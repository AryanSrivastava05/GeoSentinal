"""Prototype suitability scoring. Weights are assumptions, not planning standards.

Normalized factors (all 0–1):
  safety         1 if ACCEPTED (passed hard filters), else 0
  road_access    1 if road_access truthy, else 0
  usable_area    min-max among the scoring set (accepted sites). If max==min, all get 1
                 when area > 0, else 0
  distance       closer is better: 1 - (d - dmin)/(dmax - dmin); if all equal, 1
  infrastructure clamp of infrastructure_score to [0, 1]
"""

from __future__ import annotations

from typing import Any


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, float(value)))


def _minmax(values: list[float], invert: bool = False) -> list[float]:
    if not values:
        return []
    lo, hi = min(values), max(values)
    if hi == lo:
        return [1.0 if (v > 0 or not invert) else 0.0 for v in values]
    scaled = [(v - lo) / (hi - lo) for v in values]
    if invert:
        return [1.0 - s for s in scaled]
    return scaled


def score_sites(
    sites: list[dict[str, Any]],
    weights: dict[str, float],
) -> list[dict[str, Any]]:
    """Attach suitability_score and factor breakdown. Sites should already be filtered."""
    if not sites:
        return []

    areas = [float(s.get("usable_area_m2") or 0) for s in sites]
    distances = [float(s.get("distance_km") or 0) for s in sites]
    area_n = _minmax(areas, invert=False)
    # Invert distance so nearer sites score higher.
    dist_n = _minmax(distances, invert=True)

    w_safety = float(weights["safety"])
    w_road = float(weights["road_access"])
    w_area = float(weights["usable_area"])
    w_dist = float(weights["distance"])
    w_infra = float(weights["infrastructure"])

    scored: list[dict[str, Any]] = []
    for i, site in enumerate(sites):
        safety = 1.0 if site.get("status") == "ACCEPTED" else 0.0
        road = 1.0 if site.get("road_access") in (True, 1, "true", "True", "yes") else (
            1.0 if str(site.get("road_access")).lower() in {"1", "true", "yes"} else 0.0
        )
        infra = _clamp01(float(site.get("infrastructure_score") or 0))
        factors = {
            "safety": safety,
            "road_access": road,
            "usable_area": area_n[i],
            "distance": dist_n[i],
            "infrastructure": infra,
        }
        score = (
            w_safety * factors["safety"]
            + w_road * factors["road_access"]
            + w_area * factors["usable_area"]
            + w_dist * factors["distance"]
            + w_infra * factors["infrastructure"]
        )
        row = dict(site)
        row["factors"] = factors
        row["suitability_score"] = round(score, 4)
        scored.append(row)
    return scored


def rank_sites(sites: list[dict[str, Any]], top_n: int = 3) -> list[dict[str, Any]]:
    ordered = sorted(
        sites,
        key=lambda s: (-float(s.get("suitability_score") or 0), str(s.get("site_id") or "")),
    )
    ranked = []
    for i, site in enumerate(ordered[:top_n], start=1):
        row = dict(site)
        row["rank"] = i
        ranked.append(row)
    return ranked


def explain_site(site: dict[str, Any]) -> str:
    factors = site.get("factors") or {}
    bits = []
    if factors.get("safety", 0) >= 1:
        bits.append("passed all hard safety filters")
    if factors.get("road_access", 0) >= 1:
        bits.append("usable road access")
    if factors.get("usable_area", 0) >= 0.6:
        bits.append("large usable area")
    elif factors.get("usable_area", 0) >= 0.3:
        bits.append("adequate usable area")
    if factors.get("distance", 0) >= 0.6:
        bits.append("short geodesic distance to critical villages")
    elif factors.get("distance", 0) >= 0.3:
        bits.append("moderate geodesic distance to critical villages")
    infra = factors.get("infrastructure", 0)
    if infra >= 0.7:
        bits.append("strong infrastructure score")
    elif infra >= 0.4:
        bits.append("moderate infrastructure")
    if not bits:
        bits.append("best remaining option among accepted sites")
    return "Selected because: " + ", ".join(bits) + "."
