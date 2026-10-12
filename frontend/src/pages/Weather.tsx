import React from 'react';
import { CloudRain, Wind, Thermometer, Droplets, MapPin } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApi } from '../hooks/useApi';
import { ApiService } from '../api/services';

const forecastData = [
  { time: '12:00', rain: 12 }, { time: '15:00', rain: 28 },
  { time: '18:00', rain: 15 }, { time: '21:00', rain: 5  },
  { time: '00:00', rain: 2  }, { time: '03:00', rain: 0  },
];

const ttStyle = {
  contentStyle: { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 11, fontFamily: 'Outfit,sans-serif', color: '#e8ede9' },
};

export default function Weather() {
  const { data: weather, loading } = useApi(ApiService.getWeather);

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ padding: '24px', maxWidth: 1200 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Weather & Environmental Data</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
              East Sikkim · Last updated: {weather ? new Date(weather.last_updated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
            </p>
          </div>
          <span className="badge badge-neutral">IMD Simulated · {weather?.data_mode ?? '—'}</span>
        </div>

        {/* Current conditions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { icon: <Thermometer size={16}/>, label: 'Temperature',  value: '21°C',         sub: 'Feels like 23°C', color: 'var(--color-text)' },
            { icon: <CloudRain  size={16}/>, label: '24h Rainfall',  value: loading ? '—' : `${weather?.rainfall_24h ?? '—'} mm`, sub: `Intensity: ${weather?.rainfall_intensity ?? '—'}`, color: 'var(--color-warning)' },
            { icon: <Droplets   size={16}/>, label: 'Soil Moisture', value: loading ? '—' : '98%',  sub: weather?.soil_moisture ?? '—', color: 'var(--color-danger)' },
            { icon: <Wind       size={16}/>, label: 'Wind',          value: '14 km/h',       sub: 'Gusts 22 km/h SE', color: 'var(--color-text)' },
          ].map(k => (
            <div key={k.label} className="surface" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-muted)', marginBottom: 12 }}>
                {k.icon}
                <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: '0.72rem', color: k.color === 'var(--color-danger)' ? 'var(--color-danger)' : 'var(--color-text-muted)', marginTop: 4, fontWeight: k.color === 'var(--color-danger)' ? 600 : 400 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {/* 7-day history */}
          <div className="surface" style={{ padding: 20 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: 16 }}>7-Day Rainfall History</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weather?.history ?? []}>
                <defs>
                  <linearGradient id="rfW" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00c896" stopOpacity={0.28}/>
                    <stop offset="95%" stopColor="#00c896" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7770' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 10, fill: '#6b7770' }} axisLine={false} tickLine={false} width={30}/>
                <Tooltip {...ttStyle}/>
                <Area type="monotone" dataKey="mm" stroke="#00c896" strokeWidth={2} fill="url(#rfW)"
                  dot={{ r: 4, fill: '#0c0e0d', stroke: '#00c896', strokeWidth: 2 }}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 24h forecast */}
          <div className="surface" style={{ padding: 20 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: 16 }}>Next 24h Forecast</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={forecastData}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6b7770' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 10, fill: '#6b7770' }} axisLine={false} tickLine={false} width={30}/>
                <Tooltip {...ttStyle} cursor={{ fill: 'var(--color-surface-2)' }}/>
                <Bar dataKey="rain" name="Rain (mm)" fill="#3b9eff" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stations */}
        <div className="surface" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>Observation Stations</span>
          </div>
          <table className="data-table">
            <thead><tr>{['Station','Location','Last Reading','Status'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {[
                { name: 'Gangtok AWS',          coords: '27.3389° N, 88.6065° E', ago: '10 mins ago',  status: 'ONLINE' },
                { name: 'Pakyong AWS',           coords: '27.2067° N, 88.6100° E', ago: '15 mins ago',  status: 'ONLINE' },
                { name: 'Rongli River Gauge',    coords: '27.2077° N, 88.7441° E', ago: '2 hours ago',  status: 'DEGRADED' },
              ].map(s => (
                <tr key={s.name}>
                  <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                    <MapPin size={11} style={{ display: 'inline', marginRight: 5, color: 'var(--color-text-muted)' }}/>
                    {s.name}
                  </td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{s.coords}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{s.ago}</td>
                  <td>
                    <span className={`badge ${s.status === 'ONLINE' ? 'badge-success' : 'badge-warning'}`}>{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
