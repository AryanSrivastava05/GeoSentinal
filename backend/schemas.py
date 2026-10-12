from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class PredictionIn(BaseModel):
    village_id: str
    village_name: str
    risk_score: float = Field(ge=0, le=1)


class VillageOut(BaseModel):
    village_id: str
    village_name: str
    risk_score: float
    status: str
    population: int
    latitude: float | None = None
    longitude: float | None = None
    geometry: dict[str, Any] | None = None
