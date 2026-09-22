import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div style={{
      background: '#1a1a2e',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8,
      padding: '12px 16px',
      fontSize: '0.8rem'
    }}>
      <div style={{ color: '#8a8a9e', marginBottom: 4 }}>Round {label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value.toFixed(1)} pts
        </div>
      ))}
    </div>
  );
};

export default function PointsChart({ data, drivers, title = 'Points Progression' }) {
  if (!data || data.length === 0) return null;
  const colors = ['#e10600', '#3b82f6', '#00d2be', '#ff8700', '#facc15', '#a855f7'];
  return (
    <div className="card">
      <div className="card-header">
        <h3>{title}</h3>
        <div className="flex gap-4 text-sm">
          {drivers?.map((d, i) => (
            <span key={d.code} className="flex items-center gap-2" title={d.name}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: colors[i % colors.length], display: 'inline-block' }} />
              {d.code}
            </span>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            {drivers?.map((d, i) => (
              <linearGradient key={i} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={0.2} />
                <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="round" stroke="#5a5a6e" tick={{ fontSize: 12 }} />
          <YAxis stroke="#5a5a6e" tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          {drivers?.map((d, i) => (
            <Area
              key={d.code || i}
              type="monotone"
              dataKey={d.code || d.key}
              stroke={colors[i % colors.length]}
              fill={`url(#grad-${i})`}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
