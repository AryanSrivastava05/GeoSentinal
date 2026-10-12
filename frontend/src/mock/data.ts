// ─────────────────────────────────────────────
//  SIH26001 — Mock Data (DEMO/SIMULATION mode)
//  Pilot Region: East Sikkim, India
// ─────────────────────────────────────────────

export const REGION = {
  name: 'East Sikkim',
  state: 'Sikkim',
  center: [27.3314, 88.6138] as [number, number],
  zoom: 10,
};

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'ESCALATED' | 'RESOLVED';
export type RoadStatus = 'OPEN' | 'RESTRICTED' | 'BLOCKED' | 'UNKNOWN';
export type IncidentType = 'LANDSLIDE' | 'CRACK' | 'SLOPE_MOVEMENT' | 'ROAD_BLOCKAGE' | 'FLOODING' | 'DRAINAGE_FAILURE' | 'OTHER';
export type IncidentStatus = 'SUBMITTED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';

export interface Village {
  id: string; name: string; population: number;
  lat: number; lng: number; riskLevel: RiskLevel; riskScore: number;
  district: string; nearestRoad: string;
}

export interface RiskZone {
  id: string; lat: number; lng: number; radiusKm: number;
  riskLevel: RiskLevel; riskScore: number; rainfall7d: number;
  slope: number; elevation: number;
}

export interface Alert {
  id: string; regionName: string; riskLevel: RiskLevel;
  riskScore: number; status: AlertStatus;
  message: string; createdAt: string; affectedVillages: number;
  affectedPopulation: number;
}

export interface Incident {
  id: string; type: IncidentType; description: string;
  lat: number; lng: number; severity: RiskLevel;
  status: IncidentStatus; reportedBy: string; createdAt: string;
  village: string;
}

export interface SafeLocation {
  id: string; name: string; lat: number; lng: number;
  capacity: number; suitabilityScore: number; roadAccess: string;
  hazardLevel: RiskLevel; distanceKm: number;
}

export interface Road {
  id: string; name: string; status: RoadStatus;
  location: string; lastUpdated: string;
}

// ── Villages ──────────────────────────────────
export const villages: Village[] = [
  { id: 'v1',  name: 'Rongli',      population: 2100, lat: 27.2077, lng: 88.7441, riskLevel: 'CRITICAL', riskScore: 0.87, district: 'East Sikkim', nearestRoad: 'NH-10' },
  { id: 'v2',  name: 'Rhenock',     population: 1800, lat: 27.1889, lng: 88.6800, riskLevel: 'HIGH',     riskScore: 0.71, district: 'East Sikkim', nearestRoad: 'SH-10' },
  { id: 'v3',  name: 'Pakyong',     population: 3200, lat: 27.2067, lng: 88.6100, riskLevel: 'HIGH',     riskScore: 0.65, district: 'East Sikkim', nearestRoad: 'NH-717A' },
  { id: 'v4',  name: 'Rangpo',      population: 4100, lat: 27.1760, lng: 88.5317, riskLevel: 'MEDIUM',   riskScore: 0.42, district: 'East Sikkim', nearestRoad: 'NH-10' },
  { id: 'v5',  name: 'Singtam',     population: 5200, lat: 27.2375, lng: 88.5010, riskLevel: 'MEDIUM',   riskScore: 0.38, district: 'East Sikkim', nearestRoad: 'NH-10' },
  { id: 'v6',  name: 'Dikchu',      population: 900,  lat: 27.3600, lng: 88.5600, riskLevel: 'HIGH',     riskScore: 0.68, district: 'East Sikkim', nearestRoad: 'SH-2' },
  { id: 'v7',  name: 'Mangan',      population: 2400, lat: 27.5050, lng: 88.5344, riskLevel: 'MEDIUM',   riskScore: 0.45, district: 'North Sikkim', nearestRoad: 'SH-2' },
  { id: 'v8',  name: 'Aritar',      population: 1100, lat: 27.1500, lng: 88.7300, riskLevel: 'HIGH',     riskScore: 0.72, district: 'East Sikkim', nearestRoad: 'SH-11' },
  { id: 'v9',  name: 'Lingtam',     population: 620,  lat: 27.1700, lng: 88.7700, riskLevel: 'CRITICAL', riskScore: 0.84, district: 'East Sikkim', nearestRoad: 'SH-11' },
  { id: 'v10', name: 'Tarku',       population: 430,  lat: 27.2300, lng: 88.7900, riskLevel: 'HIGH',     riskScore: 0.69, district: 'East Sikkim', nearestRoad: 'None' },
  { id: 'v11', name: 'Namprikdang', population: 810,  lat: 27.2800, lng: 88.6500, riskLevel: 'MEDIUM',   riskScore: 0.44, district: 'East Sikkim', nearestRoad: 'SH-10' },
  { id: 'v12', name: 'Makha',       population: 560,  lat: 27.2200, lng: 88.6300, riskLevel: 'LOW',      riskScore: 0.18, district: 'East Sikkim', nearestRoad: 'SH-10' },
  { id: 'v13', name: 'Rachela',     population: 340,  lat: 27.1400, lng: 88.7500, riskLevel: 'CRITICAL', riskScore: 0.91, district: 'East Sikkim', nearestRoad: 'None' },
  { id: 'v14', name: 'Kupup',       population: 290,  lat: 27.3800, lng: 88.7000, riskLevel: 'HIGH',     riskScore: 0.73, district: 'East Sikkim', nearestRoad: 'Old Silk Route' },
];

