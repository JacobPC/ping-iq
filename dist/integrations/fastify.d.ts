type Handlers = ReturnType<typeof import("../core/handlers").createHandlers>;
export declare function createFastifyPlugin(handlers: Handlers, basePath?: string): (fastify: any, _opts: any) => Promise<void>;
export {};
