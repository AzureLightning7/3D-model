from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import TypeAdapter, ValidationError
from sqlalchemy.orm import Session

from app.contexts.projects.domain.project import Project
from app.contexts.projects.infrastructure.repository import ProjectRepository
from app.contexts.projects.interfaces.dto import (
    EditsRequest,
    ProjectCreate,
    ProjectList,
    ProjectOut,
    RecomposeRequest,
    RecomposeResponse,
    SceneUpdate,
)
from app.contexts.scene.application.composer import compose
from app.contexts.scene.application.edit_reducer import (
    SceneOpError,
    apply_all,
)
from app.contexts.scene.domain.scene_graph import EditOp, Room, Scene, SceneItem
from app.contexts.style_profile.infrastructure.repository import StyleProfileRepository
from app.core.deps import CurrentUser, DbSession

router = APIRouter(prefix="/projects", tags=["projects"])

_edit_op_adapter: TypeAdapter[EditOp] = TypeAdapter(EditOp)


def _default_scene(width: float, depth: float, height: float) -> dict[str, Any]:
    scene = Scene(
        room=Room(width_m=width, depth_m=depth, height_m=height),
        items=[],
    )
    return scene.model_dump(by_alias=True, mode="json")


@router.get("", response_model=ProjectList)
def list_projects(user: CurrentUser, db: DbSession) -> ProjectList:
    items = ProjectRepository(db).list_for_owner(user.id)
    return ProjectList(
        items=[ProjectOut.model_validate(p, from_attributes=True) for p in items]
    )


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(body: ProjectCreate, user: CurrentUser, db: DbSession) -> ProjectOut:
    project = ProjectRepository(db).create(
        owner_id=user.id,
        name=body.name,
        room_width_m=body.room_width_m,
        room_depth_m=body.room_depth_m,
        room_height_m=body.room_height_m,
        scene=_default_scene(body.room_width_m, body.room_depth_m, body.room_height_m),
    )
    return ProjectOut.model_validate(project, from_attributes=True)


def _load_owned(project_id: str, user_id: str, db: Session) -> Project:
    p = ProjectRepository(db).get(project_id)
    if p is None:
        raise HTTPException(status_code=404, detail="Project not found")
    if p.owner_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return p


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: str, user: CurrentUser, db: DbSession) -> ProjectOut:
    p = _load_owned(project_id, user.id, db)
    return ProjectOut.model_validate(p, from_attributes=True)


@router.put("/{project_id}/scene", response_model=ProjectOut)
def update_scene(
    project_id: str, body: SceneUpdate, user: CurrentUser, db: DbSession
) -> ProjectOut:
    _load_owned(project_id, user.id, db)
    p = ProjectRepository(db).update_scene(
        project_id, body.scene.model_dump(by_alias=True, mode="json")
    )
    assert p is not None
    return ProjectOut.model_validate(p, from_attributes=True)


@router.post("/{project_id}/scene/edits", response_model=ProjectOut)
def apply_edits(
    project_id: str, body: EditsRequest, user: CurrentUser, db: DbSession
) -> ProjectOut:
    p = _load_owned(project_id, user.id, db)
    scene = Scene.model_validate(p.scene)

    if body.expected_version != scene.version:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "SCENE_VERSION_CONFLICT",
                "expected": body.expected_version,
                "actual": scene.version,
            },
        )

    try:
        ops = [_edit_op_adapter.validate_python(o) for o in body.ops]
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors()) from None

    try:
        new_scene = apply_all(scene, ops)
    except SceneOpError as e:
        raise HTTPException(
            status_code=400,
            detail={"code": type(e).__name__, "message": str(e)},
        ) from None

    updated = ProjectRepository(db).update_scene(
        project_id, new_scene.model_dump(by_alias=True, mode="json")
    )
    assert updated is not None
    return ProjectOut.model_validate(updated, from_attributes=True)


@router.post("/{project_id}/scene/recompose", response_model=RecomposeResponse)
def recompose_scene(
    project_id: str, body: RecomposeRequest, user: CurrentUser, db: DbSession
) -> RecomposeResponse:
    p = _load_owned(project_id, user.id, db)
    current = Scene.model_validate(p.scene)
    room = Room(
        width_m=p.room_width_m, depth_m=p.room_depth_m, height_m=p.room_height_m
    )
    profile_embedding: list[float] | None = None
    if body.profile_id:
        profile = StyleProfileRepository(db).get(body.profile_id)
        if profile is None:
            raise HTTPException(status_code=404, detail="Profile not found")
        if profile.owner_id != user.id:
            raise HTTPException(status_code=403, detail="Forbidden")
        profile_embedding = profile.embedding

    locked: list[SceneItem] = (
        [it for it in current.items if it.locked] if body.preserve_locked else []
    )
    proposed = compose(
        db=db,
        room=room,
        style=body.style,
        profile_embedding=profile_embedding,
        locked_items=locked,
    )

    # Preserve version progression — the scene is a *new* layout, not v1.
    bumped = proposed.scene.model_copy(update={"version": current.version + 1})
    updated = ProjectRepository(db).update_scene(
        project_id, bumped.model_dump(by_alias=True, mode="json")
    )
    assert updated is not None
    return RecomposeResponse(
        project=ProjectOut.model_validate(updated, from_attributes=True),
        warnings=proposed.warnings,
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str, user: CurrentUser, db: DbSession) -> None:
    _load_owned(project_id, user.id, db)
    ProjectRepository(db).delete(project_id)
