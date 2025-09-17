import { describe, it, expect } from 'vitest';
import { createOptionsDefaults, createDefaultMetrics, createHandlers } from '../src/core/handlers';

function mkReq(path: string) {
  return { method: 'GET', url: path, headers: {}, query: {}, ip: '127.0.0.1' };
}

describe('PingIQ handlers', () => {
  it('ping returns pong', async () => {
    const options = createOptionsDefaults({ info: { name: 'svc' } });
    const metrics = createDefaultMetrics();
    const handlerSet = createHandlers({ options, metrics, rateLimiter: undefined, state: { maintenance: false } as any });
    const res = await handlerSet.ping(mkReq('/ping'));
    expect(res.status).toBe(200);
    expect(typeof res.body).toBe('string');
    const json = JSON.parse(res.body as string);
    expect(json.message).toBe('pong');
  });

  it('health returns ok text', async () => {
    const options = createOptionsDefaults({});
    const metrics = createDefaultMetrics();
    const handlerSet = createHandlers({ options, metrics, rateLimiter: undefined, state: { maintenance: false } as any });
    const res = await (handlerSet as any).health(mkReq('/health'));
    expect(res.status).toBe(200);
    expect(res.body).toBe('ok');
  });

  it('readiness returns status object', async () => {
    const options = createOptionsDefaults({});
    const metrics = createDefaultMetrics();
    const handlerSet = createHandlers({ options, metrics, rateLimiter: undefined, state: { maintenance: false } as any });
    const res = await (handlerSet as any).readiness(mkReq('/readiness'));
    expect(res.status).toBe(200);
    const json = JSON.parse(res.body as string);
    expect(json).toHaveProperty('status');
    expect(json).toHaveProperty('checks');
  });

  it('diagnostics/network returns binary payload with headers', async () => {
    const options = createOptionsDefaults({ diagnostics: { enableThroughput: true, maxPayloadBytes: 1024 } });
    const metrics = createDefaultMetrics();
    const handlerSet = createHandlers({ options, metrics, rateLimiter: undefined } as any);
    const res = await (handlerSet as any).diagnosticsNetwork({ method: 'GET', url: '/diagnostics/network', headers: {}, query: { payload: '128' }, ip: '127.0.0.1' });
    expect(res.status).toBe(200);
    expect(res.headers?.['content-type']).toBe('application/octet-stream');
    expect(Number(res.headers?.['content-length'])).toBe(128);
    expect(Number.isFinite(Number(res.headers?.['x-pingiq-server-duration-ms']))).toBe(true);
    expect(res.body).toBeInstanceOf(Buffer);
  });

  it('diagnostics/latency returns tiny payload with header', async () => {
    const options = createOptionsDefaults({});
    const metrics = createDefaultMetrics();
    const handlerSet = createHandlers({ options, metrics, rateLimiter: undefined } as any);
    const res = await (handlerSet as any).diagnosticsLatency({ method: 'GET', url: '/diagnostics/latency', headers: {}, query: {}, ip: '127.0.0.1' });
    expect(res.status).toBe(200);
    expect(res.headers?.['content-type']).toBe('application/octet-stream');
    expect(Number(res.headers?.['content-length'])).toBe(1);
    expect(Number.isFinite(Number(res.headers?.['x-pingiq-server-duration-ms']))).toBe(true);
  });
});


