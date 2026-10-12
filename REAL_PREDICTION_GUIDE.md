# Using Real XGBoost Predictions with GeoSentinel

GeoSentinel does not train the XGBoost model. It consumes village-level risk
scores produced by the external ML module and uses them for risk classification,
safe-site filtering, ranking, and relocation planning.

## 1. Export the prediction file

Place the model output at:

```text
C:\Users\acer\Desktop\GeoSentinel\data\processed\predictions.csv
```

The file must contain exactly these required columns:

```csv
village_id,village_name,risk_score
V001,Nongstoin Bazar,0.83
V002,Mawthawkrah,0.42
V003,Mairang East,0.91
```

Requirements:

- `village_id` must match an ID in `data/demo/villages.geojson`.
- `village_name` should match the corresponding village.
- `risk_score` must be a numeric value from `0` to `1`.
- Use `0.83`, not `83`, for an 83% risk probability.
- Do not include missing or non-numeric risk scores.

The input adapter is implemented in
[`integration/ml_input.py`](integration/ml_input.py).

## 2. Export probabilities from XGBoost

The model should export the probability of the high-risk class:

```python
risk_scores = model.predict_proba(X)[:, 1]
```

Then create the GeoSentinel CSV:

```python
import pandas as pd

output = pd.DataFrame({
    "village_id": village_ids,
    "village_name": village_names,
    "risk_score": risk_scores,
})

output.to_csv(
    r"C:\Users\acer\Desktop\GeoSentinel\data\processed\predictions.csv",
    index=False,
)
```

If the model produces raw scores or logits instead of probabilities, convert
them to calibrated values between `0` and `1` before writing the CSV.

## 3. Match villages to GIS data

GeoSentinel gets village population and geometry from:

```text
C:\Users\acer\Desktop\GeoSentinel\data\demo\villages.geojson
```

Each predicted village must have a corresponding GIS feature with at least:

```json
{
  "type": "Feature",
  "properties": {
    "village_id": "V001",
    "village_name": "Nongstoin Bazar",
    "population": 620
  },
  "geometry": {
    "type": "Point",
    "coordinates": [91.262, 25.517]
  }
}
```

If a real prediction contains a new village that is not in the GeoJSON file,
add its real geometry and population before using the dashboard. Without those
fields GeoSentinel cannot calculate affected population, distance, or
relocation recommendations.

## 4. Understand the risk threshold

The threshold is configured in
[`config/settings.json`](config/settings.json):

```json
{
  "critical_risk_threshold": 0.70
}
```

The rule is strictly:

```text
risk_score > 0.70  => CRITICAL
risk_score <= 0.70 => NORMAL
```

Examples:

```text
0.70 => NORMAL
0.71 => CRITICAL
0.83 => CRITICAL
```

This is a prototype threshold and has not been operationally validated.

## 5. Start GeoSentinel

From the project directory:

```powershell
cd C:\Users\acer\Desktop\GeoSentinel
uvicorn backend.main:app --reload
```

In another terminal, start the dashboard:

```powershell
cd C:\Users\acer\Desktop\GeoSentinel\frontend
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

Search for a village. The dashboard will display its current risk score,
`CRITICAL` or `NORMAL` status, population, and the top safer relocation sites.

## 6. Verify the prediction input

Check all village results:

```powershell
Invoke-WebRequest `
  -UseBasicParsing `
  http://127.0.0.1:8000/villages
```

Check one village's prediction and relocation recommendations:

```powershell
Invoke-WebRequest `
  -UseBasicParsing `
  http://127.0.0.1:8000/villages/V001/relocation
```

Open the FastAPI documentation at:

```text
http://127.0.0.1:8000/docs
```

## 7. Optional temporary API input

For a temporary in-memory test, send predictions directly to
`POST /predictions`:

```powershell
$body = @(
  @{
    village_id = "V001"
    village_name = "Nongstoin Bazar"
    risk_score = 0.92
  },
  @{
    village_id = "V002"
    village_name = "Mawthawkrah"
    risk_score = 0.35
  }
) | ConvertTo-Json

Invoke-RestMethod `
  -Uri http://127.0.0.1:8000/predictions `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

This override only lasts while the backend process is running. For normal use,
replace `data/processed/predictions.csv`.

## Complete data flow

```text
Real rainfall / soil / terrain / satellite data
                    |
                    v
          External XGBoost model
                    |
                    v
       risk_score between 0 and 1
                    |
                    v
data/processed/predictions.csv
                    |
                    v
        GeoSentinel DECIDE + RELOCATE
                    |
                    v
Risk status, safe sites, capacity, allocation, and map
```

## Important limitation

The current GeoSentinel module consumes risk scores; it does not currently
accept raw rainfall, soil moisture, DEM, slope, land-cover, or satellite inputs.
The external ML module remains responsible for collecting those inputs and
producing validated risk probabilities.

Before operational use, validate the model, probability calibration, threshold,
village population data, site data, capacity assumptions, and recommendations
with historical landslide data and the appropriate disaster-management
authorities. These results are advisory and are not official evacuation orders.
