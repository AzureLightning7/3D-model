# DormVibe — Agent & Build Plan (`AGENTS.md`)

**Audience:** Autonomous coding agents (Claude Code, Cursor, Trae, GitHub Copilot agents) and human contributors.
**Purpose:** Give an agent everything it needs to make a non-trivial, correct contribution without re-reading the whole codebase.
**Status:** Draft v1 · Living document
**Companion docs:** [`01_BUSINESS_REQUIREMENTS.md`](01_BUSINESS_REQUIREMENTS.md), [`02_TECHNICAL_SPECIFICATION.md`](02_TECHNICAL_SPECIFICATION.md)

> **If you are an agent, read this whole file before you write code.** The Tech Spec defines *what* to build; this file tells you *how this codebase wants to be built in*. Drift here will not survive review.

---

## Table of Contents

1. [Repository Structure](#1-repository-structure)
2. [Implementation Phases](#2-implementation-phases)
3. [Module Ownership](#3-module-ownership)
4. [Development Priorities](#4-development-priorities)
5. [Coding Conventions](#5-coding-conventions)
6. [Shared Interfaces & Type Sharing](#6-shared-interfaces--type-sharing)
7. [API Contracts](#7-api-contracts)
8. [Environment Variables](#8-environment-variables)
9. [Testing Strategy](#9-testing-strategy)
10. [CI/CD Assumptions](#10-cicd-assumptions)
11. [Starter Tasks](#11-starter-tasks)
12. [Agent Etiquette](#12-agent-etiquette)

---

## 1. Repository Structure

Monorepo with two top-level apps and a shared types package. `pnpm` workspace at the root.

```
dormvibe/
├── apps/
│   ├── web/                          # React + Vite SPA
│   │   ├── src/
│   │   │   ├── app/                  # router, layout shell, providers
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   ├── projects/
│   │   │   │   ├── room-ingest/
│   │   │   │   ├── survey/
│   │   │   │   ├── editor/           # the 3D editor
│   │   │   │   │   ├── components/   # <Item3D>, <CameraRig>, <Gizmo>...
│   │   │   │   │   ├── hooks/
│   │   │   │   │   ├── store/        # Zustand store for the editor
│   │   │   │   │   ├── ops/          # edit-op constructors & validators
│   │   │   │   │   └── three/        # raw three.js helpers (math, snapping)
│   │   │   │   ├── catalog/
│   │   │   │   └── shopping-list/
│   │   │   ├── shared/
│   │   │   │   ├── api/              # generated API client + wrappers
│   │   │   │   ├── components/       # cross-feature UI primitives
│   │   │   │   ├── hooks/
│   │   │   │   └── utils/
│   │   │   ├── themes/               # see Tech Spec §12
│   │   │   ├── i18n/                 # locale files (zh-CN, en)
│   │   │   └── main.tsx
│   │   ├── public/
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tailwind.config.ts
│   │   └── vite.config.ts
│   │
│   └── api/                          # FastAPI backend
│       ├── app/
│       │   ├── core/                 # config, logging, auth deps, errors
│       │   ├── contexts/             # bounded contexts (Tech Spec §5.1)
│       │   │   ├── identity/
│       │   │   │   ├── domain/       # entities, value objects (pure Python)
│       │   │   │   ├── application/  # use cases, services
│       │   │   │   ├── infrastructure/ # SQLAlchemy repos, OAuth clients
│       │   │   │   └── interfaces/   # FastAPI routers, Pydantic DTOs
│       │   │   ├── projects/
│       │   │   ├── scene/
│       │   │   ├── catalog/
│       │   │   ├── style_profile/
│       │   │   └── ai_orchestration/
│       │   ├── ai/
│       │   │   ├── base.py           # AIProvider protocol
│       │   │   ├── providers/
│       │   │   ├── router.py
│       │   │   ├── prompts/          # versioned prompt files
│       │   │   └── telemetry.py
│       │   ├── workers/              # Celery tasks
│       │   ├── db/
│       │   │   ├── base.py
│       │   │   ├── session.py
│       │   │   └── migrations/       # Alembic
│       │   ├── storage/              # S3-compatible client wrapper
│       │   └── main.py               # FastAPI app factory
│       ├── tests/
│       │   ├── unit/
│       │   ├── integration/
│       │   └── e2e/
│       ├── pyproject.toml
│       ├── Dockerfile
│       └── alembic.ini
│
├── packages/
│   └── shared-types/                 # generated from FastAPI OpenAPI
│       ├── src/index.ts
│       └── package.json
│
├── infra/
│   ├── docker-compose.yml            # postgres, redis, minio, mailhog
│   ├── docker-compose.override.yml   # dev convenience
│   └── k8s/                          # post-MVP
│
├── docs/
│   ├── 01_BUSINESS_REQUIREMENTS.md
│   ├── 02_TECHNICAL_SPECIFICATION.md
│   ├── 03_AGENT_PLAN.md              # this file
│   └── adr/                          # architecture decision records
│
├── .github/
│   └── workflows/
│       ├── web-ci.yml
│       ├── api-ci.yml
│       └── deploy.yml
│
├── .env.example
├── pnpm-workspace.yaml
├── package.json
├── README.md
└── AGENTS.md → docs/03_AGENT_PLAN.md  # symlink so agents find it at the root
```

### Why this layout

- Apps are fully decoupled and independently deployable. Backend can move to its own repo later with no code rewrite.
- Each backend context follows clean architecture: `domain` is pure, `application` orchestrates, `infrastructure` adapts, `interfaces` exposes. Imports flow inward only.
- Frontend `features/<name>/` keeps everything a feature needs in one place. Cross-feature code lives in `shared/`.
- `editor/three/` is a deliberate quarantine for raw Three.js code. Most of the Editor uses R3F components; the imperative escape hatches go here.

---

## 2. Implementation Phases

Phases are sequential by *dependency*, not by calendar. Two engineers can run Phase 1 frontend and Phase 1 backend in parallel.

### Phase 0 — Foundations (Week 0)
- Repo skeleton, monorepo tooling, lint/format/typecheck, Docker compose for local infra, CI green on a hello-world endpoint and a hello-world page. Shared-types package wired up. **Done = a developer can clone and `pnpm dev` to a working blank app + API.**

### Phase 1 — Spine (Weeks 1–2)
- Auth (email/password + JWT), Projects CRUD, Survey UI + Style Profile persistence, Catalog seed (10–20 hand-picked GLBs), basic Editor with a *fixed* example scene (no AI yet). **Done = a logged-in user can save and view a hard-coded room.**

### Phase 2 — Core loop (Weeks 3–4)
- Room ingest (Tier 0 manual dimensions; Tier 1 photo-assisted as stretch), AI orchestrator with one provider wired, layout solver, initial scene generation, scene edit ops (`MOVE/ROTATE/ADD/DELETE`), undo/redo, scene persistence. **Done = a user can go from survey → AI-generated room → editing → save.**

### Phase 3 — The moat (Weeks 5–6)
- `SWAP_ITEM` with intent preservation, `LOCK_ITEM`, recommendation panel using vector search, `RECOMPOSE` that respects locks. **Done = a live demo shows changing the sofa color while the rug stays in place.**

### Phase 4 — Conversion (Week 7)
- Shopping list screen, stylized image export, share to social, polish, perf pass, theme toggle, accessibility audit. **Done = end-to-end demoable in front of judges.**

### Phase 5 — Hardening (Week 8)
- Observability, rate limits, cost metrics, error budgets, load test, accessibility AA, docs.

---

## 3. Module Ownership

Each module has a single human owner during MVP. Agents working in a module should pull the owner into review and not silently restructure files outside their assignment.

| Module | Path | Owner |
|---|---|---|
| Web — auth, projects, shell | `apps/web/src/features/{auth,projects}` + `app/` | TBD |
| Web — survey | `apps/web/src/features/survey` | TBD |
| Web — editor (3D) | `apps/web/src/features/editor` | TBD (lead) |
| Web — catalog & shopping list | `apps/web/src/features/{catalog,shopping-list}` | TBD |
| Web — themes & i18n | `apps/web/src/{themes,i18n}` | TBD |
| API — identity & projects | `apps/api/app/contexts/{identity,projects}` | TBD |
| API — scene & catalog | `apps/api/app/contexts/{scene,catalog}` | TBD (lead) |
| API — AI orchestration | `apps/api/app/{ai,contexts/ai_orchestration,workers}` | TBD |
| Infra & CI | `infra/`, `.github/`, deploy | TBD |

---

## 4. Development Priorities

When agents must trade off, decide in this order:

1. **Correctness on the Scene Graph contract.** Every mutation must validate; nothing about the moat works if the data model is fuzzy.
2. **Type safety end-to-end.** TypeScript strict; Pydantic strict; no `any`, no untyped dicts at boundaries.
3. **Idempotency and retry-safety on AI calls.** They are slow and fail.
4. **Demoability.** A path that works perfectly on the demo flow is worth more than half-finished features across the app.
5. **Performance in the editor.** 60fps with realistic scenes is non-negotiable.
6. **Polish on auth and onboarding.** First impressions.
7. **Test coverage on the AI adapter + scene ops.** These will be touched the most.

What we *don't* prioritize during MVP: micro-bench-tuning the database, premature service splits, custom design-system primitives we could get from shadcn/ui, exotic state managers.

---

## 5. Coding Conventions

### 5.1 Common

- **Naming.**
  - **Components & classes:** `PascalCase`. (`SceneCanvas`, `StyleProfileService`)
  - **Functions, variables, instances:** `camelCase` in TS, `snake_case` in Python.
  - **Constants:** `UPPER_SNAKE_CASE`.
  - **Files:** `PascalCase.tsx` for React components, `camelCase.ts` for non-component TS, `snake_case.py` for Python.
  - **DB columns:** `snake_case`. JSON in API: `camelCase` (Pydantic translates).
  - **Branch names:** `feat/<scope>-<short-desc>`, `fix/...`, `chore/...`.
- **Commit messages.** Conventional Commits (`feat(editor): add rotation gizmo`).
- **No comments that restate the code.** Comments explain *why* or unusual *how*. Public APIs get docstrings.
- **No magic numbers in domain code.** Named constants in a `constants.py` / `constants.ts` per feature.

### 5.2 Frontend (TypeScript)

- **`tsconfig.json` strict mode on**, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- **No default exports** except for route components and Vite-required entry points. Named exports everywhere else (better for refactoring and grep).
- **Components are pure when possible.** Side effects in hooks or event handlers; never in render.
- **Hooks naming:** `use<Noun>` for state, `use<Verb>` for actions (`useProjects`, `useApplyEdit`).
- **API access is centralized.** Never `fetch()` from a component; always `apiClient.x.y()` via TanStack Query.
- **Imports.** Absolute imports from `@/` (configured in `tsconfig.paths`). External → internal-shared → internal-feature → relative, separated by blank lines. Sorted by `@trivago/prettier-plugin-sort-imports`.
- **Lint/format.** ESLint + Prettier. Zero warnings policy in CI.
- **Three.js / R3F.** Components that mount under `<Canvas>` go in `editor/components/`. Hooks that read R3F state go in `editor/hooks/`. Never call `useThree` outside `<Canvas>`.

### 5.3 Backend (Python)

- **Python 3.12.** `pyproject.toml` only — no `setup.py`, no `requirements.txt` checked in.
- **Tooling.** `ruff` (lint + format), `mypy --strict`, `pytest`, `pytest-asyncio`. `pre-commit` runs all of them.
- **Type everything.** Function signatures, dataclasses, dict shapes (`TypedDict`), Pydantic models. `Any` requires a comment explaining why.
- **Layers don't import upward.** `domain/` imports from nothing in the app. `application/` imports from `domain/`. `infrastructure/` and `interfaces/` import from `application/` and `domain/`. Enforced by `import-linter` in CI.
- **Async by default** for I/O. Sync helpers fine for pure CPU work.
- **Errors.** Domain raises domain exceptions. Interfaces translate to HTTP problem+json. Never `except Exception: pass`.
- **Settings.** `pydantic-settings`; one `Settings` class read from env. Never `os.environ[...]` scattered through code.
- **Logging.** Structured JSON. Use a request-id middleware that injects into every log line.

### 5.4 SQL & migrations

- All migrations are reviewed by hand. Never auto-apply in production.
- Never drop a column without a multi-step migration (add new → backfill → switch reads → switch writes → drop old).
- Every table has `created_at`, `updated_at` (with DB triggers), and a UUID primary key (not bigserial) unless there's a specific reason.

---

## 6. Shared Interfaces & Type Sharing

The Scene Graph and API DTOs must agree across frontend and backend. We do this by **generating types from the backend, not maintaining two parallel definitions.**

### 6.1 Pipeline

1. Pydantic models in `apps/api/app/contexts/*/interfaces/dto.py`.
2. FastAPI emits `openapi.json` at startup.
3. CI runs `openapi-typescript-codegen` → outputs to `packages/shared-types/src/api/`.
4. The web app imports from `@dormvibe/shared-types`.

### 6.2 Hand-mirrored only when necessary

The Scene Graph is also defined as a Zod schema on the frontend (so we get runtime validation in the browser), but its source of truth is the Pydantic schema on the backend. A small generator script (`scripts/pydantic-to-zod.py`) runs in CI; the generated Zod is committed and reviewed.

### 6.3 The `SceneGraph` and `EditOp` contracts

These are the highest-traffic types. Their authoritative definitions live in:

- `apps/api/app/contexts/scene/domain/scene_graph.py` (Pydantic).
- Generated TS at `packages/shared-types/src/scene.ts`.
- Generated Zod at `apps/web/src/features/editor/schemas/scene.zod.ts`.

Any change to these files requires:
- Migration plan for stored scenes (bump `schemaVersion`).
- Co-ordinated PRs to backend, generator, and editor.

---

## 7. API Contracts

The full contract is generated from FastAPI's OpenAPI. The surface and conventions:

### 7.1 Surface (canonical list, MVP)

See Tech Spec §10.2 for the endpoint table. Treat that table as the source of truth; this section describes only conventions and shared shapes.

### 7.2 Standard envelopes

```jsonc
// Successful collection
{
  "items": [ ... ],
  "nextCursor": "opaque-string-or-null"
}

// Successful single resource
{ "data": { ... } }

// Error (problem+json)
{
  "type": "https://dormvibe.app/errors/scene-version-conflict",
  "title": "Scene version conflict",
  "status": 409,
  "detail": "Your edit was based on version 17, but the latest is 18.",
  "code": "SCENE_VERSION_CONFLICT",
  "instance": "/api/v1/projects/abc/scene/edits"
}
```

### 7.3 Job pattern (long-running AI calls)

1. `POST` to a kick-off endpoint → returns `{ jobId, statusUrl, streamUrl }` with HTTP 202.
2. Client subscribes to `statusUrl` (poll) or `streamUrl` (WebSocket).
3. Job status: `queued | running | succeeded | failed | canceled`.
4. On `succeeded`, `result` field holds either the inline result (small) or an asset URL (large).

### 7.4 Idempotency

`POST` endpoints that trigger AI work accept an `Idempotency-Key` header. Within a 24h window, the same key returns the same response. Keys are scoped per-user.

### 7.5 Rate limits

Returned in headers on every response:
`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, plus per-route `X-AICredits-Remaining` for AI endpoints.

---

## 8. Environment Variables

All env vars are documented in `.env.example`. Every service reads via a typed `Settings` object. Never read `process.env` / `os.environ` directly outside of `core/config`.

### 8.1 Web app (`apps/web/.env`)

Only public vars. Vite exposes only `VITE_*` to the client.

```
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WS_BASE_URL=ws://localhost:8000/api/v1
VITE_OAUTH_GOOGLE_CLIENT_ID=
VITE_OAUTH_WECHAT_APPID=
VITE_SENTRY_DSN_PUBLIC=
VITE_DEFAULT_LOCALE=zh-CN
VITE_DEFAULT_THEME=dormvibe-default
```

### 8.2 API (`apps/api/.env`)

```
# General
APP_ENV=local                # local | staging | production
APP_LOG_LEVEL=info
APP_BASE_URL=http://localhost:8000

# Database
DATABASE_URL=postgresql+asyncpg://dormvibe:dormvibe@localhost:5432/dormvibe
REDIS_URL=redis://localhost:6379/0

# Object storage (S3-compatible)
STORAGE_ENDPOINT=http://localhost:9000     # MinIO in dev, OSS in prod
STORAGE_REGION=cn-shanghai
STORAGE_BUCKET=dormvibe-dev
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_PUBLIC_BASE_URL=http://localhost:9000/dormvibe-dev

# Auth
JWT_SECRET=                  # 32+ random bytes
JWT_ACCESS_TTL_SECONDS=900
JWT_REFRESH_TTL_SECONDS=2592000
OAUTH_GOOGLE_CLIENT_ID=
OAUTH_GOOGLE_CLIENT_SECRET=
OAUTH_WECHAT_APPID=
OAUTH_WECHAT_SECRET=

# AI providers — set the ones you use
# Routing: capability + region picks the provider; never hardcode in feature code.
AI_DEFAULT_LLM_PROVIDER=qwen          # qwen | deepseek | anthropic | openai
AI_DEFAULT_IMAGE_PROVIDER=replicate   # replicate | fal
AI_DEFAULT_3D_PROVIDER=replicate      # replicate | meshy | tripo
AI_DEFAULT_REGION=cn                  # cn | global

# Replicate (primary for image gen, depth, image-to-3D)
REPLICATE_API_TOKEN=
REPLICATE_MODEL_FLUX=black-forest-labs/flux-schnell
REPLICATE_MODEL_DEPTH=depth-anything/depth-anything-v2
REPLICATE_MODEL_IMG2_3D=firtoz/trellis            # alt: tencent/hunyuan3d-2

# fal.ai (alternate fast image gen)
FAL_API_KEY=

# LLM providers
QWEN_API_KEY=                         # Aliyun Bailian / DashScope
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DEEPSEEK_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# 3D direct-API alternatives (post-MVP, off by default)
MESHY_API_KEY=
TRIPO_API_KEY=

# Observability
SENTRY_DSN=
OTEL_EXPORTER_OTLP_ENDPOINT=

# Email (post-MVP for password reset, etc.)
EMAIL_FROM=hello@dormvibe.app
SMTP_URL=
```

### 8.3 Worker (`apps/api/.env.worker`)

Same variables as API plus:

```
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
WORKER_CONCURRENCY=4
WORKER_QUEUES=default,ai_llm,ai_image,ai_depth
```

---

## 9. Testing Strategy

**Test pyramid**, weighted toward the parts that fail in interesting ways: scene ops, AI adapter, layout solver.

| Level | Frontend | Backend |
|---|---|---|
| Unit | Vitest. Pure function tests, scene-op reducers, Zod schema parses. | Pytest. Domain logic, scene-op application, layout solver, AI provider adapters with mocked HTTP. |
| Component | Vitest + React Testing Library. Survey steps render, RHF validates, themes apply. | — |
| Integration | Playwright headed (limited). Editor renders, item drag works, swap preserves siblings. | Pytest with a real Postgres + MinIO via testcontainers. Endpoint tests through the FastAPI app. |
| E2E | Playwright nightly. Whole onboarding-to-shopping-list path. | — |
| Visual regression | Playwright + percy or chromatic on key screens. | — |

### 9.1 Hard rules

- Every PR includes tests for new behavior. No exceptions for "trivial" code in the scene-op or AI areas.
- Tests don't talk to real AI providers. Use a recorded-fixture mode (`vcr.py`) and a fake provider for unit tests.
- The layout solver has a property-based test (Hypothesis) — for any room and any item set, the solver must not place items outside the room or overlapping each other.
- The Scene Graph has a round-trip test: serialize → deserialize → re-serialize is a fixed point.

### 9.2 Coverage targets

- Backend: 80% on `domain/` and `application/`, 60% overall.
- Frontend: 60% overall, 80% on `editor/ops/` and `editor/store/`.

---

## 10. CI/CD Assumptions

GitHub Actions. Two pipelines.

### 10.1 `web-ci.yml`

Triggers: PR + push to main on `apps/web/**` or `packages/shared-types/**`.

```
- pnpm install --frozen-lockfile
- pnpm -F web typecheck
- pnpm -F web lint
- pnpm -F web test --coverage
- pnpm -F web build
- (PR only) Vercel preview deploy via Vercel GitHub App
```

### 10.2 `api-ci.yml`

Triggers: PR + push to main on `apps/api/**`.

```
- Set up Python 3.12 + uv (or pip)
- Install deps
- ruff check && ruff format --check
- mypy app
- import-linter --check
- pytest -q (with testcontainers Postgres + Redis)
- Build Docker image, push to registry on main
- (PR only) Deploy to Railway/Fly.io review app
```

### 10.3 Type generation gate

A separate job runs `scripts/regenerate-shared-types.sh` and fails CI if `packages/shared-types/` would change. **Generated types must be committed.** Forces conscious updates and avoids "the types changed silently" surprises.

### 10.4 Production deploy

Manual approval on `deploy.yml` for production. Staging auto-deploys on merge to main.

---

## 11. Starter Tasks

Each task is sized for a single agent session. Each has a clear *Done When*. Pick one, declare ownership in the PR, ship it.

### 11.1 — Bootstrap the monorepo
**Files:** root, `pnpm-workspace.yaml`, `apps/web/`, `apps/api/`, `packages/shared-types/`.
**Goal:** A new contributor can clone and run `pnpm dev` (or `pnpm -F web dev` and `pnpm -F api dev`) to a working blank web page and `/health` API endpoint.
**Done when:** `pnpm dev` shows a styled blank page that calls `/health` and renders "ok"; CI runs and is green; `.env.example` exists; `README.md` has a quick-start that actually works.

### 11.2 — Docker Compose for local infra
**Files:** `infra/docker-compose.yml`.
**Goal:** Postgres 16 with `pgvector`, Redis 7, MinIO running locally with persistent volumes.
**Done when:** `docker compose up` brings them up; the API can connect to all three; a 30-second `make seed` populates a tiny dev dataset.

### 11.3 — Auth: register, login, refresh, /me
**Module:** `apps/api/app/contexts/identity/`, `apps/web/src/features/auth/`.
**Goal:** Email/password auth with JWT access + refresh-token rotation.
**Done when:** A user can register and log in via the web UI; refresh-token rotation works (token reuse triggers full logout); `/me` returns the current user; integration test covers the happy path.

### 11.4 — Scene Graph schema + Pydantic + Zod generation
**Module:** `apps/api/app/contexts/scene/domain/`, generator script, `packages/shared-types/`.
**Goal:** The Scene Graph and `EditOp` types defined once in Pydantic, generated to TS and Zod.
**Done when:** `scripts/regenerate-shared-types.sh` produces TS + Zod from the Pydantic models; round-trip test passes; CI gate from §10.3 active.

### 11.5 — Scene edit-op reducer (pure function, both sides)
**Module:** `apps/api/app/contexts/scene/application/edit_reducer.py`, `apps/web/src/features/editor/ops/applyOp.ts`.
**Goal:** A pure function `apply(scene, op) → scene'` that handles every op in Tech Spec §3.3. Same algorithm runs server-side (truth) and client-side (optimistic).
**Done when:** All ops covered; round-trip property test (`apply` is deterministic and preserves invariants); side-by-side TS and Python implementations agree on a fixture corpus checked in to `tests/fixtures/scene-ops/`.

### 11.6 — Catalog seed (10 hand-picked GLBs)
**Module:** `apps/api/app/contexts/catalog/`, dev seed script.
**Goal:** A small seeded catalog of furniture: GLBs in MinIO, metadata in Postgres, embeddings populated.
**Done when:** `make seed-catalog` populates products with real GLB URLs; API endpoint `GET /api/v1/catalog/products` returns them; `GET /api/v1/catalog/recommend?style=...` returns ranked results.

### 11.7 — Editor skeleton: Canvas + 4-wall room + one item
**Module:** `apps/web/src/features/editor/`.
**Goal:** A page that mounts an R3F canvas, renders a 4-wall room from hard-coded dimensions, loads one furniture GLB at a fixed position. OrbitControls work.
**Done when:** Visiting `/editor/demo` shows a navigable 3D room with one sofa; 60fps on a M-series Mac and a 2022 mid-tier Android.

### 11.8 — Editor: drag, rotate, snap to floor
**Module:** `apps/web/src/features/editor/components/`, `apps/web/src/features/editor/three/`.
**Goal:** Click an item to select; drag along the floor plane; R/Shift-R to rotate; collision indicated visually but not blocking.
**Done when:** All gestures work with mouse and touch; ops emitted to the editor store match `MOVE_ITEM`/`ROTATE_ITEM`; visual selection state persists across re-renders.

### 11.9 — AI provider adapter + Replicate & Qwen implementations
**Module:** `apps/api/app/ai/`.
**Goal:** `AIProvider` protocol with capabilities (`structured_json`, `image_gen`, `image_to_depth`, `image_to_3d`). **Replicate** adapter implements `image_gen` (Flux), `image_to_depth` (Depth Anything V2), and `image_to_3d` (Trellis). **Qwen** adapter implements `structured_json`. Router selects by capability + region (CN → Qwen for LLM; everywhere → Replicate for vision/3D until we add a CN alt).
**Done when:** `from app.ai import ai_router; await ai_router.structured_json(...)` works; `ai_router.image_gen(...)` returns a Flux image URL; `ai_router.image_to_depth(...)` returns a depth map; provider, latency, and cost-estimate logged for every call; unit tests use a fake provider; integration test uses VCR cassettes against real APIs (recorded once, not re-hit in CI).

### 11.10 — Survey UI + style profile derivation
**Module:** `apps/web/src/features/survey/`, `apps/api/app/contexts/style_profile/`.
**Goal:** A 5-step image-pick survey saves a `StyleProfile` for the user. Profile derivation uses the AI router with structured-JSON output.
**Done when:** A user can complete the survey on web; a profile is created; the same profile is returned by `GET /api/v1/style-profiles/{id}`; profile embedding is populated.

### 11.11 — Initial scene composition (LLM proposal + layout solver)
**Module:** `apps/api/app/contexts/scene/application/composer.py`, `apps/api/app/contexts/scene/application/layout_solver.py`.
**Goal:** Given a `StyleProfile` and room dimensions, produce a valid Scene Graph with 5–10 items, no collisions, all inside the room.
**Done when:** `POST /api/v1/projects/{id}/scene/recompose` returns a valid scene under 30s P95; property test confirms no overlaps and all-in-room for 1000 random inputs.

### 11.12 — `SWAP_ITEM` end-to-end (the moat demo)
**Module:** scene application + editor UI.
**Goal:** Clicking "swap" on an item shows three candidate replacements; picking one applies the swap; everything else stays exactly where it was.
**Done when:** Demo video shows: select sofa → swap → new sofa appears in same position → rug, bed, lamp untouched. Tests verify no other item's transform changes.

### 11.13 — Theme system & default theme
**Module:** `apps/web/src/themes/`.
**Goal:** Token-based theming per Tech Spec §12. Two themes: `dormvibe-default` (deck purple) and `dark`. Toggle in the UI; persists across sessions.
**Done when:** Toggling theme has zero visual flash; Tailwind classes consume tokens; one theme audit test ensures AA contrast on text/bg pairs.

### 11.14 — Shopping list & export
**Module:** `apps/web/src/features/shopping-list/`, `apps/api/app/contexts/projects/exports/`.
**Goal:** From the editor, "I'm done" goes to a shopping list with thumbnails, prices, totals, and per-item retailer links. "Export image" produces a stylized PNG of the room.
**Done when:** Final-screen totals match catalog prices at the time of generation; image export downloads a 1080×1920 (mobile share) and 1920×1080 (landscape) PNG; share buttons open native share or copy a URL.

### 11.15 — Observability & cost telemetry
**Module:** `apps/api/app/core/`, `apps/api/app/ai/telemetry.py`.
**Goal:** Sentry on errors. Per-AI-call log with provider, latency, input/output token estimates, RMB cost estimate. Per-user daily AI quota enforced.
**Done when:** `dashboards/ai-costs.md` describes how to query a 7-day cost report; quota exceeded returns a friendly error and surfaces in the UI.

---

## 12. Agent Etiquette

A few things that make this codebase pleasant to work in, especially with multiple agents in flight:

- **Read the relevant context document first.** Before code: this file. Before scene work: Tech Spec §3. Before UI work: Tech Spec §12. Before AI work: Tech Spec §7.
- **Stay in your module.** If a fix requires changes outside your module's path, open a small, separate PR for it and link from your main PR.
- **One PR, one concern.** Don't bundle a refactor with a feature.
- **Show the work in the PR description.** Link the starter task. List what you changed and what you intentionally did *not* change. If you made an architectural choice, note it; consider opening an ADR.
- **When you're stuck on intent, ask in the PR description rather than guess.** Especially for scene-graph behavior.
- **Don't introduce a new dependency without justifying it.** Every new package is a maintenance liability; prefer shadcn/ui-style copy-in components, native APIs, and standard library.
- **Don't put prompts in code.** Prompts go in `apps/api/app/ai/prompts/<use_case>/v1.md`.
- **Don't paper over a flaky test.** Either fix the underlying race or revert.
- **Test the demo path.** If your change touches the upload → survey → generate → swap → shopping-list path, run it manually before requesting review.

> When in doubt, optimize for the next contributor's clarity, not your own velocity.
