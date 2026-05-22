# DormVibe — Technical Specification

**Audience:** Engineering team (you), AI coding agents, future hires.
**Purpose:** Define the system architecture, conventions, and contracts in enough detail that two engineers (or a swarm of agents) can build in parallel without colliding.
**Status:** Draft v1 · Living document
**Companion docs:** [`01_BUSINESS_REQUIREMENTS.md`](01_BUSINESS_REQUIREMENTS.md), [`03_AGENT_PLAN.md`](03_AGENT_PLAN.md)

---

## Table of Contents

1. [Tech Stack & Rationale](#1-tech-stack--rationale)
2. [System Architecture](#2-system-architecture)
3. [Core Domain Model — the Scene Graph](#3-core-domain-model--the-scene-graph)
4. [Frontend Responsibilities](#4-frontend-responsibilities)
5. [Backend Responsibilities](#5-backend-responsibilities)
6. [3D Rendering Engine](#6-3d-rendering-engine)
7. [AI Integration Approach](#7-ai-integration-approach)
8. [Database Design](#8-database-design)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [API Design](#10-api-design)
11. [State Management](#11-state-management)
12. [UI Theming Architecture](#12-ui-theming-architecture)
13. [Deployment Architecture](#13-deployment-architecture)
14. [Scalability Considerations](#14-scalability-considerations)
15. [Security Considerations](#15-security-considerations)
16. [Non-Functional Requirements](#16-non-functional-requirements)
17. [Open Technical Decisions](#17-open-technical-decisions)

---

## 1. Tech Stack & Rationale

### 1.1 Recommended stack

| Layer | Choice | Why |
|---|---|---|
| **Frontend framework** | React 18 + TypeScript + Vite | Strict typing, vast 3D ecosystem, already used in earlier prototype. Vite gives sub-second HMR. |
| **3D rendering** | Three.js via React Three Fiber (R3F) + `@react-three/drei` + `@react-three/rapier` | R3F lets us treat the 3D scene as a React tree — components, props, state, suspense — instead of an imperative engine. drei gives camera controls, gizmos, and HUD primitives. rapier (WASM physics) gives drag-and-drop with collision detection without a heavy engine. |
| **Frontend state** | Zustand (client-only state) + TanStack Query (server state) | Zustand carried over from earlier prototype; minimal boilerplate. TanStack Query handles caching, retries, and optimistic updates for API state. |
| **Styling** | Tailwind CSS + shadcn/ui + CSS custom properties | Tailwind for velocity. shadcn/ui gives accessible Radix-based components we own and can re-theme. CSS custom properties drive **swappable themes** without recompiling. |
| **Forms** | React Hook Form + Zod | Schema-first validation; the same Zod schema runs in the survey UI and shares types with the backend Pydantic schema (via codegen or hand-mirroring). |
| **Backend framework** | **FastAPI (Python 3.12)** | The team likes Python. FastAPI is async, has first-class OpenAPI generation, and the Python ecosystem (pydantic, numpy, opencv, ML clients) is a better home for AI orchestration than Node. |
| **ORM & migrations** | SQLAlchemy 2.0 (async) + Alembic | Mature, typed, async-friendly. |
| **Validation** | Pydantic v2 | Already idiomatic in FastAPI; can serialize Scene Graph; Pydantic schemas can be exported to TypeScript via `pydantic-to-typescript`. |
| **Background jobs** | Celery + Redis (or RQ for simplicity) | AI inference is 5–60s; HTTP requests must not block. Workers are horizontally scalable. |
| **Database** | PostgreSQL 16 + `pgvector` extension | Relational core (users, projects, products) + JSONB for the Scene Graph + vector column for style/item embeddings (recommendation). One database for MVP. |
| **Cache & queue** | Redis 7 | Session blacklist, rate limits, Celery broker, hot-path cache. |
| **Object storage** | S3-compatible. Dev: MinIO. Prod (China): Aliyun OSS. Prod (global): AWS S3. | Holds room photos, generated thumbnails, GLB models. Same SDK across all three (boto3 / aioboto3). |
| **Auth** | JWT access + refresh tokens; OAuth via Authlib | Stateless, mobile-ready. WeChat / Google / Apple via standard OAuth flows. |
| **Containerization** | Docker + Docker Compose (dev) | Same image runs in dev, CI, and prod. |
| **Frontend hosting** | Vercel (initial); Aliyun OSS + CDN (China prod) | Vercel for fast preview deploys; migrate the China-facing frontend to a domestic CDN for latency and ICP compliance. |
| **Backend hosting** | Railway / Fly.io (early); Aliyun ECS or ACK (China prod) | Start cheap, migrate before launch in China. |
| **CI/CD** | GitHub Actions | Free tier handles us. |
| **Observability** | Sentry (errors) + Logfire or OpenTelemetry → Grafana Cloud (traces/metrics) | Critical because AI calls are slow, expensive, and fail in interesting ways. |

### 1.2 What changes from the earlier prototype

The earlier prototype (Vite/React + Express + MiniMax) carries over **conceptually**, but the new product is structurally different:

- **Backend changes language**: Express → FastAPI. The earlier flow (quiz → mood board image + TTS) was a thin proxy to MiniMax. The new flow needs structured scene state, persistence, jobs, and a furniture catalog. Python is the better home.
- **Frontend gains 3D**: R3F + rapier are net-new. The earlier mood-board screen becomes the *export* screen, not the product itself.
- **Scene-as-data**: The scene is a structured JSON graph, not a generated image. This is the architectural decision that enables intent-preserving customization (§3, §10).
- **MiniMax is dropped**: not moving forward with it. The new AI strategy uses a provider-agnostic adapter (§7) with **Replicate as the primary inference platform** for image generation, depth estimation, and 3D model generation (Trellis, Hunyuan3D-2), and a separate LLM provider (Qwen / DeepSeek / Claude) for structured-JSON reasoning. The adapter design means swapping any provider is a config change, not a code change.

### 1.3 Why not Python on the frontend (or Node on the backend)?

- **No to Python frontend** — there is no real 3D-in-the-browser story in Python. R3F + Three.js is the path.
- **Could we keep Node?** Yes. NestJS would be defensible. We'd lose the Python AI/CV ecosystem leverage and gain nothing the team specifically wants. Recommendation stands: **FastAPI**.

---

## 2. System Architecture

### 2.1 High-level diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                            User's Browser                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  React + TypeScript SPA (Vite build)                         │   │
│  │  ┌───────────┐  ┌──────────────┐  ┌──────────────────────┐  │   │
│  │  │ UI Shell  │  │ Survey UI    │  │ 3D Editor            │  │   │
│  │  │ (themed)  │  │ (RHF + Zod)  │  │ (R3F + drei +rapier) │  │   │
│  │  └───────────┘  └──────────────┘  └──────────────────────┘  │   │
│  │  Zustand (client state) · TanStack Query (server state)     │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS / JSON · WebSocket (job updates)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        FastAPI API Gateway                          │
│  Auth · Rate-limit · OpenAPI · request validation (Pydantic)        │
└──┬──────────┬─────────────┬─────────────┬─────────────┬─────────────┘
   │          │             │             │             │
   ▼          ▼             ▼             ▼             ▼
┌────────┐ ┌─────────┐ ┌─────────────┐ ┌────────────┐ ┌───────────────┐
│ Users  │ │Projects │ │Scene Service│ │ Catalog    │ │ AI Orchestrator│
│Service │ │Service  │ │  (CRUD on   │ │ Service    │ │ (provider-     │
│        │ │         │ │ scene graph)│ │            │ │  agnostic)     │
└────┬───┘ └────┬────┘ └──────┬──────┘ └──────┬─────┘ └────────┬──────┘
     │          │              │               │                │
     │          │              │               │                ▼
     │          │              │               │         ┌──────────────┐
     │          │              │               │         │ Job Queue    │
     │          │              │               │         │ (Celery+     │
     │          │              │               │         │  Redis)      │
     │          │              │               │         └──────┬───────┘
     │          │              │               │                │
     │          │              │               │                ▼
     │          │              │               │         ┌──────────────┐
     │          │              │               │         │ AI Workers   │
     │          │              │               │         │ (Python)     │
     │          │              │               │         └──┬─────┬──┬──┘
     │          │              │               │            │     │  │
     ▼          ▼              ▼               ▼            ▼     ▼  ▼
┌─────────────────────────────────────────────┐  ┌────────────────────┐
│       PostgreSQL 16 (with pgvector)         │  │ External AI APIs   │
│  users · projects · scenes · products ·     │  │ MiniMax · Qwen ·   │
│  embeddings · jobs · audit_log              │  │ DeepSeek · Claude  │
└─────────────────────────────────────────────┘  │ Replicate · World  │
                  │                              │ Labs · etc.        │
                  ▼                              └────────────────────┘
        ┌──────────────────┐
        │ Redis (cache,    │
        │ sessions, queue) │
        └──────────────────┘

           ┌─────────────────────────────────────┐
           │  Object Storage (Aliyun OSS / S3)   │
           │  room-photos · scene-thumbnails ·   │
           │  furniture-glbs · exports           │
           └─────────────────────────────────────┘
```

### 2.2 Architectural principles

- **Clean / hexagonal architecture on the backend.** Domain logic in `domain/`, use cases in `application/`, adapters (DB, external APIs, storage) in `infrastructure/`, HTTP in `interfaces/`. The domain doesn't import the framework.
- **Feature-based folder structure on the frontend.** Each feature (`survey`, `editor`, `catalog`, `auth`) owns its components, hooks, types, and tests.
- **One direction of data flow.** Frontend never mutates backend state by side effect — only via documented mutations through TanStack Query.
- **Scene as the source of truth.** The Scene Graph is the only canonical representation of "the user's room." Renderings, thumbnails, and shopping lists are projections of it.
- **AI is a function, not a state.** AI calls return data; they don't own state. State changes are explicit mutations of the Scene Graph initiated by the user.

---

## 3. Core Domain Model — the Scene Graph

This section is **load-bearing**. The intent-preserving customization moat (BRD §10) lives or dies here.

### 3.1 Why a Scene Graph

If the room is a generated *image*, swapping a sofa means re-running the generator, which produces a different rug, different walls, different lighting — every other choice the user already made evaporates. That's what NanoBanana / Copilot 3D can't fix.

If the room is a structured *graph of objects*, swapping a sofa is a single mutation on a single node. Everything else is, by construction, untouched.

### 3.2 Schema (conceptual, language-neutral)

```
SceneGraph
├── schemaVersion: "1.0"
├── id: UUID
├── projectId: UUID
├── room
│   ├── dimensions: { width_m, depth_m, height_m }    // floats, meters
│   ├── walls: Wall[]                                 // MVP: 4 axis-aligned
│   ├── floor: { materialRef, uvScale }
│   ├── ceiling: { materialRef }
│   └── photoBackplate?: { assetUrl, cameraEstimate } // optional reference
├── items: SceneItem[]
├── styleProfileId: UUID                              // FK to StyleProfile
├── lockedItemIds: UUID[]                             // user-pinned items
├── meta: { createdAt, updatedAt, schemaMigratedFrom? }
└── history: SceneEdit[]                              // last N undoable edits

SceneItem
├── id: UUID                                          // STABLE across edits
├── productId: UUID                                   // FK to FurnitureProduct
├── modelAssetUrl: string                             // .glb URL
├── category: enum(sofa, bed, desk, chair, ...)
├── transform: { position[3], rotation_quat[4], scale[3] }
├── footprint: { width_m, depth_m }                   // for snap & collision
├── origin: enum(ai_initial, ai_swap, user_added, user_modified)
├── styleTags: string[]
├── colorways: { paletteRef, primaryHex }
└── locked: boolean

StyleProfile
├── id: UUID
├── userId: UUID
├── axes: { japandi_maximalist, warm_cool, dense_airy, ... } // floats -1..1
├── colorPalette: hex[]
├── budget: { totalMin, totalMax, currency }
├── lifestyleFlags: { wfh, hosts_guests, has_pets, ... }
├── embedding: vector[768]                            // for product matching
└── meta: { source: "survey_v1", createdAt }
```

### 3.3 Edit operations (the API of the Scene Graph)

Every mutation is one of a small, named set:

| Operation | Effect | Reversible |
|---|---|---|
| `MOVE_ITEM(itemId, transform)` | Updates one item's transform. | Yes |
| `ROTATE_ITEM(itemId, quat)` | Convenience over MOVE_ITEM. | Yes |
| `DELETE_ITEM(itemId)` | Removes one item. | Yes (history holds the deleted node) |
| `ADD_ITEM(item)` | Inserts a new item. | Yes |
| `SWAP_ITEM(itemId, replacementProductId)` | Replaces the product reference & model URL on one item; preserves transform & footprint where compatible, otherwise re-snaps to floor. | Yes |
| `LOCK_ITEM(itemId)` / `UNLOCK_ITEM(itemId)` | Toggles locked. | Yes |
| `RESIZE_ROOM(dimensions)` | Updates room. Items that fall outside are flagged, not deleted. | Yes |
| `RECOMPOSE(stylePatch)` | AI-assisted full re-layout. **Honors `lockedItemIds` and never moves locked items.** | Yes |

**No operation regenerates the entire scene.** "Regenerate" is `RECOMPOSE`, and it is opt-in, scoped, and respects locks.

### 3.4 Persistence

- Scene graphs live as JSONB columns in PostgreSQL. We get atomic writes, server-side JSON queries (e.g. "scenes containing sofa product X"), and easy migration via versioned schemas.
- Scene history (last 50 edits) is stored alongside the scene as a bounded JSONB array. Cheap, no separate table.
- Long-term audit history is append-only in a separate `scene_edit_log` table.

---

## 4. Frontend Responsibilities

The frontend is a **single-page application** with three primary screens and shared chrome.

### 4.1 Screens

| Screen | Responsibility |
|---|---|
| **Onboarding / Auth** | Sign-up, sign-in, OAuth flows. |
| **Project Hub** | List of saved projects; "new project" entry point. |
| **Room ingest** | Upload photos (with drag-drop), preview, confirm or correct dimensions. Or pick a blank-room template. |
| **Survey** | Multi-step questionnaire, image-pick UI, autosave per step. |
| **Editor** | The 3D scene with side panels. The product. |
| **Shopping list** | Final cart-style screen with totals and product links. Shareable image export. |

### 4.2 Editor sub-architecture

The Editor screen has the highest internal complexity. It decomposes into:

```
<EditorPage>
  <EditorChrome>            // top bar, theme switcher, save indicator
  <SidePanelLeft>           // catalog browser, recommendations
  <Canvas3D>                // R3F root
    <SceneRoot>             // walls, floor, ceiling, lights
    <ItemsLayer>            // each SceneItem as <Item3D>
    <SelectionGizmo>        // shows when an item is selected
    <DragController>        // mouse → world drag with rapier
    <CameraRig>             // orbit + pan, with constraints
  <SidePanelRight>          // selected-item properties, swap, lock
  <BottomBar>               // undo/redo, view modes, "ask AI"
```

The 3D layer reads from a Zustand store and dispatches operations from §3.3. **No 3D component talks to the network directly** — only through hooks that wrap TanStack Query mutations.

### 4.3 Asset loading

- Furniture models are GLB files served from object storage with HTTP caching headers (immutable URLs, content-hashed).
- Use drei's `useGLTF` with suspense for streaming.
- Three LOD tiers per model (high / mid / low) chosen by camera distance and device tier.
- Preload "likely-next" models when user hovers a catalog card.

### 4.4 Mobile-web considerations (MVP)

- Editor must function on mobile-web at 60fps on a 2022-class Android phone with a single sofa scene; gracefully degrades on heavier scenes.
- Touch gestures: one-finger orbit, two-finger pan/zoom, long-press to drag an item.
- The catalog and survey screens are mobile-first by default.

---

## 5. Backend Responsibilities

### 5.1 Bounded contexts

The backend is one deployable, but conceptually splits into bounded contexts:

| Context | Owns |
|---|---|
| **Identity** | Users, sessions, OAuth, JWT issuance, password reset. |
| **Projects** | Projects (a user's saved rooms), thumbnails, sharing. |
| **Scene** | The Scene Graph: load, persist, validate, apply edits, history. |
| **Catalog** | Furniture products, 3D models, embeddings, style tags, retailer links, price snapshots. |
| **Style profiling** | Survey schema, profile derivation (rule-based + LLM), embeddings. |
| **AI orchestration** | Provider-agnostic AI client; queues, retries, cost telemetry. |
| **Billing** *(post-MVP)* | Subscriptions, quotas, payment provider webhooks. |

Each context maps to a Python package under `app/contexts/<name>/` (see Agent Plan §1).

### 5.2 Cross-cutting concerns

- **Validation** — every external input goes through a Pydantic schema. No raw dicts cross a public boundary.
- **Authorization** — every endpoint declares the role / ownership rule it requires; enforced by a dependency.
- **Error format** — RFC 7807 problem+json. Never leak stack traces.
- **Idempotency** — POST endpoints that trigger AI work accept an `Idempotency-Key` header.

---

## 6. 3D Rendering Engine

### 6.1 Why React Three Fiber + drei + rapier

| Need | Tool |
|---|---|
| Declarative 3D, integrates with React state | **R3F** |
| Camera controls, gizmos, environment maps, useGLTF | **drei** |
| Drag-and-drop with collision detection | **rapier** (WASM physics) |
| Post-processing for stylized look | **@react-three/postprocessing** |
| State, accessible from R3F components | **Zustand** |

Going imperative with raw Three.js is faster for tiny demos and slower for everything beyond. We are not building tiny demos.

### 6.2 Approximate-room reconstruction strategy

The BRD makes clear: an *approximate, editable* room is the goal, not architectural reconstruction. Three strategies, in increasing complexity:

| Tier | Approach | Effort | Quality | Use |
|---|---|---|---|---|
| **0 — Manual** | User picks a template, sets W×D×H. | trivial | floor-plan-accurate, no photo realism. | Always available as fallback. |
| **1 — Photo-assisted** | Run depth estimation (e.g. Depth Anything V2 via Replicate or local) on user photo → estimate floor plane and approximate room dimensions → produce parametric 4-wall room. User confirms / tweaks. | medium | dimensions within ~10% in most rooms; great UX. | **MVP target.** |
| **2 — Full reconstruction** | World Labs Marble or equivalent → mesh-quality scene reconstruction. | high | best, but external dependency cost & latency. | Stretch / post-MVP. |

**MVP recommendation: Tier 0 + Tier 1 with Tier 0 as guaranteed fallback.** The photo backplate from Tier 1 can be displayed behind the parametric room as a visual anchor.

### 6.3 Visual style

The product looks better as **stylized 3D** (think low-poly, soft shadows, a hint of toon shading) than as failed photoreal. Photoreal sets an expectation we can't meet on browser GPU budgets and fails the "uncanny valley" test mercilessly. Stylized is also cheaper to render and works on more devices.

---

## 7. AI Integration Approach

### 7.1 What AI is used for

| Use case | Type | Latency budget | Recommended provider (MVP) |
|---|---|---|---|
| Survey → style profile + embedding | LLM (structured output) | ≤ 3s | **Qwen** (Aliyun-native, low CN latency) or **DeepSeek** (cost). Claude/GPT for development. |
| Initial room composition (place items) | Hybrid: LLM proposes, deterministic layout solver places | ≤ 30s | LLM as above + in-house layout module |
| Item recommendation | Vector similarity over catalog (`pgvector`) | ≤ 200ms | None — runs in our DB |
| Item swap suggestions | Vector + style/footprint constraints | ≤ 500ms | None — in-house |
| Stylized export image | Image gen | ≤ 10s | **Flux.1 Schnell / Pro** via Replicate or fal.ai |
| Photo → depth & dimensions | CV model | ≤ 5s | **Depth Anything V2** via Replicate |
| Photo → approximate 3D scene *(stretch, post-MVP)* | Scene reconstruction | ≤ 60s | **World Labs Marble** (mentioned in pitch) — evaluate when stable |
| User-generated furniture from inspiration photo *(stretch)* | Image-to-3D mesh | ≤ 90s | **Trellis** or **Hunyuan3D-2** via Replicate; **Meshy** or **Tripo** as direct-API alternatives |

### 7.2 Why Replicate as the primary AI inference platform

Replicate is the right MVP-stage choice for everything *except* the LLM:

- **One API surface for many capabilities** — image generation (Flux), depth estimation (Depth Anything V2), and image-to-3D (Trellis, Hunyuan3D-2) all behind the same client. Cuts integration time and vendor sprawl.
- **Pay-per-GPU-second** — no minimum subscription. Costs scale with usage, which is exactly what an MVP wants.
- **Model variety** — when a better 3D or depth model ships next quarter, swapping to it is changing a model identifier, not rewriting an integration.
- **Active 3D ecosystem** — `firtoz/trellis` is the current strong default for image-to-3D; `tencent/hunyuan3d-2` is the fidelity option; both are hosted and current.

**Known weaknesses to architect around:**
- Cold starts on less-popular models can be 30–60s. Use only models with a warm pool, or accept the cold path and surface it as "this can take a minute."
- Cost per image (~$0.03–0.05 for Flux Pro on Replicate) is higher than fal.ai or self-hosted at scale. Acceptable for MVP; revisit at >5k images/day.
- **Latency from China to Replicate is non-trivial.** For the China production stack, pair Replicate with a domestic alternative (Volcengine, Aliyun Bailian, or a self-hosted Flux/Depth model on Aliyun GPUs) behind the same adapter. Replicate stays the dev/demo default; production routing prefers domestic.

**Direct-API alternatives** kept available behind the adapter, in case Replicate doesn't meet a requirement:

| Capability | Alternative | When to switch |
|---|---|---|
| Fast Flux image gen | **fal.ai** | If we hit Replicate cold-start issues or need sub-second Flux Schnell. |
| Image-to-3D (production) | **Meshy API** | Best-in-class docs and SOC2/ISO 27001 if we go enterprise. Game-engine plugins. |
| Image-to-3D (clean topology) | **Tripo API** | Quad-based topology; auto-rigging if we ever need animated furniture. |
| LLM (China) | **Qwen via Aliyun Bailian** | First choice for production CN traffic. |
| LLM (cost) | **DeepSeek** | Strong reasoning at ~10× lower cost than Claude/GPT. |
| LLM (quality / dev) | **Claude / GPT** | Use during development for debugging structured-output prompts. |

### 7.3 Layout solver (the un-glamorous core)

This is what makes the AI output usable. The LLM is bad at "place a 220cm sofa 80cm from the left wall, perpendicular to the desk" — it hallucinates dimensions. The layout solver isn't AI; it's a small constraint solver that takes:

- Room dimensions
- A *list* of items the LLM proposed (with footprints from the catalog, not LLM-guessed)
- Soft constraints (sofa faces TV, desk near window, etc.) generated by the LLM
- Hard constraints (no overlap, items inside the room, doors clear)

…and outputs valid transforms. **Without this, AI rooms have furniture clipping through walls.** A simple greedy + grid-snap solver is enough for MVP.

### 7.4 Intent-preserving customization, in code

The `SWAP_ITEM` operation is implemented as:

```
1. Load current SceneGraph.
2. Look up the target item by id.
3. Query catalog for candidate replacements:
   - same category
   - footprint within ±15% of original (so it fits where the original sits)
   - cosine similarity to current style profile embedding
4. If user picked a specific replacement, use that.
5. Apply replacement: keep transform, swap productId + modelAssetUrl.
6. Re-snap to floor (height may differ).
7. Validate no new collisions; if collision, nudge along original axis by min necessary delta.
8. Persist the mutation as a single SceneEdit.
```

The LLM is not in this loop. **This is why it's deterministic and fast.**

### 7.5 3D model strategy: curated catalog first, generation as stretch

A common confusion at this stage of product design is to assume "AI 3D app" means *the AI generates every 3D model on demand.* It shouldn't, for MVP:

- **Generated furniture meshes still have artifacts.** Topology quirks, missing back faces, wrong scale. Fine for one-off demos, painful for a production catalog where users are *buying* the items.
- **Catalog 3D needs to match real products.** A user clicks "buy" on the rug they see; the rendered rug must match the SKU. Generated meshes don't map to SKUs.
- **Catalog 3D is reused millions of times.** Generating once, storing in OSS, and streaming to many users is dramatically cheaper than per-user inference.

**MVP plan:** curate ~50–100 hero items as hand-checked GLBs sourced from licensed catalogs (IKEA Trio, Sketchfab, Poly Haven) or commissioned artists. Each item has a SKU, retailer link, footprint, and style tags.

**Where image-to-3D earns its keep, post-MVP:** the "I have inspiration but you don't have it in the catalog" case. User uploads a photo of a sofa they saw; we generate a placeholder 3D mesh (Trellis / Hunyuan3D-2) for visualization, find the closest catalog match for the actual purchase. This is a feature, not infrastructure.

### 7.6 Provider-agnostic adapter

```
app/ai/
├── base.py             # AIProvider protocol with capabilities
├── providers/
│   ├── replicate.py    # primary: image gen, depth, 3D
│   ├── fal.py          # alternate: fast Flux
│   ├── qwen.py         # primary LLM for CN
│   ├── deepseek.py     # alternate LLM
│   ├── anthropic.py    # dev/quality LLM
│   ├── meshy.py        # post-MVP: 3D
│   └── tripo.py        # post-MVP: 3D with rigging
├── router.py           # picks provider per capability + region
├── prompts/            # versioned prompt files
└── telemetry.py        # logs latency, tokens, cost per call
```

Use cases are routed by **capability** (`structured_json`, `image_gen`, `image_to_depth`, `image_to_3d`) — not by provider name — so feature code never references "Replicate." Region-aware routing: production traffic from China prefers domestic providers; demo/dev from outside China can use whatever's fastest/cheapest.

### 7.7 Prompts as versioned assets

Prompts live in `app/ai/prompts/<use_case>/v1.md` (or `.j2` if templated). Treat them as code: version-controlled, code-reviewed, and A/B-testable. Don't paste prompts into Python strings inline.

---

## 8. Database Design

### 8.1 Logical schema (PostgreSQL)

```
users                       -- id, email, oauth_subjects, created_at, locale
sessions                    -- id, user_id, refresh_token_hash, ua, ip, expires
projects                    -- id, user_id, title, created_at, updated_at, thumb_url
scenes                      -- id, project_id, graph (JSONB), schema_version
scene_edit_log              -- id, scene_id, op (JSONB), actor_id, ts
style_profiles              -- id, user_id, axes, palette, budget, embedding (vector)
furniture_products          -- id, retailer, retailer_sku, title, category,
                            --   price_cents, currency, model_url, thumb_url,
                            --   footprint, style_tags, embedding (vector)
furniture_price_history     -- product_id, price_cents, observed_at
ai_jobs                     -- id, user_id, kind, status, input_ref, output_ref,
                            --   provider, latency_ms, cost_micros
audit_log                   -- id, actor_id, action, target, ts, ip
```

### 8.2 Index notes

- `furniture_products.embedding` — IVFFlat / HNSW index for fast similarity.
- `furniture_products` — composite index on `(category, style_tags)` for filtered recommendation.
- `scenes` — GIN index on `graph` JSONB for queries by item/product.
- `ai_jobs` — index on `(user_id, kind, status)` for "active jobs" dashboards and quota.

### 8.3 Migrations & schema versioning

- Alembic, autogenerated migrations reviewed by hand. No "just run `db.create_all()`" in production.
- `scenes.graph.schemaVersion` is independent — we bump it when the Scene Graph format itself changes, and run a migrator at read time.

### 8.4 Why one PostgreSQL, not microservice databases?

At MVP scale, multiple databases are a tax we can't afford. Bounded contexts share one database with namespaced tables. We can split later if a context's load justifies it.

---

## 9. Authentication & Authorization

### 9.1 Authentication flow

- Email/password + OAuth (Google, Apple, WeChat). WeChat is critical for China launch.
- Passwords: argon2id; never bcrypt-without-pepper.
- Tokens: short-lived JWT access (15 min) + refresh token (rotating, 30 days, server-side blacklist on logout).
- Refresh rotation detects reuse → forces full reauth.

### 9.2 Authorization model

- **Resource ownership.** A user can read/write only their own `projects`, `scenes`, `style_profiles`. Enforced at the data-access layer, not just the route.
- **Roles** (post-MVP): `user`, `staff`, `admin`. Staff can read anonymized scenes for support.
- **Sharing** (post-MVP): a project can have a shareable read-only link (signed URL with expiry).

### 9.3 Sensitive operations

- Account deletion, email change, OAuth-link change require recent password (or step-up auth).
- All sensitive operations are audit-logged.

---

## 10. API Design

### 10.1 Conventions

- **REST + JSON**, with one WebSocket for live job updates.
- **OpenAPI 3.1** schema auto-generated by FastAPI. Frontend types regenerated from it (`openapi-typescript-codegen`).
- **Versioned**: `/api/v1/...`. Breaking changes bump the version.
- **camelCase JSON** in API payloads (frontend-friendly), `snake_case` in DB. Pydantic does the translation via `alias_generator`.
- **Errors**: `application/problem+json` with `type`, `title`, `status`, `detail`, `instance`, plus a `code` for machine handling.
- **Pagination**: cursor-based on collection endpoints. Never offset/limit on user-visible lists.

### 10.2 Endpoint sketch

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/oauth/{provider}/callback
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

GET    /api/v1/me
PATCH  /api/v1/me

GET    /api/v1/projects
POST   /api/v1/projects                              -- create empty project
GET    /api/v1/projects/{projectId}
DELETE /api/v1/projects/{projectId}

POST   /api/v1/projects/{projectId}/room/photo       -- upload photo, returns asset id
POST   /api/v1/projects/{projectId}/room/dimensions  -- set or override dimensions
POST   /api/v1/projects/{projectId}/room/reconstruct -- async: create initial scene from photo

POST   /api/v1/style-profiles                        -- submit survey, returns profile
GET    /api/v1/style-profiles/{id}

GET    /api/v1/projects/{projectId}/scene
POST   /api/v1/projects/{projectId}/scene/edits      -- apply one or many edit ops
POST   /api/v1/projects/{projectId}/scene/recompose  -- async: AI re-layout (respects locks)
POST   /api/v1/projects/{projectId}/scene/swap       -- single-item swap (sync, fast path)

GET    /api/v1/catalog/products
GET    /api/v1/catalog/products/{productId}
GET    /api/v1/catalog/recommend?context=...         -- vector search + filters

GET    /api/v1/jobs/{jobId}                          -- poll
WS     /api/v1/jobs/{jobId}/stream                   -- subscribe to status

POST   /api/v1/projects/{projectId}/exports/image    -- async stylized image
POST   /api/v1/projects/{projectId}/exports/cart     -- shopping list with totals
```

### 10.3 Edit endpoint design

`POST /api/v1/projects/{projectId}/scene/edits` accepts an array of operations (matching §3.3) and returns the new scene with its updated `version`. Optimistic concurrency: client sends the version it was based on; server rejects stale writes with 409.

```jsonc
// request
{
  "baseVersion": 17,
  "ops": [
    { "type": "MOVE_ITEM", "itemId": "...", "transform": { ... } },
    { "type": "ROTATE_ITEM", "itemId": "...", "rotation": [...] }
  ]
}

// response
{
  "scene": { /* updated SceneGraph */ },
  "version": 18
}
```

---

## 11. State Management

| Kind of state | Where it lives | Why |
|---|---|---|
| Auth tokens, current user | Zustand (persisted to httpOnly cookie for refresh) | Read everywhere, mutated rarely. |
| Editor scene graph (mirror of server) | Zustand store, hydrated from TanStack Query | Mutable at 60fps during drag; cheap reads everywhere in 3D tree. |
| Edit queue (unflushed ops) | Zustand store | Coalesced and batched to API every N ms or on commit. |
| Server data (projects, catalog, jobs) | TanStack Query | Caching, retries, optimistic updates. |
| UI ephemeral state (modal open?) | Local React state | Doesn't need to leak. |
| Theme, locale | React context + localStorage | Read everywhere; rarely changes. |

**Edit flushing strategy.** While dragging, ops accumulate locally; commit happens on drag-end. This avoids 60 round-trips/sec to the server and gives a clean undo unit.

---

## 12. UI Theming Architecture

The BRD calls for swappable UI themes. The design has not been chosen, so the architecture has to support late binding.

### 12.1 Token system

Define a finite, semantic token set (not pixel values):

```
--color-bg, --color-bg-elevated, --color-surface, --color-surface-hover
--color-text, --color-text-muted, --color-accent, --color-accent-fg
--color-border, --color-danger, --color-success
--radius-sm, --radius-md, --radius-lg
--shadow-sm, --shadow-md, --shadow-lg
--font-sans, --font-display, --font-mono
--motion-fast, --motion-base, --motion-slow
--space-1 .. --space-12
```

These live in `:root` and are overridden per theme. **Components reference tokens, never hex codes.**

### 12.2 Theme files

```
src/themes/
├── tokens.css         # default values on :root
├── themes.css         # [data-theme="..."] selectors override tokens
├── dormvibe-default/  # the deck's purple
├── japandi/
├── y2k/
├── dark/
└── ...
```

Switching theme = `document.documentElement.dataset.theme = 'japandi'`. No re-render, no rebuild.

### 12.3 Tailwind alignment

Tailwind config consumes the same tokens via `theme.extend.colors = { bg: 'var(--color-bg)', ... }`. So `bg-bg`, `text-accent`, `rounded-md` all theme correctly.

### 12.4 3D theming

Themes affect the 3D scene too: ground material, ambient light tint, environment map. Each theme exports a `scene-theme.json` with these. The Editor reads it via a `useSceneTheme()` hook and feeds R3F components.

### 12.5 Accessibility

Every theme is checked for AA contrast on text/bg, accent/bg, and danger/bg. A unit test enumerates themes and asserts.

---

## 13. Deployment Architecture

### 13.1 Environments

| Environment | Frontend | Backend | DB | Storage |
|---|---|---|---|---|
| **Local dev** | Vite dev (5173) | uvicorn --reload (8000), Celery worker | Docker postgres + redis | MinIO |
| **Preview** (PR builds) | Vercel preview | Railway/Fly.io review app | Shared dev cluster | MinIO bucket per branch |
| **Staging** | Vercel | Railway/Fly.io | dedicated postgres | dedicated bucket |
| **Production (China)** | Aliyun OSS + CDN, ICP-filed domain | Aliyun ECS or ACK | Aliyun RDS for PostgreSQL | Aliyun OSS |
| **Production (global, post-MVP)** | Vercel / Cloudflare | AWS Fargate or Fly.io | RDS / managed PG | S3 |

### 13.2 Build & release

- One Docker image per backend release; tagged with git SHA. Same image runs in staging and prod.
- Frontend builds are content-hashed and immutable.
- Database migrations run as a Kubernetes/Compose Job before the new app rollout.
- Rollback = redeploy previous image + revert migration if needed.

### 13.3 China data residency

Production data for China users must reside in China. This means:

- **Two production regions** once we expand globally: a China stack on Aliyun (or equivalent) and a global stack outside. They share **code**, not data.
- Auth supports per-region routing at the edge.
- Cross-region admin tooling reads through audited proxies, never directly.

This is a constraint that pays off only if designed in early. **Revisit before launch in mainland.**

---

## 14. Scalability Considerations

The MVP doesn't need to scale; the architecture has to *not block* scaling.

| Concern | MVP posture | Scale-out path |
|---|---|---|
| API throughput | Single-instance FastAPI behind a reverse proxy. | Horizontal scaling — FastAPI is stateless. |
| AI inference cost | Cap free tier; cache identical prompts. | Move hot models to provisioned capacity; consider self-hosting depth estimation when usage justifies. |
| 3D model delivery | Object storage + CDN. | Already CDN-fronted; add regional origins. |
| DB write load | One Postgres. | Read replicas for catalog; partition `scene_edit_log` by month. |
| Background jobs | One Celery worker. | Multiple workers; dedicated queues per kind (depth, llm, image-gen). |
| Rendering exports | On-demand, queued. | Pre-render on save; warm cache for "share" path. |

---

## 15. Security Considerations

- **Transport:** TLS 1.2+ everywhere; HSTS preload.
- **Cookies:** httpOnly, Secure, SameSite=Lax for the refresh-token cookie.
- **CSRF:** double-submit token on the refresh endpoint; the access token is sent via Authorization header from JS, which is itself protected by the SPA's same-origin policy.
- **Input validation:** Pydantic at every public boundary. Reject unknown fields by default.
- **File uploads:** size limits per content type; magic-byte verification (don't trust the client `Content-Type`); virus scan on documents (post-MVP).
- **Object storage:** uploads go via signed PUT URLs scoped to a single key; no client receives long-lived storage credentials.
- **Secret management:** secrets in environment, sourced from a secret manager (1Password / Doppler / Aliyun KMS). Never in git, never in client builds.
- **Rate limits:** per-IP and per-user; AI endpoints have stricter quotas. Tracked in Redis.
- **CSP:** strict content-security-policy; only our API origin and CDN origin allowed.
- **Dependency hygiene:** `npm audit` / `pip-audit` in CI; Dependabot.
- **PIPL:** explicit consent flows for survey data; user-initiated data export and deletion within 15 days; data residency (§13.3).
- **PII minimization:** survey responses are pseudonymous when used for product analytics.
- **Cost-DOS:** AI endpoints have a hard per-user-per-day cap independent of free/paid tier — protects against runaway-cost attacks.

---

## 16. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | First-contentful-paint ≤ 2.5s on 4G mid-tier mobile. Editor 60fps with ≤ 30 items on a 2022-class device. Initial AI generation ≤ 60s P95. Item swap ≤ 5s P95. |
| **Availability** | 99.5% on the API in MVP; 99.9% post-MVP. AI provider outages must degrade, not crash (fallback provider, queued job, friendly UI). |
| **Reliability** | All AI work is idempotent and retriable. Scene edits are atomic (all-or-nothing). |
| **Observability** | Errors → Sentry. Tracing on all API + AI calls. Cost metrics per AI call (provider, tokens, RMB). Per-user activation funnel events. |
| **Localization** | Zh-CN primary, EN secondary. UI strings via i18n keys, never hardcoded. Number/currency formatting locale-aware. |
| **Accessibility** | WCAG 2.1 AA on all 2D UI. Editor has keyboard-driven fallback (arrow keys move selected item; Tab cycles items). |
| **Browser support** | Latest Chrome, Edge, Safari, Firefox; mobile Safari 16+; mobile Chrome on Android 11+. WebGL2 required; WebGPU is progressive enhancement. |
| **Maintainability** | No PR merges without review, type-check, and tests passing. Architecture decisions captured as ADRs in `docs/adr/`. |
| **Cost** | Per-active-user infra + AI cost tracked weekly. MVP ceiling: under USD 1 / monthly active free user. |

---

## 17. Open Technical Decisions

These decisions should be closed in week 1 of the build:

1. **Auth provider strategy.** Roll our own with Authlib (more flexible) or use a managed service (Clerk/Supabase Auth/Auth0)? Managed is faster for MVP if it supports WeChat OAuth credibly.
2. **Photo-to-room reconstruction.** Tier 1 (depth-assisted) vs Tier 0-only for MVP. Driven by demo expectations and how many users actually upload photos vs. use templates.
3. **Furniture model sourcing.** Curate ~100 hand-picked GLBs (control, quality, slow), license a catalog (cost), or proceduralize (fast, less varied)? Probably curate for MVP.
4. **LLM provider for production CN traffic.** Qwen (Aliyun-native, simplest path) vs DeepSeek (cost-effective, strong reasoning). Likely default Qwen, fall back to DeepSeek if cost becomes a problem. Claude/GPT only for development.
5. **Job queue.** Celery (full-featured, heavier) vs RQ (simpler) vs FastAPI BackgroundTasks (only for the smallest jobs). Recommend Celery; RQ acceptable.
6. **Mobile-native plan.** React Native + react-three-fiber-native, or Flutter, or WebView shell? Don't decide now, but the decision shouldn't be precluded — keep all logic in the API and out of the frontend where possible.
7. **WeChat mini-program.** Yes/no for post-MVP, and if yes, does that change our backend API shape (it doesn't, much) or our auth flow (it does, somewhat)?

The Agent Plan (`03_AGENT_PLAN.md`) takes these decisions as parameters where it can, and assumes defaults where it must.
