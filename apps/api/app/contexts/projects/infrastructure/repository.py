from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.contexts.projects.domain.project import Project
from app.contexts.projects.infrastructure.models import ProjectModel


def _to_domain(m: ProjectModel) -> Project:
    return Project(
        id=m.id,
        owner_id=m.owner_id,
        name=m.name,
        room_width_m=m.room_width_m,
        room_depth_m=m.room_depth_m,
        room_height_m=m.room_height_m,
        scene=m.scene,
        created_at=m.created_at,
        updated_at=m.updated_at,
    )


class ProjectRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_owner(self, owner_id: str) -> list[Project]:
        stmt = (
            select(ProjectModel)
            .where(ProjectModel.owner_id == owner_id)
            .order_by(ProjectModel.created_at.desc())
        )
        return [_to_domain(m) for m in self.db.execute(stmt).scalars()]

    def get(self, project_id: str) -> Project | None:
        m = self.db.get(ProjectModel, project_id)
        return _to_domain(m) if m else None

    def create(
        self,
        *,
        owner_id: str,
        name: str,
        room_width_m: float,
        room_depth_m: float,
        room_height_m: float,
        scene: dict[str, Any],
    ) -> Project:
        m = ProjectModel(
            owner_id=owner_id,
            name=name,
            room_width_m=room_width_m,
            room_depth_m=room_depth_m,
            room_height_m=room_height_m,
            scene=scene,
        )
        self.db.add(m)
        self.db.commit()
        self.db.refresh(m)
        return _to_domain(m)

    def update_scene(self, project_id: str, scene: dict[str, Any]) -> Project | None:
        m = self.db.get(ProjectModel, project_id)
        if m is None:
            return None
        m.scene = scene
        self.db.commit()
        self.db.refresh(m)
        return _to_domain(m)

    def delete(self, project_id: str) -> bool:
        m = self.db.get(ProjectModel, project_id)
        if m is None:
            return False
        self.db.delete(m)
        self.db.commit()
        return True
