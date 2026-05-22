# DormVibe — Business Requirements Document (BRD)

**Audience:** Founding team, non-technical stakeholders, advisors, and judges.
**Purpose:** Establish shared understanding of what we are building, for whom, why it matters, and how we'll scope the MVP.
**Status:** Draft v1 · Living document

> One-line pitch: **DormVibe replaces the guesswork of furnishing a room with a confident, AI-personalized 3D preview that links straight to products you can actually buy.**

---

## 1. Executive Summary

People who move into a new room — students, young professionals in new cities, renters between apartments — face a high-stakes, low-information decision. Furniture is expensive, hard to return, and impossible to truly visualize until it's already in the room. Today, the cope mechanisms are: hours scrolling Pinterest and Xiaohongshu, decision fatigue from hundreds of identical Taobao listings, or hiring a designer few can afford.

DormVibe collapses that journey into a single guided flow:

1. **Upload a photo** of your empty (or current) room — or start from a blank template.
2. **Take a short personality + lifestyle survey** (style, hobbies, budget, constraints).
3. **See your room in 3D** with furniture placed for you, in your aesthetic.
4. **Drag, swap, customize** like a Sims build mode.
5. **Click to buy** the items that compose the room you actually like.

The output is not a pretty picture. It is **a confident purchase decision** — and a room that feels like *yours* on day one.

---

## 2. Objectives

| # | Objective | Why it matters |
|---|---|---|
| O1 | Reduce the time and friction between "I just moved in" and "I have a room I love" from weeks to one sitting. | The core user pain. |
| O2 | Replace anonymous catalog browsing with personalized, contextual recommendations rendered in the user's actual space. | The differentiator vs. AR (one item at a time) and Pinterest (no execution path). |
| O3 | Build a defensible technical edge in **intent-preserving customization** — change one thing without the AI rearranging everything. | The competitive moat called out in the BMC; demoable to judges. |
| O4 | Establish a B2C product with viral surface area on Xiaohongshu / Douyin (before/after rooms are native content there). | Distribution and CAC strategy. |
| O5 | Lay technical groundwork for B2B licensing (rental staging, retailer integration) without locking the consumer product into B2B-shaped tradeoffs. | Phase 3 revenue without Phase 1 distortion. |

---

## 3. Target Users

### 3.1 Primary segment — Young professionals in Tier 1 & 2 Chinese cities

- Ages 22–35, recently moved or moving frequently (rentals, first apartments, job relocations).
- Mid-range disposable income — care about furnishing well, can't absorb mistakes.
- Digitally native; comfortable with AI tools and online furniture purchase.
- Time-poor and decision-fatigued.
- Active on **Xiaohongshu (RED), Douyin, WeChat**.

### 3.2 Acquisition channel segment — University students

- Dorm and first-apartment moves create natural high-frequency demand.
- Strong social-sharing behavior; cheap to acquire via campus growth.
- **Treat as channel, not primary revenue segment.** They drive virality and content; monetization concentrates in segment 3.1.

### 3.3 Future B2B segments (Phase 3, not MVP)

- **Furniture retailers** — white-label or API integration (Taobao/Tmall sellers, JD home, IKEA China).
- **Real estate platforms** — virtual staging for listings and model units (Lianjia/Beike, Ziroom, Danke).
- **Interior design firms** — productivity tool for human designers.

### 3.4 Personas (illustrative)

- **"Mei, 26, Shanghai"** — just moved into a 35m² rental for a new job. Has a Pinterest board, three Taobao tabs, and no time. Will pay 50–150 RMB to skip the agony.
- **"Junjie, 22, Beijing"** — final-year student moving into a shared flat. Won't pay much, but will share a great before/after on Xiaohongshu. Free tier user, viral driver.

---

## 4. Core Features (MVP)

