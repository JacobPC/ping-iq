import { ReadinessCheck } from "./types";

export function booleanCheck(name: string, fn: () => boolean | Promise<boolean>): ReadinessCheck {
  return async () => {
    const ok = await Promise.resolve(fn());
    return { name, status: ok ? "ok" : "fail" } as const;
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