// ── Risk Zones ────────────────────────────────
export const riskZones: RiskZone[] = [
  { id: 'rz1', lat: 27.1800, lng: 88.7400, radiusKm: 6.5, riskLevel: 'CRITICAL', riskScore: 0.89, rainfall7d: 184, slope: 36, elevation: 1820 },
  { id: 'rz2', lat: 27.2500, lng: 88.6800, radiusKm: 4.0, riskLevel: 'HIGH',     riskScore: 0.71, rainfall7d: 142, slope: 28, elevation: 1340 },
  { id: 'rz3', lat: 27.3500, lng: 88.5700, radiusKm: 3.0, riskLevel: 'HIGH',     riskScore: 0.67, rainfall7d: 121, slope: 24, elevation: 1120 },
  { id: 'rz4', lat: 27.1300, lng: 88.7000, radiusKm: 2.5, riskLevel: 'MEDIUM',   riskScore: 0.44, rainfall7d:  89, slope: 19, elevation:  960 },
];

// ── Alerts ────────────────────────────────────
export const alerts: Alert[] = [
  {
    id: 'al1', regionName: 'Rongli – Lingtam Corridor', riskLevel: 'CRITICAL', riskScore: 0.89, status: 'ACTIVE',
    message: 'Extreme rainfall accumulation (184 mm / 7d) on steep slope terrain. Immediate evacuation recommended for 3 villages.',
    createdAt: '2026-09-08T14:30:00Z', affectedVillages: 3, affectedPopulation: 3030,
  },
  {
    id: 'al2', regionName: 'Rhenock – Aritar Zone', riskLevel: 'HIGH', riskScore: 0.71, status: 'ACKNOWLEDGED',
    message: 'High slope instability detected. Road SH-11 partially blocked. Field verification in progress.',
    createdAt: '2026-09-08T11:15:00Z', affectedVillages: 2, affectedPopulation: 2900,
  },
  {
    id: 'al3', regionName: 'Dikchu Valley', riskLevel: 'HIGH', riskScore: 0.68, status: 'ACTIVE',
    message: 'Soil saturation above threshold. Slope movement reported by field officer.',
    createdAt: '2026-09-08T09:00:00Z', affectedVillages: 1, affectedPopulation: 900,
  },
  {
    id: 'al4', regionName: 'Pakyong Sub-Division', riskLevel: 'MEDIUM', riskScore: 0.44, status: 'RESOLVED',
    message: 'Risk decreased below threshold after 12h dry period.',
    createdAt: '2026-09-07T18:00:00Z', affectedVillages: 1, affectedPopulation: 3200,
  },
];

// ── Incidents ─────────────────────────────────
export const incidents: Incident[] = [
  { id: 'in1', type: 'LANDSLIDE',     description: 'Major landslide blocking NH-10 near Rongli bridge. Debris ~15m across.',    lat: 27.2100, lng: 88.7400, severity: 'CRITICAL', status: 'VERIFIED',             reportedBy: 'Field Officer - Suresh Kumar', createdAt: '2026-09-08T13:45:00Z', village: 'Rongli'  },
  { id: 'in2', type: 'CRACK',         description: 'Large longitudinal crack observed on slope near Rachela village (~40m long).', lat: 27.1400, lng: 88.7500, severity: 'HIGH',     status: 'VERIFIED',             reportedBy: 'Citizen Report',              createdAt: '2026-09-08T12:20:00Z', village: 'Rachela' },
  { id: 'in3', type: 'ROAD_BLOCKAGE', description: 'SH-11 partially blocked by debris at km marker 23. One lane passable.',       lat: 27.1700, lng: 88.7200, severity: 'HIGH',     status: 'VERIFIED',             reportedBy: 'Field Officer - Priya Rai',   createdAt: '2026-09-08T10:30:00Z', village: 'Lingtam' },
  { id: 'in4', type: 'SLOPE_MOVEMENT',description: 'Slow slope creep detected near Aritar. Trees visibly tilted.',               lat: 27.1500, lng: 88.7300, severity: 'MEDIUM',   status: 'PENDING_VERIFICATION', reportedBy: 'Citizen Report',              createdAt: '2026-09-08T09:10:00Z', village: 'Aritar'  },
  { id: 'in5', type: 'FLOODING',      description: 'Flash flood in Dikchu valley. River overflowing banks near settlement.',      lat: 27.3600, lng: 88.5600, severity: 'HIGH',     status: 'PENDING_VERIFICATION', reportedBy: 'Citizen Report',              createdAt: '2026-09-08T08:00:00Z', village: 'Dikchu'  },
  { id: 'in6', type: 'DRAINAGE_FAILURE','description': 'Blocked culvert causing water accumulation on SH-10.',                  lat: 27.2300, lng: 88.6100, severity: 'MEDIUM',   status: 'SUBMITTED',            reportedBy: 'Citizen Report',              createdAt: '2026-09-08T07:30:00Z', village: 'Pakyong' },
];

