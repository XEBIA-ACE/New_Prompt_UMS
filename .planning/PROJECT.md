# UMS EKS Deployment

## What This Is

CI/CD deployment capability for the existing User Management System (UMS) — an Express/TypeScript backend and React/Vite frontend, already containerized. The goal is to make the existing GitHub Actions pipelines (`.github/workflows/`) actually deploy both services to the `aiops-prod` EKS cluster in `us-east-1`, namespace `ums`.

## Core Value

A push to `main` that passes CI results in the UMS frontend and backend running healthy in EKS (`aiops-prod`/`ums`) with zero manual steps.

## Requirements

### Validated

<!-- Existing capabilities inferred from codebase map. -->

- ✓ UMS application: registration, activation, login/sessions, OTP, password recovery, account deletion (Express + better-sqlite3 + Redis + SendGrid) — existing
- ✓ React SPA frontend served by nginx, built with Vite — existing
- ✓ Multi-stage Dockerfiles for both services (non-root backend runtime) — existing
- ✓ CI pipeline: change detection, lint, tests (with Redis service container), Docker build, Trivy scan — existing
- ✓ Local orchestration via docker-compose (redis + backend + frontend) — existing

### Active

- [ ] CI pushes both backend and frontend images to Amazon ECR (`us-east-1`) tagged by commit SHA
- [ ] CI `push` and `scan` jobs work per-service via matrix (currently hardcoded to BACKEND)
- [ ] Kustomize manifests (`k8s/`): namespace `ums`, backend + frontend Deployments/Services, in-cluster Redis, PVC for SQLite, ALB Ingress
- [ ] Backend config split into ConfigMap (non-sensitive) and Secret (SENDGRID_API_KEY, OTP_HASH_SECRET, ADMIN_BEARER_TOKEN)
- [ ] Frontend nginx proxies `/api` to the backend Service; image no longer bakes an absolute API URL
- [ ] CD authenticates to AWS via the existing GitHub OIDC IAM role and runs `aws eks update-kubeconfig --region us-east-1 --name aiops-prod`
- [ ] CD replaces the three stub jobs with a single prod deploy: apply Kustomize, set images, wait for rollout, verify health
- [ ] Namespace `ums` is created idempotently by the pipeline (it does not exist yet)
- [ ] Deployment fails loudly (rollout status / health check) and surfaces useful diagnostics

### Out of Scope

- Multi-environment chain (dev → staging) — single prod target chosen; the reusable workflow keeps inputs so envs can be added later
- Provisioning the EKS cluster or IAM OIDC role — cluster `aiops-prod` and the OIDC role already exist
- Migrating SQLite to RDS/Postgres — keep SQLite on a PVC for now; revisit if multi-replica backend is ever needed
- ElastiCache Redis — in-cluster Redis is sufficient for OTP/rate-limit workloads at current scale
- App feature work — this milestone is deployment-only
- TLS/custom domain on the ALB — not specified; ALB default endpoint first, HTTPS can be layered on later

## Context

- Brownfield repo mapped in `.planning/codebase/` (STACK, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, INTEGRATIONS, CONCERNS).
- Verification finding: current pipelines **cannot deploy anywhere**. `ci-build.yml` passes `registries: '[]'` so images never leave the runner; all three CD jobs in `cd-deploy-reusable.yml` are placeholders that `exit 1`.
- Known CI bugs to fix: `push` and `scan` jobs hardcode BACKEND context instead of using the service matrix.
- Backend requires ~25 env vars (see `.planning/codebase/STACK.md` Configuration); config is fail-fast at startup, so missing vars will crash the pod — ConfigMap/Secret must be complete before first rollout.
- SQLite (better-sqlite3) means the backend must run as a single replica with an RWO EBS volume; `Recreate` deployment strategy required to avoid two pods sharing the volume.
- `cd-deploy.yml` references `vars.HEALTH_CHECK_URL` — must be set (or derived) for the health check step.
- Kubernetes namespace names must be lowercase: the namespace is `ums` (user originally wrote "UMS").

## Constraints

- **Platform**: EKS cluster `aiops-prod`, region `us-east-1`, namespace `ums` — cluster pre-exists and is managed outside this repo
- **Auth**: GitHub Actions → AWS via existing OIDC IAM role (ARN supplied as repo secret/variable); no static AWS keys
- **Registry**: Amazon ECR in `us-east-1`; both service images tagged `sha-<short-sha>` to match existing metadata-action config
- **Tooling**: Kustomize for manifests; kubectl-based deploy from GitHub Actions
- **Cluster prerequisites**: EBS CSI driver (for PVC) and AWS Load Balancer Controller (for ALB Ingress) assumed installed on `aiops-prod`; pipeline should verify and fail with a clear message if missing
- **Data**: SQLite on PVC → backend replicas fixed at 1

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Amazon ECR over GHCR | Native IAM auth with EKS, no imagePullSecrets | — Pending |
| Reuse existing OIDC role | Role already provisioned in the account; wire ARN via secret | — Pending |
| Kustomize over Helm/plain YAML | User preference; base + prod overlay leaves room for future envs | — Pending |
| Single prod deploy stage | Only one target (aiops-prod/ums); removes dead dev/staging gates | — Pending |
| In-cluster Redis | OTP/rate-limit cache only; avoids ElastiCache provisioning | — Pending |
| SQLite on EBS PVC, 1 replica | Persistence without a DB migration; matches current storage model | — Pending |
| Single ALB Ingress, `/api` → backend | One URL, one LB; frontend nginx proxies API so images are env-agnostic | — Pending |
| Namespace `ums` (lowercase) | Kubernetes RFC 1123 naming; "UMS" is invalid | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-10 after initialization*
