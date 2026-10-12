"""DECIDE + RELOCATE pipeline. ML predictions are read-only inputs."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from shapely.geometry import LineString, mapping

from config.loader import ROOT, load_settings
from gis.capacity import capacity_people
from gis.distance import distance_km
from gis.filtering import filter_sites
from gis.geojson_io import fc, feature_to_site, feature_to_village, features, geoms_from_fc
from gis.relocation import allocate_ranked
from gis.suitability import explain_site, rank_sites, score_sites
from integration.ml_input import classify_status, load_predictions

DEMO = ROOT / "data" / "real"
PROCESSED = ROOT / "data" / "processed"


class Pipeline:
    def __init__(self, settings: dict[str, Any] | None = None):
        self.settings = settings or load_settings()
        self._prediction_override: list[dict[str, Any]] | None = None

    def set_predictions(self, records: list[dict[str, Any]] | None) -> None:
        self._prediction_override = records

    def _predictions(self):
        return load_predictions(records=self._prediction_override)

    def villages(self) -> list[dict[str, Any]]:
        pred = self._predictions()
        pred_map = {str(r.village_id): r for r in pred.itertuples(index=False)}
        threshold = float(self.settings["critical_risk_threshold"])
        out = []
        for feat in features(DEMO / "villages.geojson"):
            v = feature_to_village(feat)
            row = pred_map.get(v["village_id"])
            risk = float(row.risk_score) if row is not None else 0.0
            name = row.village_name if row is not None else v["village_name"]
            status = classify_status(risk, threshold)
            out.append(
                {
                    **v,
                    "village_name": name,
                    "risk_score": risk,
                    "status": status,
                }
            )
        return sorted(out, key=lambda x: x["village_id"])

    def critical_villages(self) -> list[dict[str, Any]]:
        return [v for v in self.villages() if v["status"] == "CRITICAL"]

    def village_recommendation(self, village_id: str) -> dict[str, Any] | None:
        village = next(
            (
                item
                for item in self.villages()
                if str(item["village_id"]).lower() == str(village_id).strip().lower()
            ),
            None,
        )
        if village is None:
            return None

        locations = self.safe_locations()
        recommendations = []
        for site in locations["accepted_sites"]:
            distance = site.get("distance_by_village", {}).get(village["village_id"])
            recommendation = dict(site)
            recommendation["distance_km"] = round(
                float(distance if distance is not None else site.get("distance_km") or 0),
                3,
            )
            recommendation["reason"] = explain_site(recommendation)
            recommendations.append(recommendation)

        recommendations.sort(
            key=lambda site: (
                -float(site.get("suitability_score") or 0),
                float(site.get("distance_km") or 0),
                str(site.get("site_id") or ""),
            )
        )
        return {
            "village": village,
            "recommendations": [
                {
                    "site_id": site["site_id"],
                    "name": site.get("name"),
                    "suitability_score": site.get("suitability_score"),
                    "capacity": site.get("capacity"),
                    "distance_km": site.get("distance_km"),
                    "road_access": site.get("road_access"),
                    "usable_area_m2": site.get("usable_area_m2"),
                    "infrastructure_score": site.get("infrastructure_score"),
                    "reason": site.get("reason"),
                }
                for site in recommendations[:3]
            ],
            "safe_site_count": len(recommendations),
            "critical_threshold": self.settings["critical_risk_threshold"],
            "disclaimer": (
                "Prototype decision-support system. Recommendations are advisory, "
                "not official evacuation orders."
            ),
        }

    def affected_population(self) -> dict[str, Any]:
        crit = self.critical_villages()
        total = sum(int(v["population"]) for v in crit)
        return {
            "critical_village_count": len(crit),
            "total_affected_population": total,
            "critical_villages": crit,
            "threshold": self.settings["critical_risk_threshold"],
            "disclaimer": "Prototype threshold — not operationally validated.",
        }

    def _raw_sites(self) -> list[dict[str, Any]]:
        return [feature_to_site(f) for f in features(DEMO / "candidate_sites.geojson")]

    def _zone_geoms(self):
        hazard_path = DEMO / "hazard_zones.geojson"
        flood_path = DEMO / "flood_zones.geojson"
        return (
            geoms_from_fc(hazard_path) if hazard_path.exists() else [],
            geoms_from_fc(flood_path) if flood_path.exists() else [],
        )

    def _attach_distances(self, sites: list[dict[str, Any]], villages: list[dict[str, Any]]) -> None:
        crit = [v for v in villages if v["status"] == "CRITICAL"]
        refs = crit or villages
        for site in sites:
            slon, slat = float(site["longitude"]), float(site["latitude"])
            by_v = {}
            dists = []
            for v in refs:
                d = distance_km(slon, slat, float(v["longitude"]), float(v["latitude"]))
                by_v[v["village_id"]] = round(d, 3)
                if v["status"] == "CRITICAL" or not crit:
                    dists.append(d)
            site["distance_by_village"] = by_v
            site["distance_km"] = round(sum(dists) / len(dists), 3) if dists else 0.0
            site["distance_note"] = (
                "Prototype geodesic (straight-line) distance in km — not road-network travel distance."
            )

    def safe_locations(self) -> dict[str, Any]:
        villages = self.villages()
        sites = self._raw_sites()
        self._attach_distances(sites, villages)
        hazard, flood = self._zone_geoms()
        filtered = filter_sites(
            sites,
            hazard_geoms=hazard,
            flood_geoms=flood,
            max_slope_deg=float(self.settings["max_site_slope_deg"]),
            min_usable_area_m2=float(self.settings["min_usable_area_m2"]),
        )
        area_pp = float(self.settings["area_per_person_m2"])
        for s in filtered:
            s["capacity"] = capacity_people(s.get("usable_area_m2") or 0, area_pp)
            s["area_per_person_m2"] = area_pp

        accepted = [s for s in filtered if s["status"] == "ACCEPTED"]
        rejected = [s for s in filtered if s["status"] == "REJECTED"]
        scored = score_sites(accepted, self.settings["suitability_weights"])
        top3 = rank_sites(scored, 3)
        for s in top3:
            s["reason"] = explain_site(s)

        return {
            "all_sites": filtered,
            "accepted_sites": scored,
            "rejected_sites": rejected,
            "top_sites": top3,
            "weights": self.settings["suitability_weights"],
            "filters": {
                "max_site_slope_deg": self.settings["max_site_slope_deg"],
                "min_usable_area_m2": self.settings["min_usable_area_m2"],
            },
            "disclaimer": "Suitability weights and filters are prototype assumptions. Handover GIS layers are prototype/derived data.",
        }

    def relocation_plan(self) -> dict[str, Any]:
        affected = self.affected_population()
        loc = self.safe_locations()
        top = loc["top_sites"]
        allocation = allocate_ranked(affected["critical_villages"], top)
        return {
            "affected_population": affected["total_affected_population"],
            "critical_village_count": affected["critical_village_count"],
            "top_3_sites": [
                {
                    "rank": s.get("rank"),
                    "site_id": s["site_id"],
                    "name": s.get("name"),
                    "suitability_score": s.get("suitability_score"),
                    "capacity": s.get("capacity"),
                    "distance_km": s.get("distance_km"),
                    "road_access": s.get("road_access"),
                    "infrastructure_score": s.get("infrastructure_score"),
                    "usable_area_m2": s.get("usable_area_m2"),
                    "area_per_person_m2": s.get("area_per_person_m2"),
                    "reason": s.get("reason"),
                }
                for s in top
            ],
            "allocation": allocation["by_site"],
            "allocation_by_village": allocation["by_village"],
            "unallocated_population": allocation["unallocated_population"],
            "unallocated_villages": allocation["unallocated_villages"],
            "allocated_population": allocation["allocated_population"],
            "rejected_sites": [
                {"site_id": s["site_id"], "name": s.get("name"), "status": "REJECTED", "reasons": s["reasons"]}
                for s in loc["rejected_sites"]
            ],
            "disclaimer": (
                "Prototype decision-support system. Risk thresholds, suitability weights, "
                "capacity assumptions, and demo data require validation before operational use."
            ),
        }

    def map_geojson(self) -> dict[str, Any]:
        villages = self.villages()
        loc = self.safe_locations()
        plan = self.relocation_plan()
        top_ids = {s["site_id"] for s in loc["top_sites"]}
        accepted_ids = {s["site_id"] for s in loc["accepted_sites"]}

        village_feats = []
        for v in villages:
            village_feats.append(
                {
                    "type": "Feature",
                    "properties": {
                        "village_id": v["village_id"],
                        "village_name": v["village_name"],
                        "population": v["population"],
                        "risk_score": v["risk_score"],
                        "status": v["status"],
                        "layer": "critical_villages" if v["status"] == "CRITICAL" else "villages",
                    },
                    "geometry": v["geometry"],
                }
            )

        site_feats = []
        for s in loc["all_sites"]:
            if s["site_id"] in top_ids:
                layer = "selected_sites"
                label = "RECOMMENDED"
            elif s["site_id"] in accepted_ids:
                layer = "candidate_sites"
                label = "SAFE"
            else:
                layer = "rejected_sites"
                label = "REJECTED"
            site_feats.append(
                {
                    "type": "Feature",
                    "properties": {
                        "site_id": s["site_id"],
                        "name": s.get("name"),
                        "status": s["status"],
                        "label": label,
                        "reasons": s.get("reasons") or [],
                        "suitability_score": s.get("suitability_score"),
                        "capacity": s.get("capacity"),
                        "usable_area_m2": s.get("usable_area_m2"),
                        "road_access": s.get("road_access"),
                        "layer": layer,
                    },
                    "geometry": s.get("geometry"),
                }
            )

        village_by_id = {v["village_id"]: v for v in villages}
        site_by_id = {s["site_id"]: s for s in loc["all_sites"]}
        lines = []
        for row in plan["allocation_by_village"]:
            v = village_by_id.get(row["village_id"])
            s = site_by_id.get(row["assigned_site"])
            if not v or not s:
                continue
            line = LineString(
                [(float(v["longitude"]), float(v["latitude"])), (float(s["longitude"]), float(s["latitude"]))]
            )
            lines.append(
                {
                    "type": "Feature",
                    "properties": {
                        "layer": "evacuation_lines",
                        "village_id": row["village_id"],
                        "village_name": row["village_name"],
                        "site_id": row["assigned_site"],
                        "assigned_population": row["assigned_population"],
                        "distance_km": row.get("distance_km"),
                    },
                    "geometry": mapping(line),
                }
            )

        return {
            "villages": fc(village_feats),
            "critical_villages": fc([f for f in village_feats if f["properties"]["status"] == "CRITICAL"]),
            "candidate_sites": fc([f for f in site_feats if f["properties"]["layer"] == "candidate_sites"]),
            "rejected_sites": fc([f for f in site_feats if f["properties"]["layer"] == "rejected_sites"]),
            "selected_sites": fc([f for f in site_feats if f["properties"]["layer"] == "selected_sites"]),
            "all_sites": fc(site_feats),
            "roads": json.loads((DEMO / "roads.geojson").read_text(encoding="utf-8")),
            "hazard_zones": self._optional_layer("hazard_zones.geojson"),
            "flood_zones": self._optional_layer("flood_zones.geojson"),
            "evacuation_lines": fc(lines),
            "disclaimer": (
                "Prototype decision-support system. Risk thresholds, suitability weights, "
                "capacity assumptions, and demo data require validation before operational use."
            ),
            "data_note": "FIXED PROTOTYPE GIS HANDOVER — NOT VALIDATED FOR OPERATIONAL EVACUATION.",
        }

    def _optional_layer(self, filename: str) -> dict[str, Any]:
        path = DEMO / filename
        if path.exists():
            return json.loads(path.read_text(encoding="utf-8"))
        return {"type": "FeatureCollection", "features": []}


pipeline = Pipeline()
