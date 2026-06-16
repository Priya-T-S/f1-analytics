import { useState, useEffect } from 'react';
import { getRecords, getCareerStats } from '../api/client';
import StatCard from '../components/common/StatCard';
import DataTable from '../components/common/DataTable';
import Loader from '../components/common/Loader';

export default function Records() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getRecords(),
      getCareerStats(),
    ]).then(([records, career]) => {
      setData({
        ...records.data,
        careerStats: career.data,
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const winColumns = [
    { key: 'driver_name', label: 'Driver', render: (r) => <span style={{ fontWeight: 600 }}>{r.driver_name}</span> },
    { key: 'wins', label: 'Wins', render: (r) => <strong style={{ color: 'var(--gold)' }}>{r.wins}</strong> },
    { key: 'total_points', label: 'Career Points' },
  ];

  const poleColumns = [
    { key: 'driver_name', label: 'Driver', render: (r) => <span style={{ fontWeight: 600 }}>{r.driver_name}</span> },
    { key: 'poles', label: 'Poles', render: (r) => <strong style={{ color: 'var(--info)' }}>{r.poles}</strong> },
  ];

  const avgColumns = [
    { key: 'driver_name', label: 'Driver', render: (r) => <span style={{ fontWeight: 600 }}>{r.driver_name}</span> },
    { key: 'avg_finish', label: 'Avg Finish', render: (r) => <strong>{r.avg_finish}</strong> },
    { key: 'races', label: 'Races' },
  ];

  const careerColumns = [
    { key: 'driver_name', label: 'Driver', render: (r) => <span style={{ fontWeight: 600 }}>{r.driver_name}</span> },
    { key: 'code', label: 'Code' },
    { key: 'total_points', label: 'Points', render: (r) => <strong>{r.total_points}</strong> },
    { key: 'wins', label: 'Wins' },
    { key: 'podiums', label: 'Podiums' },
    { key: 'poles', label: 'Poles' },
    { key: 'fastest_laps', label: 'Fastest Laps' },
    { key: 'avg_finish', label: 'Avg Finish' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Records & Statistics</h1>
        <p>All-time F1 leaderboards</p>
      </div>

      <div className="grid grid-3 mb-6">
        <div className="card">
          <div className="card-header"><h3>Most Wins</h3></div>
          <DataTable columns={winColumns} data={data?.mostWins || []} />
        </div>
        <div className="card">
          <div className="card-header"><h3>Most Pole Positions</h3></div>
          <DataTable columns={poleColumns} data={data?.mostPoles || []} />
        </div>
        <div className="card">
          <div className="card-header"><h3>Best Avg Finish (min 20 races)</h3></div>
          <DataTable columns={avgColumns} data={data?.bestAvgFinish || []} />
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>Full Career Stats</h3></div>
        <DataTable columns={careerColumns} data={data?.careerStats || []} />
      </div>
    </div>
  );
}
