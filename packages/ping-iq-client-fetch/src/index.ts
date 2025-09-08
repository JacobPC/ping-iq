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
    diagnosticsNetwork: (params?: { samples?: number; payload?: number }) => {
      const qs = new URLSearchParams();
      if (params?.samples) qs.set("samples", String(params.samples));
      if (params?.payload) qs.set("payload", String(params.payload));
      const url = `${prefix}/diagnostics/network${qs.toString() ? `?${qs}` : ""}`;
      return request<Record<string, unknown>>(url, h);
    },
    env: () => request<Record<string, string | undefined>>(`${prefix}/env`, h),
  };
}


