"""Load prototype configuration from settings.json with optional environment overrides.

Prototype assumption: none of these values are operationally validated.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SETTINGS_PATH = ROOT / "config" / "settings.json"

_ENV_MAP = {
    "critical_risk_threshold": "GEOSENTINEL_CRITICAL_RISK_THRESHOLD",
    "max_site_slope_deg": "GEOSENTINEL_MAX_SITE_SLOPE_DEG",
    "min_usable_area_m2": "GEOSENTINEL_MIN_USABLE_AREA_M2",
    "area_per_person_m2": "GEOSENTINEL_AREA_PER_PERSON_M2",
}


def load_settings(path: Path | None = None) -> dict[str, Any]:
    settings_path = path or SETTINGS_PATH
    with settings_path.open(encoding="utf-8") as f:
        data = json.load(f)

    for key, env_name in _ENV_MAP.items():
        raw = os.environ.get(env_name)
        if raw is None or raw == "":
            continue
        current = data[key]
        if isinstance(current, int) and not isinstance(current, bool):
            data[key] = int(float(raw))
        else:
            data[key] = float(raw)
    return data
