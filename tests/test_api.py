from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def test_api_endpoints_return_expected_shapes():
    villages = client.get("/villages")
    assert villages.status_code == 200
    assert len(villages.json()["villages"]) == 102

    affected = client.get("/affected-population")
    assert affected.status_code == 200
    assert affected.json()["critical_village_count"] == 10

    safe = client.get("/safe-locations")
    assert safe.status_code == 200
    assert len(safe.json()["rejected_sites"]) > 0
    assert len(safe.json()["top_sites"]) == 3

    plan = client.post("/relocation-plan")
    assert plan.status_code == 200
    body = plan.json()
    assert body["unallocated_population"] >= 0
    assert all(row["allocated"] <= row["capacity"] for row in body["allocation"])


def test_geojson_endpoint_contains_all_map_layers():
    body = client.get("/map-geojson").json()
    for layer in (
        "villages",
        "critical_villages",
        "candidate_sites",
        "rejected_sites",
        "selected_sites",
        "roads",
        "hazard_zones",
        "evacuation_lines",
    ):
        assert body[layer]["type"] == "FeatureCollection"


def test_village_relocation_lookup_returns_risk_and_sites():
    response = client.get("/villages/V0009/relocation")
    assert response.status_code == 200
    body = response.json()
    assert body["village"]["village_name"] == "V0009"
    assert body["village"]["status"] == "CRITICAL"
    assert body["village"]["risk_score"] > 0.70
    assert len(body["recommendations"]) == 3
    assert all(site["distance_km"] >= 0 for site in body["recommendations"])


def test_village_relocation_lookup_is_case_insensitive_and_404s():
    assert client.get("/villages/v0009/relocation").status_code == 200
    assert client.get("/villages/UNKNOWN/relocation").status_code == 404


def test_live_status_exposes_data_provenance():
    response = client.get("/live-status")
    assert response.status_code == 200
    body = response.json()
    assert body["prediction_count"] == 102
    assert body["weather_provider"] == "Open-Meteo"


def test_weather_returns_six_day_history():
    response = client.get("/weather/V0009")
    assert response.status_code == 200
    history = response.json()["rainfall_6d_history"]
    assert 1 <= len(history) <= 6
    assert all("day" in item and "rainfall_mm" in item for item in history)
