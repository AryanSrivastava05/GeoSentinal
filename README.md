# GeoSentinel DECIDE + RELOCATE

GeoSentinel is a local prototype decision-support dashboard that starts after an
external XGBoost model produces village-level risk scores. It identifies
`CRITICAL` villages, filters relocation sites using hard safety rules, ranks the
safe sites, calculates prototype capacity, and allocates affected people without
exceeding capacity.

> **FIXED PROTOTYPE GIS HANDOVER — NOT VALIDATED FOR OPERATIONAL EVACUATION.**
>
> Prototype decision-support system. Risk thresholds, suitability weights,
> capacity assumptions, and demo data require validation before operational use.
> Outputs are advisory and are not official evacuation orders.

## ML input contract

Put the model output at `data/processed/predictions.csv`:

```csv
village_id,village_name,risk_score
V001,Village A,0.83
```

`data/processed/predictions.json` is also supported (a JSON list, or an object
with a `predictions` list). The adapter only requires `village_id`,
`village_name`, and `risk_score` in the inclusive range 0–1. The XGBoost model
is not trained or modified by this project. The checked-in CSV is synthetic
demo input and can be replaced with the teammate's output.

## Run locally

From `C:\Users\acer\Desktop\GeoSentinel`:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python scripts\generate_demo_data.py
uvicorn backend.main:app --reload
```

Open `http://127.0.0.1:8000/docs` for the API or open
`frontend/index.html` through the Vite dev server:

```powershell
cd frontend
npm install
npm run dev
```

The active village and candidate-site layers are in `data/real/`, extracted
from `GeoSentinel_GIS_Handover_PROTOTYPE_FIXED.zip`. The active model output is
`data/processed/predictions.csv`, copied from `predictions_fixed.csv`.

The frontend expects the API at `http://127.0.0.1:8000` locally; set
`VITE_API_URL` to change it. The main demo uses only local API and demo files;
Leaflet assets are installed from npm.

## Deploy to Render

1. Push this project to a GitHub repository, including `render.yaml` and the
   required files under `data/`.
2. In Render, choose **New + → Blueprint**, connect the repository, and apply
   the blueprint. It creates the FastAPI service and the static frontend.
3. Wait for both services to finish deploying. Open the frontend's `onrender.com`
   URL; its build-time `VITE_API_URL` is linked to the API service automatically.

The API's health check is `/`. Its predictions and GIS layers are loaded from
the repository's `data/` files, so replacing those files requires a redeploy.
The default Render filesystem is ephemeral; this prototype does not persist
runtime changes such as prediction overrides across restarts.

For the exact live-data setup, test commands, provider onboarding, and
production model boundary, see [LIVE_DATA_SETUP.md](LIVE_DATA_SETUP.md).

You can select a village either by typing its name in the Village Lookup search
box or by clicking its marker on the map. The map popup shows the village name,
risk score, status, and population. Selecting it also loads village-specific
relocation recommendations in the Selected Village panel.

## API

* `GET /villages` — village geometry, population, risk score, and status.
* `GET /affected-population` — critical villages and affected total.
* `GET /villages/{village_id}/relocation` — one village's prediction and top
  safe relocation recommendations ordered by suitability and village distance.
* `GET /safe-locations` — all sites, accepted/rejected sites, reasons, scores.
* `POST /relocation-plan` — top three sites, capacity, village/site allocation,
  and explicit unallocated population.
* `GET /map-geojson` — villages, sites, zones, roads, and evacuation lines.
* `GET /weather/{village_id}` — live rainfall and soil-moisture situational data
  from Open-Meteo, cached for 10 minutes.
* `GET /live-status` — data provenance and readiness status. Live weather is
  intentionally not fed into the XGBoost predictions until the model is
  retrained and its feature contract is validated.
* `POST /predictions` — optional in-process JSON prediction override for a demo.

## Live-data boundary

The dashboard now fetches live weather for the first critical village and
refreshes it every 10 minutes. The response includes the provider, observation
time, fetch time, and a `LIVE` status. This is situational awareness only:
`data/processed/predictions.csv` remains the prediction source. To produce
real-time landslide predictions, collect the exact features used to train
`xgb_pipeline.pkl`, validate units and missing-value handling, then run the
model in a scheduled worker and persist versioned predictions. Do not replace
the prediction file with weather values alone.

## Configuration and assumptions

Edit `config/settings.json` or use `GEOSENTINEL_*` environment variables for
the critical threshold, slope, minimum area, and area-per-person assumption.
The default critical rule is strictly `risk_score > 0.70`; exactly `0.70` is
`NORMAL`. Site capacity is `floor(usable_area_m2 / area_per_person_m2)`.
Suitability weights are prototype assumptions stored in configuration. Distance
is WGS84 straight-line geodesic distance, not road travel distance.

## Tests

```powershell
python -m pytest -q
```

The tests cover threshold classification, hard-filter reasons, scoring/ranking,
capacity, allocation safety, unallocated population, API responses, and GeoJSON
layer generation.

## Folders

* `gis/` — filtering, suitability, distance, capacity, allocation, GeoJSON.
* `integration/ml_input.py` — the external-model adapter.
* `backend/` — FastAPI application and pipeline.
* `data/real/` — fixed prototype village, candidate-site, road, and study-area layers.
* `data/demo/` — original synthetic demo layers retained for reference.

## Soil-code note

`soil_code_LEGEND_TODO.txt` is included with the handover. The mapping for the
observed values `0` and `4` is not documented, so GeoSentinel treats
`soil_code` as an opaque model feature. Do not describe those values as named
soil types until the source mapping is confirmed. Any team-defined mapping must
be labelled as an assumption, not an official classification.
* `frontend/` — local React/Leaflet dashboard.
