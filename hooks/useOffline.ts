import { useEffect, useRef, useState } from 'react';

const CHECK_URL = 'https://fid-lepro-production.up.railway.app/api/health';
const INTERVAL_MS = 8000;

export function useOffline(): boolean {
  const [offline, setOffline] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      await fetch(CHECK_URL, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeout);
      setOffline(false);
    } catch {
      setOffline(true);
    }
  };

  useEffect(() => {
    check();
    timerRef.current = setInterval(check, INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return offline;
}
