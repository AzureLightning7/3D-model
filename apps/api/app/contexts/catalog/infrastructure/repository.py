from __future__ import annotations

import json
import math

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.contexts.catalog.domain.product import Product
from app.contexts.catalog.infrastructure.models import ProductModel


def _to_domain(m: ProductModel) -> Product:
    return Product(
        id=m.id,
        name=m.name,
        category=m.category,
        color=m.color,
        width_m=m.width_m,
        depth_m=m.depth_m,
        height_m=m.height_m,
        price_cny=m.price_cny,
        retailer_url=m.retailer_url,
    )


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)) or 1.0
    nb = math.sqrt(sum(x * x for x in b)) or 1.0
    return dot / (na * nb)


class ProductRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_all(self) -> list[Product]:
        rows = self.db.execute(
            select(ProductModel).order_by(ProductModel.id)
        ).scalars()
        return [_to_domain(r) for r in rows]

    def get(self, product_id: str) -> Product | None:
        m = self.db.get(ProductModel, product_id)
        return _to_domain(m) if m else None

    def recommend_by_vector(
        self, query: list[float], limit: int = 8
    ) -> list[tuple[Product, float]]:
        all_products = self.db.query(ProductModel).all()
        scored: list[tuple[float, ProductModel]] = []
        for p in all_products:
            try:
                emb = json.loads(p.embedding) if isinstance(p.embedding, str) else p.embedding
                if emb:
                    score = _cosine(query, emb)
                    scored.append((score, p))
            except Exception:
                continue
        scored.sort(key=lambda x: x[0], reverse=True)
        return [(_to_domain(p), 1.0 - score) for score, p in scored[:limit]]
