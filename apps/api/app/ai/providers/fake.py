"""Deterministic fake provider for tests and local dev without API keys.

Used by:
  - unit tests (no network)
  - local dev when the real provider env vars are blank
  - CI

The fake's outputs are stable across runs so snapshot tests stay green.
"""

from __future__ import annotations

import hashlib
import time
from typing import Any

from app.ai.base import CallTelemetry


class FakeProvider:
    name = "fake"

    async def structured_json(
        self,
        *,
        system: str,
        user: str,
        json_schema: dict[str, Any],
        max_tokens: int = 1024,
    ) -> tuple[dict[str, Any], CallTelemetry]:
        t0 = time.perf_counter()
        # Deterministic dummy that satisfies *any* schema with empty defaults.
        out = _empty_for(json_schema)
        # Seed with prompt hash so different prompts get visibly-different output
        # (useful for inspecting telemetry, not for correctness).
        out["_seed"] = hashlib.sha256(f"{system}|{user}".encode()).hexdigest()[:8]
        telem = CallTelemetry(
            provider=self.name,
            capability="structured_json",
            latency_ms=int((time.perf_counter() - t0) * 1000),
            tokens_in=len(user) // 4,
            tokens_out=64,
        )
        return out, telem

    async def image_gen(
        self, *, prompt: str, width: int = 1024, height: int = 1024
    ) -> tuple[str, CallTelemetry]:
        t0 = time.perf_counter()
        url = f"https://fake.dormvibe.app/img/{hashlib.sha256(prompt.encode()).hexdigest()[:16]}.png"
        telem = CallTelemetry(
            provider=self.name,
            capability="image_gen",
            latency_ms=int((time.perf_counter() - t0) * 1000),
        )
        return url, telem


def _empty_for(schema: dict[str, Any]) -> dict[str, Any]:
    """Best-effort empty value matching a JSON-schema-ish dict."""
    if schema.get("type") == "object":
        out: dict[str, Any] = {}
        props = schema.get("properties", {})
        required = set(schema.get("required", []))
        for k, sub in props.items():
            if k in required or sub.get("default") is not None:
                out[k] = _empty_for(sub) if isinstance(sub, dict) else None
        return out
    if schema.get("type") == "array":
        return []  # type: ignore[return-value]
    if schema.get("type") == "string":
        return ""  # type: ignore[return-value]
    if schema.get("type") in ("integer", "number"):
        return 0  # type: ignore[return-value]
    if schema.get("type") == "boolean":
        return False  # type: ignore[return-value]
    return {}
