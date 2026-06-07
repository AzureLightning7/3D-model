from __future__ import annotations

import logging

import jwt
from fastapi import APIRouter, HTTPException, status

from app.contexts.identity.application.service import IdentityService
from app.contexts.identity.application.tokens import TokenPair, decode
from app.contexts.identity.domain.user import (
    EmailAlreadyRegistered,
    InvalidCredentials,
    User,
)
from app.contexts.identity.interfaces.dto import (
    AuthResponse,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPairOut,
    UserOut,
)
from app.core.deps import CurrentUser, DbSession

router = APIRouter(prefix="/auth", tags=["auth"])

log = logging.getLogger(__name__)


def _to_auth(user: User, tokens: TokenPair) -> AuthResponse:
    return AuthResponse(
        user=UserOut.model_validate(user, from_attributes=True),
        tokens=TokenPairOut(
            access_token=tokens.access_token,
            refresh_token=tokens.refresh_token,
            access_expires_at=tokens.access_expires_at,
            refresh_expires_at=tokens.refresh_expires_at,
        ),
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: DbSession) -> AuthResponse:
    try:
        user, tokens = IdentityService(db).register(
            email=str(body.email),
            password=body.password,
            display_name=body.display_name,
        )
    except EmailAlreadyRegistered:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        ) from None
    return _to_auth(user, tokens)


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, db: DbSession) -> AuthResponse:
    try:
        user, tokens = IdentityService(db).login(
            email=str(body.email), password=body.password
        )
    except InvalidCredentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        ) from None
    return _to_auth(user, tokens)


@router.post("/refresh", response_model=TokenPairOut)
def refresh(body: RefreshRequest, db: DbSession) -> TokenPairOut:
    try:
        payload = decode(body.refresh_token, expected_type="refresh")
    except jwt.InvalidTokenError as e:
        log.info("auth.refresh.invalid_token", extra={"error": str(e)})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        ) from None
    user_id = payload.get("sub")
    if not isinstance(user_id, str):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed token")
    try:
        tokens = IdentityService(db).refresh(user_id)
    except InvalidCredentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        ) from None
    return TokenPairOut(
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        access_expires_at=tokens.access_expires_at,
        refresh_expires_at=tokens.refresh_expires_at,
    )


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser) -> UserOut:
    return UserOut.model_validate(user, from_attributes=True)
