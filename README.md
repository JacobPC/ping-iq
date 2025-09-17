### PingIQ

Framework-agnostic health, diagnostics, and metrics endpoints for Node.js.

Lightweight, secure-by-default, and production-ready. Works with Express, Fastify, Koa, and NestJS.

---

## Why PingIQ

- Fast to adopt: plug-and-play endpoints and clients; value in minutes.
- Framework-agnostic: Express, Fastify, Koa, NestJS; same core.
- Lightweight: tiny surface area, zero-config defaults, tree-shakable.
- Secure by default: no env leakage, rate-limited diagnostics, simple auth hook.
- Extensible: custom readiness checks, logging hooks, pluggable metrics.

## Installation

```bash
npm i ping-iq
# or
yarn add ping-iq
```

## How to use in 15 minutes

1) Install and mount under `/_status`.

```ts
// Express example
import express from 'express';
import { createPingIQ } from 'ping-iq';

const app = express();
const pingIQ = createPingIQ({ info: { name: 'my-service', version: '1.0.0' } });
app.use('/_status', pingIQ.express());
app.listen(3000);
```

2) Add readiness checks (optional):

```ts
import { createPingIQ, booleanCheck, timedCheck } from 'ping-iq';

const pingIQ = createPingIQ({
  readinessChecks: [
    booleanCheck('database', async () => true),
    timedCheck('cache', async () => {/* throw on failure */}),
  ],
});
```

3) Secure (optional but recommended):

```ts
const pingIQ = createPingIQ({
  authCheck: ({ headers }) => headers['x-api-key'] === process.env.STATUS_API_KEY,
  env: { enabled: false },
});
```

4) Add a client (optional):

```ts
import { createPingIQClient } from 'ping-iq-client-fetch';
const client = createPingIQClient({ baseUrl: '/_status' });
const health = await client.health();
```

## What you get

- **/**: liveness; returns 200 OK with body "OK"
- **/ping**: heartbeat that returns { status, message: "pong", timestamp }
- **/time**: server UTC timestamp
- **/info**: service metadata (name, version, environment, extra)
- **/health**: simple liveness (200 OK, body "ok"); Kubernetes-friendly
- **/readiness**: detailed readiness with async checks; supports `application/health+json`
- **/metrics**: Prometheus exposition (uptime, memory, request counts)
- **/diagnostics/network**: downloadable binary payload for throughput tests (rate-limited)
- **/diagnostics/latency**: tiny binary payload for RTT latency (rate-limited)
- **/env**: whitelisted environment variables (disabled by default)
- **/openapi.json**: optional OpenAPI 3 document for all endpoints

Security features: optional auth hook for all endpoints, rate limiting for diagnostics, strict defaults.

---

## Quick start

Pick your framework adapter and mount under a path like `/_status`.

### Express

Recommended: mount at a prefix and keep default `basePath: '/'`.

```ts
import express from 'express';
import { createPingIQ } from 'ping-iq';

const app = express();
const pingIQ = createPingIQ({
  // leave basePath default ('/') when mounting with a prefix
  info: { name: 'my-service', version: '1.0.0', environment: 'prod' },
});

app.use('/_status', pingIQ.express());
app.listen(3000, () => console.log('http://localhost:3000/_status/ping'));
```

Endpoints: `/ping`, `/time`, `/info`, `/health`, `/readiness`, `/metrics`, `/diagnostics/network`, `/diagnostics/latency`, `/env` (opt‑in) under `/_status/*`.

### Fastify

Use Fastify's `prefix` when registering.

```ts
import Fastify from 'fastify';
import { createPingIQ } from 'ping-iq';

const app = Fastify();
const pingIQ = createPingIQ();

app.register(pingIQ.fastify(), { prefix: '/_status' });
app.listen({ port: 3000 });
```

### Koa

Koa lacks a built-in router prefix for middleware, so set `basePath`.

```ts
import Koa from 'koa';
import { createPingIQ } from 'ping-iq';

const app = new Koa();
const pingIQ = createPingIQ({ basePath: '/_status/' });

app.use(pingIQ.koa());
app.listen(3000);
```

### NestJS

