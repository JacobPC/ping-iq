"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsRegistry = void 0;
class Counter {
    constructor(name, help, labels) {
        this.type = "counter";
        this.values = new Map();
        this.name = name;
        this.help = help;
        this.labels = labels;
    }
    key(labels) {
        if (!this.labels || this.labels.length === 0)
            return "__all__";
        const vals = this.labels.map((k) => labels?.[k] ?? "");
        return vals.join("::");
    }
    inc(value = 1, labels) {
        const k = this.key(labels);
        const current = this.values.get(k) ?? 0;
        this.values.set(k, current + value);
    }
    get() {
        const lines = [];
        if (this.help)
            lines.push(`# HELP ${this.name} ${this.help}`);
        lines.push(`# TYPE ${this.name} counter`);
        if (this.values.size === 0) {
            lines.push(`${this.name} 0`);
        }
        else {
            for (const [k, v] of this.values.entries()) {
                if (k === "__all__") {
                    lines.push(`${this.name} ${v}`);
                }
                else {
                    const labelPairs = (this.labels ?? []).map((key, idx) => `${key}="${k.split("::")[idx]}"`).join(",");
                    lines.push(`${this.name}{${labelPairs}} ${v}`);
                }
            }
        }
        return lines.join("\n");
    }
}
class Gauge {
    constructor(name, help, labels) {
        this.type = "gauge";
        this.values = new Map();
        this.name = name;
        this.help = help;
        this.labels = labels;
    }
    key(labels) {
        if (!this.labels || this.labels.length === 0)
            return "__all__";
        const vals = this.labels.map((k) => labels?.[k] ?? "");
        return vals.join("::");
    }
    set(value, labels) {
        const k = this.key(labels);
        this.values.set(k, value);
    }
    inc(value = 1, labels) {
        const k = this.key(labels);
        const current = this.values.get(k) ?? 0;
        this.values.set(k, current + value);
    }
    get() {
        const lines = [];
        if (this.help)
            lines.push(`# HELP ${this.name} ${this.help}`);
        lines.push(`# TYPE ${this.name} gauge`);
        if (this.values.size === 0) {
            lines.push(`${this.name} 0`);
        }
        else {
            for (const [k, v] of this.values.entries()) {
                if (k === "__all__") {
                    lines.push(`${this.name} ${v}`);
                }
                else {
                    const labelPairs = (this.labels ?? []).map((key, idx) => `${key}="${k.split("::")[idx]}"`).join(",");
                    lines.push(`${this.name}{${labelPairs}} ${v}`);
                }
            }
        }
        return lines.join("\n");
    }
}
class MetricsRegistry {
    constructor() {
        this.metricsByName = new Map();
    }
    register(metric) {
        this.metricsByName.set(metric.name, metric);
    }
    counter(name, help, labels) {
        const existing = this.metricsByName.get(name);
        if (existing && existing.type !== "counter") {
            throw new Error(`Metric ${name} already registered with type ${existing.type}`);
        }
        if (!existing) {
            const c = new Counter(name, help, labels);
            this.metricsByName.set(name, c);
            return c;
        }
        return existing;
    }
    gauge(name, help, labels) {
        const existing = this.metricsByName.get(name);
        if (existing && existing.type !== "gauge") {
            throw new Error(`Metric ${name} already registered with type ${existing.type}`);
        }
        if (!existing) {
            const g = new Gauge(name, help, labels);
            this.metricsByName.set(name, g);
            return g;
        }
        return existing;
    }
    inc(name, value = 1, labels) {
        const metric = this.metricsByName.get(name);
        if (!metric)
            throw new Error(`Metric ${name} not found`);
        if (metric.type === "counter") {
            metric.inc(value, labels);
        }
        else {
            metric.inc(value, labels);
        }
    }
    set(name, value, labels) {
        const metric = this.metricsByName.get(name);
        if (!metric)
            throw new Error(`Metric ${name} not found`);
        if (metric.type === "gauge") {
            metric.set(value, labels);
        }
        else {
            throw new Error(`Metric ${name} is not a gauge`);
        }
    }
    exposition() {
        return Array.from(this.metricsByName.values())
            .map((m) => m.get())
            .join("\n\n");
    }
}
exports.MetricsRegistry = MetricsRegistry;
