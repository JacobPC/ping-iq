"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFastifyPlugin = createFastifyPlugin;
function createFastifyPlugin(handlers, basePath = "/") {
    return async function (fastify, _opts) {
        fastify.get(`${basePath}`, async (req, reply) => {
            const out = await handlers.root({ method: req.method, url: req.url, headers: req.headers, query: req.query || {}, ip: req.headers["x-forwarded-for"] || req.ip });
            if (out.headers)
                reply.headers(out.headers);
            reply.code(out.status).send(out.body);
        });
        fastify.get(`${basePath}ping`, async (req, reply) => {
            const out = await handlers.ping({
                method: req.method,
                url: req.url,
                headers: req.headers,
                query: req.query || {},
                ip: req.headers["x-forwarded-for"] || req.ip,
            });
            if (out.headers)
                reply.headers(out.headers);
            reply.code(out.status).send(out.body);
        });
        fastify.get(`${basePath}time`, async (req, reply) => {
            const out = await handlers.time({ method: req.method, url: req.url, headers: req.headers, query: req.query || {}, ip: req.headers["x-forwarded-for"] || req.ip });
            if (out.headers)
                reply.headers(out.headers);
            reply.code(out.status).send(out.body);
        });
        fastify.get(`${basePath}info`, async (req, reply) => {
            const out = await handlers.info({ method: req.method, url: req.url, headers: req.headers, query: req.query || {}, ip: req.headers["x-forwarded-for"] || req.ip });
            if (out.headers)
                reply.headers(out.headers);
            reply.code(out.status).send(out.body);
        });
        fastify.get(`${basePath}health`, async (req, reply) => {
            const out = await handlers.health({ method: req.method, url: req.url, headers: req.headers, query: req.query || {}, ip: req.headers["x-forwarded-for"] || req.ip });
            if (out.headers)
                reply.headers(out.headers);
            reply.code(out.status).send(out.body);
        });
        fastify.get(`${basePath}healthz`, async (req, reply) => {
            const out = await handlers.healthz({ method: req.method, url: req.url, headers: req.headers, query: req.query || {}, ip: req.headers["x-forwarded-for"] || req.ip });
            if (out.headers)
                reply.headers(out.headers);
            reply.code(out.status).send(out.body);
        });
        fastify.get(`${basePath}readiness`, async (req, reply) => {
            const out = await handlers.readiness({ method: req.method, url: req.url, headers: req.headers, query: req.query || {} });
            if (out.headers)
                reply.headers(out.headers);
            reply.code(out.status).send(out.body);
        });
        fastify.get(`${basePath}metrics`, async (req, reply) => {
            const out = await handlers.metrics({ method: req.method, url: req.url, headers: req.headers, query: req.query || {}, ip: req.headers["x-forwarded-for"] || req.ip });
            if (out.headers)
                reply.headers(out.headers);
            reply.code(out.status).send(out.body);
        });
        fastify.get(`${basePath}diagnostics/network`, async (req, reply) => {
            const out = await handlers.diagnosticsNetwork({ method: req.method, url: req.url, headers: req.headers, query: req.query || {}, ip: req.headers["x-forwarded-for"] || req.ip });
            if (out.headers)
                reply.headers(out.headers);
            reply.code(out.status).send(out.body);
        });
        fastify.get(`${basePath}diagnostics/latency`, async (req, reply) => {
            const out = await handlers.diagnosticsLatency({ method: req.method, url: req.url, headers: req.headers, query: req.query || {}, ip: req.headers["x-forwarded-for"] || req.ip });
            if (out.headers)
                reply.headers(out.headers);
            reply.code(out.status).send(out.body);
        });
        fastify.get(`${basePath}env`, async (req, reply) => {
            const out = await handlers.env({ method: req.method, url: req.url, headers: req.headers, ip: req.headers["x-forwarded-for"] || req.ip });
            if (out.headers)
                reply.headers(out.headers);
            reply.code(out.status).send(out.body);
        });
        fastify.get(`${basePath}openapi.json`, async (req, reply) => {
            const out = await handlers.openapi({ method: req.method, url: req.url, headers: req.headers, query: req.query || {}, ip: req.headers["x-forwarded-for"] || req.ip });
            if (out.headers)
                reply.headers(out.headers);
            reply.code(out.status).send(out.body);
        });
        fastify.post(`${basePath}maintenance/enable`, async (req, reply) => {
            const out = await handlers.maintenanceEnable({ method: req.method, url: req.url, headers: req.headers, query: req.query || {} });
            if (out.headers)
                reply.headers(out.headers);
            reply.code(out.status).send(out.body);
        });
        fastify.post(`${basePath}maintenance/disable`, async (req, reply) => {
            const out = await handlers.maintenanceDisable({ method: req.method, url: req.url, headers: req.headers, query: req.query || {} });
            if (out.headers)
                reply.headers(out.headers);
            reply.code(out.status).send(out.body);
        });
    };
}
