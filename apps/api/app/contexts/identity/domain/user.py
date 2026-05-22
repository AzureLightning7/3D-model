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


class UserNotFound(IdentityError):
    pass
