"""GeoJSON helpers (QGIS-compatible FeatureCollections)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from shapely.geometry import mapping, shape
from shapely.geometry.base import BaseGeometry


def load_fc(path: Path | str) -> dict[str, Any]:
    with Path(path).open(encoding="utf-8") as f:
        return json.load(f)


def features(path: Path | str) -> list[dict[str, Any]]:
    fc = load_fc(path)
    return list(fc.get("features") or [])


def geoms_from_fc(path: Path | str) -> list[BaseGeometry]:
    out = []
    for feat in features(path):
        geom = feat.get("geometry")
        if geom:
            out.append(shape(geom))
    return out


def feature_to_site(feat: dict[str, Any]) -> dict[str, Any]:
    props = dict(feat.get("properties") or {})
    geom = feat.get("geometry")
    g = shape(geom) if geom else None
    centroid = g.centroid if g is not None else None
    if "road_access" not in props and "has_road_access" in props:
        props["road_access"] = props["has_road_access"]
    if "hazard_flag" not in props and "in_hazard_zone" in props:
        props["hazard_flag"] = props["in_hazard_zone"]
    if "flood_flag" not in props and "in_flood_zone" in props:
        props["flood_flag"] = props["in_flood_zone"]
    props.setdefault("name", props.get("site_id"))
    props.setdefault("infrastructure_score", 0.5)
    return {
        **props,
        "geometry": mapping(g) if g is not None else None,
        "latitude": props.get("latitude") if props.get("latitude") is not None else (centroid.y if centroid else None),
        "longitude": props.get("longitude") if props.get("longitude") is not None else (centroid.x if centroid else None),
    }


def feature_to_village(feat: dict[str, Any]) -> dict[str, Any]:
    props = dict(feat.get("properties") or {})
    geom = feat.get("geometry")
    g = shape(geom) if geom else None
    centroid = g.centroid if g is not None else None
    return {
        "village_id": str(props.get("village_id") or props.get("id")),
        "village_name": props.get("village_name") or props.get("name"),
        "population": int(props.get("population") or 0),
        "geometry": mapping(g) if g is not None else None,
        "latitude": centroid.y if centroid else None,
        "longitude": centroid.x if centroid else None,
    }


def fc(features_list: list[dict[str, Any]], extra: dict[str, Any] | None = None) -> dict[str, Any]:
    body = {"type": "FeatureCollection", "features": features_list}
    if extra:
        body.update(extra)
    return body
