type Handlers = ReturnType<typeof import("../core/handlers").createHandlers>;

export function createNestModule(handlers: Handlers, basePath = "/") {
  // Lightweight adapter: returns path and a Nest-compatible middleware
  const middleware = async (req: any, res: any, next: any) => {
    const url: string = req.originalUrl || req.url;
    const match = (p: string) => url.startsWith(p);
    const makeReq = (q = {}) => ({ method: req.method, url, headers: req.headers, query: q, ip: req.headers["x-forwarded-for"] || req.ip });

    const send = (out: { status: number; headers?: Record<string, string>; body?: any }) => {
      if (out.headers) for (const [k, v] of Object.entries(out.headers)) res.setHeader(k, v);
      res.statusCode = out.status;
      res.end(out.body);
    };

    try {
      if (match(`${basePath}ping`)) return send(await handlers.ping(makeReq(req.query)));
      if (match(`${basePath}time`)) return send(await handlers.time(makeReq(req.query)));
      if (match(`${basePath}info`)) return send(await handlers.info(makeReq(req.query)));
      if (match(`${basePath}health`)) return send(await handlers.health(makeReq(req.query)));
      if (match(`${basePath}metrics`)) return send(await handlers.metrics(makeReq(req.query)));
      if (match(`${basePath}diagnostics/network`)) return send(await handlers.diagnosticsNetwork(makeReq(req.query)));
      if (match(`${basePath}env`)) return send(await handlers.env(makeReq(req.query)));
      if (match(`${basePath}openapi.json`)) return send(await (handlers as any).openapi(makeReq(req.query)));
      return next();
    } catch (e) {
      return next(e);
    }
  };
  return { path: basePath, middleware };
}


