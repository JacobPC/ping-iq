import type { AxiosInstance } from 'axios';

export interface PingIQAxiosClientOptions {
  baseUrl: string; // e.g., http://localhost:3000/_status
  axios: AxiosInstance;
}

export function createPingIQAxiosClient(options: PingIQAxiosClientOptions) {
  const prefix = options.baseUrl.replace(/\/$/, "");
  const ax = options.axios;
  return {
    ping: async () => (await ax.get(`${prefix}/ping`)).data as { status: string; message: string; timestamp: string },
    time: async () => (await ax.get(`${prefix}/time`)).data as { timestamp: string },
    info: async () => (await ax.get(`${prefix}/info`)).data as Record<string, unknown>,
    health: async () => (await ax.get(`${prefix}/health`)).data as { status: string; timestamp: string; checks: unknown[] },
    metrics: async () => (await ax.get(`${prefix}/metrics`, { responseType: 'text' })).data as string,
    // Download throughput measurement (Mbps) using binary payload
    diagnosticsNetwork: async (params?: { payload?: number }) => {
      const url = `${prefix}/diagnostics/network`;
      const start = performance.now();
      const res = await ax.get(url, { params, responseType: 'arraybuffer', headers: { 'accept-encoding': 'identity' } });
      const end = performance.now();
      const elapsedMs = Math.max(1, end - start);
      const serverMs = Number(res.headers['x-pingiq-server-duration-ms'] ?? 0);
      const contentLength = Number(res.headers['content-length'] ?? (res.data?.byteLength ?? 0));
      const effectiveMs = Math.max(1, elapsedMs - (Number.isFinite(serverMs) ? serverMs : 0));
      const throughputMbps = contentLength > 0 ? (contentLength * 8) / (effectiveMs / 1000) / 1_000_000 : 0;
      return {
        bytes: contentLength,
        elapsedMs,
        serverDurationMs: Number.isFinite(serverMs) ? serverMs : 0,
        effectiveMs,
        throughputMbps,
      } as const;
    },
    // Latency measurement using tiny payload RTT
    diagnosticsLatency: async () => {
      const url = `${prefix}/diagnostics/latency`;
      const start = performance.now();
      const res = await ax.get(url, { responseType: 'arraybuffer', headers: { 'accept-encoding': 'identity' } });
      const end = performance.now();
      const elapsedMs = Math.max(0, end - start);
      const serverMs = Number(res.headers['x-pingiq-server-duration-ms'] ?? 0);
      const rttMs = Math.max(0, elapsedMs - (Number.isFinite(serverMs) ? serverMs : 0));
      return { elapsedMs, serverDurationMs: Number.isFinite(serverMs) ? serverMs : 0, rttMs } as const;
    },
    env: async () => (await ax.get(`${prefix}/env`)).data as Record<string, string | undefined>,
  };
}


