import { api } from './client';

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IncidentStat = 'SUBMITTED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';

export interface Village {
  village_id: string;
  village_name: string;
  population: number;
  latitude: number | null;
  longitude: number | null;
  risk_score: number;
  status: 'CRITICAL' | 'NORMAL';
  geometry: GeoJSON.Geometry | null;
}

export interface SafeLocation {
  site_id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  capacity: number;
  suitability_score?: number;
  road_access: boolean;
  distance_km?: number;
  usable_area_m2?: number;
  infrastructure_score?: number;
  status?: string;
  reasons?: string[];
  geometry?: GeoJSON.Geometry | null;
}

export interface AffectedPopulation {
  critical_village_count: number;
  total_affected_population: number;
  critical_villages: Village[];
  threshold: number;
}

export interface RelocationPlan {
  affected_population: number;
  critical_village_count: number;
  top_3_sites: SafeLocation[];
  allocation: Array<{ site_id: string; name: string; capacity: number; allocated: number; remaining_capacity: number }>;
  unallocated_population: number;
  allocated_population: number;
  rejected_sites: SafeLocation[];
}

export interface VillageRecommendation {
  village: Village;
  recommendations: SafeLocation[];
  safe_site_count: number;
  critical_threshold: number;
  disclaimer: string;
}

export interface MapLayers {
  villages: GeoJSON.FeatureCollection;
  critical_villages: GeoJSON.FeatureCollection;
  candidate_sites: GeoJSON.FeatureCollection;
  rejected_sites: GeoJSON.FeatureCollection;
  selected_sites: GeoJSON.FeatureCollection;
  roads: GeoJSON.FeatureCollection;
  hazard_zones: GeoJSON.FeatureCollection;
  flood_zones: GeoJSON.FeatureCollection;
  evacuation_lines: GeoJSON.FeatureCollection;
  all_sites?: GeoJSON.FeatureCollection;
}

export interface DashboardSummary {
  critical_zones: number;
  active_alerts: number;
  affected_villages: number;
  population_at_risk: number;
  blocked_roads: number;
  restricted_roads: number;
  safe_sites: number;
  total_safe_capacity: number;
  pending_incidents: number;
  data_mode: string;
}

export interface Alert { id: string; region_name: string; risk_level: RiskLevel; risk_score: number; status: string; message: string; created_at: string; affected_villages: number; affected_population: number; }
export interface WeatherData { rainfall_24h: number; rainfall_7d: number; rainfall_intensity: string; soil_moisture: string; last_updated: string; data_mode: string; history: Array<{ day: string; mm: number }>; }
export interface Incident { id: string; type: string; description: string; lat: number; lng: number; severity: RiskLevel; status: IncidentStat; reported_by: string; created_at: string; village: string; }

export const ApiService = {
  getVillages: () => api.get<{ villages: Village[] }>('/villages'),
  getAffectedPopulation: () => api.get<AffectedPopulation>('/affected-population'),
  getSafeLocations: () => api.get<{ all_sites: SafeLocation[]; accepted_sites: SafeLocation[]; rejected_sites: SafeLocation[]; top_sites: SafeLocation[] }>('/safe-locations'),
  generateRelocationPlan: () => api.post<RelocationPlan>('/relocation-plan', {}),
  getMap: () => api.get<MapLayers>('/map-geojson'),
  getVillageRecommendation: (id: string) => api.get<VillageRecommendation>(`/villages/${encodeURIComponent(id)}/relocation`),

  // Kept for the linked command-center pages; these endpoints are optional in this prototype.
  getDashboard: async (): Promise<DashboardSummary> => {
    const [affected, safe] = await Promise.all([ApiService.getAffectedPopulation(), ApiService.getSafeLocations()]);
    return {
      critical_zones: affected.critical_village_count,
      active_alerts: affected.critical_village_count,
      affected_villages: affected.critical_village_count,
      population_at_risk: affected.total_affected_population,
      blocked_roads: 0,
      restricted_roads: 0,
      safe_sites: safe.top_sites.length,
      total_safe_capacity: safe.accepted_sites.reduce((sum, site) => sum + (site.capacity || 0), 0),
      pending_incidents: 0,
      data_mode: 'FIXED PROTOTYPE GIS HANDOVER',
    };
  },
  getAlerts: async (): Promise<Alert[]> => [],
  getWeather: async (): Promise<WeatherData> => {
    const villages = await ApiService.getVillages();
    const village = villages.villages.find(item => item.status === 'CRITICAL') ?? villages.villages[0];
    if (!village) throw new Error('No village coordinates available');
    const weather = await api.get<{ rainfall_24h: number; rainfall_7d: number; rainfall_6d_history: Array<{ day: string; rainfall_mm: number }>; soil_moisture: number | null; fetched_at: string; provider: string }>(`/weather/${encodeURIComponent(village.village_id)}`);
    return {
      rainfall_24h: weather.rainfall_24h,
      rainfall_7d: weather.rainfall_7d,
      rainfall_intensity: weather.rainfall_24h >= 50 ? 'Heavy' : weather.rainfall_24h >= 10 ? 'Moderate' : 'Light',
      soil_moisture: weather.soil_moisture === null ? 'Unavailable' : `${weather.soil_moisture}`,
      last_updated: weather.fetched_at,
      data_mode: `${weather.provider} live`,
      history: weather.rainfall_6d_history.map(item => ({ day: item.day.slice(5), mm: item.rainfall_mm })),
    };
  },
  getIncidents: async (): Promise<Incident[]> => [],
};
