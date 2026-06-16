import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDrivers } from '../api/client';
import Loader from '../components/common/Loader';

export default function Drivers() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    getDrivers({ nationality: filter || undefined })
      .then(res => setDrivers(res.data))
      .finally(() => setLoading(false));
  }, [filter]);

  if (loading) return <Loader />;

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Drivers</h1>
          <p>{drivers.length} drivers</p>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-sm text-muted">Nationality:</span>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All</option>
            {[...new Set(drivers.map(d => d.nationality).filter(Boolean))].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-4">
        {drivers.map(driver => (
          <div
            key={driver.driver_id}
            className="driver-card"
            onClick={() => navigate(`/drivers/${driver.driver_id}`)}
          >
            <div className="driver-number">{driver.driver_number}</div>
            <div className="driver-avatar">
              {driver.image_url ? (
                <img src={driver.image_url} alt={`${driver.first_name} ${driver.last_name}`} className="driver-photo" />
              ) : (
                <div className="driver-photo-placeholder">{driver.code}</div>
              )}
            </div>
            <div className="driver-name">
              {driver.first_name} {driver.last_name}
            </div>
            <div className="driver-code" style={{ color: 'var(--accent-red)', fontWeight: 700, fontSize: '0.9rem' }}>
              {driver.code}
            </div>
            <div className="driver-nationality">{driver.nationality}</div>
            <div className="driver-team">
              <span className="constructor-badge">
                <span className="constructor-dot" style={{ background: driver.constructor_color || '#fff' }} />
                {driver.constructor || 'Unknown'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
