# Implementation Plan: 558d2e95-ac9c-5952-a63b-fb615a91b801

> **⚠ DEGRADED DESIGN DISCLOSURE**
> This design is marked degraded because:
> 1. The architecture context is degraded (missing_core: api_contracts); no api_contracts were available for grounding, increasing uncertainty about the full integration surface.
> 2. The CAST api_inventory query returned errors — no clean endpoint list was produced for /api/v1/users/me PATCH/PUT.
> 3. S1-AC3 is unmapped in CAST structural facts and can only be satisfied by human action.
> 4. Candidate verification was uncertain between runMigrations (CAST id 2385, BACKEND/db/migrations/run-migrations.ts) and runMigrations (CAST id 2406, BACKEND/src/db/migrate.ts).
> No implementation steps are produced; this story is purely investigative.

> **⚠ IMPLEMENTATION BLOCKED**
> S2 and S4 are explicitly gated on the written findings from this investigation story. No implementation should begin until the shared artifact (S1-AC3) is produced.

---

## Technical Context

- Codebase grounding snapshot: `ae246fe2f5b81296`
- Accepted impact analysis: `sha256:5bc180654da6e1cf9b5bd18c6d05c1fb7a0c01ef50bce1a4f5745601ebaf95d4`
- Determinism snapshot: `sha256:f5affeeca09cbe6b0c5abf4043af9ffe797a70dc34441a83a9677eabd3f36617`
- Repository pin: `https://github.com/XEBIA-ACE/New_Prompt_UMS` @ main @ `6c342dc4248be55aeaa6222f8360fba085e07577`
- Implement only against Accepted impact analysis (revision 1) (fingerprint `sha256:5bc180654da6e1cf9b5bd18c6d05c1fb7a0c01ef50bce1a4f5745601ebaf95d4`)

### Grounded Components (CAST)

| CAST ID | Name | Type | File |
|---------|------|------|------|
| 2385 | runMigrations | Typescript Function | BACKEND/db/migrations/run-migrations.ts |
| 2406 | runMigrations *(flagged alternative)* | Typescript Function | BACKEND/src/db/migrate.ts |
| 1267 | run-migrations.ts | Typescript Module | BACKEND/db/migrations/run-migrations.ts |
| 3101 | AccountDashboardTemplate_fragment_1 | HTML Fragment | — |
| 2942 | getSessionEmail | Typescript Function | — |
| 2948 | useCurrentUser | Typescript Function | — |
| 1169 | updateLastLoginAt | Typescript Method | — |
| 1190 | login | Typescript Method | — |
| 983 | Set | Typescript Class | — |

Additional unresolved references: `component:Date`, `component:Promise`, `component:§{main_sources}§/New_Prompt_UMS-develop/BACKEND/db/migrations/run-migrations.ts`, `cast-scan:F74:/api/v1/users/me:GET`, `cast-scan:F62-F76:integration-surface`.

---

## Design Steps

### Step 1 — INVESTIGATION (FR-001 / S1-AC1)

Directly inspect the BACKEND/db/migrations/ directory in the repository (commit `6c342dc4248be55aeaa6222f8360fba085e07577`, ref main) to enumerate all migration files. Identify and record the highest numbered migration file present. State the next free migration number explicitly. Include a note confirming whether migration 009 is already claimed by US-005 — either by direct coordination evidence or by confirming 009 is still free. A range or estimate does not satisfy this requirement; a specific confirmed number is required.

Grounded in provider-confirmed component runMigrations (CAST id 2385) in run-migrations.ts (CAST id 1267) and flagged alternative runMigrations (CAST id 2406) in BACKEND/src/db/migrate.ts. Note: CAST does not enumerate individual migration files — direct repository inspection is mandatory.

### Step 2 — INVESTIGATION (FR-002 / S1-AC2)

Directly inspect BACKEND/src/app.ts and all associated router and controller files to determine whether a PATCH or PUT HTTP handler for /api/v1/users/me (or a functionally equivalent profile-update route) exists. Record the finding as either (a) the exact file path and HTTP method of the handler if found, or (b) an explicit 'not found' conclusion if absent — the result must not be left as 'unknown'.

