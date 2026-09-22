import useRetryingImage from '../../hooks/useRetryingImage';

const initials = (d) => `${d.first_name?.[0] || ''}${d.last_name?.[0] || ''}`.toUpperCase();

// Driver photo with an initials fallback for drivers without one (or if the image fails to load).
// variant: 'card' (drivers grid), 'detail' (driver page) or 'mini' (search results).
export default function DriverPhoto({ driver, variant = 'card' }) {
  const { src, failed, waiting, onError } = useRetryingImage(driver.image_url);
  const prefix = variant === 'card' ? 'driver' : variant;
  const name = `${driver.first_name} ${driver.last_name}`;

  if (failed || waiting) {
    return <div className={`${prefix}-photo-placeholder`} title={name}>{initials(driver)}</div>;
  }
  return (
    <img
      src={src}
      alt={name}
      className={`${prefix}-photo`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={onError}
    />
  );
}
