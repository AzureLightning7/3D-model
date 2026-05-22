from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field

from app.contexts.catalog.domain.product import Product
from app.contexts.catalog.infrastructure.embeddings import for_style
from app.contexts.catalog.infrastructure.repository import ProductRepository
from app.contexts.style_profile.infrastructure.repository import StyleProfileRepository
from app.core.deps import CurrentUser, DbSession

router = APIRouter(prefix="/catalog", tags=["catalog"])


class ProductOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str
    name: str
    category: str
    color: str
    width_m: float = Field(serialization_alias="widthM")
    depth_m: float = Field(serialization_alias="depthM")
    height_m: float = Field(serialization_alias="heightM")
    price_cny: float = Field(serialization_alias="priceCny")
    retailer_url: str = Field(serialization_alias="retailerUrl")


class ProductList(BaseModel):
    items: list[ProductOut]


class RankedProduct(ProductOut):
    distance: float = Field(serialization_alias="distance")


class RankedList(BaseModel):
    items: list[RankedProduct]


def _to_dto(p: Product) -> ProductOut:
    return ProductOut(
        id=p.id,
        name=p.name,
        category=p.category,
        color=p.color,
        width_m=p.width_m,
        depth_m=p.depth_m,
        height_m=p.height_m,
        price_cny=p.price_cny,
        retailer_url=p.retailer_url,
    )


@router.get("/products", response_model=ProductList)
def list_products(db: DbSession) -> ProductList:
    return ProductList(items=[_to_dto(p) for p in ProductRepository(db).list_all()])


@router.get("/recommend", response_model=RankedList)
def recommend(
    user: CurrentUser,
    db: DbSession,
    style: str = Query(default="cozy", max_length=40),
    profile_id: str | None = Query(default=None, alias="profileId"),
    limit: int = Query(default=8, ge=1, le=50),
) -> RankedList:
    """Rank the catalog by cosine distance.

    If `profileId` is supplied (and the profile belongs to the caller), use the
    derived embedding from the user's survey. Otherwise fall back to the
    hand-tuned `style` anchor.
    """
    if profile_id:
        profile = StyleProfileRepository(db).get(profile_id)
        if profile is None:
            raise HTTPException(status_code=404, detail="Profile not found")
        if profile.owner_id != user.id:
            raise HTTPException(status_code=403, detail="Forbidden")
        vec = profile.embedding
    else:
        vec = for_style(style)
    rows = ProductRepository(db).recommend_by_vector(vec, limit=limit)
    return RankedList(
        items=[
            RankedProduct(**_to_dto(p).model_dump(), distance=round(d, 4))
            for p, d in rows
        ]
    )