| # | Feature | Description |
|---|---|---|
| F1 | **Room ingestion** | User uploads 1–4 photos of a room *or* picks a blank template (rectangular room with adjustable dimensions). System produces an approximate, editable 3D room model. Accuracy is "good enough to decorate," not architectural. |
| F2 | **Personalization survey** | Short (<3 min) quiz capturing aesthetic preferences, lifestyle/hobbies, color tolerance, budget band, and practical needs (work-from-home, hosts guests, has pets, etc.). Output is a typed "style profile." |
| F3 | **AI-generated room concept** | Given the room model + style profile, the system places a recommended furniture set within the 3D scene — sized, oriented, and color-coordinated. |
| F4 | **3D editor** | Sims-like build mode: orbit/pan/zoom, drag furniture along the floor, rotate, swap, delete, add. Snapping to walls. Collision indication. Undo/redo. |
| F5 | **Furniture catalog & swap** | Side panel of recommended products by category (sofa, bed, desk…). Each item has a real product link, price, and 3D representation. User can swap an item for an alternative without breaking the rest of the layout. |
| F6 | **Style coherence preservation** | When a user swaps or customizes an item, the rest of the scene does not regenerate. Anything not edited stays exactly as it was. (This is the moat — see §10.) |
| F7 | **Shopping list export** | Final screen with all items, prices, total, and direct purchase links. Shareable image of the rendered room. |
| F8 | **Account & project save** | Sign up, save room projects, return to edit later. |

### Explicitly NOT in MVP

- Photorealistic rendering (path tracing, ray tracing) — stylized 3D is enough.
- Architectural-grade room reconstruction (exact wall thickness, doorways, vents).
- Multi-room dwellings (one room per project for MVP).
- Lighting design (light fixtures as objects, but no lighting simulation tuning).
- AR / camera passthrough.
- B2B portal / retailer dashboard.
- Mobile native apps (responsive web is the MVP target; mobile-native is roadmap).

---

## 5. User Stories

Stories are grouped by the journey arc. Each links to a feature ID.

### 5.1 Onboarding

- **US-01** As a new user, I can sign up with email or Google/WeChat OAuth so I can save my projects. *(F8)*
- **US-02** As a new user, I can start a project without signing up and only register when I want to save. *(F8)*

### 5.2 Room ingestion

- **US-03** As a user with an empty room, I can upload 1–4 photos so the app can build a 3D room I recognize. *(F1)*
- **US-04** As a user without a photo, I can pick a blank template and set rough dimensions. *(F1)*
- **US-05** As a user, I can correct the inferred room dimensions if they look wrong. *(F1)*

### 5.3 Survey

- **US-06** As a user, I can complete a short, visual survey (image-pick rather than text-heavy) about my style and lifestyle. *(F2)*
- **US-07** As a user, I can revise my style profile later without redoing the whole survey. *(F2)*

### 5.4 Generation & editing

- **US-08** As a user, I can generate an initial furnished room concept from my room + profile. *(F3)*
- **US-09** As a user, I can drag a piece of furniture to a new position in 3D space. *(F4)*
- **US-10** As a user, I can rotate furniture freely or in 90° snaps. *(F4)*
- **US-11** As a user, I can delete items I don't want. *(F4)*
- **US-12** As a user, I can add new items from a categorized catalog. *(F5)*
- **US-13** As a user, I can swap an item for an alternative the AI suggests, and **everything else in my room stays exactly the same.** *(F6)*
- **US-14** As a user, I can undo and redo edits. *(F4)*
- **US-15** As a user, I can see when items collide or overlap so I can fix the layout. *(F4)*

### 5.5 Conversion

- **US-16** As a user, I can view a final shopping list with prices, totals, and links to buy each item. *(F7)*
- **US-17** As a user, I can share a stylized image of my designed room to Xiaohongshu / WeChat. *(F7)*
- **US-18** As a user, I can save my project and return to it from any device. *(F8)*

### 5.6 Edge & error

- **US-19** As a user whose photo couldn't be reconstructed, I'm offered a clear fallback (manual dimensions) without losing my session.
- **US-20** As a user whose AI generation failed, I see a friendly message and can retry with one click.

---

## 6. Business Goals

### 6.1 Twelve-month goals