Note: CAST detected only a GET on /api/v1/users/me (F74) via provider-confirmed callee AccountDashboardTemplate_fragment_1 (CAST id 3101) and callees getSessionEmail (CAST id 2942) and useCurrentUser (CAST id 2948) on the PATCH /api/v1/users/me source pivot; the api_inventory query returned errors (invalid arguments, NoneType has no len()), so the absence of a PATCH/PUT finding in CAST data is a measurement gap, not a confirmed structural absence. Manual inspection is required to resolve this ambiguity.

### Step 3 — DOCUMENTATION (FR-003 / S1-AC3)

Once both FR-001 and FR-002 findings are established, record both results in a single shared, team-visible artifact (e.g., a ticket comment, ADR entry, or equivalent persistent record). This artifact must be explicitly linked or referenced from both the S2 ticket and the S4 ticket before either story moves to in-progress. No implementation work on S2 through S8 may begin until this artifact exists and is referenced.

**This step can only be satisfied by a human action; no automated or CAST-derived evidence can substitute for it.**

### Step 4 — VERIFICATION (test obligation)

After the investigation, verify that the confirmed next-free migration number does not conflict with any migration file already present in the BACKEND/db/migrations directory. Cross-reference against provider-confirmed component run-migrations.ts (CAST id 1267) and runMigrations (CAST id 2385, 2406).

### Step 5 — VERIFICATION (test obligation)

After the investigation, verify that the PATCH/PUT endpoint finding is consistent across app.ts, router files, and controller files before S4 begins implementation. Cross-reference against CAST-detected callee AccountDashboardTemplate_fragment_1 (CAST id 3101), getSessionEmail (CAST id 2942), useCurrentUser (CAST id 2948), and updateLastLoginAt (CAST id 1169) on the profile-update and PATCH /api/v1/users/me source pivots.

### Step 6 — SECURITY NOTE

Ensure the shared artifact produced by this investigation (S1-AC3) does not expose sensitive schema details (e.g., raw SQL, credentials, internal table names) in a publicly accessible location. Grounded in security obligation from impact analysis.

---

## Contract Changes

| Kind | Endpoint / Name | Method | Change Required | Note |
|------|----------------|--------|-----------------|------|
| api | /api/v1/users/me | GET | Yes | Confirmed by CAST scan (F74); only GET detected on this path. |
| api | /api/v1/users/me | PATCH or PUT | Yes | Existence unconfirmed — not found in CAST integration surface F62–F76; api_inventory query returned errors. Manual inspection required. |
| data | Migration sequencing integrity | — | Yes | If migration 009 is claimed by both this work stream and US-005, database schema state becomes non-deterministic at deployment time. |
| data | runMigrations execution path DB objects | — | Yes | 2 database objects accessed through runMigrations execution path (CAST IDs unknown); exact table/schema names not resolved. |

---

## Security and Quality

- Ensure the shared artifact produced by this investigation (S1-AC3) does not expose sensitive schema details in a publicly accessible location.
- Preserve the availability, reliability, and observability constraints grounded by ae246fe2f5b81296.

---

## Implementation-Readiness Items (must be resolved or explicitly accepted)

