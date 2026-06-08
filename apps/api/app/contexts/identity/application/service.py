from __future__ import annotations

from sqlalchemy.orm import Session

from app.contexts.identity.application.password import hash_password, verify_password
from app.contexts.identity.application.tokens import TokenPair, issue_token_pair
from app.contexts.identity.domain.user import (
    EmailAlreadyRegistered,
    InvalidCredentials,
    RefreshTokenReuse,
    User,
)
from app.contexts.identity.infrastructure.refresh_token_repository import (
    RefreshTokenRepository,
)
from app.contexts.identity.infrastructure.repository import UserRepository


class IdentityService:
    def __init__(self, db: Session) -> None:
        self.repo = UserRepository(db)
        self.tokens = RefreshTokenRepository(db)

    def _issue(self, user_id: str) -> TokenPair:
        """Issue a token pair and record its refresh jti as active."""
        pair = issue_token_pair(user_id)
        self.tokens.add(
            jti=pair.refresh_jti,
            user_id=user_id,
            expires_at=pair.refresh_expires_at,
        )
        return pair

    def register(self, *, email: str, password: str, display_name: str) -> tuple[User, TokenPair]:
        if self.repo.get_by_email(email):
            raise EmailAlreadyRegistered(email)
        user = self.repo.create(
            email=email,
            display_name=display_name or email.split("@", 1)[0],
            password_hash=hash_password(password),
        )
        return user, self._issue(user.id)

    def login(self, *, email: str, password: str) -> tuple[User, TokenPair]:
        user = self.repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise InvalidCredentials()
        return user, self._issue(user.id)

    def rotate_refresh(self, *, user_id: str, jti: str) -> TokenPair:
        """Rotate a refresh token.

        The caller (router) has already verified the JWT signature, expiry, and
        type, so this method only enforces server-side state:

          - unknown jti (already rotated away / logged out / forged) -> reject
          - jti belongs to a different user -> reject
          - jti already revoked -> token *reuse*: revoke every token for the user
            and reject, forcing a full re-login (spec §9.1)
          - otherwise: revoke this jti and issue a fresh pair
        """
        rec = self.tokens.get(jti)
        if rec is None or rec.user_id != user_id:
            raise InvalidCredentials()
        if rec.revoked_at is not None:
            self.tokens.revoke_all_for_user(user_id)
            raise RefreshTokenReuse()
        if self.repo.get_by_id(user_id) is None:
            raise InvalidCredentials()
        self.tokens.revoke(jti)
        return self._issue(user_id)

    def logout(self, *, jti: str) -> None:
        """Revoke the presented refresh token. Idempotent."""
        self.tokens.revoke(jti)
