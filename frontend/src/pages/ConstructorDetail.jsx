import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getConstructor, getConstructorStandings } from '../api/client';
import { TEAM_COLORS } from '../utils/constants';
import StatCard from '../components/common/StatCard';
import DataTable from '../components/common/DataTable';
import Loader from '../components/common/Loader';

export default function ConstructorDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getConstructor(id),
      getConstructorStandings(id),
    ]).then(([constr, standings]) => {
      setData({
        constructor: constr.data,
        standings: standings.data,
      });
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;
  if (!data) return <div>Constructor not found</div>;

  const { constructor: c, standings } = data;
  const totalPts = standings.reduce((s, st) => s + st.points, 0);
  const totalWins = standings.reduce((s, st) => s + st.wins, 0);

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-4">
          {c.logo_url ? (
            <div className="detail-avatar">
              <img src={c.logo_url} alt={c.name} className="detail-logo" />
            </div>
          ) : (
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: c.color || '#333',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', fontWeight: 900, color: '#fff',
            }}>
              {c.name.charAt(0)}
            </div>
          )}
          <div>
            <h1>{c.name}</h1>
            <p>{c.nationality} • {c.base_location}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-3 mb-6">
        <StatCard label="Total Points" value={totalPts.toFixed(0)} accent="red" />
        <StatCard label="Wins" value={totalWins} accent="gold" />
        <StatCard label="Seasons" value={standings.length} accent="blue" />
      </div>

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
    </div>
  );
}
