import React from "react";
import { createRoot } from "react-dom/client";
import { MapContainer, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./styles.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function Card({ label, value, alert }) {
  return <div className={`card ${alert ? "alert" : ""}`}><small>{label}</small><strong>{value}</strong></div>;
}

function App() {
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [selectedVillage, setSelectedVillage] = React.useState(null);
  const [villagePlan, setVillagePlan] = React.useState(null);
  React.useEffect(() => {
    Promise.all([
      ["/villages", "GET"],
      ["/affected-population", "GET"],
      ["/relocation-plan", "POST"],
      ["/map-geojson", "GET"],
    ].map(([path, method]) =>
      fetch(`${API}${path}`, { method }).then((response) => {
        if (!response.ok) throw new Error(`API request failed: ${response.status}`);
        return response.json();
      })
    )).then(([villages, affected, plan, map]) => setData({ villages, affected, plan, map })).catch((err) => setError(err.message));
  }, []);

  if (error) return <main><h1>GeoSentinel</h1><p className="error">{error}. Start the FastAPI server first.</p></main>;
  if (!data) return <main><h1>GeoSentinel</h1><p>Loading decision-support layers...</p></main>;
  const { affected, plan, map } = data;
  const matches = data.villages?.villages?.filter((v) =>
    v.village_name.toLowerCase().includes(query.trim().toLowerCase())
  ).slice(0, 6) || [];
  const chooseVillage = (village) => {
    setSelectedVillage(village);
    setQuery(village.village_name);
    fetch(`${API}/villages/${encodeURIComponent(village.village_id)}/relocation`)
      .then((response) => {
        if (!response.ok) throw new Error(`Village recommendation failed: ${response.status}`);
        return response.json();
      })
      .then(setVillagePlan)
      .catch((err) => setError(err.message));
  };
  const center = [25.52, 91.26];
  const pointStyle = (feature) => {
    const status = feature.properties.status;
    return { radius: status === "CRITICAL" ? 9 : 6, color: status === "CRITICAL" ? "#dc2626" : "#2563eb", fillOpacity: 0.8 };
  };
  return <main className="app-shell">
    <header className="topbar"><div className="brand"><div className="brand-mark">G</div><div><h1>GeoSentinel</h1><p>Community safety map</p></div></div><div className="topbar-actions"><span className="status-dot">System ready</span><span className="badge">DEMO DATA</span></div></header>
    <section className="search-panel">
      <div>
        <p className="eyebrow">VILLAGE LOOKUP</p>
        <h2>Search a village for risk and relocation options</h2>
        <p>Search by village name, select a result, and review the nearest safe prototype recommendations.</p>
      </div>
      <div className="search-control">
        <div className="search-input-wrap"><span className="search-icon">/</span><input value={query} onChange={(event) => { setQuery(event.target.value); setSelectedVillage(null); }} placeholder="Search a village, e.g. Nongstoin Bazar" aria-label="Search village name" />{query && <button className="clear-search" onClick={() => { setQuery(""); setSelectedVillage(null); setVillagePlan(null); }} aria-label="Clear search">x</button>}</div>
        {query && !selectedVillage && <div className="suggestions">{matches.length ? matches.map((village) => <button key={village.village_id} onClick={() => chooseVillage(village)}>{village.village_name}<span>{village.status} · risk {village.risk_score.toFixed(2)}</span></button>) : <p>No matching village found.</p>}</div>}
      </div>
    </section>
    {villagePlan && <section className={`village-result ${villagePlan.village.status === "CRITICAL" ? "critical-result" : ""}`}>
      <div><p className="eyebrow">SELECTED VILLAGE</p><h2>{villagePlan.village.village_name}</h2><p>Population: {villagePlan.village.population.toLocaleString()} · Risk score: <b>{villagePlan.village.risk_score.toFixed(2)}</b></p></div>
      <strong>{villagePlan.village.status}</strong>
      <div className="village-sites">{villagePlan.recommendations.map((site, index) => <div className="site" key={site.site_id}><b>#{index + 1} {site.name}</b><span>{site.distance_km} km · capacity {site.capacity.toLocaleString()} · score {site.suitability_score}</span><small>{site.reason}</small></div>)}</div>
    </section>}
    <section className="summary">
      <Card label="Risk status" value={affected.critical_village_count ? "CRITICAL" : "NORMAL"} alert={affected.critical_village_count > 0} />
      <Card label="Critical villages" value={affected.critical_village_count} />
      <Card label="Affected population" value={affected.total_affected_population.toLocaleString()} />
      <Card label="Unallocated population" value={plan.unallocated_population.toLocaleString()} alert={plan.unallocated_population > 0} />
    </section>
    <section className="layout">
      <div className="map-card"><div className="map-toolbar"><span><b>Live risk map</b><small>Click any village marker to view help options</small></span><div className="legend"><span><i className="legend-dot critical"></i>Critical</span><span><i className="legend-dot normal"></i>Normal</span><span><i className="legend-dot safe"></i>Safe site</span></div></div><div className="map"><MapContainer center={center} zoom={11} scrollWheelZoom><GeoJSON data={map.hazard_zones} style={{ color: "#b91c1c", fillColor: "#ef4444", fillOpacity: 0.16 }} /><GeoJSON data={map.flood_zones} style={{ color: "#0369a1", fillColor: "#38bdf8", fillOpacity: 0.16 }} /><GeoJSON data={map.roads} style={{ color: "#64748b", weight: 2 }} /><GeoJSON data={map.villages} pointToLayer={(feature, latlng) => L.circleMarker(latlng, pointStyle(feature))} onEachFeature={(feature, layer) => {
        layer.bindPopup(`<b>${feature.properties.village_name}</b><br/>Status: ${feature.properties.status}<br/>Risk score: ${Number(feature.properties.risk_score).toFixed(2)}<br/>Population: ${Number(feature.properties.population).toLocaleString()}<br/><small>Click the marker for relocation recommendations.</small>`);
        layer.on("click", () => chooseVillage({
          village_id: feature.properties.village_id,
          village_name: feature.properties.village_name,
          risk_score: feature.properties.risk_score,
          status: feature.properties.status,
          population: feature.properties.population,
        }));
      }} /><GeoJSON data={map.all_sites} pointToLayer={(feature, latlng) => L.circleMarker(latlng, { radius: feature.properties.layer === "selected_sites" ? 10 : 6, color: feature.properties.layer === "rejected_sites" ? "#dc2626" : "#059669", fillOpacity: 0.85 })} /><GeoJSON data={map.evacuation_lines} style={{ color: "#7c3aed", weight: 3, dashArray: "6 5" }} /></MapContainer></div></div>
      <aside className="sidebar">
        <Panel title="Critical villages">{affected.critical_villages.map((v) => <div className="row" key={v.village_id}><span><b>{v.village_name}</b><small>{v.population.toLocaleString()} people</small></span><em>{v.risk_score.toFixed(2)}</em></div>)}</Panel>
        <Panel title="Recommended safe sites">{plan.top_3_sites.map((s) => <div className="site" key={s.site_id}><b>#{s.rank} {s.name}</b><span>Score {s.suitability_score} · Capacity {s.capacity.toLocaleString()}</span><span>{s.distance_km} km · {s.usable_area_m2.toLocaleString()} m²</span><small>{s.reason}</small></div>)}</Panel>
        <Panel title="Rejected sites">{plan.rejected_sites.map((s) => <div className="rejected" key={s.site_id}><b>{s.name}</b><small>{s.reasons.join(", ")}</small></div>)}</Panel>
        <Panel title="Relocation allocation">{plan.allocation.map((s) => <div className="row" key={s.site_id}><span>{s.name}<small>{s.remaining_capacity.toLocaleString()} spaces remaining</small></span><b>{s.allocated.toLocaleString()}</b></div>)}</Panel>
      </aside>
    </section>
    <footer>Prototype decision-support system. Risk thresholds, suitability weights, capacity assumptions, and demo data require validation before operational use.</footer>
  </main>;
}

function Panel({ title, children }) { return <section className="panel"><h2>{title}</h2>{children}</section>; }
createRoot(document.getElementById("root")).render(<App />);
