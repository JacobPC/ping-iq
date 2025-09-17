"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOpenAPISpec = generateOpenAPISpec;
function generateOpenAPISpec(opts) {
    const base = opts.basePath.replace(/\/$/, "");
    const info = opts.info;
    const doc = {
        openapi: "3.0.3",
        info: {
            title: opts.openapi?.title || (info.name ? `${info.name} - PingIQ` : "PingIQ"),
            version: opts.openapi?.version || info.version || "0.1.0",
            description: opts.openapi?.description || "Health, diagnostics and metrics endpoints provided by PingIQ.",
        },
        servers: opts.openapi?.servers || [],
        paths: {},
        components: {},
    };
    const jsonResp = (schema) => ({
        description: "Success",
        content: { "application/json": { schema } },
    });
    const textResp = () => ({
        description: "Success",
        content: { "text/plain": { schema: { type: "string" } } },
    });
    const paths = {
        [`${base}/`]: { get: { summary: "Liveness (OK)", responses: { 200: textResp() } } },
        [`${base}/health`]: { get: { summary: "Liveness (ok)", responses: { 200: textResp() } } },
        [`${base}/healthz`]: { get: { summary: "Liveness (ok)", responses: { 200: textResp() } } },
        [`${base}/ping`]: {
            get: {
                summary: "Ping",
                responses: { 200: jsonResp({ type: "object", properties: { status: { type: "string" }, message: { type: "string" }, timestamp: { type: "string", format: "date-time" } } }) },
            },
        },
        [`${base}/time`]: {
            get: { summary: "Server time (UTC)", responses: { 200: jsonResp({ type: "object", properties: { timestamp: { type: "string", format: "date-time" } } }) } },
        },
        [`${base}/info`]: {
            get: { summary: "Service info", responses: { 200: jsonResp({ type: "object", additionalProperties: true }) } },
        },
        // legacy: keep readiness detailed under /readiness
        [`${base}/readiness`]: {
            get: { summary: "Readiness (detailed checks)", responses: { 200: jsonResp({ type: "object", properties: { status: { type: "string", enum: ["ok", "degraded", "fail"] }, timestamp: { type: "string", format: "date-time" }, checks: { type: "array", items: { type: "object", additionalProperties: true } } } }) } },
        },
        [`${base}/metrics`]: {
            get: { summary: "Prometheus metrics", responses: { 200: textResp() } },
        },
        [`${base}/diagnostics/network`]: {
            get: {
                summary: "Download throughput payload",
                parameters: [
                    { name: "payload", in: "query", schema: { type: "integer", minimum: 0 }, required: false },
                ],
                responses: {
                    200: {
                        description: "Binary payload for bandwidth measurement",
                        content: { "application/octet-stream": { schema: { type: "string", format: "binary" } } },
                    },
                },
            },
        },
        [`${base}/diagnostics/latency`]: {
            get: {
                summary: "Tiny payload for RTT measurement",
                responses: {
                    200: {
                        description: "Single-byte payload",
                        content: { "application/octet-stream": { schema: { type: "string", format: "binary" } } },
                    },
                },
            },
        },
    };
    if (opts.env.enabled) {
        paths[`${base}/env`] = { get: { summary: "Whitelisted environment variables", responses: { 200: jsonResp({ type: "object", additionalProperties: { type: ["string", "null"] } }) } } };
    }
    doc.paths = paths;
    return doc;
}
