from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.contexts.catalog.domain.product import CATALOG
from app.contexts.catalog.infrastructure.embeddings import for_product
from app.contexts.catalog.infrastructure.models import ProductModel

log = logging.getLogger(__name__)


def seed_catalog(db: Session) -> None:
    """Idempotent: insert missing products and refresh price/retailer fields."""
    by_id = {row.id: row for row in db.query(ProductModel).all()}
    inserted = 0
    updated = 0
    for p in CATALOG:
        if p.id in by_id:
            m = by_id[p.id]
            if m.price_cny != p.price_cny or m.retailer_url != p.retailer_url:
                m.price_cny = p.price_cny
                m.retailer_url = p.retailer_url
                updated += 1
            continue
        db.add(
            ProductModel(
                id=p.id,
                name=p.name,
                category=p.category,
                color=p.color,
                width_m=p.width_m,
                depth_m=p.depth_m,
                height_m=p.height_m,
                price_cny=p.price_cny,
                retailer_url=p.retailer_url,
                embedding=for_product(p.id),
            )
        )
        inserted += 1
    if inserted or updated:
        db.commit()
        log.info("catalog.seed", extra={"inserted": inserted, "updated": updated})
