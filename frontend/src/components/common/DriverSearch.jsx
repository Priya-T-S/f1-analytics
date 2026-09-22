import { useMemo, useState } from 'react';
import DriverPhoto from './DriverPhoto';

const MAX_RESULTS = 40;
// Lowercase and strip accents so "perez" finds "Pérez" and "raikkonen" finds "Räikkönen".
const normalize = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Type-to-search driver picker. `drivers` come from /api/drivers; `value` is a driver_id.
export default function DriverSearch({ drivers, value, onChange, placeholder = 'Search drivers…', label }) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const selected = drivers.find((d) => String(d.driver_id) === String(value));

  const indexed = useMemo(() => drivers
    .map((d) => ({
      ...d,
      search: normalize(`${d.first_name} ${d.last_name} ${d.code || ''} ${d.nationality || ''} ${d.constructor || ''}`),
    }))
    // Most recent drivers first, then alphabetical.
    .sort((a, b) => (b.last_year || 0) - (a.last_year || 0) || a.last_name.localeCompare(b.last_name)),
  [drivers]);

  const matches = useMemo(() => {
    const words = normalize(text).split(/\s+/).filter(Boolean);
    const found = words.length ? indexed.filter((d) => words.every((w) => d.search.includes(w))) : indexed;
    return found.slice(0, MAX_RESULTS);
  }, [indexed, text]);

  const choose = (driver) => {
    onChange(String(driver.driver_id));
    setText('');
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && open && matches[active]) {
      e.preventDefault();
      choose(matches[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const listId = `${label || 'driver'}-results`.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className="driver-search">
      <input
        type="text"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && matches[active] ? `${listId}-${matches[active].driver_id}` : undefined}
        value={open ? text : selected ? `${selected.first_name} ${selected.last_name}` : ''}
        placeholder={placeholder}
        onFocus={() => { setText(''); setActive(0); setOpen(true); }}
        onBlur={() => setOpen(false)}
        onChange={(e) => { setText(e.target.value); setActive(0); setOpen(true); }}
        onKeyDown={onKeyDown}
      />
      {open && (
        <ul className="driver-search-list" id={listId} role="listbox">
          {matches.length === 0 && <li className="driver-search-empty">No drivers match “{text}”</li>}
          {matches.map((d, i) => (
            <li
              key={d.driver_id}
              id={`${listId}-${d.driver_id}`}
              role="option"
              aria-selected={i === active}
              className={`driver-search-option${i === active ? ' active' : ''}`}
              // mousedown fires before the input's blur, so the click isn't lost
              onMouseDown={(e) => { e.preventDefault(); choose(d); }}
              onMouseEnter={() => setActive(i)}
            >
              <span className="mini-avatar"><DriverPhoto driver={d} variant="mini" /></span>
              <span className="driver-search-name">
                {d.first_name} {d.last_name}
                {d.code && <span className="driver-search-code">{d.code}</span>}
              </span>
              <span className="driver-search-meta">
                {[d.constructor, d.last_year].filter(Boolean).join(' · ')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
