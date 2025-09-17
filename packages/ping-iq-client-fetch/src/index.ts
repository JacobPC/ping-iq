export interface PingIQClientOptions {
  baseUrl: string; // e.g., http://localhost:3000/_status
  headers?: Record<string, string>;
}

async function request<T>(url: string, headers?: Record<string, string>): Promise<T> {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`PingIQ fetch failed ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

export function createPingIQClient(options: PingIQClientOptions) {
  const prefix = options.baseUrl.replace(/\/$/, "");
  const h = options.headers;
  return {
    ping: () => request<{ status: string; message: string; timestamp: string }>(`${prefix}/ping`, h),
    time: () => request<{ timestamp: string }>(`${prefix}/time`, h),
    info: () => request<Record<string, unknown>>(`${prefix}/info`, h),
    health: () => request<{ status: string; timestamp: string; checks: unknown[] }>(`${prefix}/health`, h),
    metrics: () => request<string>(`${prefix}/metrics`, h),
    diagnosticsNetwork: async (params?: { payload?: number }) => {
      const qs = new URLSearchParams();
      if (params?.payload) qs.set("payload", String(params.payload));
      const url = `${prefix}/diagnostics/network${qs.toString() ? `?${qs}` : ""}`;
      const start = performance.now();
      const res = await fetch(url, { headers: { ...(h || {}), 'accept-encoding': 'identity' } });
      if (!res.ok) throw new Error(`PingIQ fetch failed ${res.status}`);
      const buf = await res.arrayBuffer();
      const end = performance.now();
      const elapsedMs = Math.max(1, end - start);
      const serverMs = Number(res.headers.get('x-pingiq-server-duration-ms') || 0);
      const contentLength = Number(res.headers.get('content-length') || buf.byteLength || 0);
      const effectiveMs = Math.max(1, elapsedMs - (Number.isFinite(serverMs) ? serverMs : 0));
      const throughputMbps = contentLength > 0 ? (contentLength * 8) / (effectiveMs / 1000) / 1_000_000 : 0;
      return { bytes: contentLength, elapsedMs, serverDurationMs: Number.isFinite(serverMs) ? serverMs : 0, effectiveMs, throughputMbps } as const;
    },
    diagnosticsLatency: async () => {
      const url = `${prefix}/diagnostics/latency`;
      const start = performance.now();
      const res = await fetch(url, { headers: { ...(h || {}), 'accept-encoding': 'identity' } });
      if (!res.ok) throw new Error(`PingIQ fetch failed ${res.status}`);
      await res.arrayBuffer();
      const end = performance.now();
      const elapsedMs = Math.max(0, end - start);
      const serverMs = Number(res.headers.get('x-pingiq-server-duration-ms') || 0);
      const rttMs = Math.max(0, elapsedMs - (Number.isFinite(serverMs) ? serverMs : 0));
      return { elapsedMs, serverDurationMs: Number.isFinite(serverMs) ? serverMs : 0, rttMs } as const;
    },
    env: () => request<Record<string, string | undefined>>(`${prefix}/env`, h),
  };
}


