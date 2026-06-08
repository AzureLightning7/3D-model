from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class User:
    id: str
    email: str
    display_name: str
    password_hash: str
    created_at: datetime
    updated_at: datetime


class IdentityError(Exception):
    """Base for identity domain errors."""


class EmailAlreadyRegistered(IdentityError):
    pass


class InvalidCredentials(IdentityError):
    pass


class RefreshTokenReuse(InvalidCredentials):
    """A refresh token that was already rotated/revoked was presented again.

    Subclasses InvalidCredentials so callers handling auth failure catch it too,
    while still allowing reuse to be detected and logged distinctly.
    """


class UserNotFound(IdentityError):
    pass
