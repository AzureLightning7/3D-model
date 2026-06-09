"""
MiniMax image generation service.
Ported from the Node.js reference implementation.

Reference API call:
  POST https://api.minimaxi.com/v1/image_generation
  Headers: Authorization: Bearer {MINIMAX_API_KEY}
  Body: {
    model: "image-01",
    prompt: "...",
    aspect_ratio: "16:9",
    n: 1,
    prompt_optimizer: false
  }

Response contains either:
  data.image_urls[0]  — a direct URL to the image
  data.image_base64[0] — base64 encoded image
"""

from __future__ import annotations

import base64
import logging
import time
from pathlib import Path

import httpx

from app.core.config import get_settings

GENERATED_IMAGES_DIR = (
    Path(__file__).parent.parent.parent.parent / "public" / "generated" / "images"
)

logger = logging.getLogger(__name__)


def get_minimax_client() -> httpx.Client:
    settings = get_settings()
    if not settings.minimax_api_key:
        raise ValueError(
            "MINIMAX_API_KEY is not set in environment. Add it to apps/api/.env"
        )
    return httpx.Client(
        base_url=settings.minimax_base_url,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.minimax_api_key}",
        },
        timeout=120.0,
    )


def generate_room_image(
    prompt: str,
    session_id: str,
) -> str:
    client = get_minimax_client()

    payload = {
        "model": "image-01",
        "prompt": prompt,
        "aspect_ratio": "16:9",
        "n": 1,
        "prompt_optimizer": False,
    }

    logger.info("Calling MiniMax image generation")
    logger.info("Base URL: %s", get_settings().minimax_base_url)
    logger.info("Prompt: %s...", prompt[:100])

    try:
        response = client.post("/image_generation", json=payload)
    except Exception as e:
        logger.error("HTTP request to MiniMax failed: %s", e)
        raise RuntimeError(f"Cannot reach MiniMax API: {e}")

    logger.info("MiniMax response status: %s", response.status_code)
    logger.info("MiniMax response body: %s", response.text[:500])

    if response.status_code != 200:
        raise RuntimeError(
            f"MiniMax returned HTTP {response.status_code}. Body: {response.text[:300]}"
        )

    try:
        body = response.json()
    except Exception:
        raise RuntimeError(
            f"MiniMax returned non-JSON response: {response.text[:300]}"
        )

    base_resp = body.get("base_resp", {})
    status_code = base_resp.get("status_code", 0)
    if status_code != 0:
        raise RuntimeError(
            f"MiniMax API error {status_code}: {base_resp.get('status_msg', 'Unknown error')}. "
            f"Full response: {str(body)[:500]}"
        )

    data = body.get("data") or {}
    direct_url: str | None = (
        (data.get("image_urls") or [None])[0]
        or data.get("image_url")
        or (body.get("image_urls") or [None])[0]
        or body.get("image_url")
    )

    base64_data: str | None = (
        (data.get("image_base64") or [None])[0]
        or data.get("base64")
        or (body.get("image_base64") or [None])[0]
        or body.get("base64")
    )

    if not direct_url and not base64_data:
        raise RuntimeError(
            f"MiniMax gave no image. Full response keys: {list(body.keys())}. "
            f"Data keys: {list(data.keys())}. "
            f"Full body: {str(body)[:500]}"
        )

    GENERATED_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{session_id}-room-{int(time.time())}.png"
    file_path = GENERATED_IMAGES_DIR / filename

    if direct_url:
        logger.info("Downloading image from: %s", direct_url)
        image_response = httpx.get(direct_url, timeout=60.0)
        image_response.raise_for_status()
        file_path.write_bytes(image_response.content)
    elif base64_data:
        logger.info("Saving base64 image")
        file_path.write_bytes(base64.b64decode(base64_data))

    logger.info("Image saved to: %s", file_path)
    return f"/generated/images/{filename}"


def build_room_transform_prompt(
    room_type: str,
    style: str,
    color_palette: str,
    budget: str,
    interests: list[str],
    origin: str,
) -> str:
    interests_str = ", ".join(interests) if interests else "general"

    cultural_note = ""
    if origin and origin not in ("", "International Student"):
        cultural_note = (
            f"Incorporate subtle design elements inspired by {origin} aesthetic and culture. "
        )

    return (
        f"Interior design photo of a fully furnished {room_type}. "
        f"Style: {style}. "
        f"Color palette: {color_palette} tones. "
        f"The room reflects someone who enjoys {interests_str}. "
        f"Budget level: {budget}. "
        f"{cultural_note}"
        f"Include: appropriate bed or seating, desk or work area, "
        f"storage solutions, lighting, and decorative elements. "
        f"Photorealistic interior design photography. "
        f"Warm, inviting atmosphere. High quality render. "
        f"The room should feel personal and lived-in, not like a showroom."
    )
