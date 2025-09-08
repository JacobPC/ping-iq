type Handlers = ReturnType<typeof import("../core/handlers").createHandlers>;
export declare function createNestModule(handlers: Handlers, basePath?: string): {
    path: string;
    middleware: (req: any, res: any, next: any) => Promise<any>;
};
export {};
