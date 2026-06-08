from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Literal


def _env(name: str, default: str = "") -> str:
    return os.environ.get(name, default)


def _env_int(name: str, default: int) -> int:
    raw = os.environ.get(name)
    return int(raw) if raw else default


def _env_list(name: str, default: tuple[str, ...]) -> tuple[str, ...]:
    raw = os.environ.get(name)
    if not raw:
        return default
    return tuple(part.strip() for part in raw.split(",") if part.strip())


@dataclass(frozen=True)
class Settings:
    app_env: Literal["local", "staging", "production"]
    app_log_level: str
    app_base_url: str
    cors_origins: tuple[str, ...]

    database_url: str
    storage_dir: str
    storage_public_base_url: str

    jwt_secret: str
    jwt_access_ttl_seconds: int
    jwt_refresh_ttl_seconds: int

    ai_default_llm_provider: str
    ai_default_image_provider: str
    ai_default_3d_provider: str
    ai_default_region: str

    replicate_api_token: str
    qwen_api_key: str
    qwen_base_url: str
    deepseek_api_key: str
    anthropic_api_key: str
    openai_api_key: str


_INSECURE_JWT_DEFAULT = "dev-insecure-change-me"


def load_settings() -> Settings:
    env = _env("APP_ENV", "local")
    if env not in ("local", "staging", "production"):
        raise ValueError(f"Invalid APP_ENV: {env}")

    jwt_secret = _env("JWT_SECRET", _INSECURE_JWT_DEFAULT)
    if env != "local" and jwt_secret in ("", _INSECURE_JWT_DEFAULT):
        raise RuntimeError(
            f"JWT_SECRET must be overridden with a strong value when APP_ENV is {env!r}; "
            "refusing to start with the insecure default."
        )

    return Settings(
        app_env=env,  # type: ignore[arg-type]
        app_log_level=_env("APP_LOG_LEVEL", "info"),
        app_base_url=_env("APP_BASE_URL", "http://localhost:8000"),
        cors_origins=_env_list(
            "APP_CORS_ORIGINS",
            ("http://localhost:5173", "http://127.0.0.1:5173"),
        ),
        database_url=_env("DATABASE_URL", "sqlite:///./dormvibe.db"),
        storage_dir=_env("STORAGE_DIR", "./storage"),
        storage_public_base_url=_env(
            "STORAGE_PUBLIC_BASE_URL", "http://localhost:8000/storage"
        ),
        jwt_secret=jwt_secret,
        jwt_access_ttl_seconds=_env_int("JWT_ACCESS_TTL_SECONDS", 900),
        jwt_refresh_ttl_seconds=_env_int("JWT_REFRESH_TTL_SECONDS", 2592000),
        ai_default_llm_provider=_env("AI_DEFAULT_LLM_PROVIDER", "qwen"),
        ai_default_image_provider=_env("AI_DEFAULT_IMAGE_PROVIDER", "replicate"),
        ai_default_3d_provider=_env("AI_DEFAULT_3D_PROVIDER", "replicate"),
        ai_default_region=_env("AI_DEFAULT_REGION", "cn"),
        replicate_api_token=_env("REPLICATE_API_TOKEN"),
        qwen_api_key=_env("QWEN_API_KEY"),
        qwen_base_url=_env(
            "QWEN_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1"
        ),
        deepseek_api_key=_env("DEEPSEEK_API_KEY"),
        anthropic_api_key=_env("ANTHROPIC_API_KEY"),
        openai_api_key=_env("OPENAI_API_KEY"),
    )


settings = load_settings()
