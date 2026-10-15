/**
 * profile.service.ts
 *
 * US-004 View and Edit User Profile Details.
 *
 * getProfile(userId): returns the caller's own profile and records a
 *   'profile.viewed' audit entry.
 * updateProfile(userId, command): in one transaction —
 *   1. load current profile          -> UserNotFoundException
 *   2. optimistic-lock version check -> ProfileVersionConflictException
 *   3. email uniqueness check        -> ProfileEmailAlreadyInUseException
 *   4. update row (version + 1), audit 'profile.updated' with changed field
 *      names, enqueue `user.profile.updated` in domain_event_outbox
 *   No-op submissions (nothing changed) return the current profile untouched.
 *
 * `userId` always comes from the validated session (never from the request
 * body/URL), which is what scopes both operations to the caller's own profile.
 */

import type { Database } from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { withTransaction } from '../db/with-transaction';
import { IProfileRepository } from '../repositories/profile.repository';
import { UserNotFoundException } from '../errors/registration.errors';
import {
  ProfileEmailAlreadyInUseException,
  ProfileVersionConflictException,
} from '../errors/profile.errors';
import {
  EDITABLE_PROFILE_FIELDS,
  EditableProfileField,
  ProfileDetails,
  UpdateProfileCommand,
  USER_PROFILE_UPDATED_TOPIC,
  UserProfileUpdatedEvent,
} from '../types/profile.types';

export interface ProfileService {
  getProfile(userId: string): Promise<ProfileDetails>;
  updateProfile(userId: string, command: UpdateProfileCommand): Promise<ProfileDetails>;
}

export class DefaultProfileService implements ProfileService {
  constructor(
    private readonly db: Database,
    private readonly profileRepository: IProfileRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async getProfile(userId: string): Promise<ProfileDetails> {
    return withTransaction(this.db, () => {
      const profile = this.profileRepository.findById(userId);
      if (profile === null) {
        throw new UserNotFoundException(userId);
      }
      this.profileRepository.insertAuditEntry(userId, 'profile.viewed', profile.version, this.now());
      return profile;
    });
  }

  async updateProfile(userId: string, command: UpdateProfileCommand): Promise<ProfileDetails> {
    return withTransaction(this.db, () => {
      const current = this.profileRepository.findById(userId);
      if (current === null) {
        throw new UserNotFoundException(userId);
      }
      if (current.version !== command.version) {
        throw new ProfileVersionConflictException(current.version);
      }

      const changedFields: EditableProfileField[] = EDITABLE_PROFILE_FIELDS.filter(
        (field) => current[field] !== command[field],
      );
      if (changedFields.length === 0) {
        return current;
      }

      if (
        changedFields.includes('email') &&
        this.profileRepository.isEmailUsedByAnotherUser(command.email, userId)
      ) {
        throw new ProfileEmailAlreadyInUseException();
      }

      const updatedAt = this.now();
      const fields = {
        displayName: command.displayName,
        email: command.email,
        phoneNumber: command.phoneNumber,
      };
      if (!this.profileRepository.updateIfVersionMatches(userId, fields, command.version, updatedAt)) {
        throw new ProfileVersionConflictException(current.version + 1);
      }

      const newVersion = command.version + 1;
      this.profileRepository.insertAuditEntry(
        userId,
        'profile.updated',
        newVersion,
        updatedAt,
        changedFields,
      );

      const event: UserProfileUpdatedEvent = {
        eventId: uuidv4(),
        topic: USER_PROFILE_UPDATED_TOPIC,
        occurredAt: updatedAt.toISOString(),
        userId,
        profileVersion: newVersion,
        changedFields,
      };
      this.profileRepository.insertOutboxEvent(event.eventId, event.topic, userId, event, updatedAt);

      return { ...current, ...fields, version: newVersion, profileUpdatedAt: updatedAt };
    });
  }
}
