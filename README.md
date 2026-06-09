# DormVibe

AI-generated 3D dorm-room designer. Pick a style, generate a starter layout, drag furniture around, swap models in place, then export a shopping list with retailer links. See [`_Context/`](_Context/) for the full business + technical spec.

**Status:** Phase 4 (conversion) complete — shopping list, image export, theme toggle, share.

---

## Table of contents

1. [Stack](#stack)
2. [Repo layout](#repo-layout)
3. [Prerequisites](#prerequisites)
4. [First-time setup](#first-time-setup)
5. [Running locally](#running-locally)
6. [What you can do in the app](#what-you-can-do-in-the-app)
7. [Running tests](#running-tests)
8. [Troubleshooting](#troubleshooting)
9. [Resetting state](#resetting-state)
10. [Roadmap: Docker support](#roadmap-docker-support)

---

## Stack

| Layer | Tech | Notes |
|---|---|---|
| Web | React 18 + Vite 5 + TypeScript (strict) | R3F + drei for the 3D editor, TanStack Query, Zustand, react-router |
| API | FastAPI + Pydantic v2 + SQLAlchemy 2 | Clean-architecture per bounded context |
| DB | **Postgres 16 + pgvector** | Required. Easiest via Docker Compose |
| Storage | **Local filesystem** at `/data/storage` in the api container | MinIO swap-in is planned |
| Jobs | FastAPI `BackgroundTasks` | No Redis/Celery yet |
| AI | Pluggable `AIProvider` protocol with a deterministic fake fallback | Real Replicate / Qwen wired when keys are present |
| Vector search | pgvector cosine distance on a 16-dim toy embedding space | Real CLIP/LLM embeddings replace this when the survey ships |
| Monorepo | pnpm workspaces | `apps/web`, `apps/api`, `packages/shared-types` |

The fastest path to a working stack is `docker compose up` — see [Running with Docker](#running-with-docker). Native runs require a local Postgres + pgvector install.

---

## Repo layout

```
DormVibe/
├── apps/
│   ├── web/          # React + Vite SPA
│   │   └── src/
│   │       ├── app/             # router, shell, RequireAuth
│   │       ├── features/        # auth, projects, editor, survey, shopping-list
│   │       ├── themes/          # CSS-var theme store + toggle
│   │       └── shared/          # api client, types, ui tokens
│   └── api/          # FastAPI backend
│       └── app/
│           ├── core/            # config, logging, deps
│           ├── db/              # SQLAlchemy base + session
│           ├── ai/              # AIProvider protocol + fake/real
│           └── contexts/        # bounded contexts (clean arch)
│               ├── identity/    # auth: register/login/refresh/me
│               ├── projects/    # CRUD + scene edits + recompose
│               ├── scene/       # SceneGraph + EditOp + reducer + composer
│               └── catalog/     # in-memory product list (Phase 3 stub)
├── packages/
│   └── shared-types/ # TS types mirrored from Pydantic (manual today)
├── _Context/         # business + technical + agent-plan docs
└── README.md
```

---

## Prerequisites

| | Required | Why |
|---|---|---|
| Node | ≥ 20 | Vite 5 |
| pnpm | ≥ 9 | Monorepo |
| Python | ≥ 3.12 (3.14 works) | FastAPI + Pydantic v2 |
| Git | Any recent | — |

Check:
```bash
node -v
pnpm -v
python --version
```

If `pnpm` is missing: `npm install -g pnpm`.

---

## First-time setup

From the repo root:

### 1. Install web dependencies
```bash
pnpm install
```

### 2. Install API dependencies (Python venv)

**Windows (Git Bash / WSL / PowerShell):**
```bash
cd apps/api
python -m venv .venv
.venv/Scripts/python.exe -m pip install --upgrade pip
.venv/Scripts/python.exe -m pip install -e ".[dev]"
.venv/Scripts/python.exe -m pip install hypothesis        # for property tests
cd ../..
```

**macOS / Linux:**
```bash
cd apps/api
python -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -e ".[dev]"
.venv/bin/python -m pip install hypothesis
cd ../..
```

### 3. (Optional) configure environment

The defaults in `apps/web/.env` and `apps/api/.env` work out of the box for local dev. Edit only if you need to wire real AI providers (Replicate, Qwen, etc.). See `.env.example` at the repo root for every variable the project understands.

---

## Running locally

You need **two terminals**, both run from the repo root.

### Terminal 1 — API (port 8000)
```bash
pnpm dev:api
```
The API script auto-detects `apps/api/.venv` and uses it — no manual `activate` step needed (it falls back to `python` on your PATH only if the venv doesn't exist yet). Logs end with `Uvicorn running on http://0.0.0.0:8000`. Useful URLs:

| URL | Purpose |
|---|---|
| http://localhost:8000/api/v1/health | Liveness check |
| http://localhost:8000/docs | Interactive Swagger UI |
| http://localhost:8000/redoc | Alternate API docs |

### Terminal 2 — Web (port 5173)
```bash
pnpm dev:web
```
Logs end with `Local: http://localhost:5173/`.

### Open the app

→ **http://localhost:5173**

Both servers hot-reload on file change.

---

## What you can do in the app

1. **Register** an account (email + 8+ char password).
2. (Optional) take the **5-step style survey** — your picks personalize the "✨ Generate" recommendations and item ranking.
3. **Create a project** (room dimensions in meters).
4. Click the project name to open the **editor**.
5. In the right side-panel:
   - **✨ Generate scene** — pick a style (`cozy`, `minimal`, `study`, `social`) or use your style profile, and fill the room. Locked items are preserved on regenerate.
   - **Click** an item to select; **drag** to move along the floor.
   - **⟲ / ⟳ 90°** rotate.
   - **🔒 Lock** to pin (locked items can't be moved or deleted, and survive regenerate).
   - **Swap to…** changes the model while preserving the transform.
   - **🗑 Delete**, **↶ Undo**, **↷ Redo**.
6. In the editor toolbar:
   - **📸 Export PNG** — downloads the current 3D view as a PNG.
   - **🛒 Shopping list** — opens a roll-up of every item in the scene with per-product subtotals, a CNY total, and Taobao "Shop ↗" links. From there you can **🔗 Share** (Web Share API with clipboard fallback) and **🖨 Print** (save as PDF).
7. Top-right of the shell: **🌙 / ☀️ theme toggle** — switches between the default dorm-purple theme and a light theme. Choice persists in localStorage.

Every edit goes through the same `apply(scene, op) → scene'` reducer on both client and server. The server enforces in-room bounds, lock semantics, and optimistic-concurrency via a `version` field.

---

## Running tests

### Backend (pytest + Hypothesis)
```bash
cd apps/api
.venv/Scripts/python.exe -m pytest -q    # Windows
# .venv/bin/python -m pytest -q          # macOS/Linux
```
Covers: scene-op reducer, layout-solver property test (200 random rooms × items), cross-language fixture corpus.

### Frontend (Vitest)
```bash
pnpm -F web test
```
Runs the same fixture corpus through the TypeScript reducer. If the Python and TS reducers ever drift, this fails.

### Typecheck
```bash
pnpm -F web typecheck
```

### Production build
```bash
pnpm -F web build
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `pnpm dev:api` fails with `No module named uvicorn` or `python: command not found` | The API deps aren't where the launcher looks. Create the venv per [First-time setup](#first-time-setup); the `dev` script auto-detects `apps/api/.venv` (it only falls back to PATH `python` when no venv exists). |
| Web shows `error: Failed to fetch` on `/health` | API isn't running, or CORS origin in `apps/api/app/main.py` doesn't include your Vite port |
| 401 everywhere even after login | Stale token in `localStorage`. DevTools → Application → Local Storage → delete the `dormvibe.auth` key, refresh |
| 409 `SCENE_VERSION_CONFLICT` | The scene was edited in another tab. Refresh the editor |
| Editor canvas blank on Safari | Safari ≥ 16 required for WebGL features used by R3F |
| 📸 Export PNG produces a black image | `preserveDrawingBuffer` requires the canvas to be on-screen when captured. Make sure the editor view is visible; refresh and retry |
| Theme toggle does nothing | Clear `localStorage` key `dormvibe.theme`. Ensure your browser supports CSS custom properties (every browser since 2017) |
| Port 8000 / 5173 already in use | Change the port: `pnpm -F api dev -- --port 8001`, or kill the other process |

---

## Resetting state

| What | How |
|---|---|
| All users + projects | Stop the API, delete `apps/api/dormvibe.db`, restart |
| Just your local session | DevTools → Local Storage → delete `dormvibe.auth` |
| Theme preference | DevTools → Local Storage → delete `dormvibe.theme` |
| Node deps from a bad lockfile | `rm -rf node_modules apps/*/node_modules pnpm-lock.yaml && pnpm install` |
| Python venv | `rm -rf apps/api/.venv` and re-run [first-time setup](#first-time-setup) |

---

## Running with Docker

Both apps can run in containers as an alternative to `pnpm dev:api` / `pnpm dev:web`. The behavior is identical (same SQLite-backed app), the difference is **you don't need Python or Node installed natively** — only Docker Desktop.

### Prerequisites
- Docker Desktop running (whale icon in tray = "Engine running")
- ~1.5 GB of free disk for the two images

### Start the stack
From the repo root:
```bash
docker compose -f infra/docker-compose.yml up --build
```
First run pulls base images and installs deps (~3–5 min). Subsequent runs are seconds because layers are cached.

Once you see `dormvibe-api-1 ... Healthy` and `dormvibe-web-1 ... Started`:

| URL | Same as native |
|---|---|
| http://localhost:5173 | Web app |
| http://localhost:8000/api/v1/health | API liveness |
| http://localhost:8000/docs | Swagger UI |

The browser still talks to `localhost:5173` and `localhost:8000` — the containers are just where the servers actually live.

### Common commands
```bash
# Run in the background
docker compose -f infra/docker-compose.yml up -d --build

# Tail logs
docker compose -f infra/docker-compose.yml logs -f
docker compose -f infra/docker-compose.yml logs -f api    # just the API

# Stop everything (containers + network, keeps the SQLite volume)
docker compose -f infra/docker-compose.yml down

# Stop AND wipe the database volume (full reset)
docker compose -f infra/docker-compose.yml down -v

# Rebuild after dependency changes (pyproject.toml or package.json)
docker compose -f infra/docker-compose.yml build

# Shell into a running container
docker compose -f infra/docker-compose.yml exec api bash
docker compose -f infra/docker-compose.yml exec web sh

# Run the test suite inside the api container
docker compose -f infra/docker-compose.yml exec api pytest -q
```

### What's where in the containers

| Service | Image | Volumes | Notes |
|---|---|---|---|
| `api` | `dormvibe/api:dev` (Python 3.12-slim) | `api_data` → `/data` (SQLite + uploaded files); `apps/api/app` bind-mounted → `/app/app` (hot reload) | Runs `uvicorn --reload` watching `/app/app` |
| `web` | `dormvibe/web:dev` (Node 22-alpine + pnpm 11) | `apps/web/src`, `public`, `index.html`, `vite.config.ts`, `tsconfig.json` bind-mounted; anonymous volume shadows `node_modules` | Runs `vite --host 0.0.0.0` |

The SQLite database file lives in the named volume `dormvibe_api_data`. It survives `docker compose down` and is wiped only by `docker compose down -v`.

### When to use which

| Situation | Native (`pnpm dev:*`) | Docker (`docker compose up`) |
|---|---|---|
| You're actively coding | ✅ Fastest iteration loop | OK — hot reload works, but image rebuilds are needed for dep changes |
| You don't have Python installed | — | ✅ |
| New contributor onboarding | Needs Python + Node + pnpm | ✅ Just Docker |
| CI | — | ✅ Same image as prod |
| Demoing to someone | — | ✅ "Clone, `docker compose up`, open browser." |

### Docker file layout in this repo

```
infra/docker-compose.yml      # the orchestration
apps/api/Dockerfile           # multi-stage Python 3.12 image
apps/api/.dockerignore
apps/web/Dockerfile.dev       # Node 22 + pnpm + vite for development
.dockerignore                 # repo-root context (used by the web build)
```

### What's running in the stack today

- **`postgres`** — `pgvector/pgvector:pg16`. The `vector` extension is enabled automatically on startup; the catalog of 8 products is seeded into a `products` table with a 16-dim embedding column.
- **`api`** — FastAPI on port 8000. Waits for Postgres health before starting, creates tables via `Base.metadata.create_all` for now (Alembic comes when schemas start churning).
- **`web`** — Vite dev server on port 5173 with HMR via bind mount.

### Phase 3+ services to add later

Each is one PR, ordered by need:

1. **`minio`** — S3-compatible object store for GLB files and exported images. Replaces `STORAGE_DIR` with a put_object / presign_get abstraction.
2. **`redis` + a `worker` service** — only if any AI call exceeds ~30s P95. Replaces FastAPI `BackgroundTasks` with Celery (or `arq`).
3. **Alembic migrations** — drop `create_all` once schemas stabilize and start needing real version history.
