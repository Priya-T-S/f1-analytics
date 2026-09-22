import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentStandings, getSeasonSummary, getRecords, getSyncStatus } from '../api/client';
import useSeasons from '../hooks/useSeasons';
import StatCard from '../components/common/StatCard';
import DataTable from '../components/common/DataTable';
import PointsChart from '../components/common/PointsChart';
import Loader from '../components/common/Loader';

export default function Dashboard() {
  const navigate = useNavigate();
  const { seasons, latest } = useSeasons();
  const [selectedYear, setYear] = useState(null);
  const year = selectedYear ?? latest;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!year) return;
    setLoading(true);
    Promise.all([
      getCurrentStandings(),
      getSeasonSummary(year),
      getRecords(),
      getSyncStatus(),
    ]).then(([standings, summary, records, sync]) => {
      setData({ standings: standings.data, summary: summary.data, records: records.data, sync: sync.data });
    }).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <Loader />;

  const { standings, summary, records, sync } = data || {};
  const lastUpdated = sync?.lastSync?.at
    ? new Date(sync.lastSync.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;
  const drivers = standings?.drivers || [];
  const constructors = standings?.constructors || [];

  const pointsChartData = drivers.map((d, i) => ({
    round: i + 1,
    [d.code]: d.points
  }));

  const driverColumns = [
    { key: 'position', label: 'Pos', width: '60px', render: (r) => (
      <span className={`position-badge p${r.position}`}>{r.position}</span>
    )},
    { key: 'driver_name', label: 'Driver', render: (r) => (
      <span style={{ fontWeight: 600 }}>{r.driver_name} <span style={{ color: '#5a5a6e', fontWeight: 400 }}>{r.code}</span></span>
    )},
    { key: 'constructor', label: 'Team', render: (r) => (
      <span className="constructor-badge">
        <span className="constructor-dot" style={{ background: r.constructor_color }} />
        {r.constructor}
      </span>
    )},
    { key: 'points', label: 'Pts', render: (r) => <strong>{r.points}</strong> },
    { key: 'wins', label: 'Wins' },
  ];

  const constructorColumns = [
    { key: 'position', label: 'Pos', width: '60px', render: (r) => (
      <span className={`position-badge p${r.position}`}>{r.position}</span>
    )},
    { key: 'constructor_name', label: 'Constructor' },
    { key: 'points', label: 'Pts', render: (r) => <strong>{r.points}</strong> },
    { key: 'wins', label: 'Wins' },
  ];

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>F1 Analytics</h1>
          <p>
            Statistics and historical analysis, 1950 to today
            {lastUpdated && <span className="text-muted"> • Data updated {lastUpdated}</span>}
            {sync?.lastRace && <span className="text-muted"> • Latest race: {sync.lastRace.year} {sync.lastRace.name}</span>}
          </p>
        </div>
        <select value={year} onChange={e => setYear(Number(e.target.value))}>
          {seasons.map(y => <option key={y} value={y}>{y} Season</option>)}
        </select>
      </div>

      <div className="grid grid-4 mb-6">
        <StatCard
          label="Season"
          value={year}
          sub={summary?.summary?.total_races + ' races'}
          accent="red"
        />
        <StatCard
          label="Champion"
          value={summary?.summary?.champion_driver || '—'}
          sub={summary?.summary?.champion_constructor || ''}
          accent="gold"
        />
        <StatCard
          label="Most Wins"
          value={summary?.mostWins?.driver_name || '—'}
          sub={summary?.mostWins ? `${summary.mostWins.wins} wins` : ''}
          accent="green"
        />
        <StatCard
          label="All-Time Wins Leader"
          value={records?.mostWins?.[0]?.driver_name || '—'}
          sub={records?.mostWins?.[0]?.wins + ' wins' || ''}
          accent="blue"
        />
      </div>

      <div className="grid grid-2 mb-6">
        <div className="card">
          <div className="card-header">
            <h3>{standings?.year} Driver Standings{standings?.round ? ` · after round ${standings.round}` : ''}</h3>
            <button className="btn btn-outline" onClick={() => navigate('/standings')}>View All</button>
          </div>
          <DataTable columns={driverColumns} data={drivers.slice(0, 10)} onRowClick={(r) => navigate(`/drivers/${r.driver_id}`)} />
        </div>
        <div className="card">
          <div className="card-header">
            <h3>{standings?.year} Constructor Standings</h3>
            <button className="btn btn-outline" onClick={() => navigate('/standings')}>View All</button>
          </div>
          <DataTable columns={constructorColumns} data={constructors} onRowClick={(r) => navigate(`/constructors/${r.constructor_id}`)} />
        </div>
      </div>

      <PointsChart data={pointsChartData} drivers={drivers.slice(0, 6)} />
    </div>
  );
}
