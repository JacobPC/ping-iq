import { PingIQOptions } from "./core/types";
export interface PingIQInstance {
    express: () => import("express").Router;
    fastify: () => any;
    koa: () => any;
    nest: () => {
        path: string;
        middleware: any;
    };
}
export declare function createPingIQ(options?: PingIQOptions): PingIQInstance;
export * from "./core/types";
export * from "./core/readiness";
export { generateOpenAPISpec } from "./openapi/generator";
