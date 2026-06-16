import { useState, useEffect } from 'react';
import { getDriverStandingsBySeason, getConstructorStandingsBySeason } from '../api/client';
import { SEASONS } from '../utils/constants';
import DataTable from '../components/common/DataTable';
import Loader from '../components/common/Loader';

export default function Standings() {
  const [year, setYear] = useState(SEASONS[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getDriverStandingsBySeason(year),
      getConstructorStandingsBySeason(year),
    ]).then(([drivers, constructors]) => {
      setData({
        drivers: drivers.data,
        constructors: constructors.data,
      });
    }).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <Loader />;

  const driverColumns = [
    { key: 'position', label: 'Pos', width: '60px', render: (r) => (
      <span className={`position-badge p${r.position}`}>{r.position}</span>
    )},
    { key: 'driver_name', label: 'Driver', render: (r) => (
      <span style={{ fontWeight: 600 }}>{r.driver_name} <span style={{ color: 'var(--accent-red)' }}>{r.code}</span></span>
    )},
    { key: 'nationality', label: 'Nationality' },
    { key: 'constructor_name', label: 'Team', render: (r) => (
      <span className="constructor-badge">
        <span className="constructor-dot" style={{ background: r.constructor_color }} />
        {r.constructor_name}
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
          <h1>Standings</h1>
          <p>{year} Season</p>
        </div>
        <select value={year} onChange={e => setYear(Number(e.target.value))}>
          {SEASONS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header"><h3>Driver Championship</h3></div>
          <DataTable columns={driverColumns} data={data?.drivers || []} />
        </div>
        <div className="card">
          <div className="card-header"><h3>Constructor Championship</h3></div>
          <DataTable columns={constructorColumns} data={data?.constructors || []} />
        </div>
      </div>
    </div>
  );
}
