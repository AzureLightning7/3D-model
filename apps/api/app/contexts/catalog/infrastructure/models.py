from __future__ import annotations

from sqlalchemy import Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin

EMBEDDING_DIM = 16


class ProductModel(Base, TimestampMixin):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    color: Mapped[str] = mapped_column(String(16), nullable=False)
    width_m: Mapped[float] = mapped_column(Float, nullable=False)
    depth_m: Mapped[float] = mapped_column(Float, nullable=False)
    height_m: Mapped[float] = mapped_column(Float, nullable=False)
    price_cny: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    retailer_url: Mapped[str] = mapped_column(Text, nullable=False, default="")
    # Store embedding as JSON text — works on both SQLite and Postgres
    embedding: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
