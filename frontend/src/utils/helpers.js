export function positionClass(pos) {
  if (pos === null || pos === undefined) return 'dnf';
  if (pos === 1) return 'p1';
  if (pos === 2) return 'p2';
  if (pos === 3) return 'p3';
  return '';
}

export function formatTime(seconds) {
  if (!seconds) return '—';
  const num = parseFloat(seconds);
  const mins = Math.floor(num / 60);
  const secs = (num % 60).toFixed(3);
  return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : `${secs}s`;
}

export function ordinal(n) {
  if (n === null || n === undefined) return '';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
