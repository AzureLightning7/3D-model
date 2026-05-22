"""Deterministic layout solver.

Given a list of catalog products and a room, place each item without overlapping
others, all inside the room. The MVP uses a simple "anchor against the nearest
wall, then fill" heuristic — not great aesthetically, but fast, deterministic,
and provably overlap-free, which is what the property test in
`tests/test_layout_solver.py` enforces.

Better aesthetic placement comes later (Phase 3) by letting the LLM propose
positions which this solver then *validates and snaps*, instead of inventing
positions itself.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.contexts.catalog.domain.product import Product


@dataclass(frozen=True)
class Placement:
    product_id: str
    x: float
    z: float
    rotation_y_rad: float


@dataclass(frozen=True)
class ReservedArea:
    """Axis-aligned floor footprint that the solver must not place items into.

    Used to honor locked items during RECOMPOSE: the locked item stays where it
    is, and the solver routes new items around its footprint.
    """

    x: float
    z: float
    width_m: float
    depth_m: float


def _aabb_overlap(
    ax: float, az: float, aw: float, ad: float, bx: float, bz: float, bw: float, bd: float
) -> bool:
    return (
        abs(ax - bx) * 2 < (aw + bw) - 1e-6 and abs(az - bz) * 2 < (ad + bd) - 1e-6
    )


def solve(
    *,
    room_width_m: float,
    room_depth_m: float,
    products: list[Product],
    reserved_areas: list[ReservedArea] | None = None,
) -> list[Placement]:
    """Place each product non-overlapping inside the room. Order matters:
    larger items first, so they get the prime wall spots.

    `reserved_areas` are footprints (e.g. of locked items) that the solver must
    treat as occupied. New placements never overlap them.
    """

    half_w = room_width_m / 2
    half_d = room_depth_m / 2
    margin = 0.05  # keep items a few cm off the wall
    reserved = reserved_areas or []

    # Sort by footprint area desc — big stuff first.
    queue = sorted(products, key=lambda p: -(p.width_m * p.depth_m))
    placed: list[tuple[Placement, Product]] = []

    def _try(p: Product, x: float, z: float, rot: float) -> Placement | None:
        # Apply rotation by 90° swap when rot is ~±π/2
        w, d = p.width_m, p.depth_m
        if abs(abs(rot) - 1.5708) < 0.01:
            w, d = d, w
        if not (-half_w + w / 2 + margin <= x <= half_w - w / 2 - margin):
            return None
        if not (-half_d + d / 2 + margin <= z <= half_d - d / 2 - margin):
            return None
        for placed_pl, placed_prod in placed:
            pw, pd = placed_prod.width_m, placed_prod.depth_m
            if abs(abs(placed_pl.rotation_y_rad) - 1.5708) < 0.01:
                pw, pd = pd, pw
            if _aabb_overlap(x, z, w, d, placed_pl.x, placed_pl.z, pw, pd):
                return None
        for r in reserved:
            if _aabb_overlap(x, z, w, d, r.x, r.z, r.width_m, r.depth_m):
                return None
        return Placement(product_id=p.id, x=x, z=z, rotation_y_rad=rot)

    for p in queue:
        candidate: Placement | None = None
        # Candidate slots: against each wall, evenly spaced
        slots: list[tuple[float, float, float]] = []
        steps = 7
        for i in range(steps):
            t = (i + 1) / (steps + 1)
            # Back wall (north): facing +Z
            slots.append((-half_w + t * room_width_m, -half_d + p.depth_m / 2 + margin, 0.0))
            # Front wall
            slots.append((-half_w + t * room_width_m, half_d - p.depth_m / 2 - margin, 3.14159))
            # Left wall: facing +X
            slots.append((-half_w + p.width_m / 2 + margin, -half_d + t * room_depth_m, 1.5708))
            # Right wall: facing -X
            slots.append((half_w - p.width_m / 2 - margin, -half_d + t * room_depth_m, -1.5708))
        # Center as last resort
        slots.append((0.0, 0.0, 0.0))

        for x, z, rot in slots:
            pl = _try(p, x, z, rot)
            if pl:
                candidate = pl
                break

        if candidate is None:
            # Skip this product — room too cramped. Caller may surface a warning.
            continue
        placed.append((candidate, p))

    return [pl for pl, _ in placed]
