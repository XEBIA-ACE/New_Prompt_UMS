# S1 Findings — Migration number and PATCH/PUT profile endpoint

| | |
|---|---|
| **Story** | 558d2e95-ac9c-5952-a63b-fb615a91b801 — Investigate and confirm migration number and PATCH profile endpoint existence |
| **Spec run** | 4b4c75ca-f9f2-52b9-a58d-10d6f7f72124 |
| **Repository baseline** | `main` @ `6c342dc4248be55aeaa6222f8360fba085e07577` |
| **Investigated on** | 2026-11-02 |
| **Consumers** | S2 (migration) and S4 (profile-update endpoint) — both tickets must link to this file before moving to in-progress |

This is the shared, team-visible artifact required by S1-AC3. It intentionally
lists migrations by number only and contains no SQL, credentials, or
table/column names (security obligation: this repository is public).

Executable checks for every finding below live in
`BACKEND/src/investigation/s1-558d2e95.characterization.test.ts`.

---

## Finding 1 — Migration numbering (S1-AC1 / FR-001)

Direct inspection of `BACKEND/db/migrations/` at the baseline commit:

| # | Present on `main` | Listed in `db/migrations/run-migrations.ts` | Listed in `src/db/migrate.ts` |
|---|---|---|---|
| 001 | yes | yes | yes |
| 002 | yes | yes | yes |
| 003 | yes | yes | yes |
| 004 | yes | yes | yes |
| 005 | yes | yes | yes |
| 006 | yes | yes | yes |
| 007 | yes | yes | yes |
| 008 | yes | yes | yes |

- 8 `.sql` migration files, numbered contiguously `001`–`008`, no gaps, no duplicates.
- **Highest migration number on `main`: `008`.**
- **Next free number on `main`: `009`** (no `009_*` file exists on `main`).

### Is 009 already claimed by US-005?

**Yes.** Open PR [#51](https://github.com/XEBIA-ACE/New_Prompt_UMS/pull/51)
(branch `df/spec-f662d005-58428add`, commit message "Implementation Summary:
US-005 (FR-007, FR-008, FR-009, FR-012)") adds a `009_*.sql` migration.

`009` is also contended by every other open PR that adds a migration — none of
them uses a number other than `009`:

| Open PR | Adds migration |
|---|---|
| [#51](https://github.com/XEBIA-ACE/New_Prompt_UMS/pull/51) (US-005) | 009 |
| [#9](https://github.com/XEBIA-ACE/New_Prompt_UMS/pull/9), [#41](https://github.com/XEBIA-ACE/New_Prompt_UMS/pull/41) (US-001 enhancement) | 009 |
| [#52](https://github.com/XEBIA-ACE/New_Prompt_UMS/pull/52), [#53](https://github.com/XEBIA-ACE/New_Prompt_UMS/pull/53), [#55](https://github.com/XEBIA-ACE/New_Prompt_UMS/pull/55) | 009 |
| [#80](https://github.com/XEBIA-ACE/New_Prompt_UMS/pull/80) (US-004 profile view/edit) | 009 |
| [#86](https://github.com/XEBIA-ACE/New_Prompt_UMS/pull/86), [#95](https://github.com/XEBIA-ACE/New_Prompt_UMS/pull/95), [#97](https://github.com/XEBIA-ACE/New_Prompt_UMS/pull/97), [#99](https://github.com/XEBIA-ACE/New_Prompt_UMS/pull/99) | 009 |

### Decision input for S2

- **S2 must not use `009`.** It is claimed by US-005 (PR #51).
- **Next free migration number for S2: `010`** — not present on `main` and not
  used by any open PR at investigation time.
- Re-check immediately before S2 merges: if any other `009`/`010` PR lands
  first, S2 takes the next number above the highest file on `main` at that time.
- When adding the file, register it in **both** `MIGRATION_FILES` lists
  (`BACKEND/db/migrations/run-migrations.ts` and `BACKEND/src/db/migrate.ts`);
  they are intentionally duplicated and must stay in sync.

### Which `runMigrations` is authoritative?

Both CAST candidates are real and both are live:

- `BACKEND/src/db/migrate.ts` (`runMigrations`, CAST id 2406) — runs on every
  server start.
- `BACKEND/db/migrations/run-migrations.ts` (`runMigrations`, CAST id 2385) —
  the standalone `npm run db:migrate` CLI.

They contain the same ordered list and the same apply logic (documented as
intentional duplication in `migrate.ts`). The two CAST
"runMigrations (entry: unknown)" transactions correspond to these two distinct
entry points, not a duplicate record. Each touches exactly the migration
bookkeeping table plus whatever the listed migration files create.

---

## Finding 2 — PATCH/PUT handler for `/api/v1/users/me` (S1-AC2 / FR-002)

**Not found.** No PATCH or PUT handler for `/api/v1/users/me`, and no
functionally equivalent profile-update route, exists on `main`.

Evidence (baseline commit):

- `BACKEND/src/app.ts` mounts `createUserProfileRouter` at `/api/v1/users`.
  It is the only router serving `/me`.
- `BACKEND/src/routes/user-profile.routes.ts` registers exactly one route:
  `GET /me` (behind `SessionValidationMiddleware`).
- `BACKEND/src/controllers/user-profile.controller.ts` exposes exactly one
  handler: `getMe`. No update/patch method exists in any controller.
- No file under `BACKEND/src/routes/` calls `router.patch(...)` or
  `router.put(...)`. The full HTTP surface on `main` is `GET` + `POST` +
  one `DELETE` (`/api/v1/users/deletion-requests`).
- `BACKEND/openapi.yaml` documents no PATCH/PUT operation.
- At runtime, `PATCH /api/v1/users/me` and `PUT /api/v1/users/me` fall through
  to the app's 404 handler (`{"error":"Not found."}`), while
  `GET /api/v1/users/me` reaches the session guard (401 without a token).

This confirms the CAST F74 observation (GET only) and resolves the
`api_inventory` measurement gap as a **confirmed absence**.

### Note for S4

Open PR [#80](https://github.com/XEBIA-ACE/New_Prompt_UMS/pull/80)
(US-004, unmerged) adds a `PUT /api/user/profile` route in a new
`BACKEND/src/routes/profile.routes.ts`. It is a different path from
`/api/v1/users/me` and is not on `main`; S4 should coordinate with that PR
to avoid two competing profile-update endpoints.

---

## Unresolved / out-of-scope items

- Exact table names behind the CAST "2 DB objects" for `runMigrations` are
  deliberately not recorded here (public repository).
- Linking this artifact from the S2 and S4 tickets (S1-AC3) is a human action
  in the tracker and is not performed by this change.
