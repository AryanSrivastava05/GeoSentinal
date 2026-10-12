// ─────────────────────────────────────────────────────────────
//  useApi — generic data-fetching hook
//  Returns { data, loading, error, refetch }
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';

export interface UseApiState<T> {
  data:    T | null;
  loading: boolean;
  error:   string | null;
  refetch: () => void;
}

export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  refreshMs?: number,
): UseApiState<T> {
  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [tick,    setTick]    = useState(0);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher()
      .then(d  => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e?.message ?? 'Request failed'); setLoading(false); } });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  useEffect(() => {
    if (!refreshMs) return;
    const timer = window.setInterval(() => setTick(t => t + 1), refreshMs);
    return () => window.clearInterval(timer);
  }, [refreshMs]);

  return { data, loading, error, refetch };
}
