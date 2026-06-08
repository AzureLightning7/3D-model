"""Refresh-token rotation, reuse detection, and logout (ERROR_LOG B2 + C2)."""

from __future__ import annotations

from fastapi.testclient import TestClient


def _register(client: TestClient, email: str = "rot@example.com") -> dict:
    r = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "p4ssw0rd-secret!", "displayName": "Rot"},
    )
    assert r.status_code == 201, r.text
    return r.json()["tokens"]


def _refresh(client: TestClient, refresh_token: str):
    return client.post("/api/v1/auth/refresh", json={"refreshToken": refresh_token})


def test_refresh_rotates_tokens(test_app_client: TestClient) -> None:
    rt0 = _register(test_app_client)["refreshToken"]

    r = _refresh(test_app_client, rt0)
    assert r.status_code == 200, r.text
    rt1 = r.json()["refreshToken"]
    assert rt1 != rt0, "refresh must rotate the refresh token"

    # The freshly rotated token is itself usable and rotates again.
    r2 = _refresh(test_app_client, rt1)
    assert r2.status_code == 200, r2.text
    assert r2.json()["refreshToken"] != rt1
    # (Revocation of the rotated-away token is covered by the reuse test below.)


def test_refresh_reuse_revokes_entire_chain(test_app_client: TestClient) -> None:
    rt0 = _register(test_app_client)["refreshToken"]
    rt1 = _refresh(test_app_client, rt0).json()["refreshToken"]

    # Replay the already-rotated rt0 → reuse detected → all tokens revoked.
    assert _refresh(test_app_client, rt0).status_code == 401
    # Therefore even rt1 (the otherwise-valid successor) is now dead.
    assert _refresh(test_app_client, rt1).status_code == 401


def test_logout_revokes_refresh_token(test_app_client: TestClient) -> None:
    rt = _register(test_app_client)["refreshToken"]
    r = test_app_client.post("/api/v1/auth/logout", json={"refreshToken": rt})
    assert r.status_code == 204, r.text
    assert _refresh(test_app_client, rt).status_code == 401


def test_logout_is_idempotent_for_bad_token(test_app_client: TestClient) -> None:
    r = test_app_client.post("/api/v1/auth/logout", json={"refreshToken": "not-a-jwt"})
    assert r.status_code == 204


def test_refresh_rejects_invalid_token(test_app_client: TestClient) -> None:
    assert _refresh(test_app_client, "not-a-jwt").status_code == 401
