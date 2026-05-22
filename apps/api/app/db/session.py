from __future__ import annotations

import logging
import time
from collections.abc import Iterator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

log = logging.getLogger(__name__)

_is_sqlite = settings.database_url.startswith("sqlite")
_connect_args = {"check_same_thread": False} if _is_sqlite else {}

engine = create_engine(
    settings.database_url,
    echo=False,
    future=True,
    pool_pre_ping=True,
    connect_args=_connect_args,
)

SessionLocal: sessionmaker[Session] = sessionmaker(
    bind=engine, autoflush=False, autocommit=False, expire_on_commit=False
)


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _wait_for_db(max_attempts: int = 30, delay: float = 1.0) -> None:
    """Retry DB connection at startup — useful when api starts faster than postgres."""
    last_err: Exception | None = None
    for i in range(max_attempts):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return
        except OperationalError as e:
            last_err = e
            log.warning("db.wait", extra={"attempt": i + 1, "error": str(e)[:120]})
            time.sleep(delay)
    raise RuntimeError(f"DB not reachable after {max_attempts} attempts") from last_err


def _patch_columns() -> None:
    insp = inspect(engine)
    if "products" not in insp.get_table_names():
        return
    existing = {c["name"] for c in insp.get_columns("products")}
    patches: list[str] = []
    if "price_cny" not in existing:
        patches.append("ALTER TABLE products ADD COLUMN price_cny FLOAT NOT NULL DEFAULT 0")
    if "retailer_url" not in existing:
        patches.append("ALTER TABLE products ADD COLUMN retailer_url TEXT NOT NULL DEFAULT ''")
    if not patches:
        return
    with engine.begin() as conn:
        for sql in patches:
            conn.execute(text(sql))
    log.info("db.patch_columns", extra={"applied": len(patches)})


def init_db() -> None:
    """Create extensions, tables, and seed reference data. Dev-only."""
    _wait_for_db()

    # Enable pgvector before metadata.create_all so columns of type Vector work.
    if not _is_sqlite:
        with engine.begin() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))

    # Import models so they register against Base.metadata.
    from app.contexts.identity.infrastructure import models as _identity_models  # noqa: F401
    from app.contexts.projects.infrastructure import models as _projects_models  # noqa: F401
    from app.contexts.catalog.infrastructure import models as _catalog_models  # noqa: F401
    from app.contexts.style_profile.infrastructure import models as _profile_models  # noqa: F401

    from app.db.base import Base

    Base.metadata.create_all(bind=engine)

    # Dev-only schema patch: add columns that exist on the model but not in an
    # older local DB. Production will move to Alembic.
    _patch_columns()

    # Seed the catalog into the DB (idempotent).
    from app.contexts.catalog.infrastructure.seed import seed_catalog

    with SessionLocal() as db:
        seed_catalog(db)
