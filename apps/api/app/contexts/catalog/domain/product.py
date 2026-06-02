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
    Product("sofa-grey", "Grey Sectional", "sofa", "#6B7280", 2.2, 0.9, 0.8, 2499.0, _retailer("grey sectional sofa")),
    Product("sofa-cream", "Cream Loveseat", "sofa", "#FEF3C7", 1.4, 0.7, 0.75, 1599.0, _retailer("cream loveseat sofa")),
    Product("bed-double", "Double Bed Frame", "bed", "#D6A76B", 1.4, 2.0, 0.5, 1899.0, _retailer("double bed wooden frame")),
    Product("bed-platform", "Platform Bed", "bed", "#374151", 1.6, 2.1, 0.35, 2199.0, _retailer("platform bed minimalist")),
    Product("desk-white", "White Minimalist Desk", "desk", "#F9FAFB", 1.2, 0.55, 0.75, 599.0, _retailer("white minimalist desk")),
    Product("desk-corner", "Corner Desk", "desk", "#92400E", 1.6, 1.2, 0.75, 899.0, _retailer("corner study desk")),
    Product("chair-pink", "Pink Accent Chair", "chair", "#FCA5A5", 0.7, 0.65, 0.9, 599.0, _retailer("pink accent armchair")),
    Product("chair-wood", "Wooden Dining Chair", "chair", "#B45309", 0.45, 0.45, 0.85, 249.0, _retailer("wooden dining chair")),
    Product("wardrobe-white", "White Wardrobe", "wardrobe", "#F9FAFB", 1.0, 0.55, 2.0, 1299.0, _retailer("white wardrobe closet")),
    Product("wardrobe-dark", "Dark Wardrobe", "wardrobe", "#1F2937", 1.2, 0.6, 2.1, 1599.0, _retailer("dark wood wardrobe")),
    Product("chest-drawers", "Chest of Drawers", "storage", "#D6A76B", 0.8, 0.45, 1.1, 699.0, _retailer("chest of drawers bedroom")),
    Product("bedside-table", "Bedside Table", "storage", "#E5E7EB", 0.45, 0.4, 0.55, 299.0, _retailer("bedside table nightstand")),
    Product("desk-lamp", "Desk Lamp", "lamp", "#FDE68A", 0.15, 0.3, 0.4, 129.0, _retailer("LED desk lamp study")),
    Product("pendant-light", "Pendant Light", "lamp", "#FEF3C7", 0.3, 0.3, 0.3, 199.0, _retailer("pendant ceiling light")),
    Product("plant-large", "Large Indoor Plant", "decor", "#16A34A", 0.4, 0.4, 1.2, 159.0, _retailer("large indoor plant monstera")),
    Product("mirror-full", "Full-Length Mirror", "decor", "#E5E7EB", 0.6, 0.05, 1.6, 299.0, _retailer("full length standing mirror")),
)


def find_by_id(catalog_id: str) -> Product | None:
    return next((p for p in CATALOG if p.id == catalog_id), None)
