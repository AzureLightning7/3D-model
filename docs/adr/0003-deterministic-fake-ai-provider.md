# ADR 0003 — Deterministic fake AI provider as the default

**Status:** Accepted
**Date:** 2026-06-07
**Context doc:** `_Context/02_TECHNICAL_SPECIFICATION.md` §7

## Context

DormVibe's AI is meant to run behind a provider-agnostic adapter (`app/ai/`)
routed by capability (`structured_json`, `image_gen`, …) and region. Real
providers (Qwen, Replicate) require API keys, cost money, add latency, and fail
in non-deterministic ways — none of which is acceptable as a hard dependency for
local dev, CI, or a judge demo.

## Decision

The AI router (`app/ai/router.py`) falls back to a deterministic `FakeProvider`
whenever the relevant provider key is absent. The fake's outputs are stable
across runs (seeded by a hash of the prompt), so snapshot/unit tests stay green
without network access.

Recommendations and the initial scene composition deliberately do **not** depend
on the LLM at all: item ranking is `pgvector`/cosine over catalog embeddings, and
placement is the deterministic layout solver. The LLM is reserved for future
structured-JSON reasoning (survey → richer embedding).

## Consequences

- `pnpm dev:api`, CI, and the demo work with zero AI credentials.
- Embeddings are a 16-dim "toy" space today; replacing them with real CLIP/LLM
  embeddings is isolated to `catalog/infrastructure/embeddings.py` and the
  survey derivation (tracked in `docs/ERROR_LOG.md` C9).
- Swapping in a real provider is a config/key change, not a code change.
