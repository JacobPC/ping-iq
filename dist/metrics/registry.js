"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsRegistry = void 0;
const prom_client_1 = require("prom-client");
class MetricsRegistry {
    constructor(registry) {
        this.counters = new Map();
        this.gauges = new Map();
        this.registry = registry ?? new prom_client_1.Registry();
        (0, prom_client_1.collectDefaultMetrics)({ register: this.registry });
    }
    register() {
        // no-op retained for compatibility
    }
    counter(name, help, labels) {
        let c = this.counters.get(name);
        if (!c) {
            c = new prom_client_1.Counter({ name, help: help ?? name, labelNames: labels ?? [], registers: [this.registry] });
            this.counters.set(name, c);
        }
        return c;
    }
    gauge(name, help, labels) {
        let g = this.gauges.get(name);
        if (!g) {
            g = new prom_client_1.Gauge({ name, help: help ?? name, labelNames: labels ?? [], registers: [this.registry] });
            this.gauges.set(name, g);
        }
        return g;
    }
    inc(name, value = 1, labels) {
        const c = this.counter(name);
        if (labels)
            c.inc(labels, value);
        else
            c.inc(value);
    }
    set(name, value, labels) {
        const g = this.gauge(name);
        if (labels)
            g.set(labels, value);
        else
            g.set(value);
    }
    exposition() { return this.registry.metrics(); }
    getRegistry() { return this.registry; }
}
exports.MetricsRegistry = MetricsRegistry;
