import React from 'react';
import { AlertTriangle, CloudRain, Clock } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { useApi } from '../hooks/useApi';
import { ApiService, type RiskLevel, type IncidentStat } from '../api/services';

const riskColor = (l: RiskLevel) =>
  ({ CRITICAL: '#f05252', HIGH: '#f59e0b', MEDIUM: '#00c896', LOW: '#22c55e' }[l]);

const statusBadgeClass = (s: IncidentStat) =>
  s === 'VERIFIED' ? 'badge-success' : s === 'PENDING_VERIFICATION' ? 'badge-warning' : 'badge-primary';

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const statusLabel = (s: IncidentStat) =>
  s === 'PENDING_VERIFICATION' ? 'Pending' : s.charAt(0) + s.slice(1).toLowerCase();

export default function RightPanel() {
  const { data: alerts }    = useApi(ApiService.getAlerts);
  const { data: weather }   = useApi(ApiService.getWeather, [], 10 * 60 * 1000);
  const { data: incidents } = useApi(ApiService.getIncidents);

  const topAlert      = alerts?.find(a => a.status === 'ACTIVE');
  const recentInc     = (incidents ?? []).slice(0, 4);
  const rainfallData  = weather?.history ?? [];

  return (
    <div style={{ width: 288, flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>

      {/* Active Alert */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 14px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
        <AlertTriangle size={12} style={{ color: 'var(--color-danger)' }} />
        <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Active Alert</span>
        <span className="badge badge-danger critical-badge" style={{ marginLeft: 'auto' }}>CRITICAL</span>
      </div>

      {topAlert ? (
        <div style={{ padding: '12px 14px', flexShrink: 0 }}>
          <div style={{ borderRadius: 8, border: '1px solid var(--color-danger-border)', background: 'var(--color-danger-dim)', padding: 12 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>{topAlert.region_name}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-2)', lineHeight: 1.5, marginBottom: 10 }}>{topAlert.message}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'Villages', value: topAlert.affected_villages },
                { label: 'At Risk',  value: topAlert.affected_population.toLocaleString() },
                { label: 'Score',    value: topAlert.risk_score },
              ].map(s => (
                <div key={s.label} style={{ background: 'rgba(12,14,13,0.5)', borderRadius: 6, padding: 8, border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-danger)' }}>{s.value}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', marginTop: 1 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'center', marginTop: 10, fontSize: '0.75rem' }}>
              View Full Alert →
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '16px 14px', flexShrink: 0, color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>No active alerts</div>
      )}

      {/* Rainfall */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 14px', borderBottom: '1px solid var(--color-border)', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
        <CloudRain size={12} style={{ color: 'var(--color-primary)' }} />
        <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Rainfall — 7 Days</span>
        <span className="badge badge-warning" style={{ marginLeft: 'auto' }}>{weather?.rainfall_intensity?.toUpperCase() ?? 'LIVE'}</span>
      </div>
      <div style={{ padding: '12px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
              {weather?.rainfall_7d ?? '—'}<span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 3 }}>mm</span>
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)' }}>7-day total</div>
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-warning)', letterSpacing: '-0.02em' }}>
              {weather?.rainfall_24h ?? '—'}<span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 3 }}>mm</span>
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)' }}>Last 24h</div>
          </div>
        </div>
        <div style={{ height: 64 }}>
          {!weather ? <div className="chart-skeleton" aria-label="Loading rainfall chart"><span /><span /><span /><span /><span /></div> : <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rainfallData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rfG2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00c896" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#00c896" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 8, fill: '#6b7770' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 10, fontFamily: 'Outfit,sans-serif', color: '#e8ede9' }} />
              <Area type="monotone" dataKey="mm" stroke="#00c896" strokeWidth={1.5} fill="url(#rfG2)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>}
        </div>
        <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', marginTop: 6 }}>
          Soil: <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{weather?.soil_moisture ?? '—'}</span>
          <span style={{ marginLeft: 8 }}>· {weather?.data_mode ?? 'Weather unavailable'}</span>
        </div>
      </div>

      {/* Incidents feed */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 14px', borderBottom: '1px solid var(--color-border)', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
        <Clock size={12} style={{ color: 'var(--color-text-muted)' }} />
        <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Recent Incidents</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
        {recentInc.map(inc => (
          <div key={inc.id} style={{ padding: '9px 10px', marginBottom: 4, borderRadius: 7, border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-border-strong)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <div className="status-dot" style={{ background: riskColor(inc.severity) }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text)' }}>{inc.village}</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                  {inc.type.replace(/_/g, ' ')}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)' }}>{fmtTime(inc.created_at)}</div>
                <div style={{ marginTop: 4 }}>
                  <span className={`badge ${statusBadgeClass(inc.status)}`}>{statusLabel(inc.status)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '8px 14px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div className="status-dot" style={{ background: 'var(--color-warning)' }} />
          <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>DEMO DATA</span>
        </span>
        <span style={{ fontSize: '0.62rem', color: 'var(--color-text-faint)' }}>
          {weather ? new Date(weather.last_updated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST' : '—'}
        </span>
      </div>
    </div>
  );
}
