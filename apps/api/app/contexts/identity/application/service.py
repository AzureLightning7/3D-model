from __future__ import annotations

from sqlalchemy.orm import Session

from app.contexts.identity.application.password import hash_password, verify_password
from app.contexts.identity.application.tokens import TokenPair, issue_token_pair
from app.contexts.identity.domain.user import (
    EmailAlreadyRegistered,
    InvalidCredentials,
    User,
)
from app.contexts.identity.infrastructure.repository import UserRepository


class IdentityService:
    def __init__(self, db: Session) -> None:
        self.repo = UserRepository(db)

    def register(self, *, email: str, password: str, display_name: str) -> tuple[User, TokenPair]:
        if self.repo.get_by_email(email):
            raise EmailAlreadyRegistered(email)
        user = self.repo.create(
            email=email,
            display_name=display_name or email.split("@", 1)[0],
            password_hash=hash_password(password),
        )
        return user, issue_token_pair(user.id)

    def login(self, *, email: str, password: str) -> tuple[User, TokenPair]:
        user = self.repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise InvalidCredentials()
        return user, issue_token_pair(user.id)

    def refresh(self, user_id: str) -> TokenPair:
        # MVP: stateless rotation. A future iteration tracks jti to detect reuse.
        if not self.repo.get_by_id(user_id):
            raise InvalidCredentials()
        return issue_token_pair(user_id)
