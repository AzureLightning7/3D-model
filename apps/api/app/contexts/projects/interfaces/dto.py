from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.contexts.scene.domain.scene_graph import Scene


class ProjectCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    name: str = Field(min_length=1, max_length=200)
    room_width_m: float = Field(default=3.5, gt=0, le=20, alias="roomWidthM")
    room_depth_m: float = Field(default=4.0, gt=0, le=20, alias="roomDepthM")
    room_height_m: float = Field(default=2.6, gt=0, le=6, alias="roomHeightM")


class SceneUpdate(BaseModel):
    scene: Scene


class RecomposeRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    style: str = Field(default="cozy", max_length=40)
    profile_id: str | None = Field(default=None, alias="profileId")
    preserve_locked: bool = Field(default=True, alias="preserveLocked")


class EditsRequest(BaseModel):
    """Apply one or more ops in order. `expectedVersion` enforces optimistic
    concurrency — clients send the version their state was based on."""

    model_config = ConfigDict(populate_by_name=True)
    expected_version: int = Field(alias="expectedVersion", ge=1)
    ops: list[Any] = Field(min_length=1, description="List of EditOp objects")


class ProjectOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str
    owner_id: str = Field(serialization_alias="ownerId")
    name: str
    room_width_m: float = Field(serialization_alias="roomWidthM")
    room_depth_m: float = Field(serialization_alias="roomDepthM")
    room_height_m: float = Field(serialization_alias="roomHeightM")
    scene: dict[str, Any]
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")


class ProjectList(BaseModel):
    items: list[ProjectOut]
