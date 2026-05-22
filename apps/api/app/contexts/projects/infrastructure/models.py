from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.db.base import Base, TimestampMixin


def _new_uuid() -> str:
    return str(uuid.uuid4())


class ProjectModel(Base, TimestampMixin):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_uuid)
    owner_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    room_width_m: Mapped[float] = mapped_column(Float, nullable=False, default=3.5)
    room_depth_m: Mapped[float] = mapped_column(Float, nullable=False, default=4.0)
    room_height_m: Mapped[float] = mapped_column(Float, nullable=False, default=2.6)
    scene: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
