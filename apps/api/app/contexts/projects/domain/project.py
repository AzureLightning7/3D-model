from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass(frozen=True)
class Project:
    id: str
    owner_id: str
    name: str
    room_width_m: float
    room_depth_m: float
    room_height_m: float
    scene: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class ProjectError(Exception):
    """Base for projects domain errors."""


class ProjectNotFound(ProjectError):
    pass


class ProjectForbidden(ProjectError):
    pass
