import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDriver, getDriverStandings, getDriverRaces } from '../api/client';
import { getConstructorStandingsBySeason } from '../api/client';
import { positionClass } from '../utils/helpers';
import StatCard from '../components/common/StatCard';
import DataTable from '../components/common/DataTable';
import PointsChart from '../components/common/PointsChart';
import Loader from '../components/common/Loader';
import DriverPhoto from '../components/common/DriverPhoto';

export default function DriverDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getDriver(id),
      getDriverStandings(id),
      getDriverRaces(id),
    ]).then(([driver, standings, races]) => {
      setData({
        driver: driver.data,
        standings: standings.data,
        races: races.data,
      });
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;
  if (!data) return <div>Driver not found</div>;

  const { driver, standings, races } = data;
  const totalPts = standings.reduce((s, st) => s + st.points, 0);
  const totalWins = standings.reduce((s, st) => s + st.wins, 0);

  const raceColumns = [
    { key: 'year', label: 'Season', width: '80px' },
    { key: 'race_name', label: 'Race' },
    { key: 'position', label: 'Pos', width: '70px', render: (r) => (
      <span className={`position-badge ${positionClass(r.position)}`}>
        {r.position || 'DNF'}
      </span>
    )},
    { key: 'grid_position', label: 'Grid' },
    { key: 'points', label: 'Pts' },
    { key: 'status', label: 'Status' },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="detail-avatar">
            <DriverPhoto driver={driver} variant="detail" />
          </div>
          <div>
            <h1>{driver.first_name} {driver.last_name}</h1>
            <p>{driver.nationality} • #{driver.driver_number} • {driver.constructor || 'Unknown'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-4 mb-6">
        <StatCard label="Career Points" value={totalPts.toFixed(0)} accent="red" />
        <StatCard label="Wins" value={totalWins} accent="gold" />
        <StatCard label="Seasons" value={standings.length} accent="blue" />
        <StatCard label="Races" value={races.length} accent="green" />
      </div>

      <div className="grid grid-2 mb-6">
        <div className="card">
          <div className="card-header"><h3>Season Standings</h3></div>
          <DataTable columns={[
            { key: 'year', label: 'Year' },
            { key: 'position', label: 'Final Pos', render: (r) => (
              <span className={`position-badge p${r.position}`}>{r.position}</span>
            )},
            { key: 'points', label: 'Points', render: (r) => <strong>{r.points}</strong> },
            { key: 'wins', label: 'Wins' },
          ]} data={standings} />
        </div>
        <div className="card">
          <div className="card-header"><h3>Race History</h3></div>
          <DataTable columns={raceColumns} data={races.slice(0, 10)}
            onRowClick={(r) => navigate(`/race/${r.race_id}`)}
          />
        </div>
      </div>
    </div>
  );
}
