import type { Router, Request, Response, NextFunction } from "express";

type Handlers = ReturnType<typeof import("../core/handlers").createHandlers>;

function toReq(req: Request) {
  return {
    method: req.method,
    url: req.originalUrl || req.url,
    headers: req.headers as Record<string, string | string[]>,
    query: req.query as Record<string, string | string[]>,
    body: req.body,
    ip: (req.headers["x-forwarded-for"] as string) || req.ip,
  };
}

function send(res: Response, out: { status: number; headers?: Record<string, string>; body?: any; }) {
  if (out.headers) {
    for (const [k, v] of Object.entries(out.headers)) res.setHeader(k, v);
  }
  res.status(out.status).send(out.body);
}

export function createExpressRouter(handlers: Handlers, basePath = "/"): Router {
  const express = require("express") as typeof import("express");
  const router = express.Router();

  router.get(`${basePath}ping`, async (req: Request, res: Response) => send(res, await handlers.ping(toReq(req))));
  router.get(`${basePath}time`, async (req: Request, res: Response) => send(res, await handlers.time(toReq(req))));
  router.get(`${basePath}info`, async (req: Request, res: Response) => send(res, await handlers.info(toReq(req))));
  router.get(`${basePath}health`, async (req: Request, res: Response) => send(res, await handlers.health(toReq(req))));
  router.get(`${basePath}metrics`, async (req: Request, res: Response) => send(res, await handlers.metrics(toReq(req))));
  router.get(`${basePath}diagnostics/network`, async (req: Request, res: Response) => send(res, await handlers.diagnosticsNetwork(toReq(req))));
  router.get(`${basePath}env`, async (req: Request, res: Response) => send(res, await handlers.env(toReq(req))));
  router.get(`${basePath}openapi.json`, async (req: Request, res: Response) => send(res, await (handlers as any).openapi(toReq(req))));

  // Not-found within basePath
  router.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: "Internal Server Error" });
  });

  return router;
}