| Goal | Target |
|---|---|
| Validated user demand | 10,000 sign-ups; 1,500 paid conversions or equivalent affiliate revenue. |
| Retention | ≥ 30% of users return within 30 days of first project. |
| Content velocity | 200+ user-generated before/after posts on Xiaohongshu/Douyin. |
| Affiliate revenue pipeline | Live integrations with at least 2 of: Taobao, Tmall, JD.com, IKEA China. |
| Technical milestone | Intent-preserving customization shippable and demonstrable. |

### 6.2 Revenue model (from BMC)

- **Phase 1 (MVP → 6 months):** Freemium. Free tier with limits on designs/month and export resolution. Paid tier (subscription) for unlimited designs, advanced customization, high-res export, priority rendering.
- **Phase 2 (6–12 months):** Affiliate commissions on furniture purchased through the platform.
- **Phase 3 (12+ months):** B2B SaaS / API licensing to retailers, real estate platforms, and design firms.

> **Important compliance note for B2B:** revenue derives from licensing technology, not from selling user data. PIPL compliance must be designed into the platform from day one, not retrofitted.

---

## 7. MVP Scope

### 7.1 In scope

The eight core features F1–F8 above, on responsive web (desktop primary, mobile-web functional). Single primary language: Simplified Chinese for launch market, English as toggle for development and demo.

### 7.2 Out of scope for MVP (deferred to roadmap)

- Multi-room projects.
- Photorealistic rendering.
- Mobile-native apps (iOS/Android).
- Native AR or camera passthrough.
- Designer-collaboration mode (human-in-the-loop).
- B2B retailer/staging dashboard.
- Event/party decoration mode (Long-term goal in pitch).
- WeChat mini-program (post-MVP; planned via shared backend).

### 7.3 MVP success criteria

- A first-time user can go from upload to shopping list in **under 10 minutes**.
- Initial AI generation completes in **under 60 seconds** P95.
- Item swap + scene re-render completes in **under 5 seconds** P95.
- Demoable end-to-end in front of judges with no manual cleanup.

---

## 8. Future Roadmap

| Horizon | Theme | Key items |
|---|---|---|
| **Mid-term (3–6 months post-MVP)** | Depth & polish | Multi-room projects · WeChat mini-program · Mobile-web optimization · Light personalization model trained on our own usage data · Style transfer between rooms ("apply my living room style to my bedroom") |
| **Mid-term (6–12 months)** | Distribution & monetization | Affiliate revenue infrastructure · Xiaohongshu/Douyin sharing tools (one-tap stylized export) · A/B-tested paywall · Direct integrations with Taobao/Tmall sellers · Public API (read-only) for partners |
| **Long-term (12+ months)** | Vertical expansion | B2B SaaS portal for retailers · Virtual staging for real estate · Event decoration mode (party packages, holiday themes) · Designer marketplace (human-AI hybrid) · Native iOS/Android apps · International expansion (Instagram/TikTok/Pinterest channels) |

---

## 9. Risks & Constraints

### 9.1 Product / market risks

| Risk | Mitigation |
|---|---|
| Users don't trust AI-suggested furniture enough to buy. | Keep human in the loop — every item is editable, swappable, and clearly priced. Surface social proof (other users' rooms) early. |
| The 3D editor feels too complex for casual users. | Sims-like simplicity bar. Onboarding tooltips. "Ask AI" command for users who don't want to drag. |
| Taobao/Tmall/JD product links break or pricing drifts. | Daily catalog sync. Price-stale warnings in UI. Long-term: direct merchant API partnerships. |
| Regret/value claim is asserted, not proven. | Run a small pre-launch user study (N=10–20) with before/after confidence ratings; commission a buyer's-remorse stat to anchor the pitch. |

### 9.2 Technical risks

| Risk | Mitigation |
|---|---|
| Photo-to-3D reconstruction is unreliable. | Position the MVP as "approximate editable model," not architectural reconstruction. Always offer manual dimension override. |
| Intent-preserving customization is hard. | Treat as headline R&D task. Architect the scene as a structured object graph (not a generated image) so swaps are deterministic. |
| AI inference cost balloons with growth. | Aggressive caching. Batched rendering. Limit free-tier monthly designs. Pre-rendered furniture thumbnails. |
| Rendering performance on mid-tier laptops. | LOD (level of detail) furniture meshes. WebGL2 with WebGPU upgrade path. Progressive loading. |

