import type { Router } from "express";
type Handlers = ReturnType<typeof import("../core/handlers").createHandlers>;
export declare function createExpressRouter(handlers: Handlers, basePath?: string): Router;
export {};
