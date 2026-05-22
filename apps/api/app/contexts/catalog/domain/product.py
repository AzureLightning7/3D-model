"""Catalog stub.

The MVP plan calls for a real Postgres+GLB catalog. For Phase 2 we ship a tiny
in-memory list so the editor has something to add and swap; real catalog
implementation lives in Phase 3 (storage, embeddings, search).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Final


@dataclass(frozen=True)
class Product:
    id: str
    name: str
    category: str
    color: str
    width_m: float
    depth_m: float
    height_m: float
    price_cny: float
    retailer_url: str


# Retailer URLs are deterministic search links so they always resolve to
# something a judge can click during a demo.
def _retailer(query: str) -> str:
    from urllib.parse import quote_plus

    return f"https://item.taobao.com/search?q={quote_plus(query)}"


CATALOG: Final[tuple[Product, ...]] = (
    Product("sofa-mauve", "Mauve Sofa", "sofa", "#c4b5fd", 1.6, 0.8, 0.8, 1899.0, _retailer("mauve sofa")),
    Product("sofa-teal", "Teal Sofa", "sofa", "#5eead4", 1.6, 0.8, 0.8, 1799.0, _retailer("teal sofa")),
    Product("bed-single", "Single Bed", "bed", "#fef3c7", 1.0, 2.0, 0.5, 1299.0, _retailer("single bed dorm")),
    Product("desk-oak", "Oak Desk", "desk", "#d6a76b", 1.4, 0.6, 0.75, 699.0, _retailer("oak study desk")),
    Product("chair-black", "Black Chair", "chair", "#374151", 0.5, 0.5, 0.9, 349.0, _retailer("black office chair")),
    Product("rug-round", "Round Rug", "rug", "#f9a8d4", 1.5, 1.5, 0.02, 259.0, _retailer("pink round rug")),
    Product("lamp-floor", "Floor Lamp", "lamp", "#fde68a", 0.3, 0.3, 1.6, 199.0, _retailer("floor lamp warm")),
    Product("shelf-tall", "Tall Shelf", "shelf", "#a78bfa", 0.8, 0.3, 1.8, 459.0, _retailer("tall bookshelf")),
)


def find_by_id(catalog_id: str) -> Product | None:
    return next((p for p in CATALOG if p.id == catalog_id), None)
