import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Activity, Map as MapIcon, CloudRain, Layers, Search, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { useApi } from './hooks/useApi';
import { ApiService, type Village, type VillageRecommendation, type MapLayers } from './api/services';
import RightPanel from './components/RightPanel';

const LeafletMap  = lazy(() => import('./components/LeafletMap'));

type Page = 'overview' | 'riskmap';

const defaultLayers = { riskZones: true, villages: true, roads: false, safeLocations: true, incidents: true };

/* ── KPI Card ─────────────────────────────────── */
function KPICard({
  label, value, sub, danger = false, accent = false, loading = false, trend = 'up',
}: {
  label: string; value: string | number; sub?: string;
  danger?: boolean; accent?: boolean; loading?: boolean;
  trend?: 'up' | 'steady';
}) {
  const color = loading ? 'var(--color-text-faint)'
    : danger ? 'var(--color-danger)'
    : accent ? 'var(--color-primary)'
    : 'var(--color-text)';

  return (
    <div className={`kpi-card ${danger ? 'kpi-critical' : accent ? 'kpi-safe' : 'kpi-neutral'}`}>
      <span className="kpi-label">{label}</span>
      <span className={`kpi-value ${danger && !loading ? 'kpi-critical-value' : ''}`} style={{ color }}>
        {loading ? '—' : value}
      </span>
      <div className="kpi-meta">
        {sub && <span className="kpi-sub">{sub}</span>}
        <span className="kpi-trend" aria-label={trend === 'up' ? 'Trending up' : 'Stable'}>
          <ArrowUpRight size={13} />
        </span>
      </div>
    </div>
  );
}

/* ── Sidebar ──────────────────────────────────── */
function Sidebar({
  page, setPage, activeAlertCount,
}: { page: Page; setPage: (p: Page) => void; activeAlertCount: number }) {
  const NAV: { id: Page; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <Activity size={14} /> },
    { id: 'riskmap', label: 'Risk Map', icon: <MapIcon size={14} />, badge: activeAlertCount || undefined },
  ];

  return (
    <aside className="app-sidebar" style={{
      width: 220, flexShrink: 0,
      background: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex', flexDirection: 'column', height: '100%',
    }}>
      {/* Brand */}
      <div style={{ padding: '18px 16px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="brand-mark" style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'var(--color-primary-dim)',
          border: '1px solid var(--color-primary-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Activity size={15} style={{ color: 'var(--color-primary)' }} />
        </div>
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}>SIH 26001</div>
          <div style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginTop: 1 }}>
            Command Center
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {activeAlertCount > 0 && (
        <button className="sidebar-alert" onClick={() => setPage('riskmap')} style={{
          margin: '12px 10px 0', padding: '10px 12px', borderRadius: 8,
          background: 'var(--color-danger-dim)', border: '1px solid var(--color-danger-border)',
          cursor: 'pointer', textAlign: 'left',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div className="status-dot" style={{ background: 'var(--color-danger)', boxShadow: '0 0 6px var(--color-danger)' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-danger)' }}>
              {activeAlertCount} Active Alert{activeAlertCount > 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text)' }}>East Sikkim Corridor</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-2)', marginTop: 2 }}>Risk 0.89 · 3,030 at risk</div>
        </button>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <div className="section-label" style={{ marginTop: 4, marginBottom: 8 }}>Operations</div>
        {NAV.map(item => (
          <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => setPage(item.id)}>
            <span className="nav-item-inner">{item.icon}{item.label}</span>
            {item.badge ? (
              <span className={`nav-badge ${item.badge ? 'nav-badge-alert' : ''}`} style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'var(--color-danger)', color: 'white' }}>
                {item.badge}
              </span>
            ) : null}
          </button>
        ))}

        <div className="divider" style={{ margin: '10px 0' }} />
        <div className="section-label" style={{ marginBottom: 8 }}>System</div>
        <div className="nav-item"><span className="nav-item-inner"><CloudRain size={14} /> Live model output</span></div>
      </nav>

      {/* User */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="topbar" style={{
          width: 28, height: 28, borderRadius: 7,
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.65rem', fontWeight: 700, color: '#0c0e0d', flexShrink: 0,
        }}>JD</div>
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text)' }}>John Doe</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>District Officer</div>
        </div>
      </div>
    </aside>
  );
}

