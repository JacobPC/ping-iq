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
    const { options, metrics, rateLimiter, state } = ctx;
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
            // Maintenance mode forces readiness fail
            if (state.maintenance) {
                const accepts = String(req.headers["accept"] || "");
                if (accepts.includes("application/health+json")) {
                    return respond("readiness", { status: 200, headers: { ...SECURE_JSON_HEADERS, "content-type": "application/health+json" }, body: JSON.stringify({ status: "fail" }) }, req);
                }
                return respond("readiness", ok({ status: "fail", timestamp: (0, utils_1.nowUtcIso)(), checks: [{ name: "maintenance", status: "fail" }] }), req);
            }
            // Cache TTL
            const ttl = options.readinessCacheTtlMs ?? 0;
            const now = Date.now();
            if (ttl > 0 && state.readinessCache && now - state.readinessCache.ts < ttl) {
                const cached = state.readinessCache.result;
                const accepts = String(req.headers["accept"] || "");
                if (accepts.includes("application/health+json")) {
                    const map = { ok: "pass", degraded: "warn", fail: "fail" };
                    return respond("readiness", { status: 200, headers: { ...SECURE_JSON_HEADERS, "content-type": "application/health+json" }, body: JSON.stringify({ status: map[cached.status] }) }, req);
                }
                return respond("readiness", ok({ status: cached.status, timestamp: (0, utils_1.nowUtcIso)(), checks: cached.checks }), req);
            }
            const computed = await runReadinessChecks(options.readinessChecks);
            state.readinessCache = { ts: now, result: computed };
            const accepts = String(req.headers["accept"] || "");
            if (accepts.includes("application/health+json")) {
                const map = { ok: "pass", degraded: "warn", fail: "fail" };
                return respond("readiness", { status: 200, headers: { ...SECURE_JSON_HEADERS, "content-type": "application/health+json" }, body: JSON.stringify({ status: map[computed.status] }) }, req);
            }
            return respond("readiness", ok({ status: computed.status, timestamp: (0, utils_1.nowUtcIso)(), checks: computed.checks }), req);
        },
        metrics: async (req) => {
            const g = await guard(req, "metrics");
            if (g !== true)
                return respond("metrics", g, req);
            const body = await metrics.exposition();
            return respond("metrics", {
                status: 200,
                headers: {
                    "content-type": metrics.getRegistry ? metrics.getRegistry().contentType : "text/plain; version=0.0.4",
                    "cache-control": "no-store",
                    "pragma": "no-cache",
                    "x-content-type-options": "nosniff",
                },
                body,
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
            const requestedBytes = (0, utils_1.parseIntSafe)(req.query["payload"], 64 * 1024);
            const maxPayload = options.diagnostics.maxPayloadBytes;
            const size = Math.min(Math.max(0, requestedBytes), maxPayload);
            const start = Date.now();
            const payload = Buffer.alloc(size, 0);
            const serverDurationMs = Date.now() - start;
            return respond("diagnostics_network", {
                status: 200,
                headers: {
                    ...SECURE_TEXT_HEADERS,
                    "content-type": "application/octet-stream",
                    "content-length": String(payload.length),
                    "x-pingiq-server-duration-ms": String(serverDurationMs),
                    "x-pingiq-payload-bytes": String(payload.length),
                },
                body: payload,
            }, req);
        },
        diagnosticsLatency: async (req) => {
            const g = await guard(req, "diagnostics_latency");
            if (g !== true)
                return respond("diagnostics_latency", g, req);
            if (rateLimiter) {
                const key = (0, utils_1.firstForwardedIp)(req.headers["x-forwarded-for"], req.ip) || "unknown";
                if (!rateLimiter.tryConsume(key, 1))
                    return respond("diagnostics_latency", tooManyRequests(), req);
            }
            // Always return tiny body for RTT measurement
            const start = Date.now();
            const payload = Buffer.from([0]);
            const serverDurationMs = Date.now() - start;
            return respond("diagnostics_latency", {
                status: 200,
                headers: {
                    ...SECURE_TEXT_HEADERS,
                    "content-type": "application/octet-stream",
                    "content-length": "1",
                    "x-pingiq-server-duration-ms": String(serverDurationMs),
                },
                body: payload,
            }, req);
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
        maintenanceEnable: async (req) => {
            const g = await guard(req, "maintenance_enable");
            if (g !== true)
                return respond("maintenance_enable", g, req);
            state.maintenance = true;
            state.readinessCache = undefined;
            return respond("maintenance_enable", ok({ maintenance: true }), req);
        },
        maintenanceDisable: async (req) => {
            const g = await guard(req, "maintenance_disable");
            if (g !== true)
                return respond("maintenance_disable", g, req);
            state.maintenance = false;
            state.readinessCache = undefined;
            return respond("maintenance_disable", ok({ maintenance: false }), req);
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
