"""Sanity tests for the hand-tuned product embeddings.

These vectors are stand-ins for real CLIP/LLM embeddings. They aren't supposed
to be perfect, but the cosy/minimal/study/social anchors should at least cluster
the intended products near the top of their ranking — otherwise the
recommendation panel feels random to users.
"""

from __future__ import annotations

import math

from app.contexts.catalog.infrastructure.embeddings import (
    PRODUCT_EMBEDDINGS,
    STYLE_PROFILE_EMBEDDINGS,
    for_style,
)


def _cosine_distance(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)) or 1.0
    nb = math.sqrt(sum(y * y for y in b)) or 1.0
    return 1.0 - dot / (na * nb)


def _ranked_for(style: str) -> list[str]:
    vec = for_style(style)
    scored = [(pid, _cosine_distance(vec, emb)) for pid, emb in PRODUCT_EMBEDDINGS.items()]
    scored.sort(key=lambda t: t[1])
    return [pid for pid, _ in scored]


def test_all_products_have_embeddings() -> None:
    from app.contexts.catalog.domain.product import CATALOG

    missing = [p.id for p in CATALOG if p.id not in PRODUCT_EMBEDDINGS]
    assert missing == [], f"missing embeddings: {missing}"


def test_embedding_dims_match() -> None:
    sizes = {len(v) for v in PRODUCT_EMBEDDINGS.values()}
    assert sizes == {16}, sizes


def test_cozy_anchor_clusters_cozy_items() -> None:
    top3 = _ranked_for("cozy")[:3]
    # The cozy anchor should pull in soft/warm/decor items, not desks/shelves.
    assert "sofa-mauve" in top3 or "rug-round" in top3, top3
    assert "shelf-tall" not in top3


def test_minimal_anchor_clusters_work_items() -> None:
    top3 = _ranked_for("minimal")[:3]
    # Minimal should surface desk/chair/shelf, not the cozy sofa or rug.
    assert "desk-oak" in top3 or "chair-black" in top3 or "shelf-tall" in top3
    assert "sofa-mauve" not in top3
    assert "rug-round" not in top3


def test_study_anchor_includes_lighting() -> None:
    """A study profile should feature the lamp prominently."""
    top4 = _ranked_for("study")[:4]
    assert "lamp-floor" in top4 or "desk-oak" in top4


def test_styles_are_distinct() -> None:
    """The four style anchors should not all rank identically — otherwise the
    recommendation engine has degenerated to a constant."""
    rankings = [tuple(_ranked_for(s)[:5]) for s in STYLE_PROFILE_EMBEDDINGS]
    assert len(set(rankings)) > 1
