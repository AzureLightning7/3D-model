# --- Stage 1: builder --------------------------------------------------------
# Installs deps into /opt/venv so the runtime image stays slim.
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

# Build tools needed for argon2-cffi (cffi) and httptools wheels on slim images.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /build
COPY pyproject.toml ./
COPY app ./app
RUN pip install --upgrade pip \
    && pip install -e ".[dev]" \
    && pip install hypothesis

# --- Stage 2: runtime --------------------------------------------------------
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    APP_ENV=local \
    APP_LOG_LEVEL=info \
    APP_BASE_URL=http://localhost:8000 \
    DATABASE_URL=sqlite:////data/dormvibe.db \
    STORAGE_DIR=/data/storage \
    STORAGE_PUBLIC_BASE_URL=http://localhost:8000/storage

# Copy venv from builder.
COPY --from=builder /opt/venv /opt/venv

# Non-root user. /data is a mounted volume for SQLite + storage.
RUN useradd --create-home --shell /bin/bash app \
    && mkdir -p /data/storage \
    && chown -R app:app /data
USER app

WORKDIR /app
COPY --chown=app:app app ./app
COPY --chown=app:app pyproject.toml ./

EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
    CMD python -c "import os,sys,urllib.request; p=os.environ.get('PORT','8000'); sys.exit(0 if urllib.request.urlopen(f'http://127.0.0.1:{p}/api/v1/health', timeout=2).status==200 else 1)"

# Bind to $PORT when the platform provides one (Render/Heroku), else 8000 for
# local runs and docker-compose. `exec` so uvicorn gets signals directly (clean shutdown).
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
