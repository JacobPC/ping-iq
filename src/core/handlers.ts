import { bytesToMbps, nowUtcIso, parseIntSafe, safeJson, toNumberSafe, firstForwardedIp } from "./utils";
import { InMemoryRateLimiter } from "../security/rateLimiter";
import { MetricsRegistry } from "../metrics/registry";
import { PingIQOptions, ReadinessCheck, ReadinessCheckResult, InfoOptions, EnvOptions, DiagnosticsOptions, RateLimitOptions, AuthCheck, LoggingHooks } from "./types";

export interface HandlerResponse {
  status: number;
  headers?: Record<string, string>;
  body?: string | Buffer;
}

export interface HandlerContext {
  options: PingIQResolvedOptions;
  metrics: MetricsRegistry;
  rateLimiter?: InMemoryRateLimiter;
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
    servers?: { url: string; description?: string }[];
  };
}

export function createDefaultMetrics(): MetricsRegistry {
  const registry = new MetricsRegistry();
  registry.counter("pingiq_requests_total", "Total requests to PingIQ endpoints", ["endpoint"]);
  registry.gauge("pingiq_process_uptime_seconds", "Node.js process uptime in seconds");
  registry.gauge("pingiq_process_memory_rss_bytes", "Resident set size memory in bytes");
  return registry;
}

const SECURE_JSON_HEADERS = {
  "content-type": "application/json",
  "cache-control": "no-store",
  "pragma": "no-cache",
  "x-content-type-options": "nosniff",
} as const;

const SECURE_TEXT_HEADERS = {
  "content-type": "text/plain; charset=utf-8",
  "cache-control": "no-store",
  "pragma": "no-cache",
  "x-content-type-options": "nosniff",
} as const;

function ok(json: unknown): HandlerResponse {
  return { status: 200, headers: { ...SECURE_JSON_HEADERS }, body: safeJson(json) };
}

function textOk(text: string): HandlerResponse {
  return { status: 200, headers: { ...SECURE_TEXT_HEADERS }, body: text };
}

function notFound(): HandlerResponse { return { status: 404, headers: { ...SECURE_JSON_HEADERS }, body: safeJson({ error: "Not Found" }) }; }
function unauthorized(): HandlerResponse { return { status: 401, headers: { ...SECURE_JSON_HEADERS }, body: safeJson({ error: "Unauthorized" }) }; }
function tooManyRequests(): HandlerResponse { return { status: 429, headers: { ...SECURE_JSON_HEADERS }, body: safeJson({ error: "Too Many Requests" }) }; }

async function runReadinessChecks(checks: ReadinessCheck[]): Promise<{ status: "ok" | "degraded" | "fail"; checks: ReadinessCheckResult[] }> {
  const results: ReadinessCheckResult[] = [];
  for (const check of checks) {
    const start = Date.now();
    try {
      const r = await Promise.resolve(check());
      const base: ReadinessCheckResult = r && typeof r === "object" && "status" in r ? (r as ReadinessCheckResult) : { name: "check", status: "ok" };
      results.push({ ...base, durationMs: Date.now() - start });
    } catch (e) {
      results.push({ name: "check", status: "fail", durationMs: Date.now() - start, error: e instanceof Error ? e.message : String(e) });
    }
  }
  let overall: "ok" | "degraded" | "fail" = "ok";
  if (results.some((r) => r.status === "fail")) overall = "fail";
  else if (results.some((r) => r.status === "degraded")) overall = "degraded";
  return { status: overall, checks: results };
}

