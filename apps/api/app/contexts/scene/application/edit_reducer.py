"""Pure scene-graph reducer.

`apply(scene, op) -> scene` is deterministic, validates invariants, and never
mutates inputs. The same algorithm runs in TypeScript at
`apps/web/src/features/editor/ops/applyOp.ts`; the two implementations are kept
in agreement via the fixture corpus under `apps/api/tests/fixtures/scene_ops/`.
"""

from __future__ import annotations

from collections.abc import Iterable

from app.contexts.scene.domain.scene_graph import (
    AddItem,
    DeleteItem,
    EditOp,
    LockItem,
    MoveItem,
    RotateItem,
    Scene,
    SceneItem,
    SwapItem,
)


class SceneOpError(Exception):
    """Raised when an op is invalid against the current scene."""


class ItemNotFound(SceneOpError):
    pass


class DuplicateItemId(SceneOpError):
    pass


class ItemOutsideRoom(SceneOpError):
    pass


class ItemLocked(SceneOpError):
    pass


def _replace_item(
    items: list[SceneItem], target_id: str, replacement: SceneItem
) -> list[SceneItem]:
    out: list[SceneItem] = []
    found = False
    for it in items:
        if it.id == target_id:
            out.append(replacement)
            found = True
        else:
            out.append(it)
    if not found:
        raise ItemNotFound(target_id)
    return out


def _assert_in_room(item: SceneItem, scene: Scene) -> None:
    half_w = scene.room.width_m / 2
    half_d = scene.room.depth_m / 2
    margin = 0.01
    if not (-half_w - margin <= item.position.x <= half_w + margin):
        raise ItemOutsideRoom(f"item {item.id} x={item.position.x} outside ±{half_w}")
    if not (-half_d - margin <= item.position.z <= half_d + margin):
        raise ItemOutsideRoom(f"item {item.id} z={item.position.z} outside ±{half_d}")
    if not (-margin <= item.position.y <= scene.room.height_m + margin):
        raise ItemOutsideRoom(
            f"item {item.id} y={item.position.y} outside [0,{scene.room.height_m}]"
        )


def _find(items: list[SceneItem], item_id: str) -> SceneItem:
    for it in items:
        if it.id == item_id:
            return it
    raise ItemNotFound(item_id)


def apply(scene: Scene, op: EditOp) -> Scene:
    """Return a new Scene with op applied. Raises SceneOpError on invalid op."""
    if isinstance(op, MoveItem):
        item = _find(scene.items, op.item_id)
        if item.locked:
            raise ItemLocked(op.item_id)
        moved = item.model_copy(update={"position": op.to})
        _assert_in_room(moved, scene)
        items = _replace_item(scene.items, op.item_id, moved)

    elif isinstance(op, RotateItem):
        item = _find(scene.items, op.item_id)
        if item.locked:
            raise ItemLocked(op.item_id)
        rotated = item.model_copy(update={"rotation_y_rad": op.rotation_y_rad})
        items = _replace_item(scene.items, op.item_id, rotated)

    elif isinstance(op, AddItem):
        if any(it.id == op.item.id for it in scene.items):
            raise DuplicateItemId(op.item.id)
        _assert_in_room(op.item, scene)
        items = [*scene.items, op.item]

    elif isinstance(op, DeleteItem):
        item = _find(scene.items, op.item_id)
        if item.locked:
            raise ItemLocked(op.item_id)
        items = [it for it in scene.items if it.id != op.item_id]

    elif isinstance(op, LockItem):
        item = _find(scene.items, op.item_id)
        locked_item = item.model_copy(update={"locked": op.locked})
        items = _replace_item(scene.items, op.item_id, locked_item)

    elif isinstance(op, SwapItem):
        item = _find(scene.items, op.item_id)
        # SWAP preserves transform — only the catalog reference changes.
        swapped = item.model_copy(update={"catalog_id": op.new_catalog_id})
        items = _replace_item(scene.items, op.item_id, swapped)

    else:  # pragma: no cover - exhaustive via discriminated union
        raise SceneOpError(f"Unknown op: {op!r}")

    return scene.model_copy(update={"items": items, "version": scene.version + 1})


def apply_all(scene: Scene, ops: Iterable[EditOp]) -> Scene:
    out = scene
    for op in ops:
        out = apply(out, op)
    return out