- What is the current highest migration number in BACKEND/db/migrations/? Is 009 already claimed by US-005?
- Does a PATCH or PUT handler for /api/v1/users/me (or an equivalent profile-update route) exist in app.ts or any associated router/controller file? If so, what is the file path and HTTP method?
- S2 and S4 are explicitly gated on the written findings from this investigation story; no implementation should begin until the shared artifact (S1-AC3) is produced.
- The current highest migration number has not been confirmed; US-005 also targets migration 009, creating a collision risk that blocks S2 from safely assigning the next migration number.
- The existence or absence of a PATCH/PUT handler for /api/v1/users/me is unresolved: CAST detected only a GET on that path (F74) and the api_inventory query returned errors rather than a clean endpoint list, leaving the profile-update surface structurally unconfirmed.
- api_inventory query for User_Management returned errors (invalid arguments, NoneType has no len()); no clean endpoint list was produced — PATCH/PUT existence on /api/v1/users/me cannot be confirmed or denied from CAST data alone.
- The actual migration files in BACKEND/db/migrations/ are not enumerated in the CAST facts; the highest existing migration number must be determined by direct repository inspection.
- Database object IDs for the 2 DB objects accessed via runMigrations are listed as 'unknown' in CAST; exact table/schema names are not available.
- Transaction entry points for both runMigrations transactions are listed as 'unknown'; the full call graph could not be expanded (transaction_details returned empty).
- Are the two 'runMigrations (entry: unknown)' transactions distinct execution paths or a duplicate CAST record?
- The two transactions named 'runMigrations (entry: unknown)' in CAST are likely the same logical transaction recorded twice due to unknown entry-point resolution; treated as 2 measured transaction records per CAST ground truth.
- What are the actual database table names behind the 2 DB objects associated with the migration runner?
- Intra-object structural facts (loops, SQL-in-loop) are not available for runMigrations; migration collision-detection logic cannot be assessed from CAST alone.
- Candidate verification could not confidently judge the selected focus object for this requirement.
- Candidate verification flagged a possibly better-matching alternative that was not selected: runMigrations (2406) in BACKEND/src/db/migrate.ts — review before accepting.
- Candidate verification was uncertain about the selected focus object: The requirement asks to investigate the current highest migration number and the existence of a PATCH/PUT endpoint for /api/v1/users/me — it is an investigative/documentation task, not a direct code change. The selected object runMigrations (id=2385) is in the migrations runner file and is tangentially related to migration numbering, but it is a function that executes migrations rather than a file that reveals the highest migration number; a second runMigrations candidate (id=2406, in src/db/migrate.ts) is equally plausible and may be more directly relevant to migration management, making the selection uncertain.
- Requirement traceability incomplete for S1-AC1, S1-AC2, S1-AC3.
- S1-AC3 is unmapped in CAST structural facts and can only be satisfied by a human action (producing and publishing a shared team-visible artifact referenced by S2 and S4) — no automated or CAST-derived evidence can substitute for it.
- The database objects listed as 'run-migrations.ts (unknown)' and 'runMigrations (unknown)' reflect CAST's association of the module and function with DB access; their exact table/schema names are not resolved in the provided facts.
- Architecture context is degraded (missing_core: api_contracts); no api_contracts were available for greenfield grounding, increasing uncertainty about the full integration surface.
- The api_inventory tool errors (NoneType, invalid arguments) indicate the CAST MCP query did not return a usable endpoint list; the absence of a PATCH/PUT finding is therefore a measurement gap, not a confirmed absence.

---

## Verification Plan

- **S1-AC1:** Given the BACKEND migrations directory is inspected, when the investigation is complete, then the current highest migration number is recorded and the next free migration number is stated explicitly, with a note on whether 009 is already claimed by US-005.
- **S1-AC2:** Given the BACKEND source files (app.ts and associated router/controller files) are inspected, when the investigation is complete, then the presence or absence of a PATCH or PUT handler for /api/v1/users/me (or equivalent profile-update route) is stated explicitly, including the file path and HTTP method if the endpoint exists.
- **S1-AC3:** Given both findings are established, when the investigation is complete, then the results are recorded in a shared, team-visible artifact (ticket comment, ADR entry, or equivalent) that is referenced by S2 and S4 before those stories begin implementation.
- **IMPACT:** After investigation, verify that the confirmed next-free migration number does not conflict with any migration file already present in the BACKEND/db/migrations directory.
- **IMPACT:** After investigation, verify that the PATCH/PUT endpoint finding is consistent across app.ts, router files, and controller files before S4 begins implementation.

---

## Migration & Rollback Obligations

- Document dependency and configuration migration.
- Provide a tested rollback path.

---

## Evidence Gaps

- api_inventory query for User_Management returned errors (invalid arguments, NoneType has no len()); no clean endpoint list was produced — PATCH/PUT existence on /api/v1/users/me cannot be confirmed or denied from CAST data alone.
- Database object IDs for the 2 DB objects accessed via runMigrations are listed as 'unknown' in CAST; exact table/schema names are not available.
- Transaction entry points for both runMigrations transactions are listed as 'unknown'; the full call graph could not be expanded (transaction_details returned empty).
- Intra-object structural facts (loops, SQL-in-loop) are not available for runMigrations; migration collision-detection logic cannot be assessed from CAST alone.
- The actual migration files in BACKEND/db/migrations/ are not enumerated in the CAST facts; the highest existing migration number must be determined by direct repository inspection.
- Candidate verification was uncertain about the selected focus object (see implementation-readiness items above).
- Candidate verification flagged a possibly better-matching alternative that was not selected: runMigrations (2406) — review before accepting.
