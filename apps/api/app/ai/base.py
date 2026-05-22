"""AIProvider protocol.

Capabilities are intentionally minimal for MVP:
  - structured_json: LLM with a JSON-schema response contract
  - image_gen, image_to_depth, image_to_3d: vision/3D services (stubbed for now)

The router (`app.ai.router`) selects a provider by capability + region. Feature
code should never call a provider directly; it goes through `ai_router`.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol, runtime_checkable


@dataclass(frozen=True)
class CallTelemetry:
    """Emitted on every AI call for cost/latency dashboards (Tech Spec §11)."""

    provider: str
    capability: str
    latency_ms: int
    tokens_in: int = 0
    tokens_out: int = 0
    rmb_cost_estimate: float = 0.0


@runtime_checkable
class StructuredJSONProvider(Protocol):
    async def structured_json(
        self,
        *,
        system: str,
        user: str,
        json_schema: dict[str, Any],
        max_tokens: int = 1024,
    ) -> tuple[dict[str, Any], CallTelemetry]: ...


@runtime_checkable
class ImageGenProvider(Protocol):
    async def image_gen(
        self, *, prompt: str, width: int = 1024, height: int = 1024
    ) -> tuple[str, CallTelemetry]:
        """Returns (image_url, telemetry)."""
        ...


class AIProviderError(Exception):
    """Wraps provider-level failures (network, rate limit, malformed output)."""
