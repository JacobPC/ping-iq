"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNestModule = createNestModule;
function createNestModule(handlers, basePath = "/") {
    // Lightweight adapter: returns path and a Nest-compatible middleware
    const middleware = async (req, res, next) => {
        const url = req.originalUrl || req.url;
        const match = (p) => url.startsWith(p);
        const makeReq = (q = {}) => ({ method: req.method, url, headers: req.headers, query: q, ip: req.headers["x-forwarded-for"] || req.ip });
        const send = (out) => {
            if (out.headers)
                for (const [k, v] of Object.entries(out.headers))
                    res.setHeader(k, v);
            res.statusCode = out.status;
            res.end(out.body);
        };
        try {
            if (match(`${basePath}`))
                return send(await handlers.root(makeReq(req.query)));
            if (match(`${basePath}ping`))
                return send(await handlers.ping(makeReq(req.query)));
            if (match(`${basePath}time`))
                return send(await handlers.time(makeReq(req.query)));
            if (match(`${basePath}info`))
                return send(await handlers.info(makeReq(req.query)));
            if (match(`${basePath}health`))
                return send(await handlers.health(makeReq(req.query)));
            if (match(`${basePath}healthz`))
                return send(await handlers.healthz(makeReq(req.query)));
            if (match(`${basePath}readiness`))
                return send(await handlers.readiness(makeReq(req.query)));
            if (match(`${basePath}metrics`))
                return send(await handlers.metrics(makeReq(req.query)));
            if (match(`${basePath}diagnostics/network`))
                return send(await handlers.diagnosticsNetwork(makeReq(req.query)));
            if (match(`${basePath}diagnostics/latency`))
                return send(await handlers.diagnosticsLatency(makeReq(req.query)));
            if (match(`${basePath}env`))
                return send(await handlers.env(makeReq(req.query)));
            if (match(`${basePath}openapi.json`))
                return send(await handlers.openapi(makeReq(req.query)));
            if (match(`${basePath}maintenance/enable`) && req.method === 'POST')
                return send(await handlers.maintenanceEnable(makeReq(req.query)));
            if (match(`${basePath}maintenance/disable`) && req.method === 'POST')
                return send(await handlers.maintenanceDisable(makeReq(req.query)));
            return next();
        }
        catch (e) {
            return next(e);
        }
    };
    return { path: basePath, middleware };
}
