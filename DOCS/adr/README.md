# Architecture Decision Records (ADRs)

This directory holds the durable decision artifacts for the User Management
Service. Each ADR records one decision (or one tightly-coupled set of
decisions), the options considered, the chosen option, its rationale, and its
consequences, so downstream stories can be implemented without re-opening the
discussion.

## Conventions

- File name: `NNNN-short-kebab-title.md` (zero-padded, monotonically increasing).
- Start from [`0000-template.md`](0000-template.md).
- `Status` is one of `Proposed`, `Accepted`, `Superseded by NNNN`, `Deprecated`.
  An ADR is only `Accepted` once the sign-off table is filled in.
- Preserve tracker identifiers (story IDs, `FR-*`, `*-AC*`) verbatim so the
  ADR can be traced back to the specification that requested it.
- ADRs are documentation only; changing an ADR never changes runtime behavior.
  Implementation happens in the downstream stories the ADR lists.

## Index

| ADR | Title | Status | Story |
|---|---|---|---|
| [0001](0001-otp-verification-open-decisions.md) | OTP verification: error naming, attempt counter ownership, verified status, verify-on-already-active | Proposed | `ede1d736-b91a-51a2-a0ed-2d2ef4314975` |
