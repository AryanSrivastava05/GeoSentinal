# Production data plan

GeoSentinel currently has one live provider: Open-Meteo weather data. It is
used for situational awareness and is refreshed by the dashboard every ten
minutes. The landslide predictions still come from the checked-in prediction
file.

## Required before operational deployment

1. Obtain an approved rainfall/weather provider for the target district.
2. Confirm the exact feature contract used by `xgb_pipeline.pkl`.
3. Replace prototype village, road, and candidate-site layers with verified
   government or field-survey data.
4. Store observations and predictions in PostgreSQL/PostGIS instead of files.
5. Run collection and prediction workers outside the web request process.
6. Add authentication, audit logs, monitoring, backups, and provider failure
   handling.

## Recommended provider sequence

### Pilot

- Open-Meteo for weather development.
- OpenStreetMap for map display only.
- NASA SRTM or an equivalent approved elevation source for terrain work.

### Operational review

- IMD or another government-approved rainfall feed.
- Official district/state shelter, road, flood, and hazard GIS.
- Official population and vulnerable-household data.
- National Centre for Seismology or another approved earthquake feed.

Satellite data from Sentinel or an approved Earth-observation provider should
be added only after the feature engineering and validation process is defined.
Satellite updates are not guaranteed to be minute-by-minute.

## Secret and data rules

- Keep API keys and database credentials in environment variables or a secret
  manager; never put them in React code or commit them to Git.
- Route third-party requests through FastAPI so keys remain server-side.
- Record provider, observation time, fetch time, data age, and model version
  with every prediction.
- Mark data as `LIVE`, `STALE`, or `OFFLINE`; never present stale data as live.
- Keep the relocation disclaimer and require authority confirmation before any
  evacuation action.

## Safe model rollout

Live weather must not be passed into the current XGBoost pipeline until all
of the following match training:

- feature names and order;
- units and time windows;
- preprocessing and missing-value handling;
- coordinate and terrain derivations;
- validation metrics on local historical events.

The intended production flow is:

```text
provider -> validated observation -> feature builder -> versioned model
         -> prediction record -> alert rules -> dashboard
```

