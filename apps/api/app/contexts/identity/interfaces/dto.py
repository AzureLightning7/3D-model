from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    email: EmailStr
    password: str = Field(min_length=8, max_length=200)
    display_name: str = Field(default="", max_length=120, alias="displayName")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    refresh_token: str = Field(alias="refreshToken")


class UserOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    email: str
    display_name: str = Field(serialization_alias="displayName")
    created_at: datetime = Field(serialization_alias="createdAt")


class TokenPairOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    access_token: str = Field(serialization_alias="accessToken")
    refresh_token: str = Field(serialization_alias="refreshToken")
    access_expires_at: datetime = Field(serialization_alias="accessExpiresAt")
    refresh_expires_at: datetime = Field(serialization_alias="refreshExpiresAt")


class AuthResponse(BaseModel):
    user: UserOut
    tokens: TokenPairOut