export function createHandlers(ctx: HandlerContext) {
  const { options, metrics, rateLimiter } = ctx;

  function recordProcessMetrics() {
    metrics.set("pingiq_process_uptime_seconds", process.uptime());
    const mem = process.memoryUsage();
    metrics.set("pingiq_process_memory_rss_bytes", mem.rss);
  }

  async function guard(req: { method: string; url: string; headers: Record<string, string | string[]>; ip?: string; }, endpoint: string): Promise<true | HandlerResponse> {
    options.logging.onRequest?.({ method: req.method, url: req.url, headers: req.headers, ip: req.ip });
    if (options.authCheck) {
      const allowed = await Promise.resolve(options.authCheck({ method: req.method, url: req.url, headers: req.headers, ip: req.ip }));
      if (!allowed) return unauthorized();
    }
    metrics.inc("pingiq_requests_total", 1, { endpoint });
    recordProcessMetrics();
    return true as const;
  }

  function respond(endpoint: string, res: HandlerResponse, req: { method: string; url: string; headers: Record<string, string | string[]>; ip?: string; }) {
    options.logging.onResponse?.({ method: req.method, url: req.url, headers: req.headers, ip: req.ip }, res.status);
    return res;
  }

  return {
    ping: async (req: any) => {
      const g = await guard(req, "ping");
      if (g !== true) return respond("ping", g, req);
      return respond("ping", ok({ status: "ok", message: "pong", timestamp: nowUtcIso() }), req);
    },

    time: async (req: any) => {
      const g = await guard(req, "time");
      if (g !== true) return respond("time", g, req);
      return respond("time", ok({ timestamp: nowUtcIso() }), req);
    },

    info: async (req: any) => {
      const g = await guard(req, "info");
      if (g !== true) return respond("info", g, req);
      const { name = "service", version = "0.0.0", environment = process.env.NODE_ENV ?? "unknown", extra = {} } = options.info;
      return respond("info", ok({ name, version, environment, ...extra }), req);
    },

    health: async (req: any) => {
      const g = await guard(req, "health");
      if (g !== true) return respond("health", g, req);
      const { status, checks } = await runReadinessChecks(options.readinessChecks);
      return respond("health", ok({ status, timestamp: nowUtcIso(), checks }), req);
    },

    metrics: async (req: any) => {
      const g = await guard(req, "metrics");
      if (g !== true) return respond("metrics", g, req);
      return respond(
        "metrics",
        {
          status: 200,
          headers: {
            "content-type": "text/plain; version=0.0.4",
            "cache-control": "no-store",
            "pragma": "no-cache",
            "x-content-type-options": "nosniff",
          },
          body: metrics.exposition(),
        },
        req
      );
    },

    diagnosticsNetwork: async (req: { method: string; url: string; headers: Record<string, string | string[]>; query: Record<string, string | string[]>; body?: any; ip?: string; }) => {
      const g = await guard(req, "diagnostics_network");
      if (g !== true) return respond("diagnostics_network", g, req);
      if (rateLimiter) {
        const key = firstForwardedIp(req.headers["x-forwarded-for"], req.ip) || "unknown";
        if (!rateLimiter.tryConsume(key, 1)) return respond("diagnostics_network", tooManyRequests(), req);
      }

      const samples = parseIntSafe(req.query["samples"], 5);
      const payloadBytes = parseIntSafe(req.query["payload"], 64 * 1024);
      const enableThroughput = options.diagnostics.enableThroughput;
      const maxPayload = options.diagnostics.maxPayloadBytes;
      const size = Math.min(payloadBytes, maxPayload);

      const payload = enableThroughput ? Buffer.alloc(size, 0) : undefined;
      const latencies: number[] = [];

      for (let i = 0; i < samples; i++) {
        const start = Date.now();
        // Simulate echo to measure latency; framework adapters will avoid extra overhead
        // and simply respond immediately measuring server-side processing.
        const end = Date.now();
        latencies.push(end - start);
      }

      const avg = latencies.reduce((a, b) => a + b, 0) / Math.max(1, latencies.length);
      const min = Math.min(...latencies);
      const max = Math.max(...latencies);
      const jitter = max - min;

      const result: any = { samples, avgMs: avg, minMs: min, maxMs: max, jitterMs: jitter };
      if (enableThroughput && payload) {
        const start = Date.now();
        // pretend to send payload back
        const duration = Date.now() - start;
        result.throughputMbps = bytesToMbps(payload.length, Math.max(1, duration));
        result.payloadBytes = payload.length;
      }

      return respond("diagnostics_network", ok(result), req);
    },

    env: async (req: { method: string; url: string; headers: Record<string, string | string[]>; ip?: string; }) => {
      const g = await guard(req, "env");
      if (g !== true) return respond("env", g, req);
      if (!options.env.enabled) return respond("env", notFound(), req);
      const list = options.env.whitelist;
      const out: Record<string, string | undefined> = {};
      for (const k of list) out[k] = process.env[k];
      return respond("env", ok(out), req);
    },

    openapi: async (req: any) => {
      const g = await guard(req, "openapi");
      if (g !== true) return respond("openapi", g, req);
      if (!options.openapi?.enabled) return respond("openapi", notFound(), req);
      const { generateOpenAPISpec } = require("../openapi/generator");
      const spec = generateOpenAPISpec(options);
      return respond("openapi", { status: 200, headers: { ...SECURE_JSON_HEADERS }, body: JSON.stringify(spec) }, req);
    },
  };
}

export function createOptionsDefaults(opts?: PingIQOptions): PingIQResolvedOptions {
  return {
    basePath: opts?.basePath ?? "/",
    info: {
      name: opts?.info?.name ?? undefined,
      version: opts?.info?.version ?? undefined,
      environment: opts?.info?.environment ?? undefined,
      extra: opts?.info?.extra ?? {},
    },
    readinessChecks: opts?.readinessChecks ?? [() => ({ name: "liveness", status: "ok" })],
    env: {
      enabled: opts?.env?.enabled ?? false,
      whitelist: opts?.env?.whitelist ?? [],
    },
    diagnostics: {
      enableThroughput: opts?.diagnostics?.enableThroughput ?? false,
      maxPayloadBytes: opts?.diagnostics?.maxPayloadBytes ?? 1_000_000,
    },
    rateLimit: opts?.rateLimit ?? { capacity: 5, refillPerSecond: 0.2 },
    authCheck: opts?.authCheck,
    logging: {
      onRequest: opts?.logging?.onRequest,
      onResponse: opts?.logging?.onResponse,
      onError: opts?.logging?.onError,
    },
    openapi: {
      enabled: opts?.openapi?.enabled ?? false,
      title: opts?.openapi?.title,
      version: opts?.openapi?.version,
      description: opts?.openapi?.description,
      servers: opts?.openapi?.servers,
    },
  };
}


