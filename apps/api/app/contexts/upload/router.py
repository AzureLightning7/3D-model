"""
POST /api/v1/transform-room

Accepts style preferences, generates an AI-designed version of the room using
MiniMax, and returns the URL of the generated image.
"""

from __future__ import annotations

import logging
import os
import secrets

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.ai.providers.minimax import build_room_transform_prompt, generate_room_image
from app.contexts.identity.domain.user import User
from app.core.deps import get_current_user

router = APIRouter(prefix="/transform-room", tags=["upload"])
logger = logging.getLogger(__name__)


class TransformRoomRequest(BaseModel):
    room_type: str = Field(default="dorm", description="dorm|bedroom|studio|living")
    style: str = Field(default="modern minimalist")
    color_palette: str = Field(default="neutral")
    budget: str = Field(default="mid-range")
    interests: list[str] = Field(default_factory=list)
    origin: str = Field(default="")
    room_dna: str = Field(default="")


class TransformRoomResponse(BaseModel):
    success: bool
    image_url: str
    prompt_used: str


@router.post("", response_model=TransformRoomResponse)
def transform_room(
    body: TransformRoomRequest,
    current_user: User = Depends(get_current_user),
) -> TransformRoomResponse:
    logger.info(
        "MINIMAX_API_KEY loaded: %s",
        "YES" if os.environ.get("MINIMAX_API_KEY") else "NO - KEY MISSING",
    )
    _ = current_user
    session_id = secrets.token_hex(8)

    style = body.style
    if body.room_dna:
        dna = body.room_dna
        if dna[0] == "C":
            style = "cozy minimalist"
        elif dna[0] == "S":
            style = "vibrant social"
        if len(dna) > 2:
            if dna[2] == "W":
                style += " warm tones"
            elif dna[2] == "C":
                style += " cool tones"
            elif dna[2] == "B":
                style += " bold expressive"

    prompt = build_room_transform_prompt(
        room_type=body.room_type,
        style=style,
        color_palette=body.color_palette,
        budget=body.budget,
        interests=body.interests,
        origin=body.origin,
    )

    try:
        image_url = generate_room_image(prompt, session_id)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e)) from None
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e)) from None
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {type(e).__name__}: {str(e)}",
        ) from None

    return TransformRoomResponse(success=True, image_url=image_url, prompt_used=prompt)

