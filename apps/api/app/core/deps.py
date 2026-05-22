from __future__ import annotations

from typing import Annotated

import jwt
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.contexts.identity.application.tokens import decode
from app.contexts.identity.domain.user import User
from app.contexts.identity.infrastructure.repository import UserRepository
from app.db.session import get_db

DbSession = Annotated[Session, Depends(get_db)]


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


def get_current_user(
    db: DbSession,
    authorization: Annotated[str | None, Header()] = None,
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise _unauthorized("Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = decode(token, expected_type="access")
    except jwt.ExpiredSignatureError:
        raise _unauthorized("Token expired") from None
    except jwt.InvalidTokenError as e:
        raise _unauthorized(f"Invalid token: {e}") from None

    user_id = payload.get("sub")
    if not isinstance(user_id, str):
        raise _unauthorized("Malformed token")
    user = UserRepository(db).get_by_id(user_id)
    if user is None:
        raise _unauthorized("User not found")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
