from __future__ import annotations

import pytest

from app.contexts.scene.application.edit_reducer import (
    DuplicateItemId,
    ItemLocked,
    ItemNotFound,
    ItemOutsideRoom,
    apply,
    apply_all,
)
from app.contexts.scene.domain.scene_graph import (
    AddItem,
    DeleteItem,
    LockItem,
    MoveItem,
    Room,
    RotateItem,
    Scene,
    SceneItem,
    SwapItem,
    Vec3,
)


def _scene() -> Scene:
    return Scene(
        room=Room(width_m=4, depth_m=4, height_m=2.5),
        items=[
            SceneItem(
                id="i1",
                catalog_id="sofa-mauve",
                name="sofa",
                position=Vec3(x=0, y=0, z=0),
                rotation_y_rad=0,
                scale=1,
                locked=False,
            )
        ],
    )


def test_move_updates_position_and_bumps_version():
    s = _scene()
    s2 = apply(s, MoveItem(itemId="i1", to=Vec3(x=1, y=0, z=1)))
    assert s2.items[0].position.x == 1
    assert s2.items[0].position.z == 1
    assert s2.version == s.version + 1
    # input is unchanged (pure)
    assert s.items[0].position.x == 0
    assert s.version == 1


def test_move_outside_room_rejected():
    s = _scene()
    with pytest.raises(ItemOutsideRoom):
        apply(s, MoveItem(itemId="i1", to=Vec3(x=99, y=0, z=0)))


def test_move_missing_item_rejected():
    s = _scene()
    with pytest.raises(ItemNotFound):
        apply(s, MoveItem(itemId="nope", to=Vec3(x=0, y=0, z=0)))


def test_locked_item_cannot_move_or_delete():
    s = apply(_scene(), LockItem(itemId="i1", locked=True))
    with pytest.raises(ItemLocked):
        apply(s, MoveItem(itemId="i1", to=Vec3(x=1, y=0, z=0)))
    with pytest.raises(ItemLocked):
        apply(s, DeleteItem(itemId="i1"))


def test_rotate_and_swap_and_add_and_delete():
    s = _scene()
    s = apply(s, RotateItem(itemId="i1", rotationYRad=1.5708))
    assert abs(s.items[0].rotation_y_rad - 1.5708) < 1e-6

    s = apply(s, SwapItem(itemId="i1", newCatalogId="sofa-teal"))
    assert s.items[0].catalog_id == "sofa-teal"
    # transform preserved by swap
    assert abs(s.items[0].rotation_y_rad - 1.5708) < 1e-6

    new_item = SceneItem(
        id="i2",
        catalog_id="chair-black",
        name="chair",
        position=Vec3(x=1, y=0, z=1),
        rotation_y_rad=0,
        scale=1,
        locked=False,
    )
    s = apply(s, AddItem(item=new_item))
    assert {it.id for it in s.items} == {"i1", "i2"}

    s = apply(s, DeleteItem(itemId="i1"))
    assert {it.id for it in s.items} == {"i2"}


def test_add_duplicate_rejected():
    s = _scene()
    dup = SceneItem(
        id="i1",
        catalog_id="x",
        name="x",
        position=Vec3(x=0, y=0, z=0),
        rotation_y_rad=0,
        scale=1,
        locked=False,
    )
    with pytest.raises(DuplicateItemId):
        apply(s, AddItem(item=dup))


def test_apply_all_sequence():
    s = _scene()
    final = apply_all(
        s,
        [
            MoveItem(itemId="i1", to=Vec3(x=1, y=0, z=0)),
            RotateItem(itemId="i1", rotationYRad=1.0),
            DeleteItem(itemId="i1"),
        ],
    )
    assert final.items == []
    assert final.version == s.version + 3
