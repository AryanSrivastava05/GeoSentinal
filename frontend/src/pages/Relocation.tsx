import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { ApiService, type RiskLevel } from '../api/services';

const riskColor = (l: RiskLevel) =>
  ({ CRITICAL: '#f05252', HIGH: '#f59e0b', MEDIUM: '#00c896', LOW: '#22c55e' }[l]);
const riskBg = (l: RiskLevel) =>
  ({ CRITICAL: 'rgba(240,82,82,0.10)', HIGH: 'rgba(245,158,11,0.10)', MEDIUM: 'rgba(0,200,150,0.10)', LOW: 'rgba(34,197,94,0.10)' }[l]);

export default function Relocation() {
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);

  const { data: sites, loading: sitesLoading } = useApi(ApiService.getSafeLocations);
  const [plan, setPlan] = useState<Awaited<ReturnType<typeof ApiService.generateRelocationPlan>> | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await ApiService.generateRelocationPlan();
      setPlan(result);
      setGenerated(true);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Relocation Intelligence</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: 4 }}>Safe site suitability scoring · Capacity estimation · Plan generation</p>
          </div>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
            {generating ? '⏳ Generating…' : generated ? '↻ Regenerate Plan' : '⚡ Generate Relocation Plan'}
          </button>
        </div>

        {/* Safe sites */}
        <h3 className="section-label" style={{ marginBottom: 12 }}>Recommended Safe Sites</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {sitesLoading ? (
            <div style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Loading…</div>
          ) : (sites ?? []).map((sl, i) => {
            const pct = Math.round(sl.suitability_score * 100);
            return (
              <div key={sl.id} className="surface" style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#0c0e0d', flexShrink: 0, background: i === 0 ? 'var(--color-primary)' : i === 1 ? '#5eecc6' : 'var(--color-accent)' }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)' }}>{sl.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {sl.road_access} · {sl.distance_km} km away
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>{pct}%</div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)' }}>Suitability</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>{sl.capacity.toLocaleString()}</div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)' }}>Capacity</div>
                    </div>
                    <span className="badge" style={{ color: riskColor(sl.hazard_level), background: riskBg(sl.hazard_level), borderColor: riskColor(sl.hazard_level) + '40' }}>
                      {sl.hazard_level} HAZARD
                    </span>
                  </div>
                  <div style={{ width: 120 }}>
                    <div className="stat-bar-track">
                      <div className="stat-bar-fill" style={{ width: `${pct}%`, background: 'var(--color-primary)' }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Generated plan */}
        {generated && plan && (
          <>
            <h3 className="section-label" style={{ marginBottom: 12 }}>Relocation Plan Output</h3>

            {/* Status banner */}
            <div style={{
              padding: 20, borderRadius: 10, marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 16,
              background: plan.unassigned === 0 ? 'var(--color-success-dim)' : 'var(--color-danger-dim)',
              border: `1px solid ${plan.unassigned === 0 ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`,
            }}>
              <ShieldCheck size={28} style={{ color: plan.unassigned === 0 ? 'var(--color-success)' : 'var(--color-danger)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: plan.unassigned === 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {plan.unassigned === 0 ? '✓ All People Accommodated' : `⚠ Capacity Shortage — ${plan.unassigned.toLocaleString()} unallocated`}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  {plan.total_pop_assigned.toLocaleString()} assigned · {plan.total_capacity.toLocaleString()} total capacity · {plan.unassigned} unassigned
                </div>
              </div>
            </div>

            {/* Allocation table */}
            <div className="surface" style={{ overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>{['Safe Site', 'Source Villages', 'Assigned', 'Capacity', 'Utilisation'].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {plan.rows.map((row, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>{row.site}</td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{row.source_villages.join(', ')}</td>
                      <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{row.assigned_population.toLocaleString()}</td>
                      <td style={{ color: 'var(--color-text)' }}>{row.capacity.toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="stat-bar-track" style={{ flex: 1 }}>
                            <div className="stat-bar-fill" style={{ width: `${row.utilisation_pct}%`, background: row.utilisation_pct >= 90 ? 'var(--color-warning)' : 'var(--color-primary)' }} />
                          </div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', minWidth: 32 }}>{row.utilisation_pct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
