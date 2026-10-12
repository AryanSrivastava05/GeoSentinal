import React from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, CloudRain, AlertTriangle, Users } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { ApiService } from '../api/services';

const riskTrend = [
  { date: 'Sep 1', critical: 0, high: 2, medium: 4 },
  { date: 'Sep 2', critical: 0, high: 3, medium: 4 },
  { date: 'Sep 3', critical: 1, high: 3, medium: 5 },
  { date: 'Sep 4', critical: 1, high: 4, medium: 5 },
  { date: 'Sep 5', critical: 1, high: 4, medium: 4 },
  { date: 'Sep 6', critical: 2, high: 5, medium: 4 },
  { date: 'Sep 7', critical: 2, high: 5, medium: 3 },
  { date: 'Sep 8', critical: 2, high: 6, medium: 3 },
];

const incidentTrend = [
  { date: 'Sep 2', landslide: 0, crack: 1, road: 0, flood: 0 },
  { date: 'Sep 3', landslide: 0, crack: 1, road: 1, flood: 0 },
  { date: 'Sep 4', landslide: 1, crack: 1, road: 1, flood: 0 },
  { date: 'Sep 5', landslide: 1, crack: 2, road: 1, flood: 1 },
  { date: 'Sep 6', landslide: 1, crack: 2, road: 2, flood: 1 },
  { date: 'Sep 7', landslide: 1, crack: 2, road: 2, flood: 1 },
  { date: 'Sep 8', landslide: 2, crack: 3, road: 3, flood: 1 },
];

const exposureTrend = [
  { date: 'Sep 1', population: 3200  },
  { date: 'Sep 2', population: 4100  },
  { date: 'Sep 3', population: 6800  },
  { date: 'Sep 4', population: 7400  },
  { date: 'Sep 5', population: 8200  },
  { date: 'Sep 6', population: 10500 },
  { date: 'Sep 7', population: 11900 },
  { date: 'Sep 8', population: 12480 },
];

const tt = {
  contentStyle: { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 11, fontFamily: 'Outfit,sans-serif', color: '#e8ede9' },
};

function ChartCard({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="surface" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>{title}</span>
          </div>
          {subtitle && <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{subtitle}</span>}
        </div>
        <span className="badge badge-neutral">DEMO</span>
      </div>
      {children}
    </div>
  );
}

