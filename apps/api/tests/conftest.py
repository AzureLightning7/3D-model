"""Shared test fixtures.

We run the FastAPI app against an isolated SQLite database for each test, and
patch the catalog vector-search to a Python-side cosine implementation so we
don't need a real Postgres+pgvector instance just to exercise endpoint logic.
"""

from __future__ import annotations

import math
import os
import tempfile
from collections.abc import Generator, Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker


@pytest.fixture
def test_app_client(monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    """Spin up an isolated FastAPI app + SQLite DB + seeded catalog + a Python
    cosine recommender. Yielded client is ready to hit `/api/v1/...`."""

    tmpdir = tempfile.mkdtemp(prefix="dormvibe-tests-")
    db_path = os.path.join(tmpdir, "test.db")
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("JWT_SECRET", "test-secret-key-32bytes-or-more-padding")

    # Reload settings/session/main with the patched env. Ordering matters: any
    # module already imported has bound to the prior `settings` object.
    import importlib

    import app.core.config as config_mod
    importlib.reload(config_mod)
    import app.db.session as session_mod
    importlib.reload(session_mod)

    # Build a fresh engine/session against the temp sqlite file.
    engine = create_engine(
        f"sqlite:///{db_path}",
        connect_args={"check_same_thread": False},
        future=True,
    )
    TestSessionLocal = sessionmaker(
        bind=engine, autoflush=False, autocommit=False, expire_on_commit=False
    )

    # Register all ORM models with metadata, then create tables.
    from app.contexts.catalog.infrastructure import models as _catalog_models  # noqa: F401
    from app.contexts.identity.infrastructure import models as _identity_models  # noqa: F401
    from app.contexts.projects.infrastructure import models as _projects_models  # noqa: F401
    from app.contexts.style_profile.infrastructure import models as _profile_models  # noqa: F401
    from app.db.base import Base

    Base.metadata.create_all(bind=engine)

    # Seed the catalog directly.
    from app.contexts.catalog.domain.product import CATALOG
    from app.contexts.catalog.infrastructure.embeddings import for_product
    from app.contexts.catalog.infrastructure.models import ProductModel

    with TestSessionLocal() as db:
        for p in CATALOG:
            db.add(
                ProductModel(
                    id=p.id,
                    name=p.name,
                    category=p.category,
                    color=p.color,
                    width_m=p.width_m,
                    depth_m=p.depth_m,
                    height_m=p.height_m,
                    embedding=for_product(p.id),
                )
            )
        db.commit()

    # Patch the recommend_by_vector to a Python cosine implementation. pgvector's
    # `<=>` operator only works on Postgres; tests just need correct ranking.
    from app.contexts.catalog.domain.product import Product
    from app.contexts.catalog.infrastructure import repository as repo_mod

    def _py_cosine(v1: list[float], v2: list[float]) -> float:
        dot = sum(a * b for a, b in zip(v1, v2))
        n1 = math.sqrt(sum(a * a for a in v1)) or 1.0
        n2 = math.sqrt(sum(b * b for b in v2)) or 1.0
        return 1.0 - dot / (n1 * n2)

    def _recommend(self, query_vector, *, limit=8):  # type: ignore[no-untyped-def]
        rows = self.db.query(repo_mod.ProductModel).all()
        scored: list[tuple[Product, float]] = []
        for m in rows:
            # SQLite stores the Vector as a string; coerce back to list[float].
            emb_raw = m.embedding
            if isinstance(emb_raw, str):
                emb = [float(x) for x in emb_raw.strip("[]").split(",") if x]
            else:
                emb = list(emb_raw)
            d = _py_cosine(list(query_vector), emb)
            scored.append((
                Product(
                    id=m.id, name=m.name, category=m.category, color=m.color,
                    width_m=m.width_m, depth_m=m.depth_m, height_m=m.height_m,
                    price_cny=getattr(m, "price_cny", 0.0),
                    retailer_url=getattr(m, "retailer_url", ""),
                ),
                d,
            ))
        scored.sort(key=lambda t: t[1])
        return scored[:limit]

    monkeypatch.setattr(repo_mod.ProductRepository, "recommend_by_vector", _recommend)

    # Build a FastAPI app that uses our session, *without* triggering init_db
    # (which would try CREATE EXTENSION on sqlite).
    from fastapi import APIRouter, FastAPI

    from app.contexts.catalog.interfaces.router import router as catalog_router
    from app.contexts.identity.interfaces.router import router as auth_router
    from app.contexts.projects.interfaces.router import router as projects_router
    from app.contexts.style_profile.interfaces.router import router as profile_router

    test_app = FastAPI(title="DormVibe API (test)")
    api = APIRouter(prefix="/api/v1")
    api.include_router(auth_router)
    api.include_router(projects_router)
    api.include_router(catalog_router)
    api.include_router(profile_router)
    test_app.include_router(api)

    # Override the DB dependency to use our test session.
    from app.core.deps import get_db

    def _get_test_db() -> Generator[Session, None, None]:
        db = TestSessionLocal()
        try:
            yield db
        finally:
            db.close()

    test_app.dependency_overrides[get_db] = _get_test_db

    with TestClient(test_app) as client:
        yield client


def auth_headers(client: TestClient, email: str = "demo@example.com") -> dict[str, str]:
    """Register a user (or log in if it already exists) and return Authorization headers."""
    r = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "p4ssw0rd-secret!", "display_name": "Demo"},
    )
    if r.status_code == 409:
        r = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": "p4ssw0rd-secret!"},
        )
    r.raise_for_status()
    token = r.json()["tokens"]["accessToken"]
    return {"Authorization": f"Bearer {token}"}
