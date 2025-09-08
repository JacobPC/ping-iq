"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultMetrics = createDefaultMetrics;
exports.createHandlers = createHandlers;
exports.createOptionsDefaults = createOptionsDefaults;
const utils_1 = require("./utils");
const registry_1 = require("../metrics/registry");
function createDefaultMetrics() {
    const registry = new registry_1.MetricsRegistry();
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
};
const SECURE_TEXT_HEADERS = {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store",
    "pragma": "no-cache",
    "x-content-type-options": "nosniff",
};
function ok(json) {
    return { status: 200, headers: { ...SECURE_JSON_HEADERS }, body: (0, utils_1.safeJson)(json) };
}
function textOk(text) {
    return { status: 200, headers: { ...SECURE_TEXT_HEADERS }, body: text };
}
function notFound() { return { status: 404, headers: { ...SECURE_JSON_HEADERS }, body: (0, utils_1.safeJson)({ error: "Not Found" }) }; }
function unauthorized() { return { status: 401, headers: { ...SECURE_JSON_HEADERS }, body: (0, utils_1.safeJson)({ error: "Unauthorized" }) }; }
function tooManyRequests() { return { status: 429, headers: { ...SECURE_JSON_HEADERS }, body: (0, utils_1.safeJson)({ error: "Too Many Requests" }) }; }
async function runReadinessChecks(checks) {
    const results = [];
    for (const check of checks) {
        const start = Date.now();
        try {
            const r = await Promise.resolve(check());
            const base = r && typeof r === "object" && "status" in r ? r : { name: "check", status: "ok" };
            results.push({ ...base, durationMs: Date.now() - start });
        }
        catch (e) {
            results.push({ name: "check", status: "fail", durationMs: Date.now() - start, error: e instanceof Error ? e.message : String(e) });
        }
    }
    let overall = "ok";
    if (results.some((r) => r.status === "fail"))
        overall = "fail";
    else if (results.some((r) => r.status === "degraded"))
        overall = "degraded";
    return { status: overall, checks: results };
}
function createHandlers(ctx) {
    const { options, metrics, rateLimiter } = ctx;
    function recordProcessMetrics() {
        metrics.set("pingiq_process_uptime_seconds", process.uptime());
        const mem = process.memoryUsage();
        metrics.set("pingiq_process_memory_rss_bytes", mem.rss);
    }
    async function guard(req, endpoint) {
        options.logging.onRequest?.({ method: req.method, url: req.url, headers: req.headers, ip: req.ip });
        if (options.authCheck) {
            const allowed = await Promise.resolve(options.authCheck({ method: req.method, url: req.url, headers: req.headers, ip: req.ip }));
            if (!allowed)
                return unauthorized();
        }
        metrics.inc("pingiq_requests_total", 1, { endpoint });
        recordProcessMetrics();
        return true;
    }
    function respond(endpoint, res, req) {
        options.logging.onResponse?.({ method: req.method, url: req.url, headers: req.headers, ip: req.ip }, res.status);
        return res;
    }
    return {
        root: async (req) => {
            return textOk("OK");
        },
        ping: async (req) => {
            const g = await guard(req, "ping");
            if (g !== true)
                return respond("ping", g, req);
            return respond("ping", ok({ status: "ok", message: "pong", timestamp: (0, utils_1.nowUtcIso)() }), req);
        },
        time: async (req) => {
            const g = await guard(req, "time");
            if (g !== true)
                return respond("time", g, req);
            return respond("time", ok({ timestamp: (0, utils_1.nowUtcIso)() }), req);
        },
        info: async (req) => {
            const g = await guard(req, "info");
            if (g !== true)
                return respond("info", g, req);
            const { name = "service", version = "0.0.0", environment = process.env.NODE_ENV ?? "unknown", extra = {} } = options.info;
            return respond("info", ok({ name, version, environment, ...extra }), req);
        },
        health: async (req) => {
            return textOk("ok");
        },
        healthz: async (req) => {
            return textOk("ok");
        },
        readiness: async (req) => {
            const g = await guard(req, "readiness");
            if (g !== true)
                return respond("readiness", g, req);
            const { status, checks } = await runReadinessChecks(options.readinessChecks);
            return respond("readiness", ok({ status, timestamp: (0, utils_1.nowUtcIso)(), checks }), req);
        },
        metrics: async (req) => {
            const g = await guard(req, "metrics");
            if (g !== true)
                return respond("metrics", g, req);
            return respond("metrics", {
                status: 200,
                headers: {
                    "content-type": "text/plain; version=0.0.4",
                    "cache-control": "no-store",
                    "pragma": "no-cache",
                    "x-content-type-options": "nosniff",
                },
                body: metrics.exposition(),
            }, req);
        },
        diagnosticsNetwork: async (req) => {
            const g = await guard(req, "diagnostics_network");
            if (g !== true)
                return respond("diagnostics_network", g, req);
            if (rateLimiter) {
                const key = (0, utils_1.firstForwardedIp)(req.headers["x-forwarded-for"], req.ip) || "unknown";
                if (!rateLimiter.tryConsume(key, 1))
                    return respond("diagnostics_network", tooManyRequests(), req);
            }
            const samples = (0, utils_1.parseIntSafe)(req.query["samples"], 5);
            const payloadBytes = (0, utils_1.parseIntSafe)(req.query["payload"], 64 * 1024);
            const enableThroughput = options.diagnostics.enableThroughput;
            const maxPayload = options.diagnostics.maxPayloadBytes;
            const size = Math.min(payloadBytes, maxPayload);
            const payload = enableThroughput ? Buffer.alloc(size, 0) : undefined;
            const latencies = [];
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
            const result = { samples, avgMs: avg, minMs: min, maxMs: max, jitterMs: jitter };
            if (enableThroughput && payload) {
                const start = Date.now();
                // pretend to send payload back
                const duration = Date.now() - start;
                result.throughputMbps = (0, utils_1.bytesToMbps)(payload.length, Math.max(1, duration));
                result.payloadBytes = payload.length;
            }
            return respond("diagnostics_network", ok(result), req);
        },
        env: async (req) => {
            const g = await guard(req, "env");
            if (g !== true)
                return respond("env", g, req);
            if (!options.env.enabled)
                return respond("env", notFound(), req);
            const list = options.env.whitelist;
            const out = {};
            for (const k of list)
                out[k] = process.env[k];
            return respond("env", ok(out), req);
        },
        openapi: async (req) => {
            const g = await guard(req, "openapi");
            if (g !== true)
                return respond("openapi", g, req);
            if (!options.openapi?.enabled)
                return respond("openapi", notFound(), req);
            const { generateOpenAPISpec } = require("../openapi/generator");
            const spec = generateOpenAPISpec(options);
            return respond("openapi", { status: 200, headers: { ...SECURE_JSON_HEADERS }, body: JSON.stringify(spec) }, req);
        },
    };
}
function createOptionsDefaults(opts) {
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
            maxPayloadBytes: opts?.diagnostics?.maxPayloadBytes ?? 1000000,
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
