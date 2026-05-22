"""Deterministic toy embeddings.

Each product is encoded into a 16-dim vector where each dimension corresponds
to a semantic axis (category, style tags). Real embeddings will come from the
AI router (CLIP for images, LLM for text) — when they do, this module is the
only thing that changes.

The axes are arbitrary but consistent: similar products end up with similar
vectors, which is all the cosine-distance query needs.
"""

from __future__ import annotations

import math
from typing import Final

# 16 named axes. Pure ergonomics — we never read the names back, just need
# stable ordering.
AXES: Final[tuple[str, ...]] = (
    "seating", "sleeping", "work", "storage", "lighting", "decor",
    "cozy", "minimal", "social", "study",
    "warm_color", "cool_color", "neutral",
    "tall", "low", "soft",
)


def _axis(name: str) -> int:
    return AXES.index(name)


def _vec(**weights: float) -> list[float]:
    v = [0.0] * len(AXES)
    for k, w in weights.items():
        v[_axis(k)] = w
    return _normalize(v)


def _normalize(v: list[float]) -> list[float]:
    norm = math.sqrt(sum(x * x for x in v)) or 1.0
    return [x / norm for x in v]


# Per-product embeddings. Designed so that:
#   - cozy ↔ sofa-mauve, rug, lamp
#   - minimal ↔ desk, chair, shelf
#   - study ↔ desk, chair, lamp, shelf
#   - social ↔ sofas, rug
PRODUCT_EMBEDDINGS: Final[dict[str, list[float]]] = {
    "sofa-mauve": _vec(seating=1.0, cozy=0.8, social=0.7, warm_color=0.7, soft=0.9),
    "sofa-teal":  _vec(seating=1.0, cozy=0.4, social=0.9, cool_color=0.8, soft=0.9),
    "bed-single": _vec(sleeping=1.0, cozy=0.9, warm_color=0.4, soft=0.7),
    "desk-oak":   _vec(work=1.0, study=0.9, minimal=0.7, warm_color=0.6, low=0.4),
    "chair-black": _vec(seating=0.6, work=0.8, study=0.7, minimal=0.8, neutral=0.6),
    "rug-round":  _vec(decor=1.0, cozy=0.9, social=0.6, warm_color=0.5, soft=0.9, low=1.0),
    "lamp-floor": _vec(lighting=1.0, cozy=0.7, study=0.5, warm_color=0.8, tall=1.0),
    "shelf-tall": _vec(storage=1.0, minimal=0.6, study=0.7, neutral=0.6, tall=1.0),
}


def for_product(product_id: str) -> list[float]:
    return PRODUCT_EMBEDDINGS[product_id]


# Pre-computed style profile vectors. These will eventually be derived from the
# user's 5-image survey via the LLM; for now they're hand-tuned anchors.
STYLE_PROFILE_EMBEDDINGS: Final[dict[str, list[float]]] = {
    "cozy":    _vec(cozy=1.0, warm_color=0.6, soft=0.8, lighting=0.4),
    "minimal": _vec(minimal=1.0, neutral=0.7, work=0.4, low=0.3),
    "study":   _vec(study=1.0, work=0.9, lighting=0.5, minimal=0.3),
    "social":  _vec(social=1.0, seating=0.8, cozy=0.4, soft=0.5),
}


def for_style(style: str) -> list[float]:
    return STYLE_PROFILE_EMBEDDINGS.get(style.lower(), STYLE_PROFILE_EMBEDDINGS["cozy"])
