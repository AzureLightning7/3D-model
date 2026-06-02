"""Survey definition + profile derivation.

This is the *deterministic* derivation: each option contributes weights on the
16 embedding axes (defined in `catalog.infrastructure.embeddings.AXES`). Sums
are normalized to unit length, giving a vector directly comparable to product
embeddings via cosine distance.

When we wire the AI router (Phase 4), this module is replaced by an LLM call:
the survey answers go in, a structured-JSON embedding comes out, the call is
logged via `CallTelemetry`. The downstream code (`recommend_by_vector`) is
unchanged.
"""

from __future__ import annotations

import math
from typing import Final


# Mirror of catalog.infrastructure.embeddings.AXES — duplicated to avoid an
# import cycle (style_profile shouldn't depend on catalog internals).
_AXES: Final[tuple[str, ...]] = (
    "seating", "sleeping", "work", "storage", "lighting", "decor",
    "cozy", "minimal", "social", "study",
    "warm_color", "cool_color", "neutral",
    "tall", "low", "soft",
)


def _w(**weights: float) -> dict[str, float]:
    return dict(weights)


# ---------------------------------------------------------------------------
# Question bank. 5 questions, each with 2–3 options. Each option carries axis
# weights derived from the answer's vibe.
# ---------------------------------------------------------------------------

SURVEY: Final[list[dict]] = [
    {
        "id": "vibe",
        "title": "What vibe do you want?",
        "options": [
            {
                "id": "cozy",
                "label": "Cozy",
                "subtitle": "warm, soft, lived-in",
                "weights": _w(cozy=1.0, soft=0.8, warm_color=0.7, lighting=0.4),
            },
            {
                "id": "minimal",
                "label": "Minimal",
                "subtitle": "clean, neutral, calm",
                "weights": _w(minimal=1.0, neutral=0.8, low=0.4),
            },
            {
                "id": "social",
                "label": "Social",
                "subtitle": "lots of seating, party-ready",
                "weights": _w(social=1.0, seating=0.9, cozy=0.4),
            },
        ],
    },
    {
        "id": "activity",
        "title": "What do you do most?",
        "options": [
            {
                "id": "study",
                "label": "Study & work",
                "subtitle": "desk + chair + lamp",
                "weights": _w(study=1.0, work=0.9, lighting=0.5),
            },
            {
                "id": "rest",
                "label": "Rest & recover",
                "subtitle": "bed-centric, calm",
                "weights": _w(sleeping=1.0, cozy=0.6, soft=0.5),
            },
            {
                "id": "hangout",
                "label": "Hangout & relax",
                "subtitle": "couches, friends, screens",
                "weights": _w(social=0.9, seating=0.7, cozy=0.5),
            },
        ],
    },
    {
        "id": "palette",
        "title": "Which palette feels right?",
        "options": [
            {
                "id": "warm",
                "label": "Warm",
                "subtitle": "amber, terracotta, oak",
                "weights": _w(warm_color=1.0, cozy=0.4),
            },
            {
                "id": "cool",
                "label": "Cool",
                "subtitle": "teal, blue, slate",
                "weights": _w(cool_color=1.0),
            },
            {
                "id": "bold",
                "label": "Bold & mixed",
                "subtitle": "expressive, maximalist",
                "weights": _w(decor=0.7, warm_color=0.5, cool_color=0.5, social=0.2),
            },
            {
                "id": "neutral",
                "label": "Neutral",
                "subtitle": "black, white, beige",
                "weights": _w(neutral=1.0, minimal=0.5),
            },
        ],
    },
    {
        "id": "density",
        "title": "How full should the room feel?",
        "options": [
            {
                "id": "full",
                "label": "Full",
                "subtitle": "every wall used",
                "weights": _w(decor=0.7, storage=0.6, seating=0.4),
            },
            {
                "id": "sparse",
                "label": "Sparse",
                "subtitle": "only what's needed",
                "weights": _w(minimal=0.8, low=0.3),
            },
        ],
    },
    {
        "id": "lighting",
        "title": "What kind of lighting?",
        "options": [
            {
                "id": "bright",
                "label": "Bright",
                "subtitle": "task-ready, daylight",
                "weights": _w(lighting=0.7, study=0.4),
            },
            {
                "id": "ambient",
                "label": "Ambient",
                "subtitle": "warm, dim, mood",
                "weights": _w(lighting=0.6, cozy=0.6, warm_color=0.5),
            },
        ],
    },
]


# ---------------------------------------------------------------------------
# Derivation
# ---------------------------------------------------------------------------

_QUESTIONS_BY_ID = {q["id"]: q for q in SURVEY}


def _normalize(v: list[float]) -> list[float]:
    norm = math.sqrt(sum(x * x for x in v)) or 1.0
    return [x / norm for x in v]


def derive_embedding(answers: list[dict]) -> list[float]:
    """Given `[{questionId, optionId}, ...]`, return a unit-length 16-dim vector.

    Unknown question/option ids are skipped silently (the API layer should
    surface validation errors, not the derivation).
    """
    acc = [0.0] * len(_AXES)
    for ans in answers:
        q = _QUESTIONS_BY_ID.get(ans.get("questionId", ""))
        if not q:
            continue
        opt = next((o for o in q["options"] if o["id"] == ans.get("optionId")), None)
        if not opt:
            continue
        for axis, weight in opt["weights"].items():
            if axis in _AXES:
                acc[_AXES.index(axis)] += float(weight)
    return _normalize(acc)
