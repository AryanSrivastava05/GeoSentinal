# Getting live data

GeoSentinel already has a live weather integration using Open-Meteo. It does
not require an API key for the current development setup.

## Start the API

From the project root:

```powershell
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

## Test live data

Use a village ID from the real village dataset:

```powershell
curl.exe http://127.0.0.1:8000/weather/V0009
```

The response contains:

```json
{
  "village_id": "V0009",
  "provider": "Open-Meteo",
  "rainfall_24h": 7.8,
  "rainfall_7d": 36.0,
  "soil_moisture": 0.361,
  "observed_at": "2026-09-17T15:00",
  "fetched_at": "2026-09-17T15:10:00Z",
  "data_status": "LIVE"
}
```

The backend caches a village weather response for 10 minutes. The dashboard
also refreshes the weather panel every 10 minutes.

Check the overall data status:

```powershell
curl.exe http://127.0.0.1:8000/live-status
```

Open the interactive API documentation at:

```text
http://127.0.0.1:8000/docs
```

## Getting a production provider

For a prototype, Open-Meteo is enough. For an operational deployment,
register with an approved provider such as IMD, Tomorrow.io, Meteomatics, or
another provider accepted by the responsible disaster-management authority.

The normal process is:

1. Create an account or request institutional access.
2. Create an application/project.
3. Generate an API key.
4. Check rate limits, licensing, geographic coverage, and update frequency.
5. Store the key on the backend, never in React.
6. Add the provider's terms and outage behavior to the deployment runbook.

Store secrets in a local `.env` file or a deployment secret manager:

```env
WEATHER_PROVIDER=approved_provider
WEATHER_API_KEY=replace_me
```

Start from [.env.example](.env.example). Do not commit `.env`.

The provider request belongs in
[backend/services/weather.py](backend/services/weather.py), behind the same
`get_weather(latitude, longitude)` interface. Keep the response normalized to
the existing fields (`rainfall_24h`, `rainfall_7d`, `soil_moisture`,
`observed_at`, `fetched_at`, and `data_status`) so the frontend does not need
provider-specific code.

## Important prediction limitation

Live weather is currently displayed as situational awareness. The risk score
still comes from
[data/processed/predictions.csv](data/processed/predictions.csv).

To make risk scores live, first obtain the feature contract for
`xgb_pipeline.pkl`. Then collect every required feature with matching units,
time windows, preprocessing, and missing-value rules. Run the model in a
scheduled worker, persist a versioned prediction with its observation times,
and only then update the village risk scores.

Never replace the model score with rainfall alone. Until that validation is
complete, show the dashboard state as live weather plus static model output,
not as a live landslide prediction.
