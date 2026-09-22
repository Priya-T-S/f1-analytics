import useRetryingImage from '../../hooks/useRetryingImage';

// Two letters for the fallback badge: "Red Bull" -> "RB", "Ferrari" -> "FE".
const monogram = (name = '') => {
  const words = name.replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] || '').slice(0, 2)).toUpperCase();
};

// Team logo on a light tile (most logos are drawn for white backgrounds),
// or a badge in the team colour when there is no logo or it fails to load.
// size: 'card' (constructors grid) or 'detail' (constructor page).
export default function ConstructorLogo({ constructor: c, size = 'card' }) {
  const { src, failed, waiting, onError } = useRetryingImage(c.logo_url);

  if (failed || waiting) {
    const color = c.color && c.color !== '#ffffff' ? c.color : '#3a3a52';
    return (
      <div className={`team-badge team-badge-${size}`} style={{ background: color }} title={c.name}>
        {monogram(c.name)}
      </div>
    );
  }
  return (
    <div className={`team-logo team-logo-${size}`}>
      <img
        src={src}
        alt={`${c.name} logo`}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={onError}
      />
    </div>
  );
}
