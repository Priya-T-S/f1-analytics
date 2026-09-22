import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRace, getRaceResults, getRaceTyres, getRaceSectors } from '../api/client';
import { positionClass } from '../utils/helpers';
import DataTable from '../components/common/DataTable';
import Loader from '../components/common/Loader';
import TyreStrategyChart from '../components/common/TyreStrategyChart';

const isFinished = (status) => status === 'Finished' || status === 'Lapped' || /^\+\d+ Laps?$/.test(status || '');
const seconds = (ms) => (ms == null ? '—' : (ms / 1000).toFixed(3));
const lapTime = (ms) => (ms == null ? '—' : `${Math.floor(ms / 60000)}:${((ms % 60000) / 1000).toFixed(3).padStart(6, '0')}`);

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
      getRaceTyres(id),
      getRaceSectors(id),
    ]).then(([race, results, tyres, sectors]) => {
      setData({ race: race.data, results: results.data, tyres: tyres.data, sectors: sectors.data });
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;
  if (!data) return <div>Race not found</div>;

  const { race, results, tyres, sectors } = data;
  const weather = race.rain == null ? null
    : `${race.rain ? 'Wet' : 'Dry'} · ${Math.round(race.avg_air_temp)}°C air · ${Math.round(race.avg_track_temp)}°C track`;

  const sectorColumns = [
    { key: 'driver_name', label: 'Driver', render: (r) => (
      <span style={{ fontWeight: 600 }}>{r.driver_name} <span style={{ color: 'var(--accent-red)' }}>{r.code}</span></span>
    )},
    { key: 'best_s1', label: 'Best S1', render: (r) => seconds(r.best_s1) },
    { key: 'best_s2', label: 'Best S2', render: (r) => seconds(r.best_s2) },
    { key: 'best_s3', label: 'Best S3', render: (r) => seconds(r.best_s3) },
    { key: 'ideal', label: 'Ideal Lap', render: (r) => <strong>{lapTime(r.best_s1 + r.best_s2 + r.best_s3)}</strong> },
    { key: 'top_speed', label: 'Top Speed', render: (r) => (r.top_speed ? `${r.top_speed} km/h` : '—') },
  ];

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
    { key: 'time_retired', label: 'Time', render: (r) => (r.status === 'Finished' ? r.time_retired : '') },
    { key: 'fastest_lap_time', label: 'Best Lap', render: (r) => (
      <span style={r.fastest_lap ? { color: '#b44dff', fontWeight: 700 } : undefined}>{r.fastest_lap_time || '—'}</span>
    )},
    { key: 'status', label: 'Status', render: (r) => (
      <span className={`tag ${isFinished(r.status) ? '' : 'dnf'}`}
        style={!isFinished(r.status) ? { background: 'rgba(255,51,85,0.15)', color: 'var(--danger)' } : undefined}
      >
        {r.status}{r.status !== 'Finished' && r.time_retired && r.time_retired !== r.status ? ` (${r.time_retired})` : ''}
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
          <div className="stat-label text-sm">Weather</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>{weather || race.weather_condition || '—'}</div>
        </div>
        <div className="card">
          <div className="stat-label text-sm">Laps</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>{race.scheduled_laps || '—'}</div>
        </div>
        <div className="card">
          <div className="stat-label text-sm">Circuit Race Lap Record</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>{race.lap_record_time || '—'}</div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="card-header"><h3>Race Results</h3></div>
        <DataTable columns={columns} data={results} />
      </div>

      <TyreStrategyChart stints={tyres} totalLaps={race.scheduled_laps} />

      {sectors?.length > 0 && (
        <div className="card">
          <div className="card-header"><h3>Best Sectors &amp; Speed Trap</h3></div>
          <DataTable columns={sectorColumns} data={sectors} />
        </div>
      )}
    </div>
  );
}
