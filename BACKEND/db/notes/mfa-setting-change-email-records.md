# MFA setting-change email table implementation notes

Story: 892632f7-2cac-55dd-9b97-581327068c35
Accepted impact revision 1: sha256:0572c6c5c22b16da410a2a31552d027c7110799deef6a5a8714a89583a82e48b
Grounding reference: ae246fe2f5b81296

## Repository grounding and assumptions

- FR-001–FR-002 / S3-AC1 (T001–T002, T008, T012): the specification's
  DEFAULT.registration_email_records and DEFAULT.account_deletion_notification_records
  are implemented as unqualified tables in SQLite's main database. Neither the
  application connection nor either migration runner attaches a database named
  DEFAULT. DEFAULT.mfa_setting_change_email_records therefore follows that same
  convention as `mfa_setting_change_email_records`. Literal `DEFAULT.*` SQL is
  not supported by the existing connection. Introducing an attached schema would
  change database configuration and existing access patterns beyond this story.
- The common columns, defaults, status constraint and status index follow migrations
  003 and 008. Neither has created_at/updated_at; dispatch_timestamp is the existing
  timestamp convention. change_type and change_timestamp are required TEXT fields,
  matching existing text and timestamp storage. No change-type enumeration was
  specified, so this migration does not invent one.
- user_id follows migration 003's users(id) foreign key with ON DELETE CASCADE,
  without its registration-only UNIQUE restriction: multiple setting changes can
  belong to a user. Migration 008 explicitly omits its foreign key for post-deletion
  processing; that exception does not apply here. No activation token or credentials
  are stored in the new table.
- FR-003–FR-005 / S3-AC2–S3-AC3 (T003–T005, T009–T010, T013–T014): migration
  009 follows the existing sequence, is registered in both startup and CLI runners,
  and guards both table and index creation. Tests cover suite reruns, direct SQL
  reruns, adoption of an existing table, and insert/select on createDb's connection.
- FR-006–FR-007 / S3-AC4 (T006–T007, T011, T015): regression coverage applies
  migration 009 over populated migrations 001–008, compares existing outbox schemas
  and rows, then exercises their existing repository read/write/status/retry paths.
  Integration setup includes migration 009, so existing registration and deletion
  integration tests also run with the new table present.

## Deployment and rollback

No new dependency or configuration is required. Standard startup or `npm run db:migrate` applies migration 009 transactionally and records it in schema_migrations.
A failure rolls back the transaction under the existing runner.

For application rollback, restore the previous application version and retain the
additive table and migration ledger entry. Existing repository operations are tested
with the new table present (S3-AC4); old code does not access it. Do not drop the table
or delete its rows as part of rollback. No destructive down migration is supplied.

The supplied CAST object/caller-graph gaps remain external evidence limitations;
local migration and repository inspection grounds this change. No notification
sender, service, worker, template, or public API is introduced.

## Local verification

- Backend TypeScript build: passed.
- mfa-email-migration.spec.ts: all four acceptance tests passed.
- Standalone db:migrate: fresh temporary database and second run passed.
- Existing registration/deletion integration suites: blocked at application import
  by missing bcrypt native binary. Installing bcrypt fell back to compilation,
  which failed because the environment has no make. Full flow validation remains
  required in CI; the new repository-level regression test passes with real SQLite.
