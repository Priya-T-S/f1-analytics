import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Official Pirelli compound colours.
const COMPOUND_COLORS = {
  SOFT: '#ff3333',
  MEDIUM: '#ffd12e',
  HARD: '#f0f0ec',
  INTERMEDIATE: '#43b02a',
  WET: '#0067ad',
};
const colorFor = (compound) => COMPOUND_COLORS[compound] || '#5a5a6e';

const StintTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: '12px 16px', fontSize: '0.8rem'
    }}>
      <div style={{ color: '#8a8a9e', marginBottom: 4 }}>{label}</div>
      {payload.map(p => {
        const n = p.dataKey.replace('len', '');
        const row = p.payload;
        return (
          <div key={p.dataKey} style={{ color: colorFor(row[`compound${n}`]), fontWeight: 600 }}>
            Stint {n}: {row[`compound${n}`] || 'Unknown'}, laps {row[`start${n}`]}–{row[`end${n}`]}
          </div>
        );
      })}
    </div>
  );
};

// stints: [{ code, stint, compound, lap_start, lap_end }] ordered by finishing position.
export default function TyreStrategyChart({ stints, totalLaps }) {
  if (!stints?.length) return null;

  const rows = [];
  const byDriver = new Map();
  for (const s of stints) {
    if (!byDriver.has(s.code)) {
      const row = { code: s.code };
      byDriver.set(s.code, row);
      rows.push(row);
    }
    const row = byDriver.get(s.code);
    const end = s.lap_end ?? totalLaps;
    row[`len${s.stint}`] = end - s.lap_start + 1;
    row[`compound${s.stint}`] = s.compound;
    row[`start${s.stint}`] = s.lap_start;
    row[`end${s.stint}`] = end;
  }
  const maxStint = Math.max(...stints.map(s => s.stint));

  return (
    <div className="card mb-6">
      <div className="card-header">
        <h3>Tyre Strategy</h3>
        <div className="flex gap-4 text-sm">
          {Object.entries(COMPOUND_COLORS).map(([name, color]) => (
            <span key={name} className="flex items-center gap-2">
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
              {name.charAt(0) + name.slice(1).toLowerCase()}
            </span>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(240, rows.length * 24)}>
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }} barCategoryGap={4}>
          <XAxis type="number" domain={[0, totalLaps || 'auto']} stroke="#5a5a6e" tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="code" stroke="#5a5a6e" tick={{ fontSize: 12 }} width={48} interval={0} />
          <Tooltip content={<StintTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          {Array.from({ length: maxStint }, (_, i) => i + 1).map(n => (
            <Bar key={n} dataKey={`len${n}`} stackId="stints" stroke="#0a0a0f" strokeWidth={2} isAnimationActive={false}>
              {rows.map(row => <Cell key={row.code} fill={colorFor(row[`compound${n}`])} />)}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
