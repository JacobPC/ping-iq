import { Metric, MetricsRegistryLike } from "../core/types";

type LabelValues = Record<string, string>;

class Counter implements Metric {
  public readonly name: string;
  public readonly help?: string;
  public readonly type = "counter" as const;
  public readonly labels?: string[];
  private readonly values: Map<string, number> = new Map();

  constructor(name: string, help?: string, labels?: string[]) {
    this.name = name;
    this.help = help;
    this.labels = labels;
  }

  private key(labels?: LabelValues): string {
    if (!this.labels || this.labels.length === 0) return "__all__";
    const vals = this.labels.map((k) => labels?.[k] ?? "");
    return vals.join("::");
  }

  public inc(value = 1, labels?: LabelValues) {
    const k = this.key(labels);
    const current = this.values.get(k) ?? 0;
    this.values.set(k, current + value);
  }

  public get(): string {
    const lines: string[] = [];
    if (this.help) lines.push(`# HELP ${this.name} ${this.help}`);
    lines.push(`# TYPE ${this.name} counter`);
    if (this.values.size === 0) {
      lines.push(`${this.name} 0`);
    } else {
      for (const [k, v] of this.values.entries()) {
        if (k === "__all__") {
          lines.push(`${this.name} ${v}`);
        } else {
          const labelPairs = (this.labels ?? []).map((key, idx) => `${key}="${k.split("::")[idx]}"`).join(",");
          lines.push(`${this.name}{${labelPairs}} ${v}`);
        }
      }
    }
    return lines.join("\n");
  }
}

class Gauge implements Metric {
  public readonly name: string;
  public readonly help?: string;
  public readonly type = "gauge" as const;
  public readonly labels?: string[];
  private readonly values: Map<string, number> = new Map();

  constructor(name: string, help?: string, labels?: string[]) {
    this.name = name;
    this.help = help;
    this.labels = labels;
  }

  private key(labels?: LabelValues): string {
    if (!this.labels || this.labels.length === 0) return "__all__";
    const vals = this.labels.map((k) => labels?.[k] ?? "");
    return vals.join("::");
  }

  public set(value: number, labels?: LabelValues) {
    const k = this.key(labels);
    this.values.set(k, value);
  }

  public inc(value = 1, labels?: LabelValues) {
    const k = this.key(labels);
    const current = this.values.get(k) ?? 0;
    this.values.set(k, current + value);
  }

  public get(): string {
    const lines: string[] = [];
    if (this.help) lines.push(`# HELP ${this.name} ${this.help}`);
    lines.push(`# TYPE ${this.name} gauge`);
    if (this.values.size === 0) {
      lines.push(`${this.name} 0`);
    } else {
      for (const [k, v] of this.values.entries()) {
        if (k === "__all__") {
          lines.push(`${this.name} ${v}`);
        } else {
          const labelPairs = (this.labels ?? []).map((key, idx) => `${key}="${k.split("::")[idx]}"`).join(",");
          lines.push(`${this.name}{${labelPairs}} ${v}`);
        }
      }
    }
    return lines.join("\n");
  }
}

export class MetricsRegistry implements MetricsRegistryLike {
  private readonly metricsByName: Map<string, Metric> = new Map();

  public register(metric: Metric): void {
    this.metricsByName.set(metric.name, metric);
  }

  public counter(name: string, help?: string, labels?: string[]): Counter {
    const existing = this.metricsByName.get(name);
    if (existing && existing.type !== "counter") {
      throw new Error(`Metric ${name} already registered with type ${existing.type}`);
    }
    if (!existing) {
      const c = new Counter(name, help, labels);
      this.metricsByName.set(name, c);
      return c;
    }
    return existing as Counter;
  }

  public gauge(name: string, help?: string, labels?: string[]): Gauge {
    const existing = this.metricsByName.get(name);
    if (existing && existing.type !== "gauge") {
      throw new Error(`Metric ${name} already registered with type ${existing.type}`);
    }
    if (!existing) {
      const g = new Gauge(name, help, labels);
      this.metricsByName.set(name, g);
      return g;
    }
    return existing as Gauge;
  }

  public inc(name: string, value = 1, labels?: LabelValues): void {
    const metric = this.metricsByName.get(name);
    if (!metric) throw new Error(`Metric ${name} not found`);
    if (metric.type === "counter") {
      (metric as Counter).inc(value, labels);
    } else {
      (metric as Gauge).inc(value, labels);
    }
  }

  public set(name: string, value: number, labels?: LabelValues): void {
    const metric = this.metricsByName.get(name);
    if (!metric) throw new Error(`Metric ${name} not found`);
    if (metric.type === "gauge") {
      (metric as Gauge).set(value, labels);
    } else {
      throw new Error(`Metric ${name} is not a gauge`);
    }
  }

  public exposition(): string {
    return Array.from(this.metricsByName.values())
      .map((m) => m.get())
      .join("\n\n");
  }
}


