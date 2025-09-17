import { ReadinessCheck } from "./types";

export function booleanCheck(name: string, fn: () => boolean | Promise<boolean>): ReadinessCheck {
  return async () => {
    try {
      const ok = await Promise.resolve(fn());
      return { name, status: ok ? "ok" : "fail" } as const;
    } catch (e) {
      return { name, status: "fail", error: e instanceof Error ? e.message : String(e) } as const;
    }
  };
}

export function timedCheck(name: string, fn: () => Promise<void> | void): ReadinessCheck {
  return async () => {
    const start = Date.now();
    try {
      await Promise.resolve(fn());
      return { name, status: "ok", durationMs: Date.now() - start };
    } catch (e) {
      return { name, status: "fail", durationMs: Date.now() - start, error: e instanceof Error ? e.message : String(e) };
    }
  };
}

export function httpGetCheck(name: string, url: string, timeoutMs = 2000, fetchImpl?: typeof fetch): ReadinessCheck {
  return async () => {
    const fetchFn = fetchImpl ?? (globalThis as any).fetch;
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchFn(url, { signal: controller.signal });
      clearTimeout(to);
      return { name, status: res.ok ? 'ok' : 'fail', details: { status: res.status } } as const;
    } catch (e) {
      clearTimeout(to);
      return { name, status: 'fail', error: e instanceof Error ? e.message : String(e) } as const;
    }
  };
}

export function tcpPortCheck(name: string, host: string, port: number, timeoutMs = 2000): ReadinessCheck {
  return async () => {
    const net = await import('node:net');
    return await new Promise((resolve) => {
      const socket = new net.Socket();
      const timer = setTimeout(() => { socket.destroy(); resolve({ name, status: 'fail', error: 'timeout' } as const); }, timeoutMs);
      socket.connect(port, host, () => {
        clearTimeout(timer); socket.end(); resolve({ name, status: 'ok' } as const);
      });
      socket.on('error', (err: any) => { clearTimeout(timer); resolve({ name, status: 'fail', error: String(err?.message || err) } as const); });
    });
  };
}

export function clientPingCheck(name: string, fn: () => Promise<void> | void): ReadinessCheck {
  return async () => {
    try { await Promise.resolve(fn()); return { name, status: 'ok' } as const; }
    catch (e) { return { name, status: 'fail', error: e instanceof Error ? e.message : String(e) } as const; }
  };
}
