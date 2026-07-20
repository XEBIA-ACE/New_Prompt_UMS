# UMS Deployment — GitHub Actions → ECR → EKS

**Target:** EKS cluster `aiops-prod` · region `us-east-1` · namespace `ums`
**Last updated:** 2026-07-10 (initial EKS deployment enablement)

## 1. Architecture

```
push to main
    │
    ▼
CI Build (.github/workflows/ci-build.yml → ci-build-reusable.yml)
    │  detect-changes → lint → test (redis service) → build ─┐
    │                                                        ├→ scan (Trivy, both images)
    │                                                        └→ push (OIDC → ECR, both images, tag sha-<short>)
    ▼ (workflow_run: CI Build success on main)
CD Deploy (.github/workflows/cd-deploy.yml → cd-deploy-reusable.yml)
    │  OIDC auth → verify images in ECR → kubeconfig → app Secret
    │  → kustomize edit set image → kubectl apply -k → rollout gates
    │  → resolve ALB → health check   (diagnostics dump on any failure)
    ▼
EKS aiops-prod / namespace ums
    ┌────────────────────────── ALB (internet-facing, HTTP 80) ─────────────────────────┐
    │   /api/* ─────────────► ums-backend:3000   (Express API)                          │
    │   /health (exact) ────► ums-backend:3000   (unauthenticated health)               │
    │   /* ─────────────────► ums-frontend:80    (nginx + SPA; nginx also proxies /api) │
    └───────────────────────────────────────────────────────────────────────────────────┘
    ums-backend ──► ums-redis:6379 (OTP + rate limiting, ephemeral by design)
    ums-backend ──► /app/data/app.db on PVC ums-backend-data (EBS gp3, Retain)
```

**User traffic:** browser → ALB → frontend (SPA assets) and `/api/v1/*` → backend. The SPA is built with **relative** API URLs, so the same image works in compose, EKS, or anywhere behind a proxy that routes `/api`.

## 2. AWS / cluster infrastructure (created 2026-07-10)

| Resource | Value | Notes |
|----------|-------|-------|
| ECR repos | `864899865567.dkr.ecr.us-east-1.amazonaws.com/ums-backend`, `.../ums-frontend` | Immutable tags, scan-on-push |
| IAM role | `arn:aws:iam::864899865567:role/github-actions-ums-deploy` | OIDC trust: `repo:XEBIA-ACE/New_Prompt_UMS:*`, aud `sts.amazonaws.com`. Inline policy: ECR push on the 2 repos + `eks:DescribeCluster` on aiops-prod |
| EKS access entry | `github-actions-ums-deploy` → `AmazonEKSEditPolicy` | **Scoped to namespace `ums` only** — the pipeline cannot touch cluster-scoped resources or other namespaces |
| Namespace | `ums` | Pre-created (lowercase per RFC 1123 — "UMS" is not a valid name) |
| StorageClass | `ums-gp3` — gp3, `Retain`, WaitForFirstConsumer, expandable | The cluster has **no default StorageClass**; `Retain` protects the SQLite user DB if the PVC is ever deleted |

Pre-existing and verified: GitHub OIDC provider in IAM, EBS CSI driver addon, AWS Load Balancer Controller + `alb` IngressClass (proven by other live ingresses on the cluster).

## 3. Required GitHub configuration

Settings → Secrets and variables → Actions:

| Kind | Name | Value / purpose |
|------|------|-----------------|
| Secret | `AWS_ROLE_ARN` | `arn:aws:iam::864899865567:role/github-actions-ums-deploy` (pipeline auth — never reaches the app) |
| Secret | `SENDGRID_API_KEY` | From the SendGrid dashboard (Settings → API Keys, needs Mail Send). Becomes K8s Secret `ums-secrets` |
| Secret | `OTP_HASH_SECRET` | HMAC secret for OTP hashing — generate: `openssl rand -hex 32`. Rotating it invalidates in-flight OTPs (users just re-request) |
| Secret | `ADMIN_BEARER_TOKEN` | Bearer token guarding `/api/v1/admin/*` — generate: `openssl rand -hex 32`. Share only with admin API consumers |
| Variable | `HEALTH_CHECK_URL` | Optional. When unset, CD derives `http://<ALB hostname>/health` from the Ingress automatically |

**Secret flow:** GitHub Secrets → CD job recreates K8s Secret `ums-secrets` on every deploy (idempotent `--dry-run=client \| apply`) → backend pod via `envFrom.secretRef`. Nothing secret is committed to git or baked into images. **Rotation** = update the GitHub secret, re-run CD Deploy (workflow_dispatch), restart happens via the apply.

