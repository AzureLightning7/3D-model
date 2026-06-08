# ADR 0001 — Minimal Scene Graph for MVP

**Status:** Accepted
**Date:** 2026-06-07
**Context doc:** `_Context/02_TECHNICAL_SPECIFICATION.md` §3

## Context

The technical spec (§3.2) describes a rich Scene Graph: per-room walls, floor,
ceiling, `photoBackplate`, and per-item `modelAssetUrl`, `category`, quaternion
rotation, `footprint`, `origin`, `styleTags`, `colorways`, plus `lockedItemIds`,
`meta`, and an embedded `history[]`.

The shipped model (`apps/api/app/contexts/scene/domain/scene_graph.py`) is much
smaller: a `Room` of `{widthM, depthM, heightM}`, and `SceneItem`s of
`{id, catalogId, name, position, rotationYRad (scalar), scale, locked}`, with a
top-level optimistic-concurrency `version` and `schemaVersion`.

## Decision

Ship the minimal shape for the MVP. The narrowing is deliberate:

- A scalar Y-rotation is sufficient because furniture sits on the floor; full
  quaternions add complexity with no MVP payoff.
- Footprints live in the catalog (`Product.width_m/depth_m`), so they don't need
  to be duplicated on each item.
- Undo/redo is handled client-side by snapshotting whole scenes, so an embedded
  `history[]` isn't required server-side yet.
- Walls/floor/ceiling are derived from room dimensions by the renderer.

`schemaVersion` is stamped so the format can evolve with a read-time migrator.

## Consequences

- Spec fields not yet modelled (`styleProfileId` on the scene, `origin`,
  `styleTags`, `colorways`, `modelAssetUrl`, `photoBackplate`) are tracked in
  `docs/ERROR_LOG.md` (C1) and added when a feature needs them.
- The one tie worth adding early is `scenes.style_profile_id` so a scene can
  remember which profile produced it; deferred until recompose needs it.
