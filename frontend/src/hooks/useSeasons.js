import { useEffect, useState } from 'react';
import { getSeasons } from '../api/client';

let cached = null;

// Seasons in the database, newest first. `latest` is the newest season with at least one race result.
export default function useSeasons() {
  const [data, setData] = useState(cached);

  useEffect(() => {
    if (cached) return;
    getSeasons().then((res) => {
      const rows = res.data;
      cached = {
        seasons: rows.map((s) => s.year),
        latest: rows.find((s) => s.completed > 0)?.year ?? rows[0]?.year ?? null,
      };
      setData(cached);
    });
  }, []);

  return data || { seasons: [], latest: null };
}
