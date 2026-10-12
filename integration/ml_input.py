"""Adapter: convert teammate XGBoost output into DECIDE/RELOCATE village records.

Contract (only required fields from the ML module):
    village_id, village_name, risk_score  (risk_score in [0, 1])

Place files here (either format):
    data/processed/predictions.csv
    data/processed/predictions.json

CSV header:
    village_id,village_name,risk_score

This module never trains, retrains, or mutates XGBoost internals.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CSV = ROOT / "data" / "processed" / "predictions.csv"
DEFAULT_JSON = ROOT / "data" / "processed" / "predictions.json"

REQUIRED = ("village_id", "village_name", "risk_score")


class MLInputError(ValueError):
    """Raised when prediction files are missing or malformed."""


def _validate_frame(df: pd.DataFrame) -> pd.DataFrame:
    missing = [c for c in REQUIRED if c not in df.columns]
    if missing:
        raise MLInputError(f"Prediction input missing columns: {missing}. Required: {list(REQUIRED)}")
    out = df[list(REQUIRED)].copy()
    out["village_id"] = out["village_id"].astype(str)
    out["village_name"] = out["village_name"].astype(str)
    out["risk_score"] = pd.to_numeric(out["risk_score"], errors="coerce")
    if out["risk_score"].isna().any():
        raise MLInputError("One or more risk_score values are not numeric.")
    if ((out["risk_score"] < 0) | (out["risk_score"] > 1)).any():
        raise MLInputError("risk_score must be between 0 and 1 inclusive.")
    return out.reset_index(drop=True)


def load_predictions_csv(path: Path | str) -> pd.DataFrame:
    path = Path(path)
    if not path.exists():
        raise MLInputError(f"Predictions CSV not found: {path}")
    df = pd.read_csv(path)
    return _validate_frame(df)


def load_predictions_json(source: Path | str | list[dict[str, Any]]) -> pd.DataFrame:
    if isinstance(source, list):
        df = pd.DataFrame(source)
        return _validate_frame(df)
    path = Path(source)
    if not path.exists():
        raise MLInputError(f"Predictions JSON not found: {path}")
    with path.open(encoding="utf-8") as f:
        payload = json.load(f)
    if isinstance(payload, dict) and "predictions" in payload:
        payload = payload["predictions"]
    if not isinstance(payload, list):
        raise MLInputError("JSON predictions must be a list of objects.")
    return _validate_frame(pd.DataFrame(payload))


def load_predictions(
    csv_path: Path | str | None = None,
    json_path: Path | str | None = None,
    records: list[dict[str, Any]] | None = None,
) -> pd.DataFrame:
    """Load predictions from in-memory records, then JSON, then CSV (default path)."""
    if records is not None:
        return load_predictions_json(records)
    json_file = Path(json_path) if json_path else DEFAULT_JSON
    csv_file = Path(csv_path) if csv_path else DEFAULT_CSV
    if json_path or json_file.exists():
        if json_file.exists():
            return load_predictions_json(json_file)
    return load_predictions_csv(csv_file)


def classify_status(risk_score: float, threshold: float) -> str:
    """CRITICAL only when risk_score is strictly greater than the prototype threshold."""
    return "CRITICAL" if float(risk_score) > float(threshold) else "NORMAL"
