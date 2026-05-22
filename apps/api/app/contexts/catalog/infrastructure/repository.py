from __future__ import annotations

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


class ProductRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_all(self) -> list[Product]:
        rows = self.db.execute(select(ProductModel).order_by(ProductModel.id)).scalars()
        return [_to_domain(r) for r in rows]

    def get(self, product_id: str) -> Product | None:
        m = self.db.get(ProductModel, product_id)
        return _to_domain(m) if m else None

    def recommend_by_vector(
        self, query_vector: list[float], *, limit: int = 8
    ) -> list[tuple[Product, float]]:
        """Returns (product, cosine_distance) ranked by similarity (asc distance)."""
        stmt = (
            select(
                ProductModel,
                ProductModel.embedding.cosine_distance(query_vector).label("distance"),
            )
            .order_by("distance")
            .limit(limit)
        )
        out: list[tuple[Product, float]] = []
        for row in self.db.execute(stmt):
            product_row, distance = row
            out.append((_to_domain(product_row), float(distance)))
        return out
