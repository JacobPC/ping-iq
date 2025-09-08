type Handlers = ReturnType<typeof import("../core/handlers").createHandlers>;
export declare function createKoaMiddleware(handlers: Handlers, basePath?: string): (ctx: any, next: any) => Promise<any>;
export {};
