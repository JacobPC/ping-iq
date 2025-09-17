export type HealthStatus = "ok" | "degraded" | "fail";
export interface ReadinessCheckResult {
    name: string;
    status: HealthStatus;
    durationMs?: number;
    error?: string;
    details?: Record<string, unknown>;
}
export type ReadinessCheck = () => Promise<ReadinessCheckResult | void> | ReadinessCheckResult | void;
export type ReadinessCheckFactory = (name: string, fn: () => Promise<boolean> | boolean) => ReadinessCheck;
export interface InfoOptions {
    name?: string;
    version?: string;
    environment?: string;
    extra?: Record<string, unknown>;
}
export interface EnvOptions {
    enabled?: boolean;
    whitelist?: string[];
}
export interface DiagnosticsOptions {
    enableThroughput?: boolean;
    maxPayloadBytes?: number;
}
export interface RateLimitOptions {
    capacity: number;
    refillPerSecond: number;
}
export interface AuthContext {
    method: string;
    url: string;
    headers: Record<string, string | string[]>;
    ip?: string;
}
export type AuthCheck = (ctx: AuthContext) => Promise<boolean> | boolean;
export interface LoggingHooks {
    onRequest?: (ctx: AuthContext) => void;
    onResponse?: (ctx: AuthContext, statusCode: number) => void;
    onError?: (ctx: AuthContext, error: unknown) => void;
}
export interface PingIQOptions {
    basePath?: string;
    info?: InfoOptions;
    readinessChecks?: ReadinessCheck[];
    env?: EnvOptions;
    diagnostics?: DiagnosticsOptions;
    rateLimit?: RateLimitOptions;
    authCheck?: AuthCheck;
    logging?: LoggingHooks;
    openapi?: {
        enabled?: boolean;
        title?: string;
        version?: string;
        description?: string;
        servers?: {
            url: string;
            description?: string;
        }[];
    };
    livenessMetrics?: boolean;
    readinessCacheTtlMs?: number;
}
export interface RequestLike {
    method: string;
    url: string;
    headers: Record<string, string | string[]>;
    query: Record<string, string | string[]>;
    body?: unknown;
    ip?: string;
}
export interface ResponseLike {
    statusCode: number;
    headers?: Record<string, string>;
    body?: string | Buffer;
}
export interface Metric {
    name: string;
    help?: string;
    type: "counter" | "gauge";
    labels?: string[];
    get(): string;
}
export interface MetricsRegistryLike {
    register(metric: Metric): void;
    inc(name: string, value?: number, labels?: Record<string, string>): void;
    set(name: string, value: number, labels?: Record<string, string>): void;
    exposition(): Promise<string> | string;
}
