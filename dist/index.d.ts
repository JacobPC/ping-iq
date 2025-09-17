import { PingIQOptions } from "./core/types";
export interface PingIQInstance {
    express: () => import("express").Router;
    fastify: () => any;
    koa: () => any;
    nest: () => {
        path: string;
        middleware: any;
    };
    maintenance: {
        enable(): void;
        disable(): void;
        isEnabled(): boolean;
    };
    setupGracefulShutdown: (options?: {
        signals?: NodeJS.Signals[];
        drainMs?: number;
        onSignal?: (signal: string) => void;
    }) => () => void;
}
export declare function createPingIQ(options?: PingIQOptions): PingIQInstance;
export * from "./core/types";
export * from "./core/readiness";
export { generateOpenAPISpec } from "./openapi/generator";
