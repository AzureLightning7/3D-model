from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class RefreshTokenRecord:
    jti: str
    user_id: str
    expires_at: datetime
    revoked_at: datetime | None