/* ── Top Bar ──────────────────────────────────── */
function TopBar({ page, backendOnline, villages, onVillageSelect }: { page: Page; backendOnline: boolean; villages: Village[]; onVillageSelect: (village: Village) => void }) {
  const labels: Record<Page, string> = { overview: 'Overview', riskmap: 'Risk Map' };
  return (
    <div style={{
      height: 52, flexShrink: 0,
      borderBottom: '1px solid var(--color-border)',
      background: 'var(--color-surface)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div className="page-heading">
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)' }}>{labels[page]}</span>
          <span>DECIDE · RELOCATE</span>
        </div>
        <span style={{ width: 1, height: 16, background: 'var(--color-border)', display: 'block' }} />
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          <CloudRain size={12} style={{ color: 'var(--color-primary-light)' }} />
          142 mm / 7d
          <span className="badge badge-warning rainfall-status" style={{ marginLeft: 4 }}><AlertTriangle size={10} /> +38%</span>
        </span>
        {/* Backend status */}
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div className="status-dot" style={{
            background: backendOnline ? 'var(--color-success)' : 'var(--color-danger)',
            boxShadow: `0 0 5px ${backendOnline ? 'var(--color-success)' : 'var(--color-danger)'}`,
          }} />
          <span className={backendOnline ? 'api-status-live' : ''} style={{ fontSize: '0.7rem', fontWeight: 600, color: backendOnline ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {backendOnline ? 'API LIVE' : 'API OFFLINE'}
          </span>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="village-search" style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)' }} />
          <VillageSearch villages={villages} onSelect={onVillageSelect} />
        </div>
        <span className="badge badge-warning">FIXED GIS</span>
      </div>
    </div>
  );
}

function VillageSearch({ villages, onSelect }: { villages: Village[]; onSelect: (village: Village) => void }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);
  const matches = query.trim() ? villages.filter(v => v.village_name.toLowerCase().includes(query.toLowerCase())).slice(0, 6) : [];
  return <div style={{ position: 'relative' }}>
    <input ref={inputRef} className="input" value={query} onChange={e => setQuery(e.target.value)} style={{ paddingLeft: 30, width: 270, paddingRight: 62 }} placeholder="Search villages…" aria-label="Search village name" />
    <kbd className="search-shortcut">⌘K / Ctrl K</kbd>
    {matches.length > 0 && <div className="search-results">{matches.map(village => <button key={village.village_id} onClick={() => { setQuery(village.village_name); onSelect(village); }}>{village.village_name}<span>{village.status} · {village.risk_score.toFixed(2)}</span></button>)}</div>}
  </div>;
}

/* ── Map with layer controls ─────────────── */
function RiskMapPage({ selectedVillage, villagePlan, onVillageSelect }: { selectedVillage: Village | null; villagePlan: VillageRecommendation | null; onVillageSelect: (village: Village) => void }) {
  const [layers, setLayers] = useState(defaultLayers);
  const { data: mapData } = useApi(ApiService.getMap);
  const toggle = (k: keyof typeof layers) => setLayers(p => ({ ...p, [k]: !p[k] }));
  return (
    <div className="dashboard-page" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <Layers size={13} style={{ color: 'var(--color-text-muted)' }} />
        <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Layers</span>
        {(Object.keys(layers) as (keyof typeof layers)[]).map(k => (
          <button key={k} className={`btn ${layers[k] ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '0.25rem 0.75rem', fontSize: '0.7rem' }}
            onClick={() => toggle(k)}>
            {k.replace(/([A-Z])/g, ' $1').trim()}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div className="map-card" style={{ height: '100%', position: 'relative' }}>
          <Suspense fallback={<MapLoader />}><LeafletMap layers={layers} mapData={mapData} onVillageSelect={onVillageSelect} selectedVillage={selectedVillage} villagePlan={villagePlan} /></Suspense>
          {villagePlan && <div className="selected-village-card"><b>{villagePlan.village.village_name}</b><span className={villagePlan.village.status === 'CRITICAL' ? 'risk-critical' : 'risk-normal'}>{villagePlan.village.status}</span><small>Risk {villagePlan.village.risk_score.toFixed(2)} · {villagePlan.village.population.toLocaleString()} people</small><strong>Relocate to {villagePlan.recommendations[0]?.name ?? 'no safe site'}</strong><small>{villagePlan.recommendations[0] ? `${villagePlan.recommendations[0].distance_km} km away · route highlighted` : 'No suitable site passed safety filters.'}</small></div>}
        </div>
      </div>
    </div>
  );
}

/* ── Overview (wired to real dashboard API) ── */
function Overview({ setPage, mapData, selectedVillage, villagePlan, onVillageSelect }: { setPage: (p: Page) => void; mapData: MapLayers | null; selectedVillage: Village | null; villagePlan: VillageRecommendation | null; onVillageSelect: (village: Village) => void }) {
  const { data: summary, loading } = useApi(ApiService.getDashboard);
  const [layers] = useState(defaultLayers);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* KPIs */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: '14px 16px', flexShrink: 0 }}>
        <KPICard label="Critical Zones"     value={summary?.critical_zones ?? 0}                             sub="Active risk zones"                                        danger  loading={loading} />
        <KPICard label="Population at Risk" value={summary ? summary.population_at_risk.toLocaleString() : 0} sub={`${summary?.affected_villages ?? 0} villages affected`}  danger  loading={loading} />
        <KPICard label="Blocked Roads"      value={summary?.blocked_roads ?? 0}                              sub="NH-10 affected"                                           danger  loading={loading} trend="steady" />
        <KPICard label="Safe Sites Ready"   value={summary?.safe_sites ?? 0}                                 sub={`${(summary?.total_safe_capacity ?? 0).toLocaleString()} capacity`} accent loading={loading} />
      </div>

      {/* Map + Right Panel */}
      <div className="dashboard-content" style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '0 16px 16px', gap: 12 }}>
        <div className="map-card" style={{ flex: 1, overflow: 'hidden', borderRadius: 10, border: '1px solid var(--color-border)', position: 'relative' }}>
          <Suspense fallback={<MapLoader />}><LeafletMap layers={layers} mapData={mapData} onVillageSelect={onVillageSelect} /></Suspense>
          {villagePlan && <div className="selected-village-card"><b>{villagePlan.village.village_name}</b><span className={villagePlan.village.status === 'CRITICAL' ? 'risk-critical' : 'risk-normal'}>{villagePlan.village.status}</span><small>Risk {villagePlan.village.risk_score.toFixed(2)} · {villagePlan.village.population.toLocaleString()} people</small><strong>{villagePlan.recommendations[0]?.name ?? 'No safe site available'}</strong><small>{villagePlan.recommendations[0] ? `${villagePlan.recommendations[0].distance_km} km · capacity ${villagePlan.recommendations[0].capacity.toLocaleString()}` : 'Check rejected-site reasons.'}</small></div>}
          <button onClick={() => setPage('riskmap')} style={{
            position: 'absolute', bottom: 14, left: 14, zIndex: 500,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 8,
            background: 'rgba(12,14,13,0.92)', border: '1px solid var(--color-danger-border)',
            backdropFilter: 'blur(12px)', cursor: 'pointer',
          }}>
            <div className="status-dot" style={{ background: 'var(--color-danger)', boxShadow: '0 0 6px var(--color-danger)', flexShrink: 0 }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-danger)' }}>CRITICAL — {summary?.affected_villages ?? '—'} villages</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-text-2)', marginTop: 2 }}>{summary?.population_at_risk?.toLocaleString() ?? '—'} people at risk · View exposure →</div>
            </div>
          </button>
        </div>
        <RightPanel />
      </div>
    </div>
  );
}

function MapLoader() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface-2)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 24, height: 24, border: '2px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Loading map…</div>
      </div>
    </div>
  );
}

/* ── Root ─────────────────────────────────────── */
export default function App() {
  const [page, setPage] = useState<Page>('overview');
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [villagePlan, setVillagePlan] = useState<VillageRecommendation | null>(null);
  const { data: villagesData } = useApi(ApiService.getVillages);
  const { data: mapData } = useApi(ApiService.getMap);
  const selectVillage = (village: Village) => {
    setSelectedVillage(village);
    ApiService.getVillageRecommendation(village.village_id).then(setVillagePlan).catch(() => setVillagePlan(null));
  };

  // Fetch alerts to drive sidebar badge + API health indicator
  const { error: alertsError } = useApi(ApiService.getVillages);
  const backendOnline = !alertsError && villagesData !== null;
  const activeAlertCount = villagesData?.villages.filter(village => village.status === 'CRITICAL').length ?? 0;

  return (
    <div className="app-shell" style={{ height: '100vh', width: '100vw', display: 'flex', overflow: 'hidden', background: 'var(--color-bg)', fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Sidebar page={page} setPage={setPage} activeAlertCount={activeAlertCount} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar page={page} backendOnline={backendOnline} villages={villagesData?.villages ?? []} onVillageSelect={selectVillage} />
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          <Suspense fallback={<div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>Loading…</div>}>
            {page === 'overview'   && <Overview setPage={setPage} mapData={mapData} selectedVillage={selectedVillage} villagePlan={villagePlan} onVillageSelect={selectVillage} />}
            {page === 'riskmap'   && <RiskMapPage selectedVillage={selectedVillage} villagePlan={villagePlan} onVillageSelect={selectVillage} />}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
