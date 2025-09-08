import { useEffect, useMemo, useState } from 'react';

export interface PingIQClientLike {
  ping: () => Promise<{ status: string; message: string; timestamp: string }>;
  time: () => Promise<{ timestamp: string }>;
  info: () => Promise<Record<string, unknown>>;
  health: () => Promise<{ status: string; timestamp: string; checks: unknown[] }>;
  metrics: () => Promise<string>;
  diagnosticsNetwork: (params?: { samples?: number; payload?: number }) => Promise<Record<string, unknown>>;
  env: () => Promise<Record<string, string | undefined>>;
}

export function usePingIQ<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fn().then((d) => mounted && setData(d)).catch((e) => mounted && setError(e)).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, error, loading } as const;
}

export function createPingIQHooks(client: PingIQClientLike) {
  return {
    usePing: () => usePingIQ(client.ping, []),
    useTime: () => usePingIQ(client.time, []),
    useInfo: () => usePingIQ(client.info, []),
    useHealth: () => usePingIQ(client.health, []),
    useMetrics: () => usePingIQ(client.metrics, []),
    useDiagnosticsNetwork: (params?: { samples?: number; payload?: number }) => usePingIQ(() => client.diagnosticsNetwork(params), [params?.samples, params?.payload]),
    useEnv: () => usePingIQ(client.env, []),
  } as const;
}


