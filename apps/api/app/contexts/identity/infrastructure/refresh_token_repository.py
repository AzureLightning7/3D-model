from __future__ import annotations

from datetime import datetime

from sqlalchemy import update
from sqlalchemy.orm import Session

from app.contexts.identity.domain.refresh_token import RefreshTokenRecord
from app.contexts.identity.infrastructure.models import RefreshTokenModel
from app.db.base import utcnow


def _to_domain(m: RefreshTokenModel) -> RefreshTokenRecord:
    return RefreshTokenRecord(
        jti=m.jti,
        user_id=m.user_id,
        expires_at=m.expires_at,
        revoked_at=m.revoked_at,
    )


class RefreshTokenRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def add(self, *, jti: str, user_id: str, expires_at: datetime) -> None:
        self.db.add(
            RefreshTokenModel(jti=jti, user_id=user_id, expires_at=expires_at)
        )
        self.db.commit()

    def get(self, jti: str) -> RefreshTokenRecord | None:
        m = self.db.get(RefreshTokenModel, jti)
        return _to_domain(m) if m else None

    def revoke(self, jti: str) -> None:
        """Idempotently mark a single token revoked."""
        m = self.db.get(RefreshTokenModel, jti)
        if m is not None and m.revoked_at is None:
            m.revoked_at = utcnow()
            self.db.commit()

    def revoke_all_for_user(self, user_id: str) -> None:
        """Revoke every still-active token for a user (reuse → full reauth)."""
        self.db.execute(
            update(RefreshTokenModel)
            .where(
                RefreshTokenModel.user_id == user_id,
                RefreshTokenModel.revoked_at.is_(None),
            )
            .values(revoked_at=utcnow())
        )
        self.db.commit()
