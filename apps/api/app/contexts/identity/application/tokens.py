from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

import jwt

from app.core.config import settings

ALGORITHM = "HS256"


@dataclass(frozen=True)
class TokenPair:
    access_token: str
    refresh_token: str
    access_expires_at: datetime
    refresh_expires_at: datetime


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _encode(payload: dict[str, Any]) -> str:
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def issue_token_pair(user_id: str) -> TokenPair:
    now = _now()
    access_exp = now + timedelta(seconds=settings.jwt_access_ttl_seconds)
    refresh_exp = now + timedelta(seconds=settings.jwt_refresh_ttl_seconds)
    jti = str(uuid.uuid4())
    access = _encode(
        {
            "sub": user_id,
            "type": "access",
            "iat": int(now.timestamp()),
            "exp": int(access_exp.timestamp()),
        }
    )
    refresh = _encode(
        {
            "sub": user_id,
            "type": "refresh",
            "jti": jti,
            "iat": int(now.timestamp()),
            "exp": int(refresh_exp.timestamp()),
        }
    )
    return TokenPair(
        access_token=access,
        refresh_token=refresh,
        access_expires_at=access_exp,
        refresh_expires_at=refresh_exp,
    )


def decode(token: str, *, expected_type: Literal["access", "refresh"]) -> dict[str, Any]:
    payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
    if payload.get("type") != expected_type:
        raise jwt.InvalidTokenError(
            f"Expected {expected_type} token, got {payload.get('type')!r}"
        )
    return payload
