"""Small live weather adapter for village-level situational awareness."""

from __future__ import annotations

import json
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

SOURCE = "Open-Meteo"
URL = "https://api.open-meteo.com/v1/forecast"
CACHE_SECONDS = 600
_cache: dict[str, tuple[float, dict]] = {}


class WeatherProviderError(RuntimeError):
    """Raised when the configured weather provider cannot be reached."""


def get_weather(latitude: float, longitude: float) -> dict:
    key = f"{latitude:.5f},{longitude:.5f}"
    cached = _cache.get(key)
    now = time.time()
    if cached and now - cached[0] < CACHE_SECONDS:
        return {**cached[1], "cached": True}

    query = urlencode(
        {
            "latitude": latitude,
            "longitude": longitude,
            "hourly": "precipitation,soil_moisture_0_to_7cm",
            "past_days": 7,
            "forecast_days": 1,
            "timezone": "Asia/Kolkata",
        }
    )
    request = Request(f"{URL}?{query}", headers={"User-Agent": "GeoSentinel/0.1"})
    try:
        with urlopen(request, timeout=20) as response:
            payload = json.load(response)
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise WeatherProviderError(f"{SOURCE} request failed: {exc}") from exc

    hourly = payload.get("hourly") or {}
    precipitation = [float(value or 0) for value in hourly.get("precipitation", [])]
    soil = [float(value) for value in hourly.get("soil_moisture_0_to_7cm", []) if value is not None]
    times = hourly.get("time") or []
    observed_at = times[-1] if times else None
    daily_totals: dict[str, float] = {}
    for timestamp, amount in zip(times, precipitation):
        day = str(timestamp)[:10]
        daily_totals[day] = daily_totals.get(day, 0.0) + amount
    daily_history = [
        {"day": day, "rainfall_mm": round(daily_totals[day], 2)}
        for day in sorted(daily_totals)[-6:]
    ]
    result = {
        "provider": SOURCE,
        "latitude": latitude,
        "longitude": longitude,
        "rainfall_24h": round(sum(precipitation[-24:]), 2),
        "rainfall_7d": round(sum(precipitation[-168:]), 2),
        "rainfall_6d_history": daily_history,
        "soil_moisture": round(soil[-1], 4) if soil else None,
        "observed_at": observed_at,
        "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now)),
        "data_status": "LIVE",
        "cached": False,
    }
    _cache[key] = (now, result)
    return result