// ── Safe Locations ────────────────────────────
export const safeLocations: SafeLocation[] = [
  { id: 'sl1', name: 'Gangtok Sports Complex',       lat: 27.3389, lng: 88.6065, capacity: 2000, suitabilityScore: 0.94, roadAccess: 'NH-10 (Open)',    hazardLevel: 'LOW',    distanceKm: 18 },
  { id: 'sl2', name: 'Rangpo Relief Camp',            lat: 27.1760, lng: 88.5317, capacity: 1500, suitabilityScore: 0.88, roadAccess: 'NH-10 (Open)',    hazardLevel: 'LOW',    distanceKm: 22 },
  { id: 'sl3', name: 'Singtam Community Hall',        lat: 27.2375, lng: 88.5010, capacity: 800,  suitabilityScore: 0.81, roadAccess: 'NH-10 (Open)',    hazardLevel: 'LOW',    distanceKm: 24 },
  { id: 'sl4', name: 'Pakyong Airport Grounds',       lat: 27.2067, lng: 88.6100, capacity: 1200, suitabilityScore: 0.79, roadAccess: 'NH-717A (Open)',  hazardLevel: 'LOW',    distanceKm: 12 },
  { id: 'sl5', name: 'Rhenock Higher Secondary School',lat: 27.1889, lng: 88.6500, capacity: 600,  suitabilityScore: 0.72, roadAccess: 'SH-10 (Open)',   hazardLevel: 'MEDIUM', distanceKm: 8  },
];

// ── Roads ─────────────────────────────────────
export const roads: Road[] = [
  { id: 'rd1', name: 'NH-10 (Rangpo–Rongli)',     status: 'BLOCKED',     location: 'km 34, near Rongli',  lastUpdated: '2026-09-08T14:00:00Z' },
  { id: 'rd2', name: 'SH-11 (Rhenock–Aritar)',    status: 'RESTRICTED',  location: 'km 23',               lastUpdated: '2026-09-08T10:30:00Z' },
  { id: 'rd3', name: 'Old Silk Route',             status: 'UNKNOWN',     location: 'Kupup sector',        lastUpdated: '2026-09-08T06:00:00Z' },
  { id: 'rd4', name: 'NH-10 (Rangpo–Singtam)',     status: 'OPEN',        location: '—',                   lastUpdated: '2026-09-08T16:00:00Z' },
  { id: 'rd5', name: 'NH-717A (Pakyong bypass)',   status: 'OPEN',        location: '—',                   lastUpdated: '2026-09-08T15:00:00Z' },
];

// ── Weather (7-day observed) ───────────────────
export const rainfallHistory = [
  { day: 'Sep 2', mm: 24 }, { day: 'Sep 3', mm: 38 }, { day: 'Sep 4', mm: 61 },
  { day: 'Sep 5', mm: 74 }, { day: 'Sep 6', mm: 52 }, { day: 'Sep 7', mm: 91 },
  { day: 'Sep 8', mm: 142 },
];

export const currentWeather = {
  rainfall24h: 42,
  rainfall7d: 142,
  rainfallIntensity: 'HEAVY',
  soilMoisture: 'SATURATED',
  lastUpdated: '2026-09-08T21:30:00Z',
  dataMode: 'DEMO/SIMULATION' as const,
};

// ── Dashboard Summary ─────────────────────────
export const dashboardSummary = {
  criticalZones: 2,
  activeAlerts: 3,
  affectedVillages: 14,
  populationAtRisk: 12480,
  blockedRoads: 1,
  restrictedRoads: 1,
  safeSites: 5,
  totalCapacity: 6100,
  pendingIncidents: 3,
  dataMode: 'DEMO/SIMULATION' as const,
};

// ── Helpers ───────────────────────────────────
export const riskColor = (level: RiskLevel) => ({
  CRITICAL: '#ff4d6d',
  HIGH:     '#f59e0b',
  MEDIUM:   '#00c896',
  LOW:      '#22c55e',
}[level]);

export const riskBg = (level: RiskLevel) => ({
  CRITICAL: 'rgba(255,77,109,0.12)',
  HIGH:     'rgba(245,158,11,0.12)',
  MEDIUM:   'rgba(0,200,150,0.10)',
  LOW:      'rgba(34,197,94,0.10)',
}[level]);

export const roadStatusColor = (s: RoadStatus) => ({
  OPEN:       '#22c55e',
  RESTRICTED: '#f59e0b',
  BLOCKED:    '#ff4d6d',
  UNKNOWN:    '#7a9088',
}[s]);

export const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};
export const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};
