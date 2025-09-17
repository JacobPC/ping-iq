"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOpenAPISpec = void 0;
exports.createPingIQ = createPingIQ;
const handlers_1 = require("./core/handlers");
const rateLimiter_1 = require("./security/rateLimiter");
const graceful_1 = require("./lifecycle/graceful");
function createPingIQ(options) {
    const opts = (0, handlers_1.createOptionsDefaults)(options);
    const metrics = (0, handlers_1.createDefaultMetrics)();
    const rateLimiter = new rateLimiter_1.InMemoryRateLimiter(opts.rateLimit);
    const state = { maintenance: false };
    const handlers = (0, handlers_1.createHandlers)({ options: opts, metrics, rateLimiter, state });
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
        setupGracefulShutdown: (options) => (0, graceful_1.setupGracefulShutdown)(state, options),
    };
}
__exportStar(require("./core/types"), exports);
__exportStar(require("./core/readiness"), exports);
var generator_1 = require("./openapi/generator");
Object.defineProperty(exports, "generateOpenAPISpec", { enumerable: true, get: function () { return generator_1.generateOpenAPISpec; } });
