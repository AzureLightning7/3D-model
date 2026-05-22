"""Property tests for Scene Graph and edit ops.

Covers two invariants agent-plan §6.3 / §9 calls out:
  - Round-trip: serialize → deserialize → serialize is a fixed point.
  - SWAP idempotency: chained swaps end with the last `newCatalogId` and the
    item's transform never changes.
"""

from __future__ import annotations

from hypothesis import given, settings
from hypothesis import strategies as st

from app.contexts.scene.application.edit_reducer import apply_all
from app.contexts.scene.domain.scene_graph import (
    Room,
    Scene,
    SceneItem,
    SwapItem,
    Vec3,
)

_CATALOG_IDS = ["sofa-mauve", "sofa-teal", "bed-single", "desk-oak", "rug-round"]


def _make_scene(item_count: int = 3) -> Scene:
    items = [
        SceneItem(
            id=f"i{i}",
            catalogId="sofa-mauve",
            name="Sofa",
            position=Vec3(x=0.0, y=0.0, z=float(i) * 0.5),
            rotationYRad=0.0,
            scale=1.0,
            locked=False,
        )
        for i in range(item_count)
    ]
    return Scene(
        room=Room(width_m=4.0, depth_m=4.0, height_m=2.5),
        items=items,
        version=1,
    )


def test_scene_roundtrip_is_fixed_point() -> None:
    """serialize → deserialize → serialize must be byte-identical."""
    original = _make_scene()
    blob_a = original.model_dump(by_alias=True, mode="json")
    parsed = Scene.model_validate(blob_a)
    blob_b = parsed.model_dump(by_alias=True, mode="json")
    assert blob_a == blob_b


def test_scene_roundtrip_via_canonical_json() -> None:
    """Same fixed-point check, but going through actual JSON text. Surfaces
    any non-determinism in field ordering or numeric formatting."""
    import json

    original = _make_scene(item_count=5)
    text_a = json.dumps(original.model_dump(by_alias=True, mode="json"), sort_keys=True)
    parsed = Scene.model_validate(json.loads(text_a))
    text_b = json.dumps(parsed.model_dump(by_alias=True, mode="json"), sort_keys=True)
    assert text_a == text_b


@given(
    swaps=st.lists(st.sampled_from(_CATALOG_IDS), min_size=1, max_size=12),
)
@settings(max_examples=100, deadline=None)
def test_swap_idempotency_chained(swaps: list[str]) -> None:
    """A chain of SWAPs always lands on the final catalog id, never moves the
    item, and never disturbs other items."""
    s = _make_scene(item_count=3)
    initial_transforms = {
        it.id: (it.position.x, it.position.y, it.position.z, it.rotation_y_rad, it.scale)
        for it in s.items
    }
    ops = [SwapItem(itemId="i0", newCatalogId=c) for c in swaps]
    out = apply_all(s, ops)

    target = next(it for it in out.items if it.id == "i0")
    assert target.catalog_id == swaps[-1]
    # Transform of the swapped item never changes.
    t0 = initial_transforms["i0"]
    assert (target.position.x, target.position.y, target.position.z, target.rotation_y_rad, target.scale) == t0
    # All other items untouched (same id set, same transforms).
    for it in out.items:
        if it.id == "i0":
            continue
        assert (it.position.x, it.position.y, it.position.z, it.rotation_y_rad, it.scale) == initial_transforms[it.id]
    # Version advances by exactly the number of ops applied.
    assert out.version == s.version + len(swaps)


def test_swap_to_same_catalog_id_is_safe() -> None:
    """Swapping an item to its current catalog id is harmless (no exception)."""
    s = _make_scene(item_count=1)
    out = apply_all(s, [SwapItem(itemId="i0", newCatalogId="sofa-mauve")])
    assert out.items[0].catalog_id == "sofa-mauve"
    assert out.version == s.version + 1
