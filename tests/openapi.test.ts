import { describe, it, expect } from 'vitest';
import { generateOpenAPISpec } from '../src';

describe('OpenAPI generator', () => {
  it('generates paths including liveness and readiness', () => {
    const opts: any = {
      basePath: '/_status/',
      info: {},
      readinessChecks: [],
      env: { enabled: false, whitelist: [] },
      diagnostics: { enableThroughput: false, maxPayloadBytes: 1000000 },
      rateLimit: { capacity: 5, refillPerSecond: 0.2 },
      logging: {},
      openapi: { enabled: true },
    };
    const doc = generateOpenAPISpec(opts);
    expect(doc.openapi).toBe('3.0.3');
    expect(doc.paths['/_status/']).toBeDefined();
    expect(doc.paths['/_status/health']).toBeDefined();
    expect(doc.paths['/_status/healthz']).toBeDefined();
    expect(doc.paths['/_status/readiness']).toBeDefined();
  });
});


