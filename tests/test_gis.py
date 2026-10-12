from gis.capacity import capacity_people
from gis.filtering import filter_site
from gis.relocation import allocate_ranked
from gis.suitability import rank_sites, score_sites


def test_threshold_is_strictly_greater():
    from integration.ml_input import classify_status

    assert classify_status(0.70, 0.70) == "NORMAL"
    assert classify_status(0.7001, 0.70) == "CRITICAL"


def test_filter_records_all_rejection_reasons():
    result = filter_site(
        {
            "site_id": "X",
            "geometry": {"type": "Point", "coordinates": [91.0, 25.0]},
            "hazard_flag": True,
            "flood_flag": True,
            "slope_deg": 12,
            "road_access": False,
            "usable_area_m2": 10,
        },
        hazard_geoms=[],
        flood_geoms=[],
        max_slope_deg=8,
        min_usable_area_m2=1000,
    )
    assert result["status"] == "REJECTED"
    assert set(result["reasons"]) == {
        "inside_hazard_zone",
        "inside_flood_zone",
        "slope_exceeds_maximum",
        "insufficient_road_access",
        "usable_area_below_minimum",
    }


def test_scoring_and_ranking_are_descending():
    sites = [
        {"site_id": "A", "status": "ACCEPTED", "road_access": True, "usable_area_m2": 3000, "distance_km": 1, "infrastructure_score": 0.9},
        {"site_id": "B", "status": "ACCEPTED", "road_access": True, "usable_area_m2": 1000, "distance_km": 5, "infrastructure_score": 0.5},
    ]
    weights = {"safety": 0.30, "road_access": 0.25, "usable_area": 0.20, "distance": 0.15, "infrastructure": 0.10}
    ranked = rank_sites(score_sites(sites, weights))
    assert ranked[0]["site_id"] == "A"
    assert ranked[0]["suitability_score"] >= ranked[1]["suitability_score"]


def test_capacity_and_allocation_never_exceed_capacity():
    assert capacity_people(20000, 25) == 800
    result = allocate_ranked(
        [{"village_id": "V1", "village_name": "One", "population": 900, "risk_score": 0.9}],
        [{"site_id": "A", "name": "A", "capacity": 800}, {"site_id": "B", "name": "B", "capacity": 50}],
    )
    assert result["allocated_population"] == 850
    assert result["unallocated_population"] == 50
    assert all(row["allocated"] <= row["capacity"] for row in result["by_site"])


def test_zero_population_and_no_sites():
    result = allocate_ranked([], [])
    assert result["affected_population"] == 0
    assert result["unallocated_population"] == 0
