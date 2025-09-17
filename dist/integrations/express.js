"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExpressRouter = createExpressRouter;
function toReq(req) {
    return {
        method: req.method,
        url: req.originalUrl || req.url,
        headers: req.headers,
        query: req.query,
        body: req.body,
        ip: req.headers["x-forwarded-for"] || req.ip,
    };
}
function send(res, out) {
    if (out.headers) {
        for (const [k, v] of Object.entries(out.headers))
            res.setHeader(k, v);
    }
    res.status(out.status).send(out.body);
}
function createExpressRouter(handlers, basePath = "/") {
    const express = require("express");
    const router = express.Router();
    // root liveness OK
    router.get(`${basePath}`, async (req, res) => send(res, await handlers.root(toReq(req))));
    router.get(`${basePath}ping`, async (req, res) => send(res, await handlers.ping(toReq(req))));
    router.get(`${basePath}time`, async (req, res) => send(res, await handlers.time(toReq(req))));
    router.get(`${basePath}info`, async (req, res) => send(res, await handlers.info(toReq(req))));
    router.get(`${basePath}health`, async (req, res) => send(res, await handlers.health(toReq(req))));
    router.get(`${basePath}healthz`, async (req, res) => send(res, await handlers.healthz(toReq(req))));
    router.get(`${basePath}readiness`, async (req, res) => send(res, await handlers.readiness(toReq(req))));
    router.get(`${basePath}metrics`, async (req, res) => send(res, await handlers.metrics(toReq(req))));
    router.get(`${basePath}diagnostics/network`, async (req, res) => send(res, await handlers.diagnosticsNetwork(toReq(req))));
    router.get(`${basePath}diagnostics/latency`, async (req, res) => send(res, await handlers.diagnosticsLatency(toReq(req))));
    router.get(`${basePath}env`, async (req, res) => send(res, await handlers.env(toReq(req))));
    router.get(`${basePath}openapi.json`, async (req, res) => send(res, await handlers.openapi(toReq(req))));
    router.post(`${basePath}maintenance/enable`, async (req, res) => send(res, await handlers.maintenanceEnable(toReq(req))));
    router.post(`${basePath}maintenance/disable`, async (req, res) => send(res, await handlers.maintenanceDisable(toReq(req))));
    // Not-found within basePath
    router.use((err, _req, res, _next) => {
        res.status(500).json({ error: "Internal Server Error" });
    });
    return router;
}
