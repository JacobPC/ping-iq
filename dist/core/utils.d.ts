export declare function nowUtcIso(): string;
export declare function safeJson<T>(value: T): string;
export declare function parseIntSafe(value: string | string[] | undefined, fallback: number): number;
export declare function toNumberSafe(value: string | string[] | undefined, fallback: number): number;
export declare function bytesToMbps(bytes: number, durationMs: number): number;
export declare function clamp(n: number, min: number, max: number): number;
export declare function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number, onTimeout?: () => T): Promise<T>;
export declare function firstForwardedIp(value: string | string[] | undefined, fallback?: string): string | undefined;
