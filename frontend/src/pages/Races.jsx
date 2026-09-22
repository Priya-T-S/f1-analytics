import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRacesBySeason } from '../api/client';
import useSeasons from '../hooks/useSeasons';
import { ordinal } from '../utils/helpers';
import Loader from '../components/common/Loader';

export default function Races() {
  const params = useParams();
  const navigate = useNavigate();
  const { seasons, latest } = useSeasons();
  const year = params.year ?? latest;
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!year) return;
    setLoading(true);
    getRacesBySeason(year)
      .then(res => setRaces(res.data))
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) return <Loader />;

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>{year} Race Calendar</h1>
          <p>{races.length} races</p>
        </div>
        <select value={year} onChange={e => navigate(`/races/${e.target.value}`)}>
          {seasons.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {races.map(race => (
          <div key={race.race_id} className="card" style={{ cursor: 'pointer', padding: '16px 20px' }}
            onClick={() => navigate(`/race/${race.race_id}`)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.85rem',
                }}>
                  {race.round_number}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                    {race.name}
                  </div>
                  <div className="text-sm text-muted">
                    {race.circuit_name}, {race.circuit_country} • {new Date(race.race_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                {race.scheduled_laps && <span className="text-muted">{race.scheduled_laps} laps</span>}
                {race.winner_name && (
                  <span style={{ fontWeight: 600 }}>
                    Winner: {race.winner_name}
                    <span style={{ color: 'var(--accent-red)', marginLeft: 4 }}>{race.winner_code}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
