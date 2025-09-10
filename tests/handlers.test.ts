import { describe, it, expect } from 'vitest';
import { createOptionsDefaults, createDefaultMetrics, createHandlers } from '../src/core/handlers';

function mkReq(path: string) {
  return { method: 'GET', url: path, headers: {}, query: {}, ip: '127.0.0.1' };
}

describe('PingIQ handlers', () => {
  it('ping returns pong', async () => {
    const options = createOptionsDefaults({ info: { name: 'svc' } });
    const metrics = createDefaultMetrics();
    const handlerSet = createHandlers({ options, metrics, rateLimiter: undefined });
    const res = await handlerSet.ping(mkReq('/ping'));
    expect(res.status).toBe(200);
    expect(typeof res.body).toBe('string');
    const json = JSON.parse(res.body as string);
    expect(json.message).toBe('pong');
  });

  it('health returns ok text', async () => {
    const options = createOptionsDefaults({});
    const metrics = createDefaultMetrics();
    const handlerSet = createHandlers({ options, metrics, rateLimiter: undefined });
    const res = await (handlerSet as any).health(mkReq('/health'));
    expect(res.status).toBe(200);
    expect(res.body).toBe('ok');
  });

  it('readiness returns status object', async () => {
    const options = createOptionsDefaults({});
    const metrics = createDefaultMetrics();
    const handlerSet = createHandlers({ options, metrics, rateLimiter: undefined });
    const res = await (handlerSet as any).readiness(mkReq('/readiness'));
    expect(res.status).toBe(200);
    const json = JSON.parse(res.body as string);
    expect(json).toHaveProperty('status');
    expect(json).toHaveProperty('checks');
  });
});


