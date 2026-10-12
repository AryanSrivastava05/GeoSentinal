import React, { useState } from 'react';
import { Plus, X, Upload } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { ApiService, type Incident, type IncidentCat, type IncidentStat, type RiskLevel } from '../api/services';

const TYPE_TABS: { label: string; value: IncidentCat | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Landslide', value: 'LANDSLIDE' },
  { label: 'Road Block', value: 'ROAD_BLOCKAGE' },
  { label: 'Flooding', value: 'FLOODING' },
  { label: 'Crack', value: 'CRACK' },
];

const riskColor = (l: RiskLevel) =>
  ({ CRITICAL: '#f05252', HIGH: '#f59e0b', MEDIUM: '#00c896', LOW: '#22c55e' }[l]);
const riskBg = (l: RiskLevel) =>
  ({ CRITICAL: 'rgba(240,82,82,0.10)', HIGH: 'rgba(245,158,11,0.10)', MEDIUM: 'rgba(0,200,150,0.10)', LOW: 'rgba(34,197,94,0.10)' }[l]);

const statusBadge = (s: IncidentStat) => ({
  VERIFIED:             { bg: 'var(--color-success-dim)', color: 'var(--color-success)',      label: '✓ Verified' },
  PENDING_VERIFICATION: { bg: 'var(--color-warning-dim)', color: 'var(--color-warning)',      label: '⏳ Pending' },
  SUBMITTED:            { bg: 'var(--color-primary-dim)', color: 'var(--color-primary-light)',label: '↑ Submitted' },
  REJECTED:             { bg: 'rgba(107,119,112,0.12)',  color: 'var(--color-text-muted)',    label: '✕ Rejected' },
}[s]);

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

interface FormState {
  type: IncidentCat; description: string; village: string;
  severity: RiskLevel; reported_by: string;
}

export default function Incidents() {
  const [typeFilter, setTypeFilter] = useState<IncidentCat | 'ALL'>('ALL');
  const [isModalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting]  = useState(false);
  const [form, setForm] = useState<FormState>({
    type: 'LANDSLIDE', description: '', village: '',
    severity: 'HIGH', reported_by: '',
  });

  const { data: incidents, loading, refetch } = useApi(
    () => typeFilter === 'ALL'
      ? ApiService.getIncidents()
      : ApiService.getIncidents(undefined, typeFilter),
    [typeFilter],
  );

  const handleSubmit = async () => {
    if (!form.description || !form.village) return;
    setSubmitting(true);
    try {
      await ApiService.createIncident({ ...form, lat: 27.3, lng: 88.6 });
      setModalOpen(false);
      setForm({ type: 'LANDSLIDE', description: '', village: '', severity: 'HIGH', reported_by: '' });
      refetch();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Incident Reports</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
              {loading ? 'Loading…' : `${incidents?.filter(i => i.status === 'PENDING_VERIFICATION').length ?? 0} pending · ${incidents?.length ?? 0} total`}
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={14} /> Report Incident
          </button>
        </div>

        {/* Type tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {TYPE_TABS.map(tab => (
            <button key={tab.value} className="btn" onClick={() => setTypeFilter(tab.value)}
              style={{
                background: typeFilter === tab.value ? 'var(--color-primary-dim)' : 'var(--color-surface)',
                color: typeFilter === tab.value ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                borderColor: typeFilter === tab.value ? 'var(--color-primary-border)' : 'var(--color-border)',
                fontWeight: 700,
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="surface" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>Loading incidents…</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  {['Type', 'Village', 'Description', 'Severity', 'Status', 'Reporter', 'Time'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(incidents ?? []).map(inc => {
                  const sb = statusBadge(inc.status);
                  return (
                    <tr key={inc.id} style={{ cursor: 'pointer' }}>
                      <td>
                        <span className="badge" style={{ background: riskBg(inc.severity), color: riskColor(inc.severity), borderColor: riskColor(inc.severity) + '30' }}>
                          {inc.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>{inc.village}</td>
                      <td style={{ color: 'var(--color-text-muted)', maxWidth: 240 }}>
                        <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {inc.description}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: riskColor(inc.severity) }}>{inc.severity}</span>
                      </td>
                      <td>
                        <span className="badge" style={{ background: sb.bg, color: sb.color, border: 'none' }}>{sb.label}</span>
                      </td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{inc.reported_by}</td>
                      <td style={{ color: 'var(--color-text-muted)' }}>
                        <div>{fmtDate(inc.created_at)}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--color-text-faint)' }}>{fmtTime(inc.created_at)}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(12,14,13,0.85)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div className="surface" style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>Report New Incident</h3>
              <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setModalOpen(false)}><X size={16} /></button>
            </div>
            <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {([
                { label: 'Incident Type', field: 'type', type: 'select', options: ['LANDSLIDE','ROAD_BLOCKAGE','CRACK','FLOODING','SLOPE_MOVEMENT','DRAINAGE_FAILURE','OTHER'] },
                { label: 'Village / Location', field: 'village', type: 'text', placeholder: 'e.g. Rongli' },
                { label: 'Description', field: 'description', type: 'textarea', placeholder: 'Describe what you observed…' },
                { label: 'Severity', field: 'severity', type: 'select', options: ['CRITICAL','HIGH','MEDIUM','LOW'] },
                { label: 'Your Name (optional)', field: 'reported_by', type: 'text', placeholder: 'Anonymous' },
              ] as any[]).map(f => (
                <div key={f.field}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 5 }}>{f.label}</label>
                  {f.type === 'select' ? (
                    <select className="input" style={{ width: '100%' }}
                      value={(form as any)[f.field]}
                      onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))}>
                      {f.options.map((o: string) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea className="input" rows={3} placeholder={f.placeholder} style={{ width: '100%', resize: 'vertical' }}
                      value={(form as any)[f.field]}
                      onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))} />
                  ) : (
                    <input className="input" type="text" placeholder={f.placeholder} style={{ width: '100%' }}
                      value={(form as any)[f.field]}
                      onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))} />
                  )}
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 5 }}>Media Evidence (optional)</label>
                <div style={{ border: '1px dashed var(--color-border-strong)', borderRadius: 8, padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                  <Upload size={18} style={{ margin: '0 auto 6px', color: 'var(--color-text-2)' }} />
                  <span style={{ fontSize: '0.72rem' }}>Click to upload image</span>
                </div>
              </div>
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-2)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
