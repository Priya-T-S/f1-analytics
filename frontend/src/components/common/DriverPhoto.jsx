import { useState } from 'react';

const initials = (d) => `${d.first_name?.[0] || ''}${d.last_name?.[0] || ''}`.toUpperCase();

// Driver photo with an initials fallback for drivers without one (or if the image fails to load).
// variant: 'card' (drivers grid), 'detail' (driver page) or 'mini' (search results).
export default function DriverPhoto({ driver, variant = 'card' }) {
  const [failed, setFailed] = useState(false);
  const prefix = variant === 'card' ? 'driver' : variant;
  const name = `${driver.first_name} ${driver.last_name}`;

  if (!driver.image_url || failed) {
    return <div className={`${prefix}-photo-placeholder`} title={name}>{initials(driver)}</div>;
  }
  return (
    <img
      src={driver.image_url}
      alt={name}
      className={`${prefix}-photo`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
