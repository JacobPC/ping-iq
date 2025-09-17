import { InMemoryRateLimiter } from "../security/rateLimiter";
import { MetricsRegistry } from "../metrics/registry";
import { PingIQOptions, ReadinessCheck, ReadinessCheckResult, InfoOptions, EnvOptions, DiagnosticsOptions, RateLimitOptions, AuthCheck, LoggingHooks } from "./types";
export interface HandlerResponse {
    status: number;
    headers?: Record<string, string>;
    body?: string | Buffer;
}
export interface RuntimeState {
    maintenance: boolean;
    readinessCache?: {
        ts: number;
        result: {
            status: "ok" | "degraded" | "fail";
            checks: ReadinessCheckResult[];
        };
    };
}
export interface HandlerContext {
    options: PingIQResolvedOptions;
    metrics: MetricsRegistry;
    rateLimiter?: InMemoryRateLimiter;
    state: RuntimeState;
}
export interface PingIQResolvedOptions {
    basePath: string;
    info: InfoOptions;
    readinessChecks: ReadinessCheck[];
    env: Required<EnvOptions>;
    diagnostics: Required<DiagnosticsOptions>;
    rateLimit: RateLimitOptions;
    authCheck?: AuthCheck;
    logging: LoggingHooks;
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
    readinessCacheTtlMs?: number;
}
export declare function createDefaultMetrics(): MetricsRegistry;
export declare function createHandlers(ctx: HandlerContext): {
    root: (req: any) => Promise<HandlerResponse>;
    ping: (req: any) => Promise<HandlerResponse>;
    time: (req: any) => Promise<HandlerResponse>;
    info: (req: any) => Promise<HandlerResponse>;
    health: (req: any) => Promise<HandlerResponse>;
    healthz: (req: any) => Promise<HandlerResponse>;
    readiness: (req: {
        method: string;
        url: string;
        headers: Record<string, string | string[]>;
        query: Record<string, string | string[]>;
    }) => Promise<HandlerResponse>;
    metrics: (req: any) => Promise<HandlerResponse>;
    diagnosticsNetwork: (req: {
        method: string;
        url: string;
        headers: Record<string, string | string[]>;
        query: Record<string, string | string[]>;
        body?: any;
        ip?: string;
    }) => Promise<HandlerResponse>;
    diagnosticsLatency: (req: {
        method: string;
        url: string;
        headers: Record<string, string | string[]>;
        query: Record<string, string | string[]>;
        body?: any;
        ip?: string;
    }) => Promise<HandlerResponse>;
    env: (req: {
        method: string;
        url: string;
        headers: Record<string, string | string[]>;
        ip?: string;
    }) => Promise<HandlerResponse>;
    openapi: (req: any) => Promise<HandlerResponse>;
    maintenanceEnable: (req: any) => Promise<HandlerResponse>;
    maintenanceDisable: (req: any) => Promise<HandlerResponse>;
};
export declare function createOptionsDefaults(opts?: PingIQOptions): PingIQResolvedOptions;
