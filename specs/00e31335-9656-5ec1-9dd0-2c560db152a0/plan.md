# Implementation Plan: 00e31335-9656-5ec1-9dd0-2c560db152a0

## Technical Context
- Codebase grounding snapshot (ae246fe2f5b81296)
- Accepted impact analysis (sha256:1d7b7032f3619903b7e8a666e9494cc1275c6ba91db1ec7527fc00a896a431cf)
- Implement only against Accepted impact analysis (revision 1) (fingerprint sha256:1d7b7032f3619903b7e8a666e9494cc1275c6ba91db1ec7527fc00a896a431cf)
- Resolve or explicitly accept the following implementation-readiness items:
  - Candidate verification flagged a possibly better-matching alternative that was not selected: registration_email_records (422) -- review before accepting.
  - Candidate verification found the selected focus object implausible for this requirement: The requirement is about designing a new SQLite table and migrations for MFA notification records, whereas NotificationsPanel (Typescript Function) is a UI component and not related to database schema or DDL work.
  - No CAST objects representing SQLite schema, migration logic, or Database Services are linked to the focus object, preventing structural verification of the acceptance criteria.
  - No pre-existing implementation was found for this requirement; scope is derived solely from the requirement text, not from measured code evidence.
  - No-match classification: The requirement explicitly introduces a new dedicated SQLite table for MFA notification records, modeled on existing tables, so it is expected that no matches for mfa_notification_records or related names are present yet; this is a new schema capability rather than a missing existing one.
  - Searched 3 term(s) derived from this requirement (mfa_notification_records, registration_email_records, account_deletion_notification_records) against Cast; none resolved to an existing code object.
  - Which components will need to be built to implement each acceptance criterion, since no existing implementation was found?

## Contract Changes
- No material API, event, or data contract change is evidenced.

## Security and Quality
- Validate credential and personal-data handling against the Jira requirement
- Validate credential and personal-data handling against the story's acceptance criteria
- Verify the changed user flow against the stated accessibility criteria

## Implementation Steps
- For service https-github-com-xebia-ace-new-prompt-ums, introduce a new SQLite table dedicated to MFA change notification events (named mfa_change_notification_records or an explicitly configured equivalent) alongside the existing users, registration_email_records, and account_deletion_notification_records tables, ensuring the DDL is added to the same schema initialization or migration mechanism currently used in all environments so that a fresh environment initializes without SQL errors related to missing MFA notification tables. [evidence: ae246fe2f5b81296, sha256:1d7b7032f3619903b7e8a666e9494cc1275c6ba91db1ec7527fc00a896a431cf]
- For service https-github-com-xebia-ace-new-prompt-ums, extend the existing Database Services layer that already exposes INSERT and SELECT for other notification-related tables to also support mfa_change_notification_records, including fields for user linkage, MFA old state, MFA new state, notification status, and timestamps, so that a manual INSERT followed by a SELECT via this layer persists and returns all stored fields. [evidence: ae246fe2f5b81296, sha256:1d7b7032f3619903b7e8a666e9494cc1275c6ba91db1ec7527fc00a896a431cf]
- For service https-github-com-xebia-ace-new-prompt-ums, implement the schema change that adds mfa_change_notification_records as an additive, backward-compatible migration that does not drop or modify existing users, registration_email_records, or account_deletion_notification_records tables or their data, validating on upgrade that pre-existing records remain intact. [evidence: ae246fe2f5b81296, sha256:1d7b7032f3619903b7e8a666e9494cc1275c6ba91db1ec7527fc00a896a431cf]
- For service https-github-com-xebia-ace-new-prompt-ums, update or add automated checks (for example, in the backend test suite or startup self-checks) that load the Database Services after the new mfa_change_notification_records table is introduced, asserting that no runtime errors occur due to missing table definitions and that the existing health/health endpoint continues to report a healthy database connection. [evidence: ae246fe2f5b81296, sha256:1d7b7032f3619903b7e8a666e9494cc1275c6ba91db1ec7527fc00a896a431cf]

## Verification Plan
- **S1-AC1**: Given the existing SQLite schema with users, registration_email_records, and account_deletion_notification_records tables
When the database is initialized or migrated in a fresh environment
Then a new table named mfa_change_notification_records (or the agreed equivalent name) is created successfully, and the application can start without SQL errors related to missing MFA notification tables.
- **S1-AC2**: Given an initialized database including the new MFA notification table
When a manual INSERT is executed into mfa_change_notification_records with valid values for user linkage, MFA old/new state, status, and timestamps via the existing Database Services layer
Then the row is persisted and can be retrieved with a subsequent SELECT using the same layer, including all stored fields.
- **S1-AC3**: Given an existing database that already has users, registration_email_records, and account_deletion_notification_records populated
When the schema initialization or migration process that introduces mfa_change_notification_records is applied
Then existing tables and data remain intact, and no destructive changes occur to users or any existing email/notification tables.
- **S1-AC4**: Given the new MFA notification table defined in the schema
When the backend test suite or application runtime loads the Database Services
Then no runtime errors occur due to missing table definitions, and the service reports a healthy database connection in its existing health/health endpoint behavior.
- **IMPACT**: Verify acceptance criterion: Given the existing SQLite schema with users, registration_email_records, and account_deletion_notification_records tables
When the database is initialized or migrated in a fresh environment
Then a new table named mfa_change_notification_records (or the agreed equivalent name) is created successfully, and the application can start without SQL errors related to missing MFA notification tables.
- **IMPACT**: Verify acceptance criterion: Given an initialized database including the new MFA notification table
When a manual INSERT is executed into mfa_change_notification_records with valid values for user linkage, MFA old/new state, status, and timestamps via the existing Database Services layer
Then the row is persisted and can be retrieved with a subsequent SELECT using the same layer, including all stored fields.
- **IMPACT**: Verify acceptance criterion: Given an existing database that already has users, registration_email_records, and account_deletion_notification_records populated
When the schema initialization or migration process that introduces mfa_change_notification_records is applied
Then existing tables and data remain intact, and no destructive changes occur to users or any existing email/notification tables.
- **IMPACT**: Verify acceptance criterion: Given the new MFA notification table defined in the schema
When the backend test suite or application runtime loads the Database Services
Then no runtime errors occur due to missing table definitions, and the service reports a healthy database connection in its existing health/health endpoint behavior.

## Provenance
- Policy version: ace-spec-format/v1
- Accepted impact analysis revision: 1
- Accepted impact analysis: sha256:1d7b7032f3619903b7e8a666e9494cc1275c6ba91db1ec7527fc00a896a431cf
- Repository baseline commit: 6c342dc4248be55aeaa6222f8360fba085e07577
- Deterministic grounding reference: ae246fe2f5b81296