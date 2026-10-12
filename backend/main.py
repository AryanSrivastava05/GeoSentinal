"""GeoSentinel DECIDE + RELOCATE API. Does not train XGBoost."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.schemas import PredictionIn
from backend.services.pipeline import pipeline
from backend.services.weather import WeatherProviderError, get_weather
from integration.ml_input import MLInputError

DISCLAIMER = (
    "Prototype decision-support system. Risk thresholds, suitability weights, "
    "capacity assumptions, and demo data require validation before operational use."
)

app = FastAPI(
    title="GeoSentinel DECIDE + RELOCATE",
    description=(
        "Decision-support API for identifying CRITICAL villages after an external "
        "XGBoost risk score is supplied, filtering unsafe relocation sites, ranking "
        "the top 3, and allocating affected population.\n\n"
        f"{DISCLAIMER}"
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "name": "GeoSentinel",
        "modules": ["DECIDE", "RELOCATE"],
        "docs": "/docs",
        "disclaimer": DISCLAIMER,
        "ml_input": "data/processed/predictions.csv",
    }


@app.get("/villages")
def get_villages():
    try:
        return {
            "villages": pipeline.villages(),
            "disclaimer": DISCLAIMER,
            "data_note": "FIXED PROTOTYPE GIS HANDOVER — NOT VALIDATED FOR OPERATIONAL EVACUATION.",
        }
    except MLInputError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/affected-population")
def get_affected_population():
    try:
        return pipeline.affected_population()
    except MLInputError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/villages/{village_id}/relocation")
def get_village_relocation(village_id: str):
    try:
        result = pipeline.village_recommendation(village_id)
        if result is None:
            raise HTTPException(status_code=404, detail=f"Village not found: {village_id}")
        return result
    except MLInputError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/weather/{village_id}")
def get_village_weather(village_id: str):
    village = next(
        (
            item
            for item in pipeline.villages()
            if str(item["village_id"]).lower() == village_id.strip().lower()
        ),
        None,
    )
    if village is None:
        raise HTTPException(status_code=404, detail=f"Village not found: {village_id}")
    if village["latitude"] is None or village["longitude"] is None:
        raise HTTPException(status_code=422, detail="Village has no coordinates")
    try:
        return {"village_id": village["village_id"], "village_name": village["village_name"], **get_weather(village["latitude"], village["longitude"])}
    except WeatherProviderError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.get("/live-status")
def get_live_status():
    villages = pipeline.villages()
    return {
        "status": "READY",
        "prediction_source": "data/processed/predictions.csv",
        "prediction_count": len(villages),
        "prediction_data_status": "STATIC_MODEL_OUTPUT",
        "weather_provider": "Open-Meteo",
        "weather_endpoint": "/weather/{village_id}",
        "disclaimer": "Live weather is situational awareness only; it is not yet used to retrain or overwrite model predictions.",
    }


@app.get("/safe-locations")
def get_safe_locations():
    try:
        return pipeline.safe_locations()
    except MLInputError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/relocation-plan")
def post_relocation_plan():
    try:
        return pipeline.relocation_plan()
    except MLInputError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/map-geojson")
def get_map_geojson():
    try:
        return pipeline.map_geojson()
    except MLInputError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/predictions")
def post_predictions(items: list[PredictionIn]):
    """Optional: ingest teammate JSON predictions for this process (does not overwrite CSV)."""
    records = [i.model_dump() for i in items]
    pipeline.set_predictions(records)
    return {"loaded": len(records), "source": "request_body"}
