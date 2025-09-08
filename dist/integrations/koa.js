"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createKoaMiddleware = createKoaMiddleware;
function createKoaMiddleware(handlers, basePath = "/") {
    return async function koaMiddleware(ctx, next) {
        const path = ctx.path || ctx.request?.path || ctx.url;
        const send = (out) => {
            ctx.status = out.status;
            if (out.headers)
                for (const [k, v] of Object.entries(out.headers))
                    ctx.set(k, v);
            ctx.body = out.body;
        };
        const req = {
            method: ctx.method,
            url: ctx.originalUrl || ctx.url,
            headers: ctx.headers,
            query: ctx.query || {},
            body: ctx.request?.body,
            ip: ctx.headers["x-forwarded-for"] || ctx.ip,
        };
        if (path === `${basePath}`)
            return send(await handlers.root(req));
        if (path === `${basePath}ping`)
            return send(await handlers.ping(req));
        if (path === `${basePath}time`)
            return send(await handlers.time(req));
        if (path === `${basePath}info`)
            return send(await handlers.info(req));
        if (path === `${basePath}health`)
            return send(await handlers.health(req));
        if (path === `${basePath}healthz`)
            return send(await handlers.healthz(req));
        if (path === `${basePath}readiness`)
            return send(await handlers.readiness(req));
        if (path === `${basePath}metrics`)
            return send(await handlers.metrics(req));
        if (path === `${basePath}diagnostics/network`)
            return send(await handlers.diagnosticsNetwork(req));
        if (path === `${basePath}env`)
            return send(await handlers.env(req));
        if (path === `${basePath}openapi.json`)
            return send(await handlers.openapi(req));
        return next();
    };
}
