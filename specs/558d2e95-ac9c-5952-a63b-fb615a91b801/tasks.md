# Tasks: 558d2e95-ac9c-5952-a63b-fb615a91b801

> **Story:** Investigate and confirm migration number and PATCH profile endpoint existence
> **Story ID:** 558d2e95-ac9c-5952-a63b-fb615a91b801
> **Status:** BLOCKED — implementation of S2–S8 must not begin until T003 (S1-AC3) is complete.

---

## Investigation Tasks

- [ ] **T001** — FR-001 (maps to S1-AC1): Enumerate all migration files present in the BACKEND migrations directory (BACKEND/db/migrations/ or equivalent). Identify the highest numbered migration among them, record that number explicitly, state the next free migration number, and include a note confirming whether migration 009 is already claimed by US-005 — either by direct coordination evidence or by confirmation that 009 is still free. A range or estimate does not satisfy this requirement; a specific, confirmed number is required.
  - Grounded in: runMigrations (CAST id 2385, BACKEND/db/migrations/run-migrations.ts), run-migrations.ts (CAST id 1267), flagged alternative runMigrations (CAST id 2406, BACKEND/src/db/migrate.ts)
  - Evidence gap: CAST does not enumerate individual migration files; direct repository inspection is mandatory.

- [ ] **T002** — FR-002 (maps to S1-AC2): Inspect BACKEND/src/app.ts and all associated router and controller files to determine whether a PATCH or PUT HTTP handler for /api/v1/users/me (or a functionally equivalent profile-update route) exists in the codebase. State the finding as either (a) the exact file path and HTTP method of the handler if found, or (b) an explicit 'not found' conclusion if absent — the result must not be left as 'unknown'.
  - Grounded in: CAST scan F74 (GET /api/v1/users/me confirmed), AccountDashboardTemplate_fragment_1 (CAST id 3101), getSessionEmail (CAST id 2942), useCurrentUser (CAST id 2948)
  - Evidence gap: CAST detected only a GET on /api/v1/users/me (F74); api_inventory query returned errors (invalid arguments, NoneType has no len()) — absence of PATCH/PUT in CAST is a measurement gap, not a confirmed structural absence. Manual inspection required.

- [ ] **T003** — FR-003 (maps to S1-AC3): Once both T001 and T002 findings are established, record both results in a single shared, team-visible artifact (e.g., a ticket comment, ADR entry, or equivalent persistent record). Explicitly link or reference this artifact from both the S2 ticket and the S4 ticket before either story moves to in-progress. No implementation work on S2 through S8 may begin until this artifact exists and is referenced.
  - Note: This task can only be satisfied by a human action; no automated or CAST-derived evidence can substitute for it.
  - Security note: The artifact must not expose sensitive schema details (e.g., raw SQL, credentials, internal table names) in a publicly accessible location.

---

## Verification Tasks

- [ ] **T004** — Verify S1-AC1: Given the BACKEND migrations directory is inspected, when the investigation is complete, then the current highest migration number is recorded and the next free migration number is stated explicitly, with a note on whether 009 is already claimed by US-005.
  - Test obligation ID: `4b4c75ca-f9f2-52b9-a58d-10d6f7f72124:test:characterization:S1-AC1`
  - Required before: release | Environment: ci

- [ ] **T005** — Verify S1-AC2: Given the BACKEND source files (app.ts and associated router/controller files) are inspected, when the investigation is complete, then the presence or absence of a PATCH or PUT handler for /api/v1/users/me (or equivalent profile-update route) is stated explicitly, including the file path and HTTP method if the endpoint exists.
  - Test obligation ID: `4b4c75ca-f9f2-52b9-a58d-10d6f7f72124:test:characterization:S1-AC2`
  - Required before: release | Environment: ci

- [ ] **T006** — Verify S1-AC3: Given both findings are established, when the investigation is complete, then the results are recorded in a shared, team-visible artifact (ticket comment, ADR entry, or equivalent) that is referenced by S2 and S4 before those stories begin implementation.
  - Test obligation ID: `4b4c75ca-f9f2-52b9-a58d-10d6f7f72124:test:characterization:S1-AC3`
  - Required before: release | Environment: ci

- [ ] **T007** — Verify IMPACT: After investigation, verify that the confirmed next-free migration number does not conflict with any migration file already present in the BACKEND/db/migrations directory.

- [ ] **T008** — Verify IMPACT: After investigation, verify that the PATCH/PUT endpoint finding is consistent across app.ts, router files, and controller files before S4 begins implementation.

---

## Traceability Matrix

| Criterion | Functional Spec Ref | Accepted Impact Hash |
|-----------|--------------------|-----------------------|
| S1-AC1 | spec_functional | sha256:5bc180654da6e1cf9b5bd18c6d05c1fb7a0c01ef50bce1a4f5745601ebaf95d4 |
| S1-AC2 | spec_functional | sha256:5bc180654da6e1cf9b5bd18c6d05c1fb7a0c01ef50bce1a4f5745601ebaf95d4 |
| S1-AC3 | spec_functional | sha256:5bc180654da6e1cf9b5bd18c6d05c1fb7a0c01ef50bce1a4f5745601ebaf95d4 |

---

## Provenance

- **Policy version:** `ace-spec-format/v1`
- **Accepted impact analysis revision:** `1`
- **Accepted impact analysis:** `sha256:5bc180654da6e1cf9b5bd18c6d05c1fb7a0c01ef50bce1a4f5745601ebaf95d4`
- **Repository baseline commit:** `6c342dc4248be55aeaa6222f8360fba085e07577`
- **Deterministic grounding reference:** `ae246fe2f5b81296`
- **Run ID:** `4b4c75ca-f9f2-52b9-a58d-10d6f7f72124`
