# DormVibe — Error & Issue Log

**Created:** 2026-06-07
**Branch:** `Azure/fix-errors`
**Source:** Full codebase audit against `_Context/01_BUSINESS_REQUIREMENTS.md`,
`_Context/02_TECHNICAL_SPECIFICATION.md`, and common practices.

This file is the running record of every issue found, its current status, and
either **what was done** to fix it or **what should be done**. Keep it updated as
issues are resolved.

## Legend

| Status | Meaning |
|---|---|
| ✅ Fixed | Resolved in this branch. "Resolution" describes what was changed. |
| 🟡 Partial | Partially addressed; remaining work noted. |
| ⬜ Open | Not yet addressed. "Plan" describes what should be done. |

Severity: **Critical** (breaks a real path) · **Security** · **Spec-drift** ·
**UX** · **Hygiene**.

---

## Summary

| ID | Title | Severity | Status |
|---|---|---|---|
| A1 | Compose `api` had no healthcheck for `web`'s `service_healthy` wait | Critical | ✅ Fixed |
| A2 | `pgvector.Vector` on the default SQLite DB (verified: works) | Critical | ✅ Not a bug |
| A3 | E2E demo-flow spec used dead localStorage key + stale selectors | Critical | ✅ Fixed¹ |
| A4 | Theme toggle advertised in README but never rendered | Critical | ✅ Fixed |
| A5 | `dormvibe-light` theme had no CSS | Critical | 🟡 Partial |
| B1 | Default JWT secret usable in any environment | Security | ✅ Fixed |
| B2 | Refresh tokens never rotated / revoked | Security | ✅ Fixed |
| B3 | CORS origins hardcoded to localhost | Security | ✅ Fixed |
| B4 | SQLite DB committed to the repo | Security | ✅ Verified |
| B5 | Auth API leaked raw JWT decode error text | Security | ✅ Fixed |
| B6 | Photo upload has no server-side magic-byte/size validation | Security | ⬜ Open |
| C1 | Scene Graph far smaller than spec §3.2 | Spec-drift | ⬜ Open |
| C2 | No `/auth/logout` endpoint | Spec-drift | ✅ Fixed |
| C3 | No room-photo / dimensions / reconstruct endpoints | Spec-drift | ⬜ Open |
| C4 | No job queue / WebSocket job status | Spec-drift | ⬜ Open |
| C5 | No `Idempotency-Key` handling | Spec-drift | ⬜ Open |
| C6 | Errors are not RFC 7807 problem+json | Spec-drift | ⬜ Open |
| C7 | RECOMPOSE doesn't re-validate carried-forward locked items | Spec-drift | ✅ Fixed |
| C8 | `SWAP_ITEM` has no footprint/collision check | Spec-drift | ⬜ Open |
| C9 | Frontend MBTI survey answers are lost before reaching the server | Spec-drift | ⬜ Open |
| C10 | Catalog has 24 products vs spec's 50–100 | Spec-drift | ⬜ Open |
| C11 | Items render as colored boxes, never GLB models | Spec-drift | ⬜ Open |
| C12 | `@react-three/rapier` (spec'd) is absent | Spec-drift | ⬜ Open |
| C13 | `docs/adr/` exists but is empty | Spec-drift | ✅ Fixed |
| D1 | Password strength used `> 8` while field accepts `>= 8` | UX | ✅ Fixed |
| D2 | `setItemYOffset` (Raise/Lower) never persists to server | UX | ✅ Fixed |
| D3 | `ItemBox` reads `meshRef` before declaration (TDZ-style) | UX | ✅ Fixed |
| D4 | Drag mutates mesh outside React; can desync mid-render | UX | ⬜ Open |
| D5 | Room DNA shared/persisted only after the API round-trip | UX | ⬜ Open |
| D6 | Stale-session flash of dashboard before 401 bounce | UX | ⬜ Open |
| D7 | Layout solver silently drops items in cramped rooms | UX | ✅ Fixed |
| D8 | `langStore` default hardcoded `en`, ignoring `VITE_DEFAULT_LOCALE` | UX | ✅ Fixed |
| D9 | README "Phase 4 complete" claims partly untrue | UX | ✅ Fixed |
| E1 | Inconsistent localStorage key style (`.` vs `-`) | Hygiene | ⬜ Open |
| E2 | Lint/type/test not enforced in CI (needs confirmation) | Hygiene | ✅ Fixed |
| E3 | `zod` dependency declared but unused | Hygiene | ⬜ Open |
| E4 | `_patch_columns()` ALTER-TABLE shim instead of Alembic | Hygiene | ⬜ Open |
| T1 | Test fixture seeded a `list` into the `Text` embedding column | Critical | ✅ Fixed |
| T2 | "cozy" recompose dropped the rug (top-K=6, rug ranks 7th) | Critical | ✅ Fixed |

¹ A3 code/selectors corrected; full green requires a live stack + `@playwright/test`
install (see entry).

T1/T2 were discovered while running the test suite to verify the same-day fixes
(both were latent — T1 made the client tests *error* so T2's assertion never ran).

---

## Fixed in this branch

### A1 — Compose `api` healthcheck — ✅ Fixed
- **Severity:** Critical
- **Where:** `infra/docker-compose.yml`
- **Problem:** `web` declared `depends_on: api: condition: service_healthy`, but
  the `api` service had no `healthcheck:` block. It only worked because the
  Dockerfile bakes a `HEALTHCHECK`; the contract was invisible at the compose
  level and would break if the Dockerfile changed.
- **Resolution:** Added an explicit `healthcheck:` to the `api` service mirroring
  the Dockerfile's urllib check (`/api/v1/health`), with `interval/timeout/
  start_period/retries`.

### A3 — E2E demo-flow spec corrected — ✅ Fixed¹
- **Severity:** Critical
- **Where:** `apps/web/e2e/demo-flow.spec.ts`, `apps/web/src/features/editor/components/SidePanel.tsx`
- **Problem:** The spec injected the token at `localStorage["dormvibe.accessToken"]`
  (real key is `dormvibe.auth`, shape `{state:{user,tokens},version}`), clicked a
  `/generate scene/i` button (real label "Generate My Layout"/"生成我的布局"),
  and used `getByLabel(/swap to/i)` (real label "Replace With…"). It also never
  switched the SidePanel tabs, so Lock/Swap controls were never visible.
- **Resolution:** Added stable `data-testid`s to the SidePanel controls
  (`generate-scene`, `mode-start|add|edit`, `lock-toggle`, `swap-select`,
  `saving-indicator`). Rewrote the spec to seed `dormvibe.auth` correctly, use the
  testids, switch tabs, and assert the locale-independent 🔓 icon after locking.
- **¹ Remaining to fully verify:** the spec is excluded from Vitest and needs
  `pnpm add -D -F web @playwright/test` + a running stack to execute headless.
  Logic/selectors are corrected; a live run is the final confirmation.

### A4 — Theme toggle wired into the shell — ✅ Fixed
- **Severity:** Critical
- **Where:** `apps/web/src/app/AppShell.tsx`
- **Problem:** `ThemeToggle.tsx` existed but had zero importers; the README
  advertised a top-right theme toggle that did not appear anywhere.
- **Resolution:** Imported and rendered `<ThemeToggle />` next to the language
  toggle in both the logged-out and logged-in nav branches. Also switched the
  shell's hardcoded `background: "#0A0A0A"` to `var(--c-bg)` so toggling has a
  visible effect on the page background.

### A5 — Light theme CSS added — 🟡 Partial
- **Severity:** Critical
- **Where:** `apps/web/src/index.css`
- **Problem:** Only `:root` (dark) tokens existed; `[data-theme="dormvibe-light"]`
  was missing, so the toggle changed the `<html data-theme>` attribute with no
  visual effect.
- **Resolution:** Added a `[data-theme="dormvibe-light"]` block overriding every
  `--c-*` token with light values.
- **Remaining:** Several surfaces still hardcode dark hex values (e.g.
  `HomePage` `#0A0A0A`, the sticky nav's `rgba(10,10,10,…)`, the editor canvas
  `<color args={["#0A0A0A"]}>`). Light mode is functional for token-driven
  surfaces but not pixel-perfect until those are tokenized. Tracked here; ties
  into the larger theming refactor the spec describes (§12).

### B1 — JWT secret guard — ✅ Fixed
- **Severity:** Security
- **Where:** `apps/api/app/core/config.py`, `.env.example`
- **Problem:** `JWT_SECRET` silently defaulted to `"dev-insecure-change-me"` in
  any environment; nothing rejected it in staging/production.
- **Resolution:** `load_settings()` now raises `RuntimeError` when
  `APP_ENV != "local"` and `JWT_SECRET` is empty or the insecure default. Updated
  `.env.example` with a warning comment.

### B3 — Configurable CORS origins — ✅ Fixed
- **Severity:** Security
- **Where:** `apps/api/app/core/config.py`, `apps/api/app/main.py`, `.env.example`
- **Problem:** `allow_origins` was hardcoded to localhost; production would need a
  code edit.
- **Resolution:** Added `APP_CORS_ORIGINS` (comma-separated) parsed into
  `settings.cors_origins` (defaults to the localhost pair). `main.py` now reads
  `list(settings.cors_origins)`. Documented in `.env.example`.

### B4 — Committed SQLite DB — ✅ Verified
- **Severity:** Security
- **Where:** `.gitignore`, `apps/api/dormvibe.db`
- **Problem (suspected):** a dev SQLite DB (with user rows / password hashes) was
  thought to be committed.
- **Resolution / finding:** `.gitignore` already lists `apps/api/dormvibe.db`
  (line 60) and `git ls-files apps/api/dormvibe.db` returns nothing — the file is
  **not tracked**. No action needed. The on-disk file is local-only.

### B5 — Generic auth error messages — ✅ Fixed
- **Severity:** Security
- **Where:** `apps/api/app/contexts/identity/interfaces/router.py`, `apps/api/app/core/deps.py`
- **Problem:** Responses returned `f"Invalid refresh token: {e}"` and
  `f"Invalid token: {e}"`, leaking the JWT library's failure mode to clients.
- **Resolution:** Both now return generic messages ("Invalid refresh token" /
  "Invalid token") and log the underlying error server-side at INFO via a module
  logger.

### D1 — Password strength threshold — ✅ Fixed
- **Severity:** UX
- **Where:** `apps/web/src/features/auth/RegisterPage.tsx`
- **Problem:** The strength meter used `password.length > 8`, but the field and
  backend accept `>= 8`, so an exactly-8-char password never scored its length
  point.
- **Resolution:** Changed to `password.length >= 8`.

### D8 — Default locale from env — ✅ Fixed
- **Severity:** UX
- **Where:** `apps/web/src/store/langStore.ts`
- **Problem:** Default language was hardcoded `"en"`; `VITE_DEFAULT_LOCALE`
  (`zh-CN` in compose, per spec's zh-primary target) was read nowhere.
- **Resolution:** The store's initial `lang` now derives from
  `VITE_DEFAULT_LOCALE` (`zh*` → `zh`, else `en`), falling back to `en` when
  unset so non-docker dev is unchanged. Persisted user choice still wins.

### D9 — README "Phase 4 complete" accuracy — ✅ Fixed
- **Severity:** UX
- **Where:** `README.md`
- **Problem:** The README's "theme toggle" claim was false (A4 — not rendered),
  and sign-out had no server-side teardown (C2 — no `/auth/logout`).
- **Resolution:** Both underlying gaps are now closed: the theme toggle renders
  (A4) and `/auth/logout` exists and is called on sign-out (C2). Every item in the
  README status line ("shopping list, image export, theme toggle, share") is now
  real, so the line is accurate — no README edit needed. (Light-theme coverage is
  still partial; see A5.)

### T1 — Test fixture seeded a list into a Text column — ✅ Fixed
- **Severity:** Critical (test suite red)
- **Where:** `apps/api/tests/conftest.py`
- **Problem:** The fixture seeded `embedding=for_product(p.id)` (a `list[float]`)
  into `products.embedding`, which is `Text` (`catalog/infrastructure/models.py:24`).
  On SQLite this raised `sqlite3.ProgrammingError: type 'list' is not supported`,
  erroring all 6 client-based tests. Production `seed.py` correctly uses
  `json.dumps(...)`; the fixture had drifted (its comments reference an older era
  when the column was a pgvector `Vector`).
- **Resolution:** Fixture now seeds `embedding=json.dumps(for_product(p.id))`,
  matching `seed.py`. The monkeypatched `_recommend` already parses string
  embeddings, so ranking still works.

### T2 — "cozy" recompose dropped the rug — ✅ Fixed
- **Severity:** Critical (breaks the headline demo)
- **Where:** `apps/api/app/contexts/scene/application/composer.py:23`
- **Problem:** `DEFAULT_TOP_K = 6`, but rug-round ranks **7th** by cosine
  similarity to the "cozy" anchor (verified: bed-single, chair-pink, sofa-mauve,
  sofa-cream, bed-double, pendant-light, *rug-round*, …). So the cozy scene never
  contained a rug, and the documented demo ("swap the sofa while the rug stays
  put", `test_demo_flow.py`) could not work. Latent because T1 made the test error
  before this assertion ran.
- **Resolution:** Raised `DEFAULT_TOP_K` to 8 (matches the recommend endpoint
  default; gives the rug margin). All 27 API tests pass.
- **Follow-up (⬜):** A category-aware composer that *guarantees* a rug/decor item
  regardless of K would be more robust than relying on the ranking cutoff.

### B2 — Refresh-token rotation, reuse detection & revocation — ✅ Fixed
- **Severity:** Security
- **Where:** new `refresh_tokens` table + `RefreshTokenRepository`
  (`identity/infrastructure/`), `identity/domain/refresh_token.py`, rewired
  `identity/application/service.py` and `identity/interfaces/router.py`,
  `identity/application/tokens.py` (now exposes `refresh_jti`).
- **Problem:** `refresh()` re-issued a pair without invalidating the old token —
  a captured refresh token stayed usable for its full 30-day life. No jti store,
  no reuse detection (spec §9.1).
- **Resolution:** Each issued refresh token's `jti` is persisted as active.
  `rotate_refresh` revokes the presented jti and issues a new pair; presenting an
  already-revoked jti is treated as **reuse** and revokes *every* token for that
  user (forces full re-login). The router still validates JWT signature/expiry/
  type first. Covered by `tests/test_auth_refresh.py` (rotation, reuse →
  whole-chain revocation, invalid-token rejection).

### C2 — `/auth/logout` endpoint — ✅ Fixed
- **Severity:** Spec-drift (security-adjacent)
- **Where:** `identity/interfaces/router.py`, `apps/web/src/shared/api.ts`,
  `apps/web/src/app/AppShell.tsx`.
- **Problem:** No logout route; the frontend "logout" only cleared localStorage,
  leaving the refresh token valid server-side until expiry.
- **Resolution:** Added `POST /auth/logout` that revokes the presented refresh
  token's jti (idempotent — a bad/expired token still returns 204). The shell's
  `logout()` calls it best-effort before clearing local state. Covered by
  `tests/test_auth_refresh.py` (logout revokes; idempotent for bad token).

### D3 — `meshRef` used before declaration — ✅ Fixed
- **Severity:** UX (readability / lint hazard)
- **Where:** `apps/web/src/features/editor/components/ItemBox.tsx`.
- **Problem:** `onPointerMove` referenced `meshRef.current` while
  `const meshRef = useRef…` was declared ~20 lines below the handlers — worked via
  closure but confusing and a `no-use-before-define` trip hazard.
- **Resolution:** Moved the `meshRef` declaration up with the other `useRef`s.

### C13 — Seed the ADR directory — ✅ Fixed
- **Severity:** Spec-drift (spec §16 wants ADRs in `docs/adr/`)
- **Where:** `docs/adr/`.
- **Problem:** The directory existed but was empty; decisions were implicit in the
  code.
- **Resolution:** Wrote four ADRs capturing decisions already baked in:
  `0001-scene-graph-minimal`, `0002-background-tasks-not-celery`,
  `0003-deterministic-fake-ai-provider`, `0004-sqlite-and-postgres-dev`.

### D7 + C7 — Recompose warnings (skipped items & out-of-bounds locks) — ✅ Fixed
- **Severity:** D7 = UX, C7 = Spec-drift
- **Where:** `scene/application/composer.py` (new `ComposeResult`),
  `projects/interfaces/dto.py` (`RecomposeResponse`),
  `projects/interfaces/router.py`; frontend `shared/types.ts`, `shared/api.ts`,
  `editor/store/sceneStore.ts`, `editor/components/SidePanel.tsx`.
- **Problem (D7):** the layout solver skips items it can't fit, so a cramped room
  came back sparser than requested with no signal. **(C7):** locked items were
  carried into the recomposed scene with no bounds check — an out-of-range lock
  would be silently kept.
- **Resolution:** `compose()` returns `ComposeResult(scene, warnings)`: it diffs
  requested vs placed products to warn about skips, and flags any locked item that
  fails an in-room check (still **kept**, never deleted — matching the spec's
  "flag, not delete"). `POST …/recompose` now returns `{ project, warnings }`; the
  editor stores `lastWarnings` and renders an amber banner in the SidePanel.
- **Tests:** `test_recompose_warns_when_room_too_small` (1×1 room → "too small");
  existing recompose/demo tests updated for the new response shape. 37 API tests
  pass; web typecheck + 35 vitest pass.
- **Note:** small API contract change — recompose response went from `Project` to
  `{ project, warnings }`; only the editor consumes it and was updated.

### D2 — Raise/Lower now persists (via `position.y`) — ✅ Fixed
- **Severity:** UX
- **Where:** `editor/store/sceneStore.ts`, `editor/components/SidePanel.tsx`,
  `editor/components/ItemBox.tsx`, `shared/types.ts`.
- **Problem:** Raise/Lower wrote to a client-only `yOffsets` map that was never
  sent to the server and was wiped on reload; a parallel `yOffset` field on
  `SceneItem` shadowed the real `position.y`.
- **Resolution:** Removed the entire `yOffsets` overlay. Raise/Lower now dispatch
  `MOVE_ITEM` changing `item.position.y` (clamped to `[0, roomHeight]`), validated
  by the reducer and persisted like any other edit. `ItemBox` renders from
  `position.y`; dropped the `yOffset` field from `SceneItem`. Net ~40 fewer lines
  in the store. Web typecheck + 35 vitest pass.

### E2 — Lint/type debt cleared + CI gate — ✅ Fixed
- **Severity:** Hygiene (root cause for bugs like T1/T2 slipping in unnoticed)
- **Where:** `apps/api/pyproject.toml` (ruff/mypy config), ~12 source/test files,
  new `.github/workflows/ci.yml`.
- **Problem:** `ruff` (43 findings) and `mypy --strict` (15) were both red, and
  nothing ran them on PRs, so lint/type regressions went unnoticed.
- **Resolution:**
  - **ruff → green** (`app` + `tests`): auto-fixed import sorting + `UP`
    modernizations; fixed 3 `zip(strict=…)`; wrapped 2 long lines; encoded the
    deliberate conventions in config — `ignore = ["N818"]` (descriptive domain
    exception names) and per-file `E501`/`N806` ignores for the catalog data table
    and the test suite.
  - **mypy --strict → green** (68 files): added `dict[str, Any]` type args, the
    `pydantic.mypy` plugin (which also resolved the `Room(...)` / `SceneItem(...)`
    alias call-arg errors — construction now consistently uses field names), a
    `pgvector.*` import override, a `JsonFormatter` `type: ignore`, and the two
    missing annotations (`_load_owned`, `lifespan`).
  - **CI:** `.github/workflows/ci.yml` runs on push + PR — web (typecheck · vitest
    · build) and api (ruff · mypy · pytest).
- **Verified locally:** ruff clean, mypy clean, 37 API tests, 35 vitest, web build
  all pass.
- **Residual:** the web `lint` script is still a stub (no ESLint); adding a JS
  linter is a separate follow-up (tracked loosely with E3).

---

## Verified — not a bug

### A2 — pgvector `Vector` on SQLite — ✅ Verified, not a bug
- **Severity:** originally flagged Critical → downgraded after investigation.
- **Where:** `apps/api/app/contexts/style_profile/infrastructure/models.py:25`.
- **Original claim:** `pgvector.sqlalchemy.Vector` is Postgres-only and would
  break `create_all` / inserts on the default SQLite dev DB.
- **Finding:** False. pgvector's SQLAlchemy type degrades gracefully on SQLite —
  it stores the vector as a string and reads it back as a numpy array. The full
  `create_all` → insert → read cycle works, and the array serializes cleanly
  through Pydantic (`np.float64` subclasses `float`).
- **Evidence:** Added `apps/api/tests/test_style_profile_endpoint.py` (4 tests:
  public survey fetch, create+fetch with a unit-length 16-dim embedding, owner
  scoping → 403, latest → 404). All pass on SQLite. This context was previously
  untested, so this is also net-new coverage.

---

## Open — what should be done

### B6 — Server-side upload validation — ⬜ Open · Security
- **Where:** `apps/web/src/features/upload/UploadRoomPage.tsx:338` (client-only
  today; no server route yet — see C3).
- **Problem:** Only a client-side size/type check exists. When a real upload
  endpoint ships, this becomes the trust boundary.
- **Plan:** With C3's upload route, enforce magic-byte verification (not client
  `Content-Type`), strict size cap, randomized filenames, no path traversal
  (spec §15).

### C1 — Scene Graph minimal vs spec — ⬜ Open · Spec-drift
- **Where:** `apps/api/app/contexts/scene/domain/scene_graph.py`.
- **Problem:** Missing `projectId`, walls/floor/ceiling, `photoBackplate`,
  `styleProfileId`, `lockedItemIds`, `meta`, `history[]`, and per-item
  `modelAssetUrl`, `category`, quaternion rotation, `footprint`, `origin`,
  `styleTags`, `colorways`.
- **Plan:** Don't widen for conformance alone. Record the deliberate MVP narrowing
  in an ADR (C13), and add only the field that actually matters now —
  `style_profile_id` on `scenes` to tie a scene to the profile that produced it.

### C3 — Room photo / dimensions / reconstruct endpoints — ⬜ Open · Spec-drift
- **Where:** spec §10.2; frontend `UploadRoomPage.tsx:79` uses a fake
  `simulateAnalysis(file.size % 100)` and never uploads.
- **Plan:** (1) Add `POST /projects/{id}/room/dimensions` now (cheap). (2) Add
  `POST /projects/{id}/room/photo` (multipart → `STORAGE_DIR` + a
  `project_assets` table; static-serve `/storage`). (3) Wire `image_to_depth`
  later. Until (2), badge the upload flow "demo only."

### C4 — Job queue / WebSocket status — ⬜ Open · Spec-drift
- **Where:** spec §10.2; `recompose` runs synchronously
  (`projects/interfaces/router.py:125`).
- **Plan:** Acceptable now (fake AI + in-process solver are <100ms). When a real
  LLM/Replicate provider lands, introduce `FastAPI BackgroundTasks` first; move to
  Celery+Redis only when a job exceeds ~30s P95.

### C5 — `Idempotency-Key` on AI endpoints — ⬜ Open · Spec-drift
- **Where:** spec §5.2; `recompose` is freely retryable and non-deterministic.
- **Plan:** Add a dependency that caches `(user_id, route, key)` → response in
  Redis with TTL. Defer until AI calls are expensive or async.

### C6 — RFC 7807 problem+json — ⬜ Open · Spec-drift
- **Where:** spec §10.1; API uses default `{"detail": …}`.
- **Plan:** Add an exception handler translating `HTTPException` → problem+json
  with `type/title/status/detail/instance/code`; update frontend `ApiError`.
  Low priority until there are external consumers.

### C8 — `SWAP_ITEM` footprint/collision check — ⬜ Open · Spec-drift
- **Where:** `apps/api/app/contexts/scene/application/edit_reducer.py:113`.
- **Problem:** Swaps `catalog_id` keeping the transform, but the replacement's
  footprint may not fit or may overlap; spec §7.4 wants re-snap + collision check.
  Note `_assert_in_room` only checks the center point, not a footprint.
- **Plan:** Load replacement dims, widen the in-room check to a footprint AABB,
  nudge along the facing axis on overlap. Add a swap-into-corner test.

### C9 — Frontend survey answers lost — ⬜ Open · Spec-drift
- **Where:** `apps/web/src/features/survey/SurveyPage.tsx:648` maps the rich
  MBTI/interest/palette answers down to 5 server questions; the `roomDNA` lives
  only in `useProfileStore` and is never persisted server-side.
- **Plan:** Persist raw answers in `style_profiles.source_answers`; later replace
  `derive_embedding` with an LLM call over the full answer set (AI router is
  already pluggable).

### C10 — Catalog size — ⬜ Open · Spec-drift
- **Where:** `apps/api/app/contexts/catalog/domain/product.py:35` (24 items).
- **Plan:** Grow to 50–100 when demo quality demands it; also add `style_tags`,
  `image_url`, and a `model_url` placeholder per product.

### C11 — GLB models not rendered — ⬜ Open · Spec-drift
- **Where:** `apps/web/src/features/editor/components/ItemBox.tsx:117` (boxes only).
- **Plan:** Add optional `modelUrl` to `CatalogProduct`; render via drei `useGLTF`
  with suspense, fall back to the colored box. Validate with a few CC0 GLBs.

### C12 — `@react-three/rapier` absent — ⬜ Open · Spec-drift
- **Where:** `apps/web/package.json` (spec §6.1 lists rapier).
- **Plan:** Accept the lighter custom drag for MVP (scenes are small). Add an AABB
  overlap check on `MOVE_ITEM` end + red highlight to satisfy US-15 without
  physics. Revisit rapier only if real physics is needed.

### D4 — Drag desync mid-render — ⬜ Open · UX
- **Where:** `apps/web/src/features/editor/components/ItemBox.tsx:79`.
- **Problem:** Direct `meshRef.current.position` mutation during drag can snap
  back if React re-renders before `onPointerUp` dispatches.
- **Plan:** Drive drag via `useFrame`/ref so React isn't the source of truth
  mid-drag — only if QA reports jitter; otherwise accept.

### D5 — Room DNA persisted only after API call — ⬜ Open · UX
- **Where:** `apps/web/src/features/survey/SurveyPage.tsx:683`.
- **Plan:** Persist DNA + raw answers at `openResult()` time; have `submit()` only
  add `profileId` on success; add a retry CTA on failure.

### D6 — Stale-session dashboard flash — ⬜ Open · UX
- **Where:** `apps/web/src/App.tsx:26`, `RequireAuth.tsx`.
- **Plan:** Validate the JWT `exp` locally (or fire `me` with a splash) on boot
  before treating the user as authed.

### E1 — localStorage key style — ⬜ Open · Hygiene
- **Where:** `dormvibe.auth` / `dormvibe.profile` vs `dormvibe-lang`.
- **Plan:** Standardize on one separator with a one-shot boot migration.

### E3 — Unused `zod` dependency — ⬜ Open · Hygiene
- **Where:** `apps/web/package.json` (no Zod schemas in `src/`).
- **Plan:** Either adopt Zod (spec §1.1 — shared survey/form schemas) or remove
  the dep. Recommend adopting.

### E4 — `_patch_columns()` shim — ⬜ Open · Hygiene
- **Where:** `apps/api/app/db/session.py:54`.
- **Plan:** Adopt Alembic (spec §8.3): initial migration from current schema,
  delete the dev-only ALTER-TABLE shim and the `create_all` reliance.

---

## Change log

- **2026-06-07** — Audit completed; this log created. Fixed A1, A3, A4, A5
  (partial), B1, B3, B5, D1, D8; verified B4. Verification run surfaced and fixed
  T1 (fixture seeding) and T2 (cozy top-K). Final state: API `pytest` 27 passed;
  web `tsc` clean; web `vitest` 35 passed; `ruff`/`mypy` clean on all edited files
  (pre-existing project-wide lint/type debt untouched — tracked as E2). All other
  entries remain open with plans.
- **2026-06-08** — Continuation batch. Verified A2 is **not a bug** (added
  `test_style_profile_endpoint.py`, 4 tests). Fixed B2 + C2 (refresh-token
  rotation/reuse-detection/revocation + `/auth/logout`, with
  `test_auth_refresh.py`), D3 (`meshRef` ordering), C13 (seeded 4 ADRs), and
  D7 + C7 (recompose now returns `{project, warnings}`; skipped items and
  out-of-bounds locks are flagged, never dropped). D9 closed (its README claims
  are now true). Final state: **37 API tests pass**, web `tsc` clean, **35 vitest
  pass**, no new ruff/mypy findings in changed files.
- **2026-06-08 (cont.)** — Fixed D2 (Raise/Lower persists via `position.y`;
  removed the `yOffsets` overlay) and E2 (cleared all ruff + mypy debt → both
  green; added `.github/workflows/ci.yml` gating web + api on push/PR). Final
  state: ruff clean, mypy clean (68 files), **37 API tests**, **35 vitest**, web
  build all green.
