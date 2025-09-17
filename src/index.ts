import { createHandlers, createOptionsDefaults, createDefaultMetrics } from "./core/handlers";
import { InMemoryRateLimiter } from "./security/rateLimiter";
import { PingIQOptions } from "./core/types";
import { setupGracefulShutdown } from "./lifecycle/graceful";

export interface PingIQInstance {
  express: () => import("express").Router;
  fastify: () => any;
  koa: () => any;
  nest: () => { path: string; middleware: any };
  maintenance: { enable(): void; disable(): void; isEnabled(): boolean };
  setupGracefulShutdown: (options?: { signals?: NodeJS.Signals[]; drainMs?: number; onSignal?: (signal: string) => void }) => () => void;
}

export function createPingIQ(options?: PingIQOptions): PingIQInstance {
  const opts = createOptionsDefaults(options);
  const metrics = createDefaultMetrics();
  const rateLimiter = new InMemoryRateLimiter(opts.rateLimit);
  const state = { maintenance: false } as any;
  const handlers = createHandlers({ options: opts, metrics, rateLimiter, state });

  return {
    express: () => require("./integrations/express").createExpressRouter(handlers, opts.basePath),
    fastify: () => require("./integrations/fastify").createFastifyPlugin(handlers, opts.basePath),
    koa: () => require("./integrations/koa").createKoaMiddleware(handlers, opts.basePath),
    nest: () => require("./integrations/nest").createNestModule(handlers, opts.basePath),
    maintenance: {
      enable: () => { state.maintenance = true; state.readinessCache = undefined; },
      disable: () => { state.maintenance = false; state.readinessCache = undefined; },
      isEnabled: () => !!state.maintenance,
    },
    setupGracefulShutdown: (options) => setupGracefulShutdown(state, options),
  };
}

export * from "./core/types";
export * from "./core/readiness";
export { generateOpenAPISpec } from "./openapi/generator";
