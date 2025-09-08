export function nowUtcIso(): string {
  return new Date().toISOString();
}

export function safeJson<T>(value: T): string {
  return JSON.stringify(value);
}

export function parseIntSafe(value: string | string[] | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function toNumberSafe(value: string | string[] | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function bytesToMbps(bytes: number, durationMs: number): number {
  if (durationMs <= 0) return 0;
  const bits = bytes * 8;
  const seconds = durationMs / 1000;
  return bits / seconds / 1_000_000;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export async function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number, onTimeout?: () => T): Promise<T> {
  let timeoutHandle: NodeJS.Timeout | undefined;
  try {
    const timeoutPromise = new Promise<T>((resolve, reject) => {
      timeoutHandle = setTimeout(() => {
        if (onTimeout) {
          try {
            resolve(onTimeout());
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(`Operation timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);
    });
    return await Promise.race([fn(), timeoutPromise]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

export function firstForwardedIp(value: string | string[] | undefined, fallback?: string): string | undefined {
  if (!value) return fallback;
  const raw = Array.isArray(value) ? value[0] : value;
  const first = raw.split(",")[0]?.trim();
  return first || fallback;
}


