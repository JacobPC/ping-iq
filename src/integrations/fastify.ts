type Handlers = ReturnType<typeof import("../core/handlers").createHandlers>;

export function createFastifyPlugin(handlers: Handlers, basePath = "/") {
  return async function (fastify: any, _opts: any) {
    fastify.get(`${basePath}`, async (req: any, reply: any) => {
      const out = await handlers.root({ method: req.method, url: req.url, headers: req.headers, query: req.query || {}, ip: req.headers["x-forwarded-for"] || req.ip });
      if (out.headers) reply.headers(out.headers);
      reply.code(out.status).send(out.body);
    });
    fastify.get(`${basePath}ping`, async (req: any, reply: any) => {
      const out = await handlers.ping({
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query || {},
        ip: req.headers["x-forwarded-for"] || req.ip,
      });
      if (out.headers) reply.headers(out.headers);
      reply.code(out.status).send(out.body);
    });

    fastify.get(`${basePath}time`, async (req: any, reply: any) => {
      const out = await handlers.time({ method: req.method, url: req.url, headers: req.headers, query: req.query || {}, ip: req.headers["x-forwarded-for"] || req.ip });
      if (out.headers) reply.headers(out.headers);
      reply.code(out.status).send(out.body);
    });

    fastify.get(`${basePath}info`, async (req: any, reply: any) => {
      const out = await handlers.info({ method: req.method, url: req.url, headers: req.headers, query: req.query || {}, ip: req.headers["x-forwarded-for"] || req.ip });
      if (out.headers) reply.headers(out.headers);
      reply.code(out.status).send(out.body);
    });

    fastify.get(`${basePath}health`, async (req: any, reply: any) => {
      const out = await handlers.health({ method: req.method, url: req.url, headers: req.headers, query: req.query || {}, ip: req.headers["x-forwarded-for"] || req.ip });
      if (out.headers) reply.headers(out.headers);
      reply.code(out.status).send(out.body);
    });

    fastify.get(`${basePath}healthz`, async (req: any, reply: any) => {
      const out = await handlers.healthz({ method: req.method, url: req.url, headers: req.headers, query: req.query || {}, ip: req.headers["x-forwarded-for"] || req.ip });
      if (out.headers) reply.headers(out.headers);
      reply.code(out.status).send(out.body);
    });

    fastify.get(`${basePath}readiness`, async (req: any, reply: any) => {
      const out = await handlers.readiness({ method: req.method, url: req.url, headers: req.headers, query: req.query || {} });
      if (out.headers) reply.headers(out.headers);
      reply.code(out.status).send(out.body);
    });

    fastify.get(`${basePath}metrics`, async (req: any, reply: any) => {
      const out = await handlers.metrics({ method: req.method, url: req.url, headers: req.headers, query: req.query || {}, ip: req.headers["x-forwarded-for"] || req.ip });
      if (out.headers) reply.headers(out.headers);
      reply.code(out.status).send(out.body);
    });

    fastify.get(`${basePath}diagnostics/network`, async (req: any, reply: any) => {
      const out = await handlers.diagnosticsNetwork({ method: req.method, url: req.url, headers: req.headers, query: req.query || {}, ip: req.headers["x-forwarded-for"] || req.ip });
      if (out.headers) reply.headers(out.headers);
      reply.code(out.status).send(out.body);
    });

    fastify.get(`${basePath}diagnostics/latency`, async (req: any, reply: any) => {
      const out = await (handlers as any).diagnosticsLatency({ method: req.method, url: req.url, headers: req.headers, query: req.query || {}, ip: req.headers["x-forwarded-for"] || req.ip });
      if (out.headers) reply.headers(out.headers);
      reply.code(out.status).send(out.body);
    });

    fastify.get(`${basePath}env`, async (req: any, reply: any) => {
      const out = await handlers.env({ method: req.method, url: req.url, headers: req.headers, ip: req.headers["x-forwarded-for"] || req.ip });
      if (out.headers) reply.headers(out.headers);
      reply.code(out.status).send(out.body);
    });

    fastify.get(`${basePath}openapi.json`, async (req: any, reply: any) => {
      const out = await handlers.openapi({ method: req.method, url: req.url, headers: req.headers, query: req.query || {}, ip: req.headers["x-forwarded-for"] || req.ip });
      if (out.headers) reply.headers(out.headers);
      reply.code(out.status).send(out.body);
    });

    fastify.post(`${basePath}maintenance/enable`, async (req: any, reply: any) => {
      const out = await (handlers as any).maintenanceEnable({ method: req.method, url: req.url, headers: req.headers, query: req.query || {} });
      if (out.headers) reply.headers(out.headers);
      reply.code(out.status).send(out.body);
    });

    fastify.post(`${basePath}maintenance/disable`, async (req: any, reply: any) => {
      const out = await (handlers as any).maintenanceDisable({ method: req.method, url: req.url, headers: req.headers, query: req.query || {} });
      if (out.headers) reply.headers(out.headers);
      reply.code(out.status).send(out.body);
    });
  };
}


