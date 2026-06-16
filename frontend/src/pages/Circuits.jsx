import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCircuits } from '../api/client';
import Loader from '../components/common/Loader';

export default function Circuits() {
  const navigate = useNavigate();
  const [circuits, setCircuits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCircuits()
      .then(res => setCircuits(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      <div className="page-header">
        <h1>Circuits</h1>
        <p>{circuits.length} tracks</p>
      </div>

      <div className="grid grid-3">
        {circuits.map(c => (
          <div key={c.circuit_id} className="card" style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/circuits/${c.circuit_id}`)}
          >
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem' }}>
              {c.name}
            </div>
            <div className="text-sm text-muted mt-4">
              {c.location}, {c.country}
            </div>
            <div className="flex gap-4 mt-4 text-sm">
              <span><strong>{c.length_km}</strong> km</span>
              <span className="text-muted">Record: {c.lap_record_time || '—'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
