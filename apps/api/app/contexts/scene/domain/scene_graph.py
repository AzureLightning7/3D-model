"""Scene Graph: the canonical data model for a designed room.

This is the highest-traffic type in the system. Both backend (truth) and frontend
(optimistic) operate on the same shape. TypeScript types are generated from this
module via the OpenAPI pipeline; Zod is hand-mirrored.

Schema versioning rule: any breaking change bumps `Scene.schema_version` and ships
with a migration for stored scenes.
"""

from __future__ import annotations

from typing import Annotated, Literal, Union

from pydantic import BaseModel, ConfigDict, Field

SCENE_SCHEMA_VERSION = 1


class Vec3(BaseModel):
    model_config = ConfigDict(extra="forbid")
    x: float
    y: float
    z: float


class Room(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)
    width_m: float = Field(gt=0, le=20, alias="widthM")
    depth_m: float = Field(gt=0, le=20, alias="depthM")
    height_m: float = Field(gt=0, le=6, alias="heightM")


class SceneItem(BaseModel):
    """A single piece of furniture/decor placed in a room."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    id: str = Field(min_length=1, max_length=64)
    catalog_id: str = Field(alias="catalogId", min_length=1, max_length=64)
    name: str = Field(default="", max_length=200)
    position: Vec3
    rotation_y_rad: float = Field(default=0.0, alias="rotationYRad")
    scale: float = Field(default=1.0, gt=0.01, le=10.0)
    locked: bool = False


class Scene(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    schema_version: int = Field(default=SCENE_SCHEMA_VERSION, alias="schemaVersion")
    room: Room
    items: list[SceneItem] = Field(default_factory=list)
    version: int = Field(default=1, ge=1, description="Optimistic-concurrency version")


# ---------------------------------------------------------------------------
# Edit operations — one per mutation kind. The reducer in
# `app.contexts.scene.application.edit_reducer` consumes these.
# ---------------------------------------------------------------------------


class MoveItem(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)
    op: Literal["MOVE_ITEM"] = "MOVE_ITEM"
    item_id: str = Field(alias="itemId")
    to: Vec3


class RotateItem(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)
    op: Literal["ROTATE_ITEM"] = "ROTATE_ITEM"
    item_id: str = Field(alias="itemId")
    rotation_y_rad: float = Field(alias="rotationYRad")


class AddItem(BaseModel):
    model_config = ConfigDict(extra="forbid")
    op: Literal["ADD_ITEM"] = "ADD_ITEM"
    item: SceneItem


class DeleteItem(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)
    op: Literal["DELETE_ITEM"] = "DELETE_ITEM"
    item_id: str = Field(alias="itemId")


class LockItem(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)
    op: Literal["LOCK_ITEM"] = "LOCK_ITEM"
    item_id: str = Field(alias="itemId")
    locked: bool


class SwapItem(BaseModel):
    """Replace an item's catalog reference while preserving its transform."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)
    op: Literal["SWAP_ITEM"] = "SWAP_ITEM"
    item_id: str = Field(alias="itemId")
    new_catalog_id: str = Field(alias="newCatalogId")


EditOp = Annotated[
    Union[MoveItem, RotateItem, AddItem, DeleteItem, LockItem, SwapItem],
    Field(discriminator="op"),
]