### 9.3 Regulatory / market constraints

| Constraint | Implication |
|---|---|
| **PIPL (China data protection)** | Personal data of China users must reside in China. Pick Aliyun (or domestic equivalent) for production from day one. Survey responses are personal data — design retention windows. |
| **Cross-border AI APIs** | Foreign LLM APIs may be blocked or unreliable from China. Architect AI integrations as swappable adapters; keep a domestic backup (MiniMax, Qwen, DeepSeek) configured. |
| **App distribution** | If we later launch a WeChat mini-program or app on Chinese stores, we need ICP filing and content review. Plan for it; not a blocker for web MVP. |
| **Affiliate program access** | Taobao/JD affiliate programs have approval gates. Apply early. |

### 9.4 Team & resource constraints

- Hackathon / small-startup scale team. Architecture must be tractable for 2–4 engineers.
- Heavy reliance on third-party AI APIs in MVP (own models are post-MVP).
- Cost-sensitive: cap monthly cloud + AI spend; design cost telemetry into the system from the start.

---

## 10. Competitive Positioning

(From the pitch deck and BMC, restated as the framing the product must defend.)

| Competitor | What they do | Where DormVibe wins |
|---|---|---|
| **IKEA Planner** | Cheap, easy floor planner. | Personalization. We learn your style; they don't. |
| **Planner 5D** | DIY 3D tool. | Speed and guidance. They require a learning curve; we hold your hand. |
| **Foyr Neo** | Pro-grade design tool. | Beginner-friendliness. They're for designers; we're for everyone. |
| **Havenly** | Human designer marketplace. | Cost and speed. They take days/weeks at hundreds of dollars; we take minutes. |
| **NanoBanana / Copilot 3D / generative competitors** | AI generates rooms as images. | **Intent-preserving customization** + **path to purchase**. Their output is a picture; ours is a buyable scene where editing one thing doesn't blow up the rest. |
| **AR apps (IKEA Place, Amazon)** | One item visualized in your room. | Whole-room visualization *before* you've decided. AR is for after the decision; DormVibe is *for* the decision. |

**Pitch line to memorize:** *"AR shows you one item in your room. We show you every item, working together, before you commit to any of them."*

---

## 11. Success Metrics (Phase 1)

| Metric | Definition | Target |
|---|---|---|
| Activation | % of sign-ups who complete first generation | ≥ 60% |
| Time-to-first-room | Median time from signup → finished initial generation | ≤ 8 min |
| Edit depth | Median number of edits before user reaches shopping list | ≥ 5 (signal of engagement) |
| Save rate | % of generations saved as projects | ≥ 40% |
| Share rate | % of finished projects with a stylized image exported | ≥ 15% |
| Click-to-product | % of finished projects where user clicks ≥ 1 product link | ≥ 50% |
| Free→Paid conversion | (Phase 1) | ≥ 3% within 30 days |

---

## 12. Open Questions for the Team

1. **Style profile schema.** What are the canonical style axes we'll use (e.g. "Japandi ↔ Maximalist")? Needs a designer's eye.
2. **Furniture catalog seed.** Do we license a 3D model catalog, scrape and clean Taobao/Tmall, or curate ~100 hero items by hand for MVP?
3. **Pricing.** What does the paid tier cost in RMB, and at what monthly design quota does free become punitive? Needs willingness-to-pay research.
4. **Photo-to-3D approach.** Manual dimensions only, depth-assisted, or full reconstruction (World Labs Marble / similar)? Drives MVP scope and timeline. *(See Tech Spec §3.3.)*
5. **Default AI providers per capability.** For LLM (style profile, scene composition reasoning): Qwen (Aliyun-native), DeepSeek (cost), or routed by region. For image generation, depth estimation, and image-to-3D: Replicate (Flux, Depth Anything V2, Trellis) is the MVP default; evaluate fal.ai for faster image inference and Meshy/Tripo as direct-API alternatives if the catalog ever needs user-generated furniture.
6. **Evidence for the regret claim.** Testimonials, small user study, or commissioned stat — pick one before the pitch.
