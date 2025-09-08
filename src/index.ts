import { createHandlers, createOptionsDefaults, createDefaultMetrics } from "./core/handlers";
import { InMemoryRateLimiter } from "./security/rateLimiter";
import { PingIQOptions } from "./core/types";

export interface PingIQInstance {
  express: () => import("express").Router;
  fastify: () => any;
  koa: () => any;
  nest: () => { path: string; middleware: any };
}

export function createPingIQ(options?: PingIQOptions): PingIQInstance {
  const opts = createOptionsDefaults(options);
  const metrics = createDefaultMetrics();
  const rateLimiter = new InMemoryRateLimiter(opts.rateLimit);
  const handlers = createHandlers({ options: opts, metrics, rateLimiter });

  return {
    express: () => require("./integrations/express").createExpressRouter(handlers, opts.basePath),
    fastify: () => require("./integrations/fastify").createFastifyPlugin(handlers, opts.basePath),
    koa: () => require("./integrations/koa").createKoaMiddleware(handlers, opts.basePath),
    nest: () => require("./integrations/nest").createNestModule(handlers, opts.basePath),
  };
}

export * from "./core/types";
export * from "./core/readiness";
export { generateOpenAPISpec } from "./openapi/generator";


