from __future__ import annotations

from hypothesis import given, settings
from hypothesis import strategies as st

from app.contexts.catalog.domain.product import CATALOG
from app.contexts.scene.application.layout_solver import solve


def _aabb_overlap(
    ax: float, az: float, aw: float, ad: float, bx: float, bz: float, bw: float, bd: float
) -> bool:
    return (abs(ax - bx) * 2 < (aw + bw) - 1e-6) and (
        abs(az - bz) * 2 < (ad + bd) - 1e-6
    )


def _footprint(placement, prod) -> tuple[float, float]:
    w, d = prod.width_m, prod.depth_m
    if abs(abs(placement.rotation_y_rad) - 1.5708) < 0.01:
        w, d = d, w
    return w, d


@given(
    width=st.floats(min_value=2.5, max_value=8.0),
    depth=st.floats(min_value=2.5, max_value=8.0),
    indices=st.lists(
        st.integers(min_value=0, max_value=len(CATALOG) - 1), min_size=1, max_size=8, unique=True
    ),
)
@settings(max_examples=200, deadline=None)
def test_solver_no_overlap_and_in_room(width: float, depth: float, indices: list[int]):
    products = [CATALOG[i] for i in indices]
    placements = solve(room_width_m=width, room_depth_m=depth, products=products)
    products_by_id = {p.id: p for p in products}

    # All placed items inside the room
    for pl in placements:
        prod = products_by_id[pl.product_id]
        w, d = _footprint(pl, prod)
        assert -width / 2 + w / 2 - 1e-3 <= pl.x <= width / 2 - w / 2 + 1e-3
        assert -depth / 2 + d / 2 - 1e-3 <= pl.z <= depth / 2 - d / 2 + 1e-3

    # No two placements overlap
    for i in range(len(placements)):
        for j in range(i + 1, len(placements)):
            a, b = placements[i], placements[j]
            aw, ad = _footprint(a, products_by_id[a.product_id])
            bw, bd = _footprint(b, products_by_id[b.product_id])
            assert not _aabb_overlap(a.x, a.z, aw, ad, b.x, b.z, bw, bd), (
                f"overlap between {a.product_id} and {b.product_id}"
            )


# Composer needs a DB-backed catalog with embeddings; that integration test
# now lives in test_compose_db.py (Postgres-backed).
