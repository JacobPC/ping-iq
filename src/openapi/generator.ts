import { PingIQResolvedOptions } from "../core/handlers";

export function generateOpenAPISpec(opts: PingIQResolvedOptions) {
  const base = opts.basePath.replace(/\/$/, "");
  const info = opts.info;
  const doc: any = {
    openapi: "3.0.3",
    info: {
      title: opts.openapi?.title || (info.name ? `${info.name} - PingIQ` : "PingIQ"),
      version: opts.openapi?.version || info.version || "0.1.0",
      description: opts.openapi?.description || "Health, diagnostics and metrics endpoints provided by PingIQ.",
    },
    servers: opts.openapi?.servers || [],
    paths: {},
    components: {},
  };

  const jsonResp = (schema: any) => ({
    description: "Success",
    content: { "application/json": { schema } },
  });

  const textResp = () => ({
    description: "Success",
    content: { "text/plain": { schema: { type: "string" } } },
  });

  const paths: any = {
    [`${base}/ping`]: {
      get: {
        summary: "Ping",
        responses: { 200: jsonResp({ type: "object", properties: { status: { type: "string" }, message: { type: "string" }, timestamp: { type: "string", format: "date-time" } } }) },
      },
    },
    [`${base}/time`]: {
      get: { summary: "Server time (UTC)", responses: { 200: jsonResp({ type: "object", properties: { timestamp: { type: "string", format: "date-time" } } }) } },
    },
    [`${base}/info`]: {
      get: { summary: "Service info", responses: { 200: jsonResp({ type: "object", additionalProperties: true }) } },
    },
    [`${base}/health`]: {
      get: { summary: "Health (liveness/readiness)", responses: { 200: jsonResp({ type: "object", properties: { status: { type: "string", enum: ["ok", "degraded", "fail"] }, timestamp: { type: "string", format: "date-time" }, checks: { type: "array", items: { type: "object", additionalProperties: true } } } }) } },
    },
    [`${base}/metrics`]: {
      get: { summary: "Prometheus metrics", responses: { 200: textResp() } },
    },
    [`${base}/diagnostics/network`]: {
      get: {
        summary: "Network diagnostics",
        parameters: [
          { name: "samples", in: "query", schema: { type: "integer", minimum: 1 }, required: false },
          { name: "payload", in: "query", schema: { type: "integer", minimum: 0 }, required: false },
        ],
        responses: { 200: jsonResp({ type: "object", additionalProperties: true }) },
      },
    },
  } as const;

  if (opts.env.enabled) {
    (paths as any)[`${base}/env`] = { get: { summary: "Whitelisted environment variables", responses: { 200: jsonResp({ type: "object", additionalProperties: { type: ["string", "null"] } }) } } };
  }

  doc.paths = paths;
  return doc;
}


