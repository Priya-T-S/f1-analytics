import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConstructors } from '../api/client';
import Loader from '../components/common/Loader';
import ConstructorLogo from '../components/common/ConstructorLogo';

export default function Constructors() {
  const navigate = useNavigate();
  const [constructors, setConstructors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConstructors()
      .then(res => setConstructors(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      <div className="page-header">
        <h1>Constructors</h1>
        <p>{constructors.length} teams</p>
      </div>

      <div className="grid grid-3">
        {constructors.map(c => (
          <div key={c.constructor_id} className="card" style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/constructors/${c.constructor_id}`)}
          >
            <div className="flex items-center gap-4">
              <ConstructorLogo constructor={c} />
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem' }}>
                  {c.name}
                </div>
                <div className="text-sm text-muted">{[c.nationality, c.base_location].filter(Boolean).join(' • ')}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
