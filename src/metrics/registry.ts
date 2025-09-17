import { MetricsRegistryLike } from "../core/types";
import { Counter, Gauge, Registry, collectDefaultMetrics } from "prom-client";

type LabelValues = Record<string, string>;

export class MetricsRegistry implements MetricsRegistryLike {
  private readonly registry: Registry;
  private readonly counters: Map<string, Counter<string>> = new Map();
  private readonly gauges: Map<string, Gauge<string>> = new Map();

  constructor(registry?: Registry) {
    this.registry = registry ?? new Registry();
    collectDefaultMetrics({ register: this.registry });
  }

  public register(): void {
    // no-op retained for compatibility
  }

  public counter(name: string, help?: string, labels?: string[]): Counter<string> {
    let c = this.counters.get(name);
    if (!c) {
      c = new Counter({ name, help: help ?? name, labelNames: labels ?? [], registers: [this.registry] });
      this.counters.set(name, c);
    }
    return c;
  }

  public gauge(name: string, help?: string, labels?: string[]): Gauge<string> {
    let g = this.gauges.get(name);
    if (!g) {
      g = new Gauge({ name, help: help ?? name, labelNames: labels ?? [], registers: [this.registry] });
      this.gauges.set(name, g);
    }
    return g;
  }

  public inc(name: string, value = 1, labels?: LabelValues): void {
    const c = this.counter(name);
    if (labels) c.inc(labels as any, value); else c.inc(value);
  }

  public set(name: string, value: number, labels?: LabelValues): void {
    const g = this.gauge(name);
    if (labels) g.set(labels as any, value); else g.set(value);
  }

  public exposition(): Promise<string> { return this.registry.metrics(); }

  public getRegistry(): Registry { return this.registry; }
}


