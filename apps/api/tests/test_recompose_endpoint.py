"""Integration tests for POST /projects/{id}/scene/recompose.

Phase 3 lock-preservation must hold at the HTTP boundary, not just inside
`compose()`. We exercise ownership, version bump, and locked-item preservation
via the FastAPI test client.
"""

from __future__ import annotations

from fastapi.testclient import TestClient

from .conftest import auth_headers


def _create_project(client: TestClient, headers: dict[str, str]) -> str:
    r = client.post(
        "/api/v1/projects",
        headers=headers,
        json={"name": "demo", "roomWidthM": 4.0, "roomDepthM": 4.0, "roomHeightM": 2.6},
    )
    assert r.status_code == 201, r.text
    return r.json()["id"]


def _seed_scene_with_locked_rug(client: TestClient, headers: dict[str, str], project_id: str) -> dict:
    """Add a rug, then lock it. Returns the resulting scene dict."""
    add_op = {
        "op": "ADD_ITEM",
        "item": {
            "id": "rug-1",
            "catalogId": "rug-round",
            "name": "Round Rug",
            "position": {"x": -0.5, "y": 0.0, "z": 0.5},
            "rotationYRad": 0.0,
            "scale": 1.0,
            "locked": False,
        },
    }
    r = client.post(
        f"/api/v1/projects/{project_id}/scene/edits",
        headers=headers,
        json={"expectedVersion": 1, "ops": [add_op]},
    )
    assert r.status_code == 200, r.text
    scene = r.json()["scene"]
    lock_op = {"op": "LOCK_ITEM", "itemId": "rug-1", "locked": True}
    r = client.post(
        f"/api/v1/projects/{project_id}/scene/edits",
        headers=headers,
        json={"expectedVersion": scene["version"], "ops": [lock_op]},
    )
    assert r.status_code == 200, r.text
    return r.json()["scene"]


def test_recompose_preserves_locked_item_position(test_app_client: TestClient) -> None:
    h = auth_headers(test_app_client)
    pid = _create_project(test_app_client, h)
    seeded = _seed_scene_with_locked_rug(test_app_client, h, pid)
    assert any(it["id"] == "rug-1" and it["locked"] for it in seeded["items"])
    prior_version = seeded["version"]

    r = test_app_client.post(
        f"/api/v1/projects/{pid}/scene/recompose",
        headers=h,
        json={"style": "cozy", "preserveLocked": True},
    )
    assert r.status_code == 200, r.text
    scene = r.json()["project"]["scene"]

    rug = next((it for it in scene["items"] if it["id"] == "rug-1"), None)
    assert rug is not None, "locked rug must survive recompose with its original id"
    assert rug["locked"] is True
    assert rug["position"]["x"] == -0.5
    assert rug["position"]["z"] == 0.5
    assert rug["catalogId"] == "rug-round"
    assert scene["version"] == prior_version + 1


def test_recompose_can_opt_out_of_preserve(test_app_client: TestClient) -> None:
    h = auth_headers(test_app_client)
    pid = _create_project(test_app_client, h)
    _seed_scene_with_locked_rug(test_app_client, h, pid)

    r = test_app_client.post(
        f"/api/v1/projects/{pid}/scene/recompose",
        headers=h,
        json={"style": "cozy", "preserveLocked": False},
    )
    assert r.status_code == 200
    scene = r.json()["project"]["scene"]
    assert not any(it["id"] == "rug-1" for it in scene["items"]), (
        "with preserveLocked=false the locked item's id should be replaced"
    )


def test_recompose_rejects_other_users(test_app_client: TestClient) -> None:
    owner = auth_headers(test_app_client, email="owner@example.com")
    pid = _create_project(test_app_client, owner)
    intruder = auth_headers(test_app_client, email="intruder@example.com")
    r = test_app_client.post(
        f"/api/v1/projects/{pid}/scene/recompose",
        headers=intruder,
        json={"style": "cozy"},
    )
    assert r.status_code == 403


def test_recompose_404_for_unknown_profile(test_app_client: TestClient) -> None:
    h = auth_headers(test_app_client)
    pid = _create_project(test_app_client, h)
    r = test_app_client.post(
        f"/api/v1/projects/{pid}/scene/recompose",
        headers=h,
        json={"profileId": "nope-does-not-exist"},
    )
    assert r.status_code == 404


def test_recompose_new_items_do_not_overlap_locked(test_app_client: TestClient) -> None:
    """The solver must route new items around the reserved area of locked ones."""
    h = auth_headers(test_app_client)
    pid = _create_project(test_app_client, h)
    _seed_scene_with_locked_rug(test_app_client, h, pid)

    r = test_app_client.post(
        f"/api/v1/projects/{pid}/scene/recompose",
        headers=h,
        json={"style": "cozy", "preserveLocked": True},
    )
    assert r.status_code == 200
    scene = r.json()["project"]["scene"]

    # Look up footprints (rug is 1.5x1.5, centered at -0.5,0.5).
    rug_w, rug_d = 1.5, 1.5
    rug_x, rug_z = -0.5, 0.5

    for it in scene["items"]:
        if it["id"] == "rug-1":
            continue
        # AABB overlap test using catalog dims (web's not aware of rotation here;
        # solver's spec is that the rug area is reserved verbatim).
        cat = it["catalogId"]
        # Map catalog id to footprint via the in-process CATALOG tuple.
        from app.contexts.catalog.domain.product import find_by_id
        prod = find_by_id(cat)
        assert prod is not None
        ix, iz = it["position"]["x"], it["position"]["z"]
        # Conservative: shrink rug box a hair to absorb solver's 1e-6 epsilon.
        overlap_x = abs(ix - rug_x) * 2 < (prod.width_m + rug_w) - 1e-3
        overlap_z = abs(iz - rug_z) * 2 < (prod.depth_m + rug_d) - 1e-3
        assert not (overlap_x and overlap_z), (
            f"item {it['id']} ({cat}) at ({ix},{iz}) overlaps locked rug"
        )


def test_recompose_warns_when_room_too_small(test_app_client: TestClient) -> None:
    """D7: items the solver can't fit are surfaced as warnings, not dropped silently."""
    h = auth_headers(test_app_client)
    r = test_app_client.post(
        "/api/v1/projects",
        headers=h,
        json={"name": "tiny", "roomWidthM": 1.0, "roomDepthM": 1.0, "roomHeightM": 2.4},
    )
    assert r.status_code == 201, r.text
    pid = r.json()["id"]

    r = test_app_client.post(
        f"/api/v1/projects/{pid}/scene/recompose", headers=h, json={"style": "cozy"}
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert isinstance(body["warnings"], list)
    assert any("too small" in w for w in body["warnings"]), body["warnings"]