**The frontend has no runtime secrets — by design.** It is a static SPA; anything compiled into the JS bundle is readable by every visitor, so no credential may ever go in `VITE_*` vars. Its only build-time config is the non-secret `VITE_API_BASE_URL` (now `""` = relative). The nginx container needs no env at all.

**Full backend env contract:** 3 secrets above + ConfigMap `ums-config` (29 non-secret vars incl. explicit source-code defaults for `PASSWORD_MIN/MAX_LENGTH`, `SESSION_EXPIRY_SECONDS`, `LOGIN_LOCKOUT_THRESHOLD`, and optional `FRONTEND_ORIGIN` CORS lock-down). Verified against every `requireEnvString`/`parsePositiveInt`/`process.env` read in `BACKEND/src` — vars missing from ConfigMap+Secret crash the pod at startup by design (fail-fast), so keep them in sync with new config code.

The deploy job also uses GitHub environment `prod` (auto-created on first run) — add protection rules there later if manual approval is wanted.

## 4. Image tag contract

`sha-<first 7 chars of commit SHA>` — computed with shell substring in **both** CI push and CD deploy. Do not reintroduce `docker/metadata-action` for tagging: its short-SHA length is not guaranteed to match, and a CI/CD tag mismatch means `ImagePullBackOff`. CD additionally verifies both images exist in ECR before touching the cluster.

## 5. File-by-file change log (2026-07-10)

### Workflows

| File | Change |
|------|--------|
| `ci-build.yml` | `registries: '[]'` (build-and-discard) → `ecr_registry` + per-service ECR `image` names; services JSON made strict JSON |
| `ci-build-reusable.yml` | `scan`/`push` de-hardcoded from BACKEND → full service matrix; OIDC + ECR login in `push`; push only on push-events after scan passes; full matrix on main (CD needs both images per commit) vs changed-only on PRs; per-service buildx cache scopes; Trivy `ignore-unfixed: true` + per-service SARIF categories |
| `cd-deploy.yml` | passes full `image_sha` (tag derived downstream); EKS coordinates explicit; `HEALTH_CHECK_URL` optional |
| `cd-deploy-reusable.yml` | 3 stub jobs (`exit 1`) → single `deploy-prod` job: OIDC auth, ECR image existence guard, kubectl pinned v1.32 (matches cluster), namespace-access smoke test, `ums-secrets` from GitHub Secrets (idempotent dry-run apply), `kustomize edit set image`, `kubectl apply -k`, rollout gates with timeouts, ALB resolution with first-deploy wait, health check with retry, failure diagnostics dump |

### Kubernetes (`k8s/` — new)