Attach the middleware in your bootstrap (or via a module's consumer).

```ts
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createPingIQ } from 'ping-iq';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const pingIQ = createPingIQ();
  const { path, middleware } = pingIQ.nest();
  app.use('/_status', middleware); // mount at prefix
  await app.listen(3000);
}
bootstrap();
```

---

## Configuration

```ts
type HealthStatus = 'ok' | 'degraded' | 'fail';

type ReadinessCheck = () =>
  | void
  | { name: string; status: HealthStatus; durationMs?: number; error?: string; details?: Record<string, unknown> }
  | Promise<void | { name: string; status: HealthStatus; durationMs?: number; error?: string; details?: Record<string, unknown> }>;

interface PingIQOptions {
  basePath?: string; // default '/'
  info?: {
    name?: string;
    version?: string;
    environment?: string;
    extra?: Record<string, unknown>; // e.g., commit, buildId
  };
  readinessChecks?: ReadinessCheck[]; // default: liveness ok
  env?: { enabled?: boolean; whitelist?: string[] }; // default disabled
  diagnostics?: { enableThroughput?: boolean; maxPayloadBytes?: number }; // default: throughput off, 1MB max
  rateLimit?: { capacity: number; refillPerSecond: number }; // default: 5 tokens, 0.2 rps refill
  authCheck?: (ctx: { method: string; url: string; headers: Record<string, string | string[]>; ip?: string }) => boolean | Promise<boolean>;
  logging?: {
    onRequest?: (ctx: { method: string; url: string; headers: Record<string, string | string[]>; ip?: string }) => void;
    onResponse?: (ctx: { method: string; url: string; headers: Record<string, string | string[]>; ip?: string }, statusCode: number) => void;
    onError?: (ctx: { method: string; url: string; headers: Record<string, string | string[]>; ip?: string }, error: unknown) => void;
  };
  openapi?: {
    enabled?: boolean; // default false
    title?: string;
    version?: string;
    description?: string;
    servers?: { url: string; description?: string }[];
  };
  livenessMetrics?: boolean; // default false
}
```

Example with readiness checks (using helpers), env allowlist, and auth:

```ts
import { createPingIQ, booleanCheck, timedCheck, httpGetCheck, tcpPortCheck, clientPingCheck } from 'ping-iq';

// Example clients (replace with your own instances)
const db = { ping: async () => true };
const cache = { ping: async () => {} };
const s3 = { ping: async () => {} };

const pingIQ = createPingIQ({
  readinessChecks: [
    // Returns ok/fail based on boolean result
    booleanCheck('database', async () => db.ping()),

    // Measures duration and sets ok on success, fail on throw
    timedCheck('cache', async () => cache.ping()),

    // HTTP GET with timeout (uses global fetch by default)
    httpGetCheck('external-api', 'https://status.example.com/health', 1500),

    // TCP port connectivity (e.g., Redis)
    tcpPortCheck('redis', '127.0.0.1', 6379, 1000),

    // Wrap any client call that should succeed
    clientPingCheck('storage', async () => { await s3.ping(); }),
  ],
  env: { enabled: true, whitelist: ['NODE_ENV', 'COMMIT_SHA', 'BUILD_ID'] },
  diagnostics: { enableThroughput: true, maxPayloadBytes: 2 * 1024 * 1024 },
  rateLimit: { capacity: 5, refillPerSecond: 0.2 },
  authCheck: ({ headers }) => headers['x-api-key'] === process.env.STATUS_API_KEY,
  openapi: { enabled: true, title: 'My Service - Status', servers: [{ url: 'https://api.example.com/_status' }] },
});
```

---

## Endpoints

- **GET /**
  - Response: plain text `OK`

- **GET /ping**
  - Response: `{ status: 'ok', message: 'pong', timestamp }`

- **GET /time**
  - Response: `{ timestamp }`

- **GET /info**
  - Response: `{ name, version, environment, ...extra }`

- **GET /health**
  - Liveness endpoint. Returns `200` with body `ok` (Kubernetes-friendly).

- **GET /readiness**
  - Runs all `readinessChecks` and reports combined status.
  - Content negotiation:
    - `Accept: application/health+json` → returns `{ status: 'pass'|'warn'|'fail' }`
    - otherwise returns detailed JSON with checks.
  - Response:
    ```json
    {
      "status": "ok|degraded|fail",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "checks": [
        { "name": "database", "status": "ok", "durationMs": 12 }
      ]
    }
    ```

- **GET /metrics**
  - Content-Type: `text/plain; version=0.0.4`
  - Example exposition:
    ```
    # HELP pingiq_requests_total Total requests to PingIQ endpoints
    # TYPE pingiq_requests_total counter
    pingiq_requests_total{endpoint="ping"} 10

    # HELP pingiq_process_uptime_seconds Node.js process uptime in seconds
    # TYPE pingiq_process_uptime_seconds gauge
    pingiq_process_uptime_seconds 123.45
    ```

- **GET /diagnostics/network**
  - Query params:
    - `payload` (bytes, default 65536): requested download size (capped by `maxPayloadBytes`).
  - Response: `application/octet-stream` with headers:
    - `Content-Length`: exact size
    - `X-PingIQ-Server-Duration-Ms`: server processing duration to subtract client-side
  - Rate-limited by default (HTTP 429 on excess).

- **GET /diagnostics/latency**
  - Returns a 1‑byte `application/octet-stream` body for RTT measurement.
  - Headers:
    - `X-PingIQ-Server-Duration-Ms`: server processing duration

- **GET /env** (disabled by default)
  - Only returns whitelisted variables.
  - Enable via `env: { enabled: true, whitelist: [...] }`.

---

## Standards

- **Kubernetes/Health Check Compatibility**: Readiness supports `application/health+json` with `status: pass|warn|fail`.
- **Prometheus Metrics**: `/metrics` returns Prometheus text exposition format (`text/plain; version=0.0.4`).
- **OpenAPI 3**: Optional `/_status/openapi.json` provides a machine-readable contract.

---

## Security & Best Practices

- Set `authCheck` to enforce JWT, API key, or custom logic across all endpoints.
- Keep `/env` disabled unless you need it; always restrict via a whitelist.
- Consider mounting under a non-guessable prefix in production (e.g., `/_internal/status`).
- Place the adapter behind your existing auth/ACL when possible.

Example API key guard:

```ts
const pingIQ = createPingIQ({
  authCheck: ({ headers }) => headers['x-api-key'] === process.env.STATUS_API_KEY,
});
```

---

## Clients (frontend)

Pick your preferred client and optionally React hooks.

### Fetch client

```ts
import { createPingIQClient } from 'ping-iq-client-fetch';
const client = createPingIQClient({ baseUrl: '/_status' });
const { status } = await client.health();

// Measure throughput
const d1 = await client.diagnosticsNetwork({ payload: 500_000 });
console.log(d1.throughputMbps, 'Mbps');

// Measure RTT latency
const l1 = await client.diagnosticsLatency();
console.log(l1.rttMs, 'ms');
```

### Axios client

```ts
import axios from 'axios';
import { createPingIQAxiosClient } from 'ping-iq-client-axios';
const client = createPingIQAxiosClient({ baseUrl: '/_status', axios });
const info = await client.info();

const d2 = await client.diagnosticsNetwork({ payload: 1_000_000 });
console.log(d2.throughputMbps, 'Mbps');

const l2 = await client.diagnosticsLatency();
console.log(l2.rttMs, 'ms');
```

### React hooks

```tsx
import { createPingIQClient } from 'ping-iq-client-fetch';
import { createPingIQHooks } from 'ping-iq-react';

const client = createPingIQClient({ baseUrl: '/_status' });
const { useHealth } = createPingIQHooks(client);

function HealthWidget() {
  const { data, loading, error } = useHealth();
  if (loading) return <>Loading...</>;
  if (error) return <>Error</>;
  return <>Status: {data?.status}</>;
}
```

---

## Subpath imports (server adapters)

If you prefer importing adapters directly:

```ts
import router from 'ping-iq/express';
import plugin from 'ping-iq/fastify';
import middleware from 'ping-iq/koa';
import nest from 'ping-iq/nest';
```

Note: the main factory `createPingIQ()` already returns bound adapters; subpaths are optional.

---

## OpenAPI

Enable the built-in OpenAPI document and serve it at `/_status/openapi.json`:

```ts
const pingIQ = createPingIQ({ openapi: { enabled: true, title: 'My Service - Status' } });
```

You can also generate the spec manually:

```ts
import { createPingIQ, generateOpenAPISpec } from 'ping-iq';
const pingIQ = createPingIQ({ openapi: { enabled: true } });
// get handlers' resolved options indirectly is not exposed; use the endpoint or mirror config.
```

Use this doc with Swagger UI, Redocly, or your preferred API portal.

---

## What makes PingIQ different (the pitch)

- Drop-in reliability endpoints: consistent contract across services and teams.
- Observe without exposing: production-safe defaults that don’t leak secrets.
- Scale-friendly: Prometheus metrics and diagnostics suited for SRE workflows.
- DX-first: adapters, clients, and hooks so your team ships in minutes.

If you need just health and metrics, it’s tiny. If you want richer diagnostics later, turn them on with one flag.

---

## Notes on basePath vs mount path

- Express/Fastify: Prefer mounting the adapter at a path prefix (e.g., `/_status`) and keep `basePath` as '/'.
- Koa: Use `basePath` (e.g., `/_status/`) since middleware is applied globally.
- NestJS: Use framework mounting (e.g., `app.use('/_status', middleware)`), keep `basePath` as '/'.

Using both a mount prefix and a non-root `basePath` will duplicate segments (e.g., `/_status/_status/ping`).

---

## License

MIT


