"""Integration tests for the style-profile context.

Doubles as the verification for ERROR_LOG A2: `style_profiles.embedding` uses
`pgvector.sqlalchemy.Vector`, and these tests prove the full
survey -> create -> read cycle works against the default SQLite dev DB (pgvector's
SQLAlchemy type stores as a string and reads back as a numpy array, which
serializes cleanly through Pydantic).
"""

from __future__ import annotations

import math

from fastapi.testclient import TestClient

from .conftest import auth_headers


def test_get_survey_is_public(test_app_client: TestClient) -> None:
    r = test_app_client.get("/api/v1/style-profiles/survey")
    assert r.status_code == 200, r.text
    questions = r.json()["questions"]
    assert len(questions) >= 1
    assert all(q["id"] and q["options"] for q in questions)


def test_create_and_fetch_profile_on_sqlite(test_app_client: TestClient) -> None:
    h = auth_headers(test_app_client)

    # Pull the survey and answer the first option of each question.
    survey = test_app_client.get("/api/v1/style-profiles/survey").json()
    answers = [
        {"questionId": q["id"], "optionId": q["options"][0]["id"]}
        for q in survey["questions"]
    ]

    r = test_app_client.post("/api/v1/style-profiles", headers=h, json={"answers": answers})
    assert r.status_code == 201, r.text
    profile = r.json()
    profile_id = profile["id"]

    # Embedding round-trips through the Vector column as a 16-dim unit vector.
    emb = profile["embedding"]
    assert len(emb) == 16
    norm = math.sqrt(sum(x * x for x in emb))
    assert abs(norm - 1.0) < 1e-6, f"embedding should be unit-length, got {norm}"

    # GET by id and GET latest both return the same profile.
    r = test_app_client.get(f"/api/v1/style-profiles/{profile_id}", headers=h)
    assert r.status_code == 200, r.text
    assert r.json()["id"] == profile_id

    r = test_app_client.get("/api/v1/style-profiles/me/latest", headers=h)
    assert r.status_code == 200, r.text
    assert r.json()["id"] == profile_id


def test_profile_is_owner_scoped(test_app_client: TestClient) -> None:
    owner = auth_headers(test_app_client, email="owner@example.com")
    survey = test_app_client.get("/api/v1/style-profiles/survey").json()
    answers = [
        {"questionId": q["id"], "optionId": q["options"][0]["id"]}
        for q in survey["questions"]
    ]
    pid = test_app_client.post(
        "/api/v1/style-profiles", headers=owner, json={"answers": answers}
    ).json()["id"]

    intruder = auth_headers(test_app_client, email="intruder@example.com")
    r = test_app_client.get(f"/api/v1/style-profiles/{pid}", headers=intruder)
    assert r.status_code == 403


def test_latest_profile_404_when_none(test_app_client: TestClient) -> None:
    h = auth_headers(test_app_client, email="noprofile@example.com")
    r = test_app_client.get("/api/v1/style-profiles/me/latest", headers=h)
    assert r.status_code == 404
