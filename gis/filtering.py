"""Hard safety filters for candidate relocation sites. Never silently drop a site."""

from __future__ import annotations

from typing import Any, Iterable

from shapely.geometry import mapping, shape
from shapely.geometry.base import BaseGeometry


REASON_HAZARD = "inside_hazard_zone"
REASON_FLOOD = "inside_flood_zone"
REASON_SLOPE = "slope_exceeds_maximum"
REASON_ROAD = "insufficient_road_access"
REASON_AREA = "usable_area_below_minimum"


def _as_geom(obj: Any) -> BaseGeometry | None:
    if obj is None:
        return None
    if isinstance(obj, BaseGeometry):
        return obj
    if isinstance(obj, dict):
        if obj.get("type") == "Feature":
            return shape(obj["geometry"])
        return shape(obj)
    return None


def _overlaps_any(site_geom: BaseGeometry | None, zones: Iterable[BaseGeometry]) -> bool:
    if site_geom is None or site_geom.is_empty:
        return False
    for zone in zones:
        if zone is None or zone.is_empty:
            continue
        if site_geom.intersects(zone):
            return True
    return False


def _truthy_flag(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "y"}
    return bool(value)


def filter_site(
    site: dict[str, Any],
    *,
    hazard_geoms: list[BaseGeometry],
    flood_geoms: list[BaseGeometry],
    max_slope_deg: float,
    min_usable_area_m2: float,
) -> dict[str, Any]:
    """Return a copy of the site with status ACCEPTED or REJECTED and reasons list."""
    props = dict(site)
    geom = _as_geom(props.get("geometry"))
    reasons: list[str] = []

    hazard_flag = _truthy_flag(props.get("hazard_flag"))
    flood_flag = _truthy_flag(props.get("flood_flag"))
    if hazard_flag or _overlaps_any(geom, hazard_geoms):
        reasons.append(REASON_HAZARD)
    if flood_flag or _overlaps_any(geom, flood_geoms):
        reasons.append(REASON_FLOOD)

    slope = float(props.get("slope_deg") or 0)
    if slope > float(max_slope_deg):
        reasons.append(REASON_SLOPE)

    if not _truthy_flag(props.get("road_access")):
        reasons.append(REASON_ROAD)

    area = float(props.get("usable_area_m2") or 0)
    if area < float(min_usable_area_m2):
        reasons.append(REASON_AREA)

    status = "REJECTED" if reasons else "ACCEPTED"
    result = {
        **props,
        "status": status,
        "reasons": reasons,
    }
    if geom is not None:
        result["geometry"] = mapping(geom)
    return result


def filter_sites(
    sites: list[dict[str, Any]],
    *,
    hazard_geoms: list[BaseGeometry],
    flood_geoms: list[BaseGeometry],
    max_slope_deg: float,
    min_usable_area_m2: float,
) -> list[dict[str, Any]]:
    return [
        filter_site(
            site,
            hazard_geoms=hazard_geoms,
            flood_geoms=flood_geoms,
            max_slope_deg=max_slope_deg,
            min_usable_area_m2=min_usable_area_m2,
        )
        for site in sites
    ]
