from __future__ import annotations

import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.contexts.catalog.infrastructure.models import EMBEDDING_DIM
from app.db.base import Base, TimestampMixin


def _new_uuid() -> str:
    return str(uuid.uuid4())


class StyleProfileModel(Base, TimestampMixin):
    __tablename__ = "style_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_uuid)
    owner_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    embedding: Mapped[list[float]] = mapped_column(
        Vector(EMBEDDING_DIM), nullable=False
    )
    source_answers: Mapped[list[dict]] = mapped_column(JSON, nullable=False, default=list)
