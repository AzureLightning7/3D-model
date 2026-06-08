from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.contexts.style_profile.domain.profile import StyleProfile
from app.contexts.style_profile.infrastructure.models import StyleProfileModel


def _to_domain(m: StyleProfileModel) -> StyleProfile:
    return StyleProfile(
        id=m.id,
        owner_id=m.owner_id,
        embedding=list(m.embedding),
        source_answers=m.source_answers,
        created_at=m.created_at,
        updated_at=m.updated_at,
    )


class StyleProfileRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, profile_id: str) -> StyleProfile | None:
        m = self.db.get(StyleProfileModel, profile_id)
        return _to_domain(m) if m else None

    def latest_for_owner(self, owner_id: str) -> StyleProfile | None:
        stmt = (
            select(StyleProfileModel)
            .where(StyleProfileModel.owner_id == owner_id)
            .order_by(StyleProfileModel.created_at.desc())
            .limit(1)
        )
        m = self.db.execute(stmt).scalar_one_or_none()
        return _to_domain(m) if m else None

    def create(
        self, *, owner_id: str, embedding: list[float], source_answers: list[dict[str, Any]]
    ) -> StyleProfile:
        m = StyleProfileModel(
            owner_id=owner_id, embedding=embedding, source_answers=source_answers
        )
        self.db.add(m)
        self.db.commit()
        self.db.refresh(m)
        return _to_domain(m)
