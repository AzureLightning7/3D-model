from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from app.contexts.style_profile.application.survey import SURVEY, derive_embedding
from app.contexts.style_profile.domain.profile import StyleProfile
from app.contexts.style_profile.infrastructure.repository import StyleProfileRepository
from app.core.deps import CurrentUser, DbSession

router = APIRouter(prefix="/style-profiles", tags=["style-profiles"])


class SurveyAnswer(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    question_id: str = Field(alias="questionId")
    option_id: str = Field(alias="optionId")


class CreateProfileRequest(BaseModel):
    answers: list[SurveyAnswer] = Field(min_length=1)


class ProfileOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str
    owner_id: str = Field(serialization_alias="ownerId")
    embedding: list[float]
    source_answers: list[dict[str, Any]] = Field(serialization_alias="sourceAnswers")
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")


def _to_dto(p: StyleProfile) -> ProfileOut:
    return ProfileOut(
        id=p.id,
        owner_id=p.owner_id,
        embedding=p.embedding,
        source_answers=p.source_answers,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


class SurveyOption(BaseModel):
    id: str
    label: str
    subtitle: str


class SurveyQuestion(BaseModel):
    id: str
    title: str
    options: list[SurveyOption]


class SurveyOut(BaseModel):
    questions: list[SurveyQuestion]


@router.get("/survey", response_model=SurveyOut)
def get_survey() -> SurveyOut:
    """Return the question bank for the client to render."""
    return SurveyOut(
        questions=[
            SurveyQuestion(
                id=q["id"],
                title=q["title"],
                options=[
                    SurveyOption(id=o["id"], label=o["label"], subtitle=o["subtitle"])
                    for o in q["options"]
                ],
            )
            for q in SURVEY
        ]
    )


@router.post("", response_model=ProfileOut, status_code=status.HTTP_201_CREATED)
def create_profile(
    body: CreateProfileRequest, user: CurrentUser, db: DbSession
) -> ProfileOut:
    answers = [
        {"questionId": a.question_id, "optionId": a.option_id} for a in body.answers
    ]
    embedding = derive_embedding(answers)
    profile = StyleProfileRepository(db).create(
        owner_id=user.id, embedding=embedding, source_answers=answers
    )
    return _to_dto(profile)


@router.get("/me/latest", response_model=ProfileOut)
def latest_profile(user: CurrentUser, db: DbSession) -> ProfileOut:
    p = StyleProfileRepository(db).latest_for_owner(user.id)
    if p is None:
        raise HTTPException(status_code=404, detail="No profile yet")
    return _to_dto(p)


@router.get("/{profile_id}", response_model=ProfileOut)
def get_profile(profile_id: str, user: CurrentUser, db: DbSession) -> ProfileOut:
    p = StyleProfileRepository(db).get(profile_id)
    if p is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    if p.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return _to_dto(p)
