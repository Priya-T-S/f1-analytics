import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRace, getRaceResults } from '../api/client';
import { positionClass } from '../utils/helpers';
import DataTable from '../components/common/DataTable';
import Loader from '../components/common/Loader';

export default function RaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getRace(id),
      getRaceResults(id),
    ]).then(([race, results]) => {
      setData({ race: race.data, results: results.data });
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;
  if (!data) return <div>Race not found</div>;

  const { race, results } = data;

  const columns = [
    { key: 'position', label: 'Pos', width: '60px', render: (r) => (
      <span className={`position-badge ${positionClass(r.position)}`}>
        {r.position || 'DNF'}
      </span>
    )},
    { key: 'driver_name', label: 'Driver', render: (r) => (
      <span style={{ fontWeight: 600, cursor: 'pointer' }}
        onClick={() => navigate(`/drivers/${r.driver_id}`)}
      >
        {r.driver_name} <span style={{ color: 'var(--accent-red)' }}>{r.code}</span>
      </span>
    )},
    { key: 'constructor_name', label: 'Team', render: (r) => (
      <span className="constructor-badge">
        <span className="constructor-dot" style={{ background: r.constructor_color }} />
        {r.constructor_name}
      </span>
    )},
    { key: 'grid_position', label: 'Grid' },
    { key: 'points', label: 'Pts', render: (r) => <strong>{r.points}</strong> },
    { key: 'laps_completed', label: 'Laps' },
    { key: 'status', label: 'Status', render: (r) => (
      <span className={`tag ${r.status === 'Finished' ? '' : 'dnf'}`}
        style={r.status !== 'Finished' ? { background: 'rgba(255,51,85,0.15)', color: 'var(--danger)' } : undefined}
      >
        {r.status}{r.status !== 'Finished' && r.time_retired ? ` (${r.time_retired})` : ''}
      </span>
    )},
  ];

  return (
    <div>
      <div className="page-header">
        <h1>{race.name}</h1>
        <p>
          {race.circuit_name}, {race.country} • {new Date(race.race_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          {' '}• Round {race.round_number} • {race.year} Season
        </p>
      </div>

      <div className="grid grid-4 mb-6">
        <div className="card">
          <div className="stat-label text-sm">Circuit</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>{race.circuit_name}</div>
        </div>
        <div className="card">
          <div className="stat-label text-sm">Length</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>{race.length_km} km</div>
        </div>
        <div className="card">
          <div className="stat-label text-sm">Laps</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>{race.scheduled_laps}</div>
        </div>
        <div className="card">
          <div className="stat-label text-sm">Lap Record</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>{race.lap_record_time || '—'}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>Race Results</h3></div>
        <DataTable columns={columns} data={results} />
      </div>
    </div>
  );
}
