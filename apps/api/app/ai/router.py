"""Capability + region router.

Selection policy for MVP:
  - structured_json: Qwen when QWEN_API_KEY is set and region=cn, else fake.
  - image_gen: Replicate when REPLICATE_API_TOKEN is set, else fake.

Real Qwen/Replicate clients ship later; right now the router falls back to the
fake provider whenever the relevant key is missing. That lets the rest of the
app develop and test without external dependencies.
"""

from __future__ import annotations

import logging
from typing import Any

from app.ai.base import CallTelemetry
from app.ai.providers.fake import FakeProvider
from app.core.config import settings

log = logging.getLogger(__name__)

_fake = FakeProvider()


class AIRouter:
    async def structured_json(
        self,
        *,
        system: str,
        user: str,
        json_schema: dict[str, Any],
        max_tokens: int = 1024,
    ) -> tuple[dict[str, Any], CallTelemetry]:
        provider = self._pick_llm()
        out, telem = await provider.structured_json(
            system=system, user=user, json_schema=json_schema, max_tokens=max_tokens
        )
        log.info(
            "ai.call",
            extra={
                "provider": telem.provider,
                "capability": telem.capability,
                "latency_ms": telem.latency_ms,
                "tokens_in": telem.tokens_in,
                "tokens_out": telem.tokens_out,
            },
        )
        return out, telem

    async def image_gen(
        self, *, prompt: str, width: int = 1024, height: int = 1024
    ) -> tuple[str, CallTelemetry]:
        provider = self._pick_image()
        url, telem = await provider.image_gen(prompt=prompt, width=width, height=height)
        log.info(
            "ai.call",
            extra={
                "provider": telem.provider,
                "capability": telem.capability,
                "latency_ms": telem.latency_ms,
            },
        )
        return url, telem

    def _pick_llm(self) -> Any:
        # Future: branch on settings.ai_default_llm_provider + key presence.
        if settings.qwen_api_key:
            # Real adapter not implemented yet; would import from providers.qwen here.
            pass
        return _fake

    def _pick_image(self) -> Any:
        if settings.replicate_api_token:
            # Real Replicate adapter ships in Phase 3.
            pass
        return _fake


ai_router = AIRouter()
