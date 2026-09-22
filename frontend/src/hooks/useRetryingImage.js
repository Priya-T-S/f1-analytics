import { useEffect, useRef, useState } from 'react';

// Wikimedia's image servers answer bursts of requests with "429 Too Many Requests",
// so a failed image is retried once after a short random delay before giving up.
export default function useRetryingImage(url) {
  const [attempt, setAttempt] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    setAttempt(0);
    return () => clearTimeout(timer.current);
  }, [url]);

  const failed = !url || attempt > 1;
  const src = url && attempt === 1 ? `${url}${url.includes('?') ? '&' : '?'}retry=1` : url;
  const onError = () => {
    if (attempt === 0) {
      setAttempt(-1); // hide while waiting
      timer.current = setTimeout(() => setAttempt(1), 1500 + Math.random() * 2500);
    } else {
      setAttempt(2);
    }
  };

  return { src, failed, waiting: attempt === -1, onError };
}
