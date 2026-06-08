# ADR 0004 — SQLite for native dev, Postgres+pgvector for Docker/prod

**Status:** Accepted
**Date:** 2026-06-08
**Context doc:** `_Context/02_TECHNICAL_SPECIFICATION.md` §8

## Context

The spec mandates PostgreSQL 16 + `pgvector` (relational core + JSONB scene
graphs + vector embeddings). But requiring a running Postgres for every `pnpm
dev:api` adds onboarding friction. There was concern that the `pgvector` column
type (`style_profiles.embedding`) would break on SQLite (`docs/ERROR_LOG.md` A2).

Investigation (`tests/test_style_profile_endpoint.py`) showed `pgvector.sqlalchemy
.Vector` degrades gracefully on SQLite: it stores the vector as a string and
reads it back as a numpy array, and the full create → insert → read cycle works.
Catalog embeddings are already stored as JSON `Text` and ranked with a Python
cosine in `recommend_by_vector`, so they're portable too.

## Decision

Support **both**:

- **Native dev / CI / tests:** SQLite (`sqlite:///./dormvibe.db`), the default
  `DATABASE_URL`. No external services needed.
- **Docker / staging / prod:** Postgres 16 + pgvector (`infra/docker-compose.yml`),
  where the real `vector` extension and `<=>` distance operator are used.

`init_db()` enables the `vector` extension only on non-SQLite engines; everything
else (table creation, seeding) is dialect-agnostic.

## Consequences

- Zero-dependency local startup; Postgres parity for anything that ships.
- Schema management is still `create_all` + a dev-only column patch; replacing it
  with Alembic is tracked separately (`docs/ERROR_LOG.md` E4).
- The Python-cosine fallback in `recommend_by_vector` means SQLite ranking is
  correct but not index-accelerated — fine for the ~24-item catalog.
