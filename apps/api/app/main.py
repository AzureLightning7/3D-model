from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.contexts.catalog.interfaces.router import router as catalog_router
from app.contexts.identity.interfaces.router import router as auth_router
from app.contexts.projects.interfaces.router import router as projects_router
from app.contexts.style_profile.interfaces.router import router as profile_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.db.session import init_db

configure_logging(settings.app_log_level)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    init_db()
    yield


app = FastAPI(title="DormVibe API", version="0.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter(prefix="/api/v1")


@api.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "dormvibe-api", "version": "0.0.0"}


api.include_router(auth_router)
api.include_router(projects_router)
api.include_router(catalog_router)
api.include_router(profile_router)

app.include_router(api)