export default function Analytics() {
  const { data: weather, loading: wLoading } = useApi(ApiService.getWeather);
  const { data: summary, loading: sLoading } = useApi(ApiService.getExposureSummary);

  const rainfallData = weather?.history ?? [];
  const totalPop     = summary?.total_population_at_risk ?? 12480;

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ padding: '24px', maxWidth: 1400 }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Analytics</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
            7-day risk, rainfall, incident, and exposure trends · East Sikkim
          </p>
        </div>

        {/* Summary KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Peak Risk Score (7d)',  value: '0.91',                                                              color: 'var(--color-danger)',  icon: <TrendingUp size={16}/> },
            { label: 'Total Rainfall (7d)',   value: wLoading ? '—' : `${weather?.rainfall_7d ?? '—'} mm`,              color: 'var(--color-accent)',   icon: <CloudRain  size={16}/> },
            { label: 'Total Incidents (7d)',  value: '9',                                                                 color: 'var(--color-warning)', icon: <AlertTriangle size={16}/> },
            { label: 'Peak Population Risk',  value: sLoading ? '—' : totalPop.toLocaleString(),                        color: 'var(--color-text)',     icon: <Users size={16}/> },
          ].map(k => (
            <div key={k.label} className="surface" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span className="kpi-label">{k.label}</span>
                <span style={{ color: k.color }}>{k.icon}</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <ChartCard title="Rainfall Accumulation" subtitle="Daily observed rainfall (mm)" icon={<CloudRain size={14}/>}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={rainfallData}>
                <defs>
                  <linearGradient id="rfA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00c896" stopOpacity={0.22}/>
                    <stop offset="95%" stopColor="#00c896" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="day"  tick={{ fontSize: 10, fill: '#6b7770' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 10, fill: '#6b7770' }} axisLine={false} tickLine={false} width={32}/>
                <Tooltip {...tt} formatter={(v: number) => [`${v} mm`, 'Rainfall']}/>
                <Area type="monotone" dataKey="mm" stroke="#00c896" strokeWidth={1.5} fill="url(#rfA)" dot={{ r: 3, fill: '#00c896', strokeWidth: 0 }}/>
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Population at Risk" subtitle="Running total across active risk zones" icon={<Users size={14}/>}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={exposureTrend}>
                <defs>
                  <linearGradient id="popA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f05252" stopOpacity={0.22}/>
                    <stop offset="95%" stopColor="#f05252" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7770' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 10, fill: '#6b7770' }} axisLine={false} tickLine={false} width={44} tickFormatter={v => `${(v/1000).toFixed(0)}k`}/>
                <Tooltip {...tt} formatter={(v: number) => [v.toLocaleString(), 'People']}/>
                <Area type="monotone" dataKey="population" stroke="#f05252" strokeWidth={1.5} fill="url(#popA)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <ChartCard title="Active Risk Zones by Level" subtitle="7-day evolution" icon={<TrendingUp size={14}/>}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={riskTrend} barCategoryGap="30%">
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7770' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 10, fill: '#6b7770' }} axisLine={false} tickLine={false} width={20}/>
                <Tooltip {...tt}/>
                <Legend wrapperStyle={{ fontSize: 10, color: '#6b7770' }}/>
                <Bar dataKey="critical" name="Critical" fill="#f05252" radius={[3,3,0,0]}/>
                <Bar dataKey="high"     name="High"     fill="#f59e0b" radius={[3,3,0,0]}/>
                <Bar dataKey="medium"   name="Medium"   fill="#00c896" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Incident Reports by Type" subtitle="7-day cumulative" icon={<AlertTriangle size={14}/>}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={incidentTrend}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7770' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 10, fill: '#6b7770' }} axisLine={false} tickLine={false} width={20}/>
                <Tooltip {...tt}/>
                <Legend wrapperStyle={{ fontSize: 10, color: '#6b7770' }}/>
                <Line type="monotone" dataKey="landslide" name="Landslide"  stroke="#f05252" strokeWidth={1.5} dot={false}/>
                <Line type="monotone" dataKey="crack"     name="Crack"      stroke="#f59e0b" strokeWidth={1.5} dot={false}/>
                <Line type="monotone" dataKey="road"      name="Road Block" stroke="#3b9eff" strokeWidth={1.5} dot={false}/>
                <Line type="monotone" dataKey="flood"     name="Flooding"   stroke="#00c896" strokeWidth={1.5} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Data quality */}
        <div className="surface" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>Data Sources & Quality</span>
          </div>
          <table className="data-table">
            <thead><tr>{['Dataset','Source','Coverage','Last Updated','Mode','Status'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {[
                { dataset: 'Village Boundaries',    source: 'Census 2011',          coverage: '14 villages',        updated: 'Static',            mode: 'DEMO',        ok: true  },
                { dataset: 'Rainfall',              source: 'IMD (simulated)',       coverage: 'East Sikkim',        updated: 'Sep 8, 21:30',      mode: 'SIMULATION',  ok: true  },
                { dataset: 'Slope / DEM',           source: 'SRTM 30m',             coverage: 'East Sikkim',        updated: 'Static',            mode: 'DEMO',        ok: true  },
                { dataset: 'Historical Landslides', source: 'NRSC / GSI',           coverage: 'Partial',            updated: 'Not ingested',      mode: 'PLACEHOLDER', ok: false },
                { dataset: 'Road Network',          source: 'OSM (simulated)',       coverage: 'NH-10, SH-10, SH-11',updated: 'Sep 8, 16:00',     mode: 'DEMO',        ok: true  },
                { dataset: 'ML Risk Model',         source: 'XGBoost (not trained)','coverage': '—',               updated: '—',                 mode: 'NOT ACTIVE',  ok: false },
              ].map((row, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>{row.dataset}</td>
                  <td style={{ color: 'var(--color-text-2)' }}>{row.source}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{row.coverage}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{row.updated}</td>
                  <td><span className={`badge ${row.mode === 'NOT ACTIVE' ? 'badge-danger' : row.mode === 'PLACEHOLDER' ? 'badge-warning' : 'badge-neutral'}`}>{row.mode}</span></td>
                  <td><div className="status-dot" style={{ background: row.ok ? 'var(--color-success)' : 'var(--color-warning)' }}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
