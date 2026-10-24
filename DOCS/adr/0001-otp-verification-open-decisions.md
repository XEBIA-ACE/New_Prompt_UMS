# ADR 0001: OTP verification — error naming, attempt counter ownership, verified status, verify-on-already-active

| | |
|---|---|
| **Status** | Proposed — awaiting team ratification (see [Sign-off](#sign-off)) |
| **Date** | 2026-10-24 |
| **Story** | `ede1d736-b91a-51a2-a0ed-2d2ef4314975` — Resolve open decisions on OTP verification and error handling |
| **Requirements** | `FR-001` … `FR-013`; acceptance criteria `S1-AC1` … `S1-AC5` (+ `IMPACT` checks); tasks `T001` … `T023` |
| **Specification inputs** | `specs/ede1d736-b91a-51a2-a0ed-2d2ef4314975/` (spec / plan / tasks, published by ACE run `708d723a-1344-5731-b6fa-68d908c019d0`); `specs/spec-US-005/spec.md` (US-005 Verify OTP on User Entry) |
| **Downstream work** | S3, S7, S8, S11 (see [Known Gaps / Open Questions](#known-gaps--open-questions) for the mapping that is known) |

> This ADR is documentation only. It does **not** change OTP runtime behavior,
> the API contract, or the database schema. Each decision below names the
> chosen option so that downstream stories can implement it; the decisions
> become binding once the [Sign-off](#sign-off) table is completed
> (`FR-001`, `S1-AC1`).

## Context

`POST /api/v1/otp/verify` exists on `main` and was built before the US-005
specification was reconciled with the code. Four points of divergence between
the US-005 specification and the current implementation were left open and
block downstream stories:

| Area | US-005 specification (`specs/spec-US-005/spec.md`) | Current implementation on `main` |
|---|---|---|
| Error names | `MISSING_REQUIRED_FIELD` (400), `OTP_NOT_FOUND` (404), `OTP_LOCKED` (409), `OTP_EXPIRED` (410), `INVALID_PASSCODE` (422), `ACCOUNT_STATE_INVALID` (422); body field `error_code` | `BACKEND/src/controllers/otp.controller.ts`: `OTP_NOT_FOUND` (404), `OTP_EXPIRED` (410), `OTP_INVALID` (422) in body field `errorCode`; 400 returns `{ "error": "userId is required." }` with no code; no locked / account-state codes |
| Attempt counter | `attempt_count` on the OTP record, `OTP_MAX_ATTEMPTS` (default 5) | No failed-verification counter. `otp_requests.attempt_sequence` counts *issuances* (send/resend), not failed verifications. `users.failed_login_count` counts failed *logins* (`auth.service.ts`). |
| Verified status | OTP record `status` enum (`pending`, `verified`, `expired`, `invalidated`) + `verified_at` | `otp_requests.status` is a *delivery* status (`pending`, `delivered`, `failed`). A successful verify sets `otp_requests.invalidated_at` and `users.activated_at` to the same timestamp in one transaction (`otp.service.ts` `verifyOtp`). |
| Verify on already-active | FR-011: activate "provided the account is currently in an unverified state"; behavior for an already-active account is not specified | User status `active` is accepted by `verifyOtp`; with no un-invalidated OTP it returns 404 `OTP_NOT_FOUND`. |

Clients of the verify endpoint found in this repository:
`FRONTEND/src/app/components/organisms/OtpVerificationForm.tsx` and
`FRONTEND/src/app/types/otp.types.ts` (switch on `OTP_EXPIRED`,
`OTP_NOT_FOUND`, `OTP_INVALID`), the backend integration specs
(`BACKEND/src/integration/*.spec.ts`), and the manual request collections
(`DOCS/postman/`, `BACKEND/tests/api.http`). No external (out-of-repo)
consumer is evidenced.

---

## Decision 1: Error naming

*Requirements: `FR-002`, `FR-003`, `FR-004`, `FR-005` · Acceptance: `S1-AC2`*

**Options considered**

1. **Adopt spec-aligned error names (breaking change)** — rename `OTP_INVALID` → `INVALID_PASSCODE`, add `MISSING_REQUIRED_FIELD`, `OTP_LOCKED`, `ACCOUNT_STATE_INVALID`, and move the code to the `error_code` field as in US-005 §1.1.
2. **Retain current error names (backward compatibility)** — keep `OTP_INVALID` / `errorCode` and only add new codes alongside.

**Chosen option:** Option 1 — adopt spec-aligned error names (a breaking change).

**Rationale**

- US-005 is the approved contract for this endpoint; keeping a second,
  divergent vocabulary means every downstream story (S3, S7, S8, S11) has to
  re-translate between spec and code.
- The only evidenced client is the in-repo `FRONTEND`, which ships from the
  same repository and can be updated in the same change. The cost of the break
  is therefore bounded and visible in review.
- The in-flight S3 error-contract work
  ([PR #70](https://github.com/XEBIA-ACE/New_Prompt_UMS/pull/70)) already
  implements the spec-aligned names; choosing Option 2 would require reworking
  that PR.

**Impact analysis on existing clients** (`FR-004`)

| Client | Impact |
|---|---|
| `FRONTEND` `OtpVerificationForm.tsx` / `otp.types.ts` | **Breaks** — the `case "OTP_INVALID"` branch and the `errorCode` field read stop matching; the user would see the generic error message instead of "incorrect code". Must be updated in the same change as the backend. |
| `FRONTEND` handling of `OTP_NOT_FOUND`, `OTP_EXPIRED` | Code values unchanged; **breaks only if** the body field moves from `errorCode` to `error_code`. |
| Backend integration specs asserting `OTP_INVALID` / `errorCode` | Must be updated with the change (test-only). |
| `DOCS/postman`, `BACKEND/tests/api.http`, `DOCS/API_REFERENCE.md`, `openapi.yaml` | Documentation drift; must be updated with the change. |
| 400 responses | Today carry no code; gaining `MISSING_REQUIRED_FIELD` is additive for clients that only read the status. |
| Send / resend codes (`OTP_FORBIDDEN`, `OTP_RATE_LIMIT_EXCEEDED`) | Out of scope of this decision; unchanged. |

**Deprecation / migration strategy** (`FR-005`)

No deprecation window (dual-emitting old and new names) is planned. Reason:
no client outside this repository is evidenced, so the rename is delivered as
a single coordinated change in which the backend, `FRONTEND`, tests and API
docs are updated together. Migration steps for the implementing story:

1. Change backend codes and body field, and update `FRONTEND` in the same PR.
2. Update `DOCS/API_REFERENCE.md`, both `openapi.yaml` files, Postman and
   `api.http` in the same PR.
3. Call the rename out as a breaking change in the PR description / release notes.

Rollback: revert that single PR; no data migration is involved.
If an external consumer is later identified, this decision must be revisited
(see Known Gaps, item G1) before the rename ships.

---

## Decision 2: Attempt counter ownership

*Requirements: `FR-002`, `FR-006`, `FR-007`, `FR-008` · Acceptance: `S1-AC3`*

**Options considered**

1. **`otp_requests` table** — a per-OTP failed-verification counter.
2. **`users` table** — a per-user failed-verification counter.

**Chosen option:** Option 1 — failed OTP verification attempts are tracked in the `otp_requests` table (not in `users`, and not in both).

**Schema implications** (`FR-007`)

- Affected table: `otp_requests` only. `users` is unchanged.
- New column (added by a new forward-only migration, e.g.
  `BACKEND/db/migrations/009_*.sql`; existing migrations are not edited):
  `attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0)`.
  Name follows US-005 `attempt_count`.
- `attempt_sequence` is **not** repurposed: it keeps meaning "n-th issuance
  for this user". The two columns must not be conflated.
- `users.failed_login_count` is **not** repurposed: it belongs to the login
  lockout (`auth.service.ts`).
- The threshold is configuration (`OTP_MAX_ATTEMPTS`, US-005 §1.3), not a
  column. Existing rows receive `0` from the default, so the migration is
  backward compatible for reads.

**Rationale** (`FR-008`)

- *Data locality:* the counter describes one issued code; it lives next to
  `code_hash`, `expires_at` and `invalidated_at` and is read in the same row
  that `findActiveByUserId` already loads — no extra query or join.
- *Correct reset semantics:* resend invalidates the old row and inserts a new
  one, so the counter naturally starts at 0 for each new code. A `users`
  counter would need explicit reset logic on every issue/verify path.
- *Maintainability:* keeps OTP state out of `users`, which already carries
  login-lockout state (`failed_login_count`, `locked_until`) — avoids mixing
  two independent lockout policies on one row.
- *Reporting:* per-OTP history (attempts per issued code, per user over time)
  is queryable directly from `otp_requests`.
- *Spec alignment:* US-005 Key Entities place `attempt_count` on the OTP record.
- *Trade-off accepted:* a per-OTP counter does not by itself bound attempts
  across many resends; that is already bounded by the Redis send/resend rate
  limit (`rate-limit.guard.ts`, `OTP_MAX_ATTEMPTS_PER_WINDOW`).

---

## Decision 3: Verified status representation

*Requirements: `FR-002`, `FR-009`, `FR-010` · Acceptance: `S1-AC4`*

**Options considered**

1. **New status field** — add a verification-status column (`pending` / `verified` / `expired` / `invalidated`) and `verified_at`, as sketched in US-005 §1.2.
2. **Existing `invalidated_at` timestamp** — keep using `otp_requests.invalidated_at` as the only lifecycle marker.

**Chosen option:** Option 2 — the OTP verified state is represented by the existing `invalidated_at` timestamp; no new status field is added.

**Schema implications** (`FR-010`)

- No new column, constraint or migration for this decision.
- `otp_requests.status` keeps its current meaning (delivery status:
  `pending` / `delivered` / `failed`) and is **not** extended with `verified`.
- How `invalidated_at` is used:
  - `invalidated_at IS NULL` ⇒ the OTP is the user's single active OTP
    (enforced by `uidx_otp_requests_active_per_user`).
  - A successful verify sets `invalidated_at` = `users.activated_at`, written
    in the same transaction (current `verifyOtp` behavior; must be preserved).
  - A superseded OTP (resend) or a locked OTP (Decision 2 threshold reached)
    also gets `invalidated_at` set; a locked OTP is distinguishable by
    `attempt_count >= OTP_MAX_ATTEMPTS`.
- API responses may still expose a `verified_at` value; it is sourced from
  `invalidated_at` / `users.activated_at`, not from a new column.

**Query performance considerations** (`FR-010`)

- The hot path (`findActiveByUserId`: `WHERE user_id = ? AND invalidated_at IS NULL`)
  is already served by the partial unique index
  `uidx_otp_requests_active_per_user`; no new index is needed.
- Expiry sweeps keep using `idx_otp_requests_expires_at`; rate-limit/lookup
  windows keep using `idx_otp_requests_user_created`.
- Option 1 would have required a second partial index on the new status
  column and dual-writes to keep it consistent with `invalidated_at`.
- Not optimized: "list all verified OTPs" style reporting requires joining
  `users.activated_at`; this is an infrequent, offline query and accepted.

**Rationale**

- Zero schema change and no data backfill for existing rows.
- One source of truth for "is this OTP still usable" — avoids a status column
  drifting out of sync with `invalidated_at` and the partial unique index.
- Avoids overloading the existing `status` column, whose values are delivery
  outcomes and are already relied on by `markDelivered` / `markFailed`.
- Trade-off accepted: the row alone does not say *why* it was invalidated
  (verified vs. superseded). See Known Gaps, item G3.

---

## Decision 4: Verify-on-already-active behavior

*Requirements: `FR-002`, `FR-011`, `FR-012` · Acceptance: `S1-AC5`*

Interpretation used: "already-active" means `POST /api/v1/otp/verify` is
called for a user whose account `status` is already `active` (i.e. already
verified) — the transition FR-011 of US-005 limits to unverified accounts.

**Options considered**

1. **No-op success** — return 200 and leave state unchanged.
2. **Error response** — reject the call.

**Chosen option:** Option 2 — an error response.

**API behavior mapping**

- When the account is already `active` and there is no un-invalidated OTP for
  it (the state after a successful verification), the endpoint returns the
  same response as any other "nothing to verify" case:
  **404 `OTP_NOT_FOUND`** (failure semantics, no state change). This is the
  current behavior on `main` and is kept.
- No dedicated "already verified" error code is introduced.
- The case of an `active` account that holds a freshly issued OTP (send/resend
  permit `active` users for future step-up use) is **not** resolved here — see
  Known Gaps, item G4.

**User experience rationale** (`FR-012`)

- A 200 "success" for a code that was never checked would tell the user their
  input was accepted when it was not, and would mask double-submits or stale
  tabs as success.
- The frontend already handles `OTP_NOT_FOUND` ("No active code was found.
  Please request a new one." in `OtpVerificationForm.tsx`), so no new client
  branch is required. Consistent: every non-verification is a failure, every
  200 means "this code was verified now".

**Security rationale** (`FR-012`)

- A no-op success would return 200 for any active user id **without a valid
  passcode**, turning the endpoint into an oracle for "this user id exists and
  is active" (account enumeration / information leakage).
- Returning the same `OTP_NOT_FOUND` used for unknown users and users with no
  pending OTP does not disclose account state.
- Downstream clients must never treat a verify 200 as authentication; with
  Option 2, a 200 is only ever produced by a matching, unexpired code.

---

## Known Gaps / Open Questions

These are deliberately **not** resolved by this ADR (per `FR-011`: do not
resolve unmentioned edge cases) and are surfaced for reviewers:

- **G1 — External consumers.** Decision 1 assumes no client outside this
  repository. If one exists, a deprecation window must be added before the
  rename ships.
- **G2 — Downstream story mapping (`FR-013`).** The tracker references S3, S7,
  S8 and S11. Only S3 is identifiable from this repository (OTP verification
  error contract, story `560cb07c-55f3-542f-a90f-918fd47e5379`,
  [PR #70](https://github.com/XEBIA-ACE/New_Prompt_UMS/pull/70)). S7, S8 and
  S11 are not traceable from the repo; their owners should link this ADR from
  the corresponding Jira stories.
- **G3 — Invalidation reason.** With Decision 3, a verified OTP and a
  superseded OTP are both "invalidated". If audit/reporting later needs an
  explicit reason, a follow-up ADR should supersede Decision 3.
- **G4 — Active account with a pending OTP.** Current `verifyOtp` accepts a
  correct code for an `active` user and rewrites `users.activated_at`. Whether
  that is step-up verification (US-005 A-004 `NEEDS CLARIFICATION`) or should
  be rejected is an open product question and out of scope here.
- **G5 — Stale documentation.** `DOCS/API_REFERENCE.md` and the Postman
  collection state that no verify endpoint exists, which is no longer true on
  `main`. To be corrected by the story that implements Decision 1.
- **G6 — Account-state errors.** `ACCOUNT_STATE_INVALID` for suspended/deleted
  accounts is in flight in
  [PR #82](https://github.com/XEBIA-ACE/New_Prompt_UMS/pull/82); its naming
  follows Decision 1 but its behavior is owned by that PR.

## Sign-off

The decisions above become `Accepted` (and binding for downstream stories)
once each is agreed below (`FR-001`, `S1-AC1`).

| Role | Name | Date | Decision(s) agreed |
|---|---|---|---|
| Product owner | | | 1, 2, 3, 4 |
| Backend lead | | | 1, 2, 3, 4 |
| Frontend lead | | | 1, 4 |
| Security reviewer | | | 4 |

## Traceability

| Requirement | Where satisfied in this ADR |
|---|---|
| `FR-001` / `S1-AC1` | Decisions 1–4 + Sign-off |
| `FR-002` / `S1-AC1` | "Chosen option" + "Rationale" in each decision |
| `FR-003` / `S1-AC2` | Decision 1 — Chosen option |
| `FR-004` / `S1-AC2` | Decision 1 — Impact analysis on existing clients |
| `FR-005` / `S1-AC2` | Decision 1 — Deprecation / migration strategy |
| `FR-006` / `S1-AC3` | Decision 2 — Chosen option |
| `FR-007` / `S1-AC3` | Decision 2 — Schema implications |
| `FR-008` / `S1-AC3` | Decision 2 — Rationale |
| `FR-009` / `S1-AC4` | Decision 3 — Chosen option |
| `FR-010` / `S1-AC4` | Decision 3 — Schema implications, Query performance considerations |
| `FR-011` / `S1-AC5` | Decision 4 — Chosen option, API behavior mapping |
| `FR-012` / `S1-AC5` | Decision 4 — User experience rationale, Security rationale |
| `FR-013` | Stored at `DOCS/adr/`, indexed in `DOCS/adr/README.md`, linked from the root `README.md`; Known Gaps G2 |
