// Parses "01:27:02.624", "00:01:32.19", "1:32.190" or "21.662" into milliseconds.
function toMs(value) {
  if (value === null || value === undefined || value === '') return null;
  const parts = String(value).split(':').map(Number);
  if (parts.some(Number.isNaN)) return null;
  const seconds = parts.reduce((acc, part) => acc * 60 + part, 0);
  return Math.round(seconds * 1000);
}

const pad = (n, width = 2) => String(n).padStart(width, '0');

// 55404 -> "55.404", 92190 -> "1:32.190", 5222624 -> "1:27:02.624"
function formatMs(ms) {
  if (ms === null || ms === undefined) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const frac = pad(ms % 1000, 3);
  if (h) return `${h}:${pad(m)}:${pad(s)}.${frac}`;
  return m ? `${m}:${pad(s)}.${frac}` : `${s}.${frac}`;
}

// Gap to the winner in Ergast style: "+17.993" or "+1:02.345".
function formatGap(ms) {
  if (ms < 60000) return `+${(ms / 1000).toFixed(3)}`;
  return `+${formatMs(ms)}`;
}

const int = (v) => (v === null || v === undefined || v === '' ? null : parseInt(v, 10));
const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));

function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

const today = () => new Date().toISOString().slice(0, 10);

module.exports = { toMs, formatMs, formatGap, int, num, chunk, today };
