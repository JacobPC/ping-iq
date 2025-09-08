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
    diagnosticsNetwork: async (params?: { samples?: number; payload?: number }) => (await ax.get(`${prefix}/diagnostics/network`, { params })).data as Record<string, unknown>,
    env: async () => (await ax.get(`${prefix}/env`)).data as Record<string, string | undefined>,
  };
}


