import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getCircuit, getCircuitWinners } from '../api/client';
import DataTable from '../components/common/DataTable';
import Loader from '../components/common/Loader';

export default function CircuitDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getCircuit(id),
      getCircuitWinners(id),
    ]).then(([circuit, winners]) => {
      setData({ circuit: circuit.data, winners: winners.data });
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;
  if (!data) return <div>Circuit not found</div>;

  const { circuit, winners } = data;

  return (
    <div>
      <div className="page-header">
        <h1>{circuit.name}</h1>
        <p>{circuit.location}, {circuit.country}</p>
      </div>

      <div className="grid grid-3 mb-6">
        <div className="card">
          <div className="stat-label text-sm">Length</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 900 }}>
            {circuit.length_km ? `${circuit.length_km} km` : '—'}
          </div>
        </div>
        <div className="card">
          <div className="stat-label text-sm">Lap Record</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 900 }}>
            {circuit.lap_record_time || '—'}
          </div>
          {circuit.lap_record_driver_name && (
            <div className="text-sm text-muted mt-4">by {circuit.lap_record_driver_name}</div>
          )}
        </div>
        <div className="card">
          <div className="stat-label text-sm">Grands Prix Held</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 900 }}>
            {winners.length}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>Race Winners</h3></div>
        <DataTable columns={[
          { key: 'year', label: 'Year' },
          { key: 'race_name', label: 'Race' },
          { key: 'winner', label: 'Winner', render: (r) => (
            <span style={{ fontWeight: 600 }}>
              {r.winner} <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>{r.winner_code}</span>
            </span>
          )},
          { key: 'fastest_lap_time', label: 'Fastest Lap' },
        ]} data={winners} />
      </div>
    </div>
  );
}
