"""Initial scene composer.

Pipeline:
  1. Pick a query vector — from a `StyleProfile.embedding` (preferred) or the
     style's hand-tuned anchor (fallback).
  2. Pull top-K products from the catalog via cosine distance.
  3. Run the deterministic layout solver to place them.
  4. Emit a Scene compatible with the edit-op reducer.
"""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.contexts.catalog.infrastructure.embeddings import for_style
from app.contexts.catalog.infrastructure.repository import ProductRepository
from app.contexts.scene.application.layout_solver import ReservedArea, solve
from app.contexts.scene.domain.scene_graph import Room, Scene, SceneItem, Vec3

DEFAULT_STYLE = "cozy"
DEFAULT_TOP_K = 6


def _new_id() -> str:
    return f"it-{uuid.uuid4().hex[:8]}"


def _footprint(item: SceneItem, width: float, depth: float) -> tuple[float, float]:
    if abs(abs(item.rotation_y_rad) - 1.5708) < 0.01:
        return depth, width
    return width, depth


def compose(
    *,
    db: Session,
    room: Room,
    style: str = DEFAULT_STYLE,
    top_k: int = DEFAULT_TOP_K,
    profile_embedding: list[float] | None = None,
    locked_items: list[SceneItem] | None = None,
) -> Scene:
    """Produce a Scene from a style/profile, keeping `locked_items` in place.

    Locked items are echoed verbatim into the output scene, and their floor
    footprints become `ReservedArea`s so the solver routes new items around
    them. The room itself comes from the caller — locked items are assumed to
    already be inside it.
    """

    repo = ProductRepository(db)
    query_vec = profile_embedding if profile_embedding is not None else for_style(style)
    ranked = repo.recommend_by_vector(query_vec, limit=top_k)
    products = [p for p, _ in ranked]

    locked = locked_items or []
    reserved: list[ReservedArea] = []
    for it in locked:
        prod = repo.get(it.catalog_id)
        if prod is None:
            continue
        w, d = _footprint(it, prod.width_m, prod.depth_m)
        reserved.append(ReservedArea(x=it.position.x, z=it.position.z, width_m=w, depth_m=d))

    # Avoid proposing duplicates of locked items — keeps swaps coherent
    # (locking a sofa shouldn't yield two sofas after recompose).
    locked_catalog_ids = {it.catalog_id for it in locked}
    products = [p for p in products if p.id not in locked_catalog_ids]

    placements = solve(
        room_width_m=room.width_m,
        room_depth_m=room.depth_m,
        products=products,
        reserved_areas=reserved,
    )
    products_by_id = {p.id: p for p in products}
    items: list[SceneItem] = []
    for pl in placements:
        prod = products_by_id[pl.product_id]
        items.append(
            SceneItem(
                id=_new_id(),
                catalogId=pl.product_id,
                name=prod.name,
                position=Vec3(x=pl.x, y=0.0, z=pl.z),
                rotationYRad=pl.rotation_y_rad,
                scale=1.0,
                locked=False,
            )
        )
    # Locked items keep their original ids and transforms.
    return Scene(room=room, items=[*items, *locked], version=1)
