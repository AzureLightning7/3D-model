from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass(frozen=True)
class StyleProfile:
    id: str
    owner_id: str
    embedding: list[float]
    source_answers: list[dict[str, Any]]
    created_at: datetime
    updated_at: datetime


class StyleProfileError(Exception):
    pass


class ProfileNotFound(StyleProfileError):
    pass
