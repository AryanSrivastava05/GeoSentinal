import React from 'react';
import { CircleMarker, GeoJSON, MapContainer, Polyline, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapLayers, Village, VillageRecommendation } from '../api/services';

interface LayerState {
  riskZones: boolean;
  villages: boolean;
  roads: boolean;
  safeLocations: boolean;
  incidents: boolean;
}

interface Props {
  layers: LayerState;
  mapData?: MapLayers | null;
  onVillageSelect?: (village: Village) => void;
  selectedVillage?: Village | null;
  villagePlan?: VillageRecommendation | null;
}

const empty: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

export default function LeafletMap({ layers, mapData, onVillageSelect, selectedVillage, villagePlan }: Props) {
  const villageData = mapData?.villages ?? empty;
  const sites = mapData?.all_sites ?? mapData?.candidate_sites ?? empty;
  const recommendedSiteId = villagePlan?.recommendations[0]?.site_id;
  const recommendedFeature = sites.features.find(feature => feature.properties?.site_id === recommendedSiteId);
  const recommendedCoordinates = recommendedFeature?.geometry.type === 'Point' ? recommendedFeature.geometry.coordinates : null;
  const villageCoordinates = selectedVillage && selectedVillage.longitude !== null && selectedVillage.latitude !== null
    ? [selectedVillage.latitude, selectedVillage.longitude] as [number, number]
    : null;
  const routeCoordinates = recommendedCoordinates && villageCoordinates
    ? [villageCoordinates, [recommendedCoordinates[1], recommendedCoordinates[0]] as [number, number]]
    : null;
  return (
    <MapContainer center={[25.52, 91.26]} zoom={8} style={{ width: '100%', height: '100%' }} zoomControl>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      {layers.roads && <GeoJSON data={mapData?.roads ?? empty} style={{ color: '#64748b', weight: 2 }} />}
      {layers.riskZones && <><GeoJSON data={mapData?.hazard_zones ?? empty} style={{ color: '#f05252', fillColor: '#f05252', fillOpacity: 0.18 }} /><GeoJSON data={mapData?.flood_zones ?? empty} style={{ color: '#3b9eff', fillColor: '#3b9eff', fillOpacity: 0.16 }} /></>}
      {layers.villages && <GeoJSON data={villageData} pointToLayer={(feature, latlng) => {
        const critical = feature.properties?.status === 'CRITICAL';
        if (critical) {
          return L.marker(latlng, {
            icon: L.divIcon({
              className: 'critical-village-marker',
              html: '<span class="critical-village-core"></span><span class="critical-village-ring"></span>',
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            }),
          });
        }
        return L.circleMarker(latlng, { radius: 5, color: '#3b9eff', fillColor: '#3b9eff', fillOpacity: .9, weight: 2 });
      }} onEachFeature={(feature, layer) => {
        const p = feature.properties || {};
        layer.bindPopup(`<div class="map-popup ${p.status === 'CRITICAL' ? 'map-popup-critical' : ''}"><b>${p.village_name}</b><br/><span>${p.status} · risk ${Number(p.risk_score).toFixed(2)}</span><br/>Population: ${Number(p.population || 0).toLocaleString()}<br/><span class="map-popup-chip">Click for relocation plan →</span></div>`);
        layer.on('click', () => onVillageSelect?.({
          village_id: p.village_id,
          village_name: p.village_name,
          population: Number(p.population || 0),
          latitude: p.latitude ?? null,
          longitude: p.longitude ?? null,
          risk_score: Number(p.risk_score || 0),
          status: p.status,
          geometry: feature.geometry,
        }));
      }} />}
      {layers.safeLocations && <GeoJSON data={sites} pointToLayer={(_feature, latlng) => L.circleMarker(latlng, { radius: 6, color: '#00c896', fillColor: '#00c896', fillOpacity: .9, weight: 2 })} />}
      {layers.incidents && <GeoJSON data={mapData?.evacuation_lines ?? empty} style={{ color: '#a78bfa', weight: 2, dashArray: '5 5' }} />}
      {routeCoordinates && <Polyline positions={routeCoordinates} pathOptions={{ color: '#00c896', weight: 4, dashArray: '8 8', opacity: 0.9 }} />}
      {recommendedCoordinates && <CircleMarker center={[recommendedCoordinates[1], recommendedCoordinates[0]]} radius={11} pathOptions={{ color: '#00c896', fillColor: '#00c896', fillOpacity: 0.22, weight: 2 }} />}
    </MapContainer>
  );
}
