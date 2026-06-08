# ADR 0002 — FastAPI BackgroundTasks before Celery/Redis

**Status:** Accepted
**Date:** 2026-06-07
**Context doc:** `_Context/02_TECHNICAL_SPECIFICATION.md` §7, §14, §17

## Context

The spec's architecture diagram and §7 call for a Celery + Redis job queue with a
`GET /jobs/{id}` poll endpoint and a `WS /jobs/{id}/stream` for AI work that can
take 5–60s. Today the only "AI" work is the deterministic in-process layout
solver and the fake AI provider, both of which complete in well under 100ms.
`recompose` runs synchronously inside the request and returns the new scene
directly.

## Decision

Do **not** add Celery/Redis/WebSocket job infrastructure yet. Keep `recompose`
(and future fast AI calls) synchronous. When a real LLM/Replicate provider is
wired and a call's P95 exceeds a few seconds:

1. First move the call to FastAPI `BackgroundTasks` with a simple `ai_jobs` row
   and a `GET /jobs/{id}` poll endpoint.
2. Only adopt Celery (or `arq`) + Redis when a job's P95 exceeds ~30s or when
   horizontal worker scaling is actually needed.

## Consequences

- No Redis dependency for local dev or the demo.
- The synchronous path is simpler to test (no async job lifecycle) — see
  `tests/test_recompose_endpoint.py`.
- Idempotency-Key handling (spec §5.2) is deferred alongside this; tracked in
  `docs/ERROR_LOG.md` (C4, C5).
