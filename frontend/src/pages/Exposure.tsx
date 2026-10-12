import React from 'react';
import { Users, MapPin, TrendingUp } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { ApiService, type RiskLevel } from '../api/services';

const riskColor = (l: RiskLevel) =>
  ({ CRITICAL: '#f05252', HIGH: '#f59e0b', MEDIUM: '#00c896', LOW: '#22c55e' }[l]);
const riskBg = (l: RiskLevel) =>
  ({ CRITICAL: 'rgba(240,82,82,0.10)', HIGH: 'rgba(245,158,11,0.10)', MEDIUM: 'rgba(0,200,150,0.10)', LOW: 'rgba(34,197,94,0.10)' }[l]);
const roadStatusColor = (s: string) =>
  ({ OPEN: '#22c55e', RESTRICTED: '#f59e0b', BLOCKED: '#f05252', UNKNOWN: '#6b7770' }[s] ?? '#6b7770');

const ROADS = [
  { name: 'NH-10 (Rangpo–Rongli)',   status: 'BLOCKED',     location: 'km 34, near Rongli' },
  { name: 'SH-11 (Rhenock–Aritar)', status: 'RESTRICTED',  location: 'km 23' },
  { name: 'Old Silk Route',          status: 'UNKNOWN',     location: 'Kupup sector' },
  { name: 'NH-10 (Rangpo–Singtam)', status: 'OPEN',        location: '—' },
  { name: 'NH-717A (Pakyong)',       status: 'OPEN',        location: '—' },
];

export default function Exposure() {
  const { data: villages, loading: vLoading } = useApi(ApiService.getVillages);
  const { data: summary, loading: sLoading }  = useApi(ApiService.getExposureSummary);

  const loading = vLoading || sLoading;

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Exposure Analysis</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
              Population and infrastructure within active risk zones · East Sikkim
            </p>
          </div>
          <span className="badge badge-warning">DEMO / SIMULATION</span>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Population at Risk', value: loading ? '—' : (summary?.total_population_at_risk ?? 0).toLocaleString(), color: 'var(--color-danger)', icon: <Users size={18}/> },
            { label: 'Critical Villages',  value: loading ? '—' : (summary?.by_risk_level?.CRITICAL?.villages ?? 0),         color: 'var(--color-danger)', icon: <MapPin size={18}/> },
            { label: 'High Risk Villages', value: loading ? '—' : (summary?.by_risk_level?.HIGH?.villages ?? 0),             color: 'var(--color-warning)', icon: <MapPin size={18}/> },
            { label: 'Blocked / Restricted Roads', value: '1 / 1', color: 'var(--color-danger)', icon: <TrendingUp size={18}/> },
          ].map(k => (
            <div key={k.label} className="surface" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="kpi-label">{k.label}</span>
                <span style={{ color: k.color }}>{k.icon}</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Village table */}
          <div className="surface" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>Villages at Risk</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{villages?.length ?? 0} total</span>
            </div>
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Loading…</div>
              ) : (villages ?? []).map(v => (
                <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 18px', borderBottom: '1px solid var(--color-border-subtle)', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="status-dot" style={{ background: riskColor(v.risk_level) }} />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)' }}>{v.name}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{v.district}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text)' }}>{v.population.toLocaleString()}</div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: riskColor(v.risk_level) }}>{v.risk_level}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Roads */}
            <div className="surface" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>Road Connectivity</span>
              </div>
              {ROADS.map(r => (
                <div key={r.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 18px', borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)' }}>{r.name}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{r.location}</div>
                  </div>
                  <span className="badge" style={{ color: roadStatusColor(r.status), background: roadStatusColor(r.status) + '18', borderColor: roadStatusColor(r.status) + '40' }}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Priority queue */}
            <div className="surface" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>Emergency Priority Queue</span>
              </div>
              {loading ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Loading…</div>
              ) : (summary?.operational_priority_queue ?? []).map((item, i) => (
                <div key={item.village} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#0c0e0d', flexShrink: 0, background: i === 0 ? 'var(--color-danger)' : i < 3 ? 'var(--color-warning)' : 'var(--color-primary)' }}>
                    P{item.rank}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)' }}>{item.village}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{item.population.toLocaleString()} people · Score {item.risk_score}</div>
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: riskColor(item.risk_level) }}>{item.risk_level}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
