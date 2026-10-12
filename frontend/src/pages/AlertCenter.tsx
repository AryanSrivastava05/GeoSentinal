import React, { useState } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { ApiService, type Alert, type AlertStatus } from '../api/services';

const STATUS_TABS: { label: string; value: AlertStatus | 'ALL' }[] = [
  { label: 'All',          value: 'ALL' },
  { label: 'Active',       value: 'ACTIVE' },
  { label: 'Acknowledged', value: 'ACKNOWLEDGED' },
  { label: 'Resolved',     value: 'RESOLVED' },
];

const riskColor = (l: string) =>
  ({ CRITICAL: '#f05252', HIGH: '#f59e0b', MEDIUM: '#00c896', LOW: '#22c55e' }[l] ?? '#6b7770');
const riskBg = (l: string) =>
  ({ CRITICAL: 'rgba(240,82,82,0.10)', HIGH: 'rgba(245,158,11,0.10)', MEDIUM: 'rgba(0,200,150,0.10)', LOW: 'rgba(34,197,94,0.10)' }[l] ?? '');

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

const statusStyle = (s: string) => ({
  ACTIVE:       { color: 'var(--color-danger)',  bg: 'var(--color-danger-dim)',  label: 'ACTIVE' },
  ACKNOWLEDGED: { color: 'var(--color-warning)', bg: 'var(--color-warning-dim)', label: 'ACK' },
  ESCALATED:    { color: 'var(--color-danger)',  bg: 'var(--color-danger-dim)',  label: 'ESCALATED' },
  RESOLVED:     { color: 'var(--color-success)', bg: 'var(--color-success-dim)', label: 'RESOLVED' },
}[s] ?? { color: '#6b7770', bg: '', label: s });

export default function AlertCenter() {
  const [filter, setFilter]   = useState<AlertStatus | 'ALL'>('ALL');
  const [selected, setSelected] = useState<Alert | null>(null);

  const { data: allAlerts, loading, refetch } = useApi(ApiService.getAlerts);
  const { data: _filtered } = useApi(
    () => filter === 'ALL' ? ApiService.getAlerts() : ApiService.getAlerts(filter),
    [filter],
  );
  const filtered = _filtered ?? [];

  // Select first alert once loaded
  React.useEffect(() => {
    if (!selected && filtered.length > 0) setSelected(filtered[0]);
  }, [filtered.length]);

  const handleAcknowledge = async (alert: Alert) => {
    await ApiService.updateAlertStatus(alert.id, 'ACKNOWLEDGED');
    refetch();
    setSelected(s => s ? { ...s, status: 'ACKNOWLEDGED' } : s);
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* List */}
      <div style={{ width: 360, flexShrink: 0, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-border)' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Alert Center</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
            {loading ? 'Loading…' : `${allAlerts?.filter(a => a.status === 'ACTIVE').length ?? 0} active · ${allAlerts?.length ?? 0} total`}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}>
          {STATUS_TABS.map(tab => (
            <button key={tab.value} onClick={() => setFilter(tab.value)}
              style={{
                flex: 1, fontSize: '0.7rem', fontWeight: 700, padding: '6px 4px', borderRadius: 6, cursor: 'pointer', border: '1px solid',
                background: filter === tab.value ? 'var(--color-primary-dim)' : 'transparent',
                color: filter === tab.value ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                borderColor: filter === tab.value ? 'var(--color-primary-border)' : 'transparent',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Alert list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {loading ? (
            <div style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>Loading alerts…</div>
          ) : filtered.map(alert => {
            const ss = statusStyle(alert.status);
            const isSelected = selected?.id === alert.id;
            return (
              <div key={alert.id} onClick={() => setSelected(alert)}
                style={{
                  padding: '14px', borderRadius: 10, marginBottom: 8, cursor: 'pointer',
                  background: isSelected ? riskBg(alert.risk_level) : 'var(--color-surface-2)',
                  border: `1px solid ${isSelected ? riskColor(alert.risk_level) + '40' : 'var(--color-border)'}`,
                  transition: 'all 0.15s',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                      <span className="badge" style={{ background: riskBg(alert.risk_level), color: riskColor(alert.risk_level), borderColor: riskColor(alert.risk_level) + '40' }}>
                        {alert.risk_level}
                      </span>
                      <span className="badge" style={{ background: ss.bg, color: ss.color, border: 'none' }}>{ss.label}</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>{alert.region_name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <Clock size={10} style={{ color: 'var(--color-text-faint)' }} />
                      <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{fmtDate(alert.created_at)} · {fmtTime(alert.created_at)}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: riskColor(alert.risk_level) }}>{alert.risk_score}</div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)' }}>score</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {selected ? (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <span className="badge" style={{ background: riskBg(selected.risk_level), color: riskColor(selected.risk_level), borderColor: riskColor(selected.risk_level) + '40', fontSize: 11 }}>
                  {selected.risk_level} RISK
                </span>
                <span className="badge badge-danger">{selected.status}</span>
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{selected.region_name}</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                {fmtDate(selected.created_at)} at {fmtTime(selected.created_at)} · Risk Score:{' '}
                <strong style={{ color: riskColor(selected.risk_level) }}>{selected.risk_score}</strong>
              </p>
            </div>

            <div className="surface" style={{ padding: 16, marginBottom: 20 }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text)', lineHeight: 1.6, margin: 0 }}>{selected.message}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Villages Affected',  value: selected.affected_villages,              color: riskColor(selected.risk_level) },
                { label: 'Population at Risk', value: selected.affected_population.toLocaleString(), color: 'var(--color-text)' },
                { label: 'Risk Score',         value: selected.risk_score,                    color: riskColor(selected.risk_level) },
              ].map(s => (
                <div key={s.label} className="surface" style={{ padding: 16 }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div className="surface" style={{ padding: 20 }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: 16 }}>Recommended Actions</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Issue official warning to district administration',
                  'Deploy field verification team to affected area',
                  'Prepare safe site at Gangtok Sports Complex',
                  'Alert NH-10 traffic authorities of potential closure',
                ].map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', color: 'var(--color-text-2)' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--color-primary-dim)', border: '1px solid var(--color-primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-primary-light)', flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    {a}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleAcknowledge(selected)}>
                  <ArrowRight size={14} /> Acknowledge Alert
                </button>
                <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Escalate</button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-faint)', fontSize: '0.82rem' }}>
            Select an alert to view details
          </div>
        )}
      </div>
    </div>
  );
}