| File | Purpose |
|------|---------|
| `base/kustomization.yaml` | Base; sets namespace `ums`; **no Namespace resource** (deploy role can't manage cluster-scoped objects) |
| `base/configmap.yaml` | 24 non-sensitive env vars (backend is fail-fast on missing vars). ⚠ Contains `REPLACE-ME` placeholders: SendGrid template IDs, `FROM_EMAIL`, `ACTIVATION_BASE_URL`, `PASSWORD_RECOVERY_BASE_URL` — app boots, but fix before relying on email flows |
| `base/backend-deployment.yaml` | 1 replica + `Recreate` (RWO EBS — RollingUpdate would deadlock); probes on `/health` (startup allows 150s for native module + boot migrations); uid/gid/fsGroup pinned 10001 so the EBS mount is writable |
| `base/backend-pvc.yaml` | 5Gi, `storageClassName: ums-gp3` (explicit — no cluster default) |
| `base/backend-service.yaml` | Port 3000; ALB healthcheck-path `/health` annotation (backend 404s on `/`) |
| `base/frontend-deployment.yaml` | 2 replicas, RollingUpdate, probes on `/` |
| `base/frontend-service.yaml` | Port 80 |
| `base/redis-deployment.yaml` | redis:7-alpine, **emptyDir by design** (OTP/rate-limit data expires in minutes; restart = users re-request OTPs) |
| `base/redis-service.yaml` | `ums-redis:6379` — matches `REDIS_URL` in the ConfigMap |
| `base/ingress.yaml` | Own ALB (no `group.name` — deliberately not joining the shared argus ALB); `/api` Prefix + `/health` Exact → backend, `/` → frontend; HTTP only (TLS out of scope for now) |
| `overlays/prod/kustomization.yaml` | ECR image names; `newTag: bootstrap` placeholder rewritten by CD every deploy |

### Application / local dev

| File | Change |
|------|--------|
| `FRONTEND/src/app/lib/api-client.ts` | `\|\| "http://localhost:3000"` → `?? ""` — relative same-origin API URLs; empty build arg no longer silently falls back to localhost |
| `FRONTEND/vite.config.ts` | Dev-server proxy `/api` → `http://localhost:3000` so `vite dev` keeps working with relative URLs |
| `FRONTEND/Dockerfile` | `VITE_API_BASE_URL` build-arg default → `""` (relative) |
| `FRONTEND/nginx.conf` | New `/api/` proxy block → `http://ums-backend:3000` (K8s Service name) |
| `docker-compose.yml` | Backend gets network alias `ums-backend` (nginx resolves it at startup — required); frontend build arg → `""` so compose traffic flows browser → nginx → backend exactly like EKS |

## 6. First-deploy runbook

1. Set the GitHub secrets (§3). Without them the CD job fails at the Secret step with a named error.
2. Merge this change set to `main`. CI builds, scans, and pushes both images; CD then deploys.
3. First deploy only: ALB provisioning takes ~2–3 min — the `Resolve ALB endpoint` step polls for up to 5.
4. Grab the ALB hostname from the CD log (or `kubectl get ingress ums -n ums`). Optionally set it as `HEALTH_CHECK_URL` repo variable (`http://<alb>/health`).
5. Update `k8s/base/configmap.yaml`: replace `REPLACE-ME` values, set `ACTIVATION_BASE_URL`/`PASSWORD_RECOVERY_BASE_URL` to `http://<alb>` — then push (redeploys automatically).
6. Verify: `curl http://<alb>/health` → `{"status":"ok",...}`; open `http://<alb>/` for the SPA.

## 7. Rollback

Deploys are declarative on immutable SHA tags — rolling back = deploying an older commit's tag:

- **Preferred:** `git revert` the bad commit and let the pipeline deploy the revert.
- **Manual:** Actions → CD Deploy → Run workflow won't help for old SHAs (it deploys current main). Instead, with namespace access:
  `kubectl set image deployment/ums-backend backend=864899865567.dkr.ecr.us-east-1.amazonaws.com/ums-backend:sha-<old> -n ums` (and frontend) — note the next pipeline apply reverts this, which is exactly the desired reconciliation behavior.
- The backend PVC is untouched by rollbacks. Schema migrations are forward-only (run at boot) — rolling back past a migration may need manual attention.

## 8. Troubleshooting

| Symptom | Likely cause | Where to look |
|---------|--------------|---------------|
| CD fails: "Image ... not found in ECR" | workflow_dispatch on a commit CI never built/pushed, or CI push job failed | CI Build run for that SHA |
| `Could not assume role` / OIDC error | Trust policy vs repo/org rename; secret `AWS_ROLE_ARN` wrong | IAM role trust conditions |
| kubectl `Unauthorized` / can-i check fails | EKS access entry or policy association removed | `aws eks list-access-entries --cluster-name aiops-prod` |
| Backend CrashLoopBackOff at startup | Missing env var (fail-fast config) — read the pod log, it names the var | `kubectl logs deploy/ums-backend -n ums`; fix ConfigMap/Secret |
| Backend pod Pending on volume | StorageClass missing or wrong AZ affinity | `kubectl describe pvc ums-backend-data -n ums` |
| Rollout hangs then times out (backend) | Old pod not releasing RWO volume — should not happen with Recreate; check if strategy was changed | Deployment strategy must stay `Recreate` |
| ALB never gets a hostname | AWS LB Controller issue (needs cluster-admin to inspect kube-system) | `kubectl logs -n kube-system deploy/aws-load-balancer-controller` |
| ALB targets unhealthy | healthcheck-path annotations lost, or backend not ready | Target group health in EC2 console; `kubectl get pods -n ums` |
| OTP/login rate-limit oddities after deploy | Redis restarted (ephemeral by design) or `REDIS_URL` regressed to localhost default | ConfigMap `REDIS_URL: redis://ums-redis:6379` |
| Trivy blocks CI | New CRITICAL/HIGH with an available fix (unfixed are ignored) | Update base image/deps; see SARIF in Security tab |

## 9. Deliberate non-goals (revisit triggers)

- **No TLS / custom domain** — add `certificate-arn` + 443 listen-port annotations when a domain is chosen.
- **No dev/staging environments** — single prod target; the reusable workflows take cluster/namespace inputs so adding one later is a caller-file change.
- **No autoscaling/HPA** — backend is hard-capped at 1 replica by SQLite; migrating to RDS/Postgres unlocks horizontal scaling.
- **No automatic rollback** — health-check failure fails the run loudly; rollback is a git revert. First candidate if deploy frequency grows.
- **SQLite + Recreate = seconds of downtime per backend deploy** — accepted; RDS migration removes it.
