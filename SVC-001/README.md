# SVC-001 — Customer Record Creation Service (scaffold)

COBOL/CICS/DB2/VSAM scaffold. Everything here is a stub: no business logic beyond
the contracts that are fully specified (COMMAREA layouts, LGACDB02 `'02ACUS'`
guard, LGSTSQ non-fatal logging guard, length check → RC `98`).

| Path | Purpose |
|---|---|
| `src/cobol/` | LGACDB01, LGACVS01, LGACDB02, LGSTSQ, LGHLTH01 (`GET /health` backend) |
| `src/copy/` | CACUSCRT (CA_CUSTOMER_CREATE), D2COMM (D2_COMMAREA), LGSTSQC, LGHLTHC, LGCFGWS/LGCFGPR (env config) |
| `build/build.jcl` | Compile / link-edit skeleton (site proc is TODO) |
| `config/svc001.env.example` | Environment variables read at runtime |
| `api/openapi.yaml` | z/OS Connect stubs for the four endpoints |
| `scripts/verify-ac1.sh` | Static AC-1 checks and fixed-format lint (no compiler needed) |

## Open items (TODO in source, not invented)
1. CUSTOMER 10th column (`COL10_TBC`)
2. CUSTOMER_SECURE 4th column (`COL4_TBC`)
3. BD5 checksum algorithm / input / output length (`COMPUTE-BD5-CHECKSUM`)
4. KSDSCUST record layout
5. `WS-REQUIRED-CA-LEN` (currently `LENGTH OF` the copybook)
6. Return codes other than `00`/`98`/`99`
7. `LGAC-NCS` behaviour when not `'ON'`
8. Rollback vs compensating-delete strategy
9. LGSTSQ_COMMAREA layout; DB2 health probes; CICS clock = UTC for `timestamp`

## Notes
- The approved spec files under `specs/SCAFFOLD-SVC-001/` were not in the repo
  when this was scaffolded; contracts come from the task's AGENTS.md text.
- Orchestration follows AGENTS.md (CUSTOMER → LGACVS01 → LGACDB02), which
  differs from the narrative responsibility list (CUSTOMER_SECURE before VSAM).
  Confirm with stakeholders.
- Bias flag (disability reference): nothing in this scaffold references it.
