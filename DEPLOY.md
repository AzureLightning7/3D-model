# DormVibe — Deployment Plan (Render)

> **Status: DRAFT — do not adopt until we've validated it end-to-end.**
> Run the [pre-deploy checks](#0-pre-deploy-checks-do-this-first) and the
> [smoke test](#5-smoke-test-prove-the-app-still-works) on a throwaway Render
> environment first. Only merge/commit this file once a deploy has gone green.

## What we're deploying

| Piece | Render service | Source | Notes |
|---|---|---|---|
| **API** (FastAPI) | **Web Service (Docker)** | `apps/api/Dockerfile` | Always-on container + a **persistent disk** at `/data` for the SQLite DB and uploaded files |
| **Web** (Vite SPA) | **Static Site** | `pnpm -F web build` → `apps/web/dist` | Served from Render's global CDN |

Two public URLs (names are ours to choose — the rest of this doc assumes these):

- API → `https://dorm-vibe.onrender.com`
- Web → `https://dormvibe-web.onrender.com`

**Why this shape:** the API is a long-running server with a local SQLite file, so it
needs a host that keeps a process alive with a persistent disk (that's why we're not
using Vercel's serverless model). The app runs entirely on **SQLite** today — the
catalog "vector search" is computed in Python over JSON-stored embeddings
(`apps/api/app/contexts/catalog/infrastructure/repository.py`), so **Postgres/pgvector
are not required** to ship. We can switch `DATABASE_URL` to managed Postgres later with
no code change.

## Cost / plan decision (read before starting)

- The API **runs fine on the free plan** — the free tier does not disable sign-up or any
  feature. What it lacks is *persistence*: free web services have **no disk** and **spin
  down when idle** (≈50s cold start on the next request), so the **SQLite DB resets on
  every deploy/restart** and accounts/projects don't survive.
- A **persistent disk requires a paid instance** (Render **Starter**, ~US$7/mo). Add it
  only when you want data to stick around.
- The **Static Site (web) is free** regardless.
- **For a public demo:** free API + the built-in **guest "Try it" mode**
  ([§8](#8-guest-try-it-mode-no-signup)) is a good combo — visitors get a throwaway
  session and nobody expects a demo to persist. Upgrade to Starter (or a free Postgres,
  see [§7](#7-known-limitations--follow-ups)) later if you want lasting accounts.

---

## 0. Pre-deploy checks (do this first)

Run locally from the repo root and confirm all pass before touching Render:

```bash
pnpm install
pnpm dev                 # both servers come up; open http://localhost:5173 and click around
pnpm -F web build        # production web build succeeds → apps/web/dist
```

For the API specifically (uses the auto-venv launcher — see README):

```bash
pnpm dev:api             # boots uvicorn on :8000, no "No module named uvicorn"
# open http://localhost:8000/api/v1/health  → {"status":"ok",...}
```

If any of these fail, **stop** — fix locally first; the deploy will not fix it.

---

## 1. Deploy the API (backend)

Render Dashboard → **New → Web Service** → connect this repo.

| Setting | Value |
|---|---|
| Name | `dorm-vibe` |
| Language / Runtime | **Docker** |
| Branch | `main` (or our chosen deploy branch) |
| Root Directory | `apps/api` |
| Dockerfile Path | `Dockerfile` (i.e. `apps/api/Dockerfile`) |
| Instance Type | **Free** (or **Starter** if adding a persistent disk) |
| Health Check Path | `/api/v1/health` |

> **Port:** nothing to do — the Docker image binds to Render's `$PORT` automatically
> (falling back to `8000` locally). A port mismatch is the #1 cause of a service that
> builds but then returns `x-render-routing: no-server`, so it's wired into the image.

> **Service name matters:** the web build bakes in `https://dorm-vibe.onrender.com/api/v1`.
> Name this service exactly **`dorm-vibe`** so the URL matches — otherwise you must
> rebuild the web with the new `VITE_API_BASE_URL`.

**Persistent disk (paid plans only):** on **Starter**+, Advanced → Disks → Add Disk →
Name `data`, Mount Path `/data`, Size `1 GB`. **Skip on Free** (no disk available; the DB
is ephemeral).

**Set environment variables** ([full table below](#api-environment-variables)). The
critical ones: `APP_ENV=production`, a generated `JWT_SECRET`, and `APP_CORS_ORIGINS`
(set in step 3, once we know the web URL). ⚠️ If you set `APP_ENV=production` you **must**
also set a strong `JWT_SECRET` — the app refuses to boot otherwise, and that startup crash
is itself a common cause of `no-server`.

Click **Create**. Wait for **Live**, then verify:

- `https://dorm-vibe.onrender.com/api/v1/health` → `{"status":"ok",...}`
- `https://dorm-vibe.onrender.com/docs` → Swagger UI loads

---

## 2. Deploy the Web (frontend)

Render Dashboard → **New → Static Site** → same repo.

| Setting | Value |
|---|---|
| Name | `dormvibe-web` |
| Branch | `main` |
| Root Directory | `.` (repo root, so the pnpm workspace resolves) |
| Build Command | `pnpm install --frozen-lockfile && pnpm -F web build` |
| Publish Directory | `apps/web/dist` |

**Environment variables:**

| Key | Value |
|---|---|
| `NODE_VERSION` | `20` |
| `VITE_API_BASE_URL` | `https://dorm-vibe.onrender.com/api/v1` |

> `VITE_API_BASE_URL` is **baked in at build time** — if the API URL changes, the web
> must be rebuilt (a redeploy).

**SPA routing — required:** Static Site → **Redirects/Rewrites** → Add Rule:
Source `/*`, Destination `/index.html`, Action **Rewrite**. Without this, refreshing on a
deep link (e.g. `/projects/123`) 404s.

Click **Create**, wait for **Live**, open `https://dormvibe-web.onrender.com`.

> **pnpm note:** Render auto-detects pnpm from `pnpm-lock.yaml`. If the build can't find
> `pnpm`, prefix the build command with `corepack enable && ` or add
> `"packageManager": "pnpm@9"` to the root `package.json`.

---

## 3. Connect them (CORS)

On **dorm-vibe** → Environment, set:

```
APP_CORS_ORIGINS=https://dormvibe-web.onrender.com
```

Save → the API redeploys. The browser app on the web origin can now call the API
(without this, requests fail with CORS errors even though the API is up).

---

## 4. Environment variables

### API environment variables

| Key | Value | Why |
|---|---|---|
| `APP_ENV` | `production` | Enables prod safety checks |
| `APP_LOG_LEVEL` | `info` | |
| `JWT_SECRET` | *(generate — see below)* | App **refuses to start** in prod with the insecure default (`config.py:67`) |
| `JWT_ACCESS_TTL_SECONDS` | `900` | |
| `JWT_REFRESH_TTL_SECONDS` | `2592000` | |
| `DATABASE_URL` | `sqlite:////data/dormvibe.db` | SQLite on the persistent disk (4 slashes = absolute path) |
| `APP_BASE_URL` | `https://dorm-vibe.onrender.com` | |
| `APP_CORS_ORIGINS` | `https://dormvibe-web.onrender.com` | Set in step 3 |
| `PORT` | `8000` | Only if you did **not** override the Docker command with `$PORT` |
| `STORAGE_DIR` | `/data/storage` | *Set for forward-compat; not read by the app yet* |
| `STORAGE_PUBLIC_BASE_URL` | `https://dorm-vibe.onrender.com/generated` | *Not read by the app yet* |
| `MINIMAX_API_KEY` etc. | *(blank)* | Leave AI keys blank → app uses the deterministic **fake** provider. `/transform-room` returns 503 without `MINIMAX_API_KEY` (expected) |

Generate a strong `JWT_SECRET`:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

(Or let Render generate it — see the `generateValue` field in the [blueprint](#appendix-renderyaml-blueprint).)

### Web environment variables

| Key | Value |
|---|---|
| `NODE_VERSION` | `20` |
| `VITE_API_BASE_URL` | `https://dorm-vibe.onrender.com/api/v1` |

---

## 5. Smoke test (prove the app still works)

Against the deployed web URL, walk the core flow (mirrors the README "What you can do"):

- [ ] `GET /api/v1/health` returns `ok`
- [ ] Web app loads, no console errors, no `Failed to fetch` on `/health`
- [ ] **Register** an account (email + 8+ char password), then log out / log in
- [ ] **Create a project** (room dimensions)
- [ ] Open the **editor**, **✨ Generate scene**, drag / rotate / lock an item
- [ ] **🛒 Shopping list** opens with totals and links
- [ ] **🌙 / ☀️ theme toggle** works and persists on refresh
- [ ] Refresh on a deep link (e.g. the editor URL) — no 404 (confirms the SPA rewrite)

If all pass, the deploy is good. **Then** commit this `DEPLOY.md`.

---

## 6. Making changes after it's deployed (day-2)

**Yes — it's basically git-push-to-deploy.** With **Auto-Deploy** on (the default), every
push to the connected branch rebuilds and redeploys automatically:

- **Web changes** → push → Render rebuilds the static bundle and swaps it on the CDN
  atomically (**zero downtime**). Changing `VITE_API_BASE_URL` is just a redeploy
  (build-time var, so a rebuild picks it up).
- **API changes** → push → Render builds the new image and restarts the container —
  **stop-then-start** (a few seconds of downtime), not zero-downtime. On **Free** that's
  inherent (single instance); with a **persistent disk** it's also required (the disk
  attaches to one instance at a time). Acceptable for our scale; worth knowing.
- **Env-var / config changes** → edit in the dashboard → triggers a redeploy.
- **Rollback** → Render keeps a deploy history; one-click **Rollback** to a previous
  build. (DB/disk contents are *not* rolled back — only the code/image.)
- **PR previews** (optional) → enable to get a temporary environment per pull request.

So iterating is easy. The only thing that's *not* instant is anything touching the
SQLite schema (we create tables on startup via `create_all`; real migrations = Alembic
later).

---

## 7. Known limitations & follow-ups

- **Single instance only.** SQLite on a local disk means we can't scale the API
  horizontally. When we need to, switch `DATABASE_URL` to a managed Postgres (the
  in-Python cosine search still works → clean swap) and drop the disk.
- **Generated AI images are ephemeral.** `app/main.py` writes them under
  `public/generated` (inside the image, **not** on `/data`), so they're lost on redeploy.
  Only relevant once we set real AI keys; persisting them is a follow-up (point the
  generated dir at `/data` + object storage).
- **No custom domain yet.** Add one in Render (Web → Settings → Custom Domains); remember
  to add it to `APP_CORS_ORIGINS` and rebuild the web with the matching `VITE_API_BASE_URL`.
- **Secrets hygiene.** `JWT_SECRET` and any AI keys live only in Render env vars, never in
  git. Rotating `JWT_SECRET` invalidates existing sessions (everyone re-logs-in).
- **Free-tier persistence.** On Free the SQLite DB is ephemeral (resets on spin-down /
  redeploy). For lasting accounts without paying for a Render disk, point `DATABASE_URL`
  at a free **Neon** or **Supabase** Postgres (both support the `vector` extension the app
  creates on boot; no code change). Otherwise lean on guest mode (§8) for demos.

---

## 8. Guest "Try it" mode (no signup)

The app ships a **guest session** so visitors can try everything without creating an
account — handy precisely because the Free tier doesn't persist data.

- **How it works:** `POST /api/v1/auth/guest` creates a throwaway user (random
  credentials, never revealed) and returns the same token pair as a normal login. The web
  exposes it as a **"Try it — no sign-up needed"** button on the Login and Register pages.
- **Nothing to configure** — it ships as part of the normal API + web deploy.
- **Cleanup (only matters with persistent storage):** each click inserts a
  `guest-*@guest.dormvibe.local` user row. On the ephemeral Free DB these vanish on
  restart; once you move to a persistent disk/Postgres, periodically prune old guest rows.

---

## Appendix: `render.yaml` (Blueprint)

Optional infrastructure-as-code alternative to clicking through the dashboard. Commit
this at the repo root, then Render Dashboard → **New → Blueprint** → pick this repo.
Review names / `plan` / `region` before applying; secrets are auto-generated.

```yaml
services:
  - type: web
    name: dorm-vibe
    runtime: docker
    rootDir: apps/api
    dockerfilePath: ./Dockerfile
    # No dockerCommand needed — the image binds to $PORT (default 8000) on its own.
    plan: starter            # paid: required for the disk below. For a free ephemeral
                             # demo, set `plan: free` and DELETE the `disk:` block.
    region: oregon           # pick the closest region
    healthCheckPath: /api/v1/health
    autoDeploy: true
    disk:
      name: data
      mountPath: /data
      sizeGB: 1
    envVars:
      - key: APP_ENV
        value: production
      - key: APP_LOG_LEVEL
        value: info
      - key: DATABASE_URL
        value: sqlite:////data/dormvibe.db
      - key: STORAGE_DIR
        value: /data/storage
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_ACCESS_TTL_SECONDS
        value: "900"
      - key: JWT_REFRESH_TTL_SECONDS
        value: "2592000"
      - key: APP_BASE_URL
        value: https://dorm-vibe.onrender.com
      - key: STORAGE_PUBLIC_BASE_URL
        value: https://dorm-vibe.onrender.com/generated
      - key: APP_CORS_ORIGINS
        value: https://dormvibe-web.onrender.com

  - type: web
    name: dormvibe-web
    runtime: static
    rootDir: .
    buildCommand: pnpm install --frozen-lockfile && pnpm -F web build
    staticPublishPath: apps/web/dist
    autoDeploy: true
    envVars:
      - key: NODE_VERSION
        value: "20"
      - key: VITE_API_BASE_URL
        value: https://dorm-vibe.onrender.com/api/v1
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

> The dashboard steps above are the source of truth; treat the blueprint as a
> convenience. After a blueprint apply, double-check the disk mounted and
> `APP_CORS_ORIGINS` matches the actual web URL.
