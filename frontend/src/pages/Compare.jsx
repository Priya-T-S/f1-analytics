import { useState, useEffect } from 'react';
import { getDrivers, getHeadToHead, getDriverComparison } from '../api/client';
import useSeasons from '../hooks/useSeasons';
import DriverSearch from '../components/common/DriverSearch';
import { positionClass } from '../utils/helpers';
import Loader from '../components/common/Loader';

export default function Compare() {
  const [drivers, setDrivers] = useState([]);
  const [d1, setD1] = useState('');
  const [d2, setD2] = useState('');
  const { seasons, latest } = useSeasons();
  const [selectedYear, setYear] = useState(null);
  const year = selectedYear ?? latest;
  const [comparison, setComparison] = useState(null);
  const [headToHead, setHeadToHead] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDrivers().then(res => setDrivers(res.data));
  }, []);

  useEffect(() => {
    if (!d1 || !d2 || !year) { setComparison(null); setHeadToHead(null); return; }
    setLoading(true);
    Promise.all([
      getDriverComparison(d1, d2),
      getHeadToHead(d1, d2, year),
    ]).then(([comp, h2h]) => {
      setComparison(comp.data);
      setHeadToHead(h2h.data);
    }).finally(() => setLoading(false));
  }, [d1, d2, year]);

  const d1Wins = headToHead?.filter(r => r.driver1_pos !== null && r.driver2_pos !== null && r.driver1_pos < r.driver2_pos).length || 0;
  const d2Wins = headToHead?.filter(r => r.driver1_pos !== null && r.driver2_pos !== null && r.driver2_pos < r.driver1_pos).length || 0;

  return (
    <div>
      <div className="page-header">
        <h1>Head-to-Head</h1>
        <p>Compare two drivers across a season</p>
      </div>

      <div className="card mb-6">
        <div className="flex gap-6 items-center" style={{ flexWrap: 'wrap' }}>
          <div className="flex-col gap-2" style={{ flex: 1, minWidth: 200 }}>
            <label className="text-sm text-muted">Driver 1</label>
            <DriverSearch drivers={drivers} value={d1} onChange={setD1} label="Driver 1" />
          </div>
          <div style={{ fontSize: '1.5rem', color: 'var(--text-muted)', alignSelf: 'center', marginTop: 16 }}>VS</div>
          <div className="flex-col gap-2" style={{ flex: 1, minWidth: 200 }}>
            <label className="text-sm text-muted">Driver 2</label>
            <DriverSearch drivers={drivers} value={d2} onChange={setD2} label="Driver 2" />
          </div>
          <div className="flex-col gap-2" style={{ minWidth: 150 }}>
            <label className="text-sm text-muted">Season</label>
            <select value={year ?? ''} onChange={e => setYear(Number(e.target.value))} style={{ width: '100%' }}>
              {seasons.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading && <Loader />}

      {comparison && !loading && (
        <>
          <div className="grid grid-2 mb-6">
            {comparison.map((driver, idx) => (
              <div key={driver.driver_id} className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: idx === 0 ? 'var(--accent-red)' : 'var(--info)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.8rem', color: '#fff',
                  }}>
                    {idx + 1}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                      {driver.driver_name}
                    </div>
                  </div>
                </div>
                <div className="grid grid-2" style={{ gap: 16 }}>
                  <div><span className="text-sm text-muted">Races</span><div style={{ fontWeight: 700 }}>{driver.races}</div></div>
                  <div><span className="text-sm text-muted">Wins</span><div style={{ fontWeight: 700, color: 'var(--gold)' }}>{driver.wins}</div></div>
                  <div><span className="text-sm text-muted">Podiums</span><div style={{ fontWeight: 700 }}>{driver.podiums}</div></div>
                  <div><span className="text-sm text-muted">Points</span><div style={{ fontWeight: 700 }}>{driver.points}</div></div>
                  <div><span className="text-sm text-muted">Poles</span><div style={{ fontWeight: 700 }}>{driver.poles}</div></div>
                </div>
              </div>
            ))}
          </div>

          {headToHead && headToHead.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3>Race-by-Race ({year})</h3>
                <div className="flex gap-4 text-sm">
                  <span>Driver 1: <strong style={{ color: 'var(--accent-red)' }}>{d1Wins}</strong></span>
                  <span>Driver 2: <strong style={{ color: 'var(--info)' }}>{d2Wins}</strong></span>
                </div>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Round</th>
                      <th>Race</th>
                      <th>Driver 1 Pos</th>
                      <th>Driver 2 Pos</th>
                      <th>Winner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {headToHead.map(r => (
                      <tr key={r.race_id}>
                        <td>{r.round_number}</td>
                        <td>{r.race_name}</td>
                        <td><span className={`position-badge ${positionClass(r.driver1_pos)}`}>{r.driver1_pos || 'DNF'}</span></td>
                        <td><span className={`position-badge ${positionClass(r.driver2_pos)}`}>{r.driver2_pos || 'DNF'}</span></td>
                        <td style={{
                          fontWeight: 600,
                          color: r.driver1_pos !== null && r.driver2_pos !== null && r.driver1_pos < r.driver2_pos ? 'var(--accent-red)' :
                                 r.driver1_pos !== null && r.driver2_pos !== null && r.driver2_pos < r.driver1_pos ? 'var(--info)' : 'var(--text-muted)'
                        }}>
                          {r.driver1_pos !== null && r.driver2_pos !== null && r.driver1_pos < r.driver2_pos ? 'Driver 1' :
                           r.driver1_pos !== null && r.driver2_pos !== null && r.driver2_pos < r.driver1_pos ? 'Driver 2' : 'Tie / Both DNF'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!d1 && !d2 && !loading && (
        <div className="text-center text-muted" style={{ padding: 60 }}>
          Select two drivers to compare
        </div>
      )}
    </div>
  );
}
