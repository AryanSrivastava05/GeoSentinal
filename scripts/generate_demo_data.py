"""Create labelled synthetic demo GIS layers for West Khasi Hills-like coordinates."""

from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEMO = ROOT / "data" / "demo"
PROCESSED = ROOT / "data" / "processed"
RAW = ROOT / "data" / "raw"

NOTE = "DEMO/SYNTHETIC DATA — NOT VALIDATED FOR OPERATIONAL EVACUATION."


def fc(features, name):
    return {
        "type": "FeatureCollection",
        "name": name,
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "disclaimer": NOTE,
        "features": features,
    }


def poly(lons_lats):
    ring = [list(p) for p in lons_lats]
    if ring[0] != ring[-1]:
        ring.append(ring[0])
    return {"type": "Polygon", "coordinates": [ring]}


def box(lon, lat, dx=0.012, dy=0.01):
    return poly(
        [
            (lon - dx, lat - dy),
            (lon + dx, lat - dy),
            (lon + dx, lat + dy),
            (lon - dx, lat + dy),
        ]
    )


def write_json(path: Path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2), encoding="utf-8")


def main():
    DEMO.mkdir(parents=True, exist_ok=True)
    PROCESSED.mkdir(parents=True, exist_ok=True)
    RAW.mkdir(parents=True, exist_ok=True)

    villages_spec = [
        ("V001", "Nongstoin Bazar", 620, 91.262, 25.517),
        ("V002", "Mawthawkrah", 480, 91.248, 25.532),
        ("V003", "Mairang East", 400, 91.278, 25.561),
        ("V004", "Markasa", 190, 91.301, 25.508),
        ("V005", "Rambrai", 220, 91.225, 25.498),
        ("V006", "Nongkhlaw", 310, 91.215, 25.545),
        ("V007", "Mawshynrut", 180, 91.198, 25.572),
        ("V008", "Pariong", 260, 91.312, 25.548),
        ("V009", "Kynshi", 150, 91.335, 25.521),
        ("V010", "Nongstoin West", 340, 91.241, 25.505),
        ("V011", "Mawlangwir", 210, 91.289, 25.492),
        ("V012", "Dommawiong", 175, 91.268, 25.478),
        ("V013", "Nongspung", 205, 91.188, 25.512),
        ("V014", "Mawkyrwat Gate", 390, 91.352, 25.490),
        ("V015", "Weiloi", 160, 91.175, 25.488),
    ]

    village_feats = []
    for vid, name, pop, lon, lat in villages_spec:
        village_feats.append(
            {
                "type": "Feature",
                "properties": {
                    "village_id": vid,
                    "village_name": name,
                    "population": pop,
                    "data_quality": "synthetic_demo",
                },
                "geometry": {"type": "Point", "coordinates": [lon, lat]},
            }
        )
    write_json(DEMO / "villages.geojson", fc(village_feats, "demo_villages"))

    # Hazard covers SITE_05 and a hillside; flood covers SITE_04.
    hazard = [
        {
            "type": "Feature",
            "properties": {"zone_id": "HAZ_01", "name": "Demo landslide hazard polygon", "data_quality": "synthetic_demo"},
            "geometry": box(91.205, 25.585, 0.03, 0.018),
        }
    ]
    flood = [
        {
            "type": "Feature",
            "properties": {"zone_id": "FLD_01", "name": "Demo flood exclusion polygon", "data_quality": "synthetic_demo"},
            "geometry": box(91.355, 25.505, 0.028, 0.016),
        }
    ]
    write_json(DEMO / "hazard_zones.geojson", fc(hazard, "demo_hazard_zones"))
    write_json(DEMO / "flood_zones.geojson", fc(flood, "demo_flood_zones"))

    sites = [
        dict(
            site_id="SITE_A",
            name="Nongstoin Community School",
            kind="school",
            lon=91.255,
            lat=25.470,
            usable=20000,
            road=True,
            hazard=False,
            flood=False,
            slope=3.2,
            infra=0.92,
        ),
        dict(
            site_id="SITE_B",
            name="District Sports Complex",
            kind="shelter",
            lon=91.290,
            lat=25.455,
            usable=12500,
            road=True,
            hazard=False,
            flood=False,
            slope=4.1,
            infra=0.80,
        ),
        dict(
            site_id="SITE_C",
            name="Mairang Community Centre",
            kind="community_center",
            lon=91.310,
            lat=25.575,
            usable=7500,
            road=True,
            hazard=False,
            flood=False,
            slope=5.0,
            infra=0.70,
        ),
        dict(
            site_id="SITE_D",
            name="South Ridge Government Building",
            kind="government_building",
            lon=91.230,
            lat=25.460,
            usable=9000,
            road=True,
            hazard=False,
            flood=False,
            slope=6.5,
            infra=0.62,
        ),
        dict(
            site_id="SITE_04",
            name="Kynshi Riverside Hall",
            kind="community_building",
            lon=91.355,
            lat=25.505,
            usable=18000,
            road=True,
            hazard=False,
            flood=True,
            slope=2.0,
            infra=0.55,
        ),
        dict(
            site_id="SITE_05",
            name="North Slope Shelter",
            kind="shelter",
            lon=91.205,
            lat=25.585,
            usable=16000,
            road=True,
            hazard=True,
            flood=False,
            slope=4.0,
            infra=0.50,
        ),
        dict(
            site_id="SITE_06",
            name="Steep Hill Hostel",
            kind="school",
            lon=91.330,
            lat=25.470,
            usable=14000,
            road=True,
            hazard=False,
            flood=False,
            slope=18.0,
            infra=0.66,
        ),
        dict(
            site_id="SITE_07",
            name="Remote Ridge Camp",
            kind="other",
            lon=91.165,
            lat=25.555,
            usable=11000,
            road=False,
            hazard=False,
            flood=False,
            slope=5.5,
            infra=0.40,
        ),
        dict(
            site_id="SITE_08",
            name="Tiny Village Store",
            kind="other",
            lon=91.275,
            lat=25.445,
            usable=400,
            road=True,
            hazard=False,
            flood=False,
            slope=2.5,
            infra=0.30,
        ),
    ]

    site_feats = []
    for s in sites:
        site_feats.append(
            {
                "type": "Feature",
                "properties": {
                    "site_id": s["site_id"],
                    "name": s["name"],
                    "kind": s["kind"],
                    "latitude": s["lat"],
                    "longitude": s["lon"],
                    "usable_area_m2": s["usable"],
                    "road_access": s["road"],
                    "hazard_flag": s["hazard"],
                    "flood_flag": s["flood"],
                    "slope_deg": s["slope"],
                    "infrastructure_score": s["infra"],
                    "data_quality": "synthetic_demo",
                },
                "geometry": box(s["lon"], s["lat"], 0.004, 0.0035),
            }
        )
    write_json(DEMO / "candidate_sites.geojson", fc(site_feats, "demo_candidate_sites"))

    roads = {
        "type": "FeatureCollection",
        "name": "demo_roads",
        "disclaimer": NOTE,
        "features": [
            {
                "type": "Feature",
                "properties": {"name": "Demo NH spine", "data_quality": "synthetic_demo"},
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [91.160, 25.450],
                        [91.220, 25.470],
                        [91.262, 25.500],
                        [91.300, 25.530],
                        [91.340, 25.560],
                    ],
                },
            },
            {
                "type": "Feature",
                "properties": {"name": "Demo south connector", "data_quality": "synthetic_demo"},
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [91.230, 25.460],
                        [91.255, 25.470],
                        [91.290, 25.455],
                        [91.330, 25.470],
                    ],
                },
            },
        ],
    }
    write_json(DEMO / "roads.geojson", roads)

    predictions = [
        ("V001", "Nongstoin Bazar", 0.83),
        ("V002", "Mawthawkrah", 0.76),
        ("V003", "Mairang East", 0.71),
        ("V004", "Markasa", 0.70),
        ("V005", "Rambrai", 0.42),
        ("V006", "Nongkhlaw", 0.38),
        ("V007", "Mawshynrut", 0.55),
        ("V008", "Pariong", 0.61),
        ("V009", "Kynshi", 0.33),
        ("V010", "Nongstoin West", 0.48),
        ("V011", "Mawlangwir", 0.29),
        ("V012", "Dommawiong", 0.22),
        ("V013", "Nongspung", 0.51),
        ("V014", "Mawkyrwat Gate", 0.18),
        ("V015", "Weiloi", 0.35),
    ]
    pred_path = PROCESSED / "predictions.csv"
    with pred_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["village_id", "village_name", "risk_score"])
        w.writerows(predictions)

    write_json(
        PROCESSED / "predictions.example.json",
        [{"village_id": a, "village_name": b, "risk_score": c} for a, b, c in predictions],
    )
    (RAW / "README.txt").write_text(
        "Place original GIS/CSV extracts here. Demo layers live in data/demo.\n" + NOTE + "\n",
        encoding="utf-8",
    )
    print("Wrote demo GeoJSON and predictions.csv")


if __name__ == "__main__":
    main()
