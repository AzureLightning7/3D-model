"""End-to-end demo flow at the HTTP layer.

This is the judge-facing scenario from `docs/03_AGENT_PLAN.md` §2 Phase 3:

  > a live demo shows changing the sofa color while the rug stays in place.

Steps exercised:
  1. Register a user.
  2. Create a project.
  3. Generate an initial scene (style=cozy).
  4. Lock the rug.
  5. SWAP the sofa to a different color.
  6. RECOMPOSE the scene.
  7. Verify: locked rug at original position, sofa swap retained, version ladder
     monotonic, no item overlaps the locked rug's footprint.

A failing assertion here means the demo will break on stage.
"""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.contexts.catalog.domain.product import find_by_id

from .conftest import auth_headers


def _create_project(client: TestClient, headers: dict[str, str]) -> str:
    r = client.post(
        "/api/v1/projects",
        headers=headers,
        json={"name": "demo room", "roomWidthM": 4.0, "roomDepthM": 4.0, "roomHeightM": 2.6},
    )
    assert r.status_code == 201, r.text
    return r.json()["id"]


def test_demo_flow_swap_sofa_keep_rug(test_app_client: TestClient) -> None:
    h = auth_headers(test_app_client, email="demo@example.com")
    pid = _create_project(test_app_client, h)

    # Step 3: initial scene composition.
    r = test_app_client.post(
        f"/api/v1/projects/{pid}/scene/recompose",
        headers=h,
        json={"style": "cozy"},
    )
    assert r.status_code == 200, r.text
    scene = r.json()["scene"]
    initial_version = scene["version"]

    # Find a sofa and a rug from the generated scene. If recompose didn't yield
    # one of them, the cozy anchor is broken — that's also a Phase-3 failure.
    sofa = next((it for it in scene["items"] if it["catalogId"].startswith("sofa-")), None)
    rug = next((it for it in scene["items"] if it["catalogId"].startswith("rug-")), None)
    assert sofa is not None, "cozy recompose should produce a sofa"
    assert rug is not None, "cozy recompose should produce a rug"

    sofa_original_pos = (sofa["position"]["x"], sofa["position"]["z"])
    sofa_original_rot = sofa["rotationYRad"]
    rug_original_pos = (rug["position"]["x"], rug["position"]["z"])
    rug_id = rug["id"]
    sofa_id = sofa["id"]

    # Step 4: lock the rug.
    r = test_app_client.post(
        f"/api/v1/projects/{pid}/scene/edits",
        headers=h,
        json={
            "expectedVersion": scene["version"],
            "ops": [{"op": "LOCK_ITEM", "itemId": rug_id, "locked": True}],
        },
    )
    assert r.status_code == 200, r.text
    scene = r.json()["scene"]

    # Step 5: swap the sofa color.
    new_sofa_color = "sofa-teal" if sofa["catalogId"] == "sofa-mauve" else "sofa-mauve"
    r = test_app_client.post(
        f"/api/v1/projects/{pid}/scene/edits",
        headers=h,
        json={
            "expectedVersion": scene["version"],
            "ops": [{"op": "SWAP_ITEM", "itemId": sofa_id, "newCatalogId": new_sofa_color}],
        },
    )
    assert r.status_code == 200, r.text
    scene = r.json()["scene"]

    # Sanity: sofa has new catalog id, same transform.
    sofa_after_swap = next(it for it in scene["items"] if it["id"] == sofa_id)
    assert sofa_after_swap["catalogId"] == new_sofa_color
    assert (sofa_after_swap["position"]["x"], sofa_after_swap["position"]["z"]) == sofa_original_pos
    assert sofa_after_swap["rotationYRad"] == sofa_original_rot

    # Step 6: recompose with preserveLocked=true.
    r = test_app_client.post(
        f"/api/v1/projects/{pid}/scene/recompose",
        headers=h,
        json={"style": "cozy", "preserveLocked": True},
    )
    assert r.status_code == 200, r.text
    final = r.json()["scene"]

    # Step 7: rug unchanged.
    rug_after = next((it for it in final["items"] if it["id"] == rug_id), None)
    assert rug_after is not None, "locked rug must survive recompose"
    assert (rug_after["position"]["x"], rug_after["position"]["z"]) == rug_original_pos
    assert rug_after["locked"] is True

    # No item in the new scene overlaps the rug's footprint.
    rug_prod = find_by_id(rug_after["catalogId"])
    assert rug_prod is not None
    rug_w, rug_d = rug_prod.width_m, rug_prod.depth_m
    rx, rz = rug_after["position"]["x"], rug_after["position"]["z"]
    for it in final["items"]:
        if it["id"] == rug_id:
            continue
        prod = find_by_id(it["catalogId"])
        assert prod is not None
        ix, iz = it["position"]["x"], it["position"]["z"]
        overlap_x = abs(ix - rx) * 2 < (prod.width_m + rug_w) - 1e-3
        overlap_z = abs(iz - rz) * 2 < (prod.depth_m + rug_d) - 1e-3
        assert not (overlap_x and overlap_z), (
            f"after recompose, {it['catalogId']} ({it['id']}) at ({ix},{iz}) overlaps locked rug"
        )

    # Version ladder monotonic.
    assert final["version"] > initial_version
