type Handlers = ReturnType<typeof import("../core/handlers").createHandlers>;

export function createKoaMiddleware(handlers: Handlers, basePath = "/") {
  return async function koaMiddleware(ctx: any, next: any) {
    const path = ctx.path || ctx.request?.path || ctx.url;
    const send = (out: { status: number; headers?: Record<string, string>; body?: any }) => {
      ctx.status = out.status;
      if (out.headers) for (const [k, v] of Object.entries(out.headers)) ctx.set(k, v);
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

    if (path === `${basePath}`) return send(await handlers.root(req));
    if (path === `${basePath}ping`) return send(await handlers.ping(req));
    if (path === `${basePath}time`) return send(await handlers.time(req));
    if (path === `${basePath}info`) return send(await handlers.info(req));
    if (path === `${basePath}health`) return send(await handlers.health(req));
    if (path === `${basePath}healthz`) return send(await handlers.healthz(req));
    if (path === `${basePath}readiness`) return send(await handlers.readiness(req));
    if (path === `${basePath}metrics`) return send(await handlers.metrics(req));
    if (path === `${basePath}diagnostics/network`) return send(await handlers.diagnosticsNetwork(req));
    if (path === `${basePath}diagnostics/latency`) return send(await (handlers as any).diagnosticsLatency(req));
    if (path === `${basePath}env`) return send(await handlers.env(req));
    if (path === `${basePath}openapi.json`) return send(await (handlers as any).openapi(req));
    if (path === `${basePath}maintenance/enable` && ctx.method === 'POST') return send(await (handlers as any).maintenanceEnable(req));
    if (path === `${basePath}maintenance/disable` && ctx.method === 'POST') return send(await (handlers as any).maintenanceDisable(req));

    return next();
  };
}


