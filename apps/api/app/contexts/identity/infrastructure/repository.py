from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.contexts.identity.domain.user import User
from app.contexts.identity.infrastructure.models import UserModel


def _to_domain(m: UserModel) -> User:
    return User(
        id=m.id,
        email=m.email,
        display_name=m.display_name,
        password_hash=m.password_hash,
        created_at=m.created_at,
        updated_at=m.updated_at,
    )


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_email(self, email: str) -> User | None:
        stmt = select(UserModel).where(UserModel.email == email.lower())
        m = self.db.execute(stmt).scalar_one_or_none()
        return _to_domain(m) if m else None

    def get_by_id(self, user_id: str) -> User | None:
        m = self.db.get(UserModel, user_id)
        return _to_domain(m) if m else None

    def create(self, *, email: str, display_name: str, password_hash: str) -> User:
        m = UserModel(
            email=email.lower(),
            display_name=display_name,
            password_hash=password_hash,
        )
        self.db.add(m)
        self.db.commit()
        self.db.refresh(m)
        return _to_domain(m)
