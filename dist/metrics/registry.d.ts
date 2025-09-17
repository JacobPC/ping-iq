import { MetricsRegistryLike } from "../core/types";
import { Counter, Gauge, Registry } from "prom-client";
type LabelValues = Record<string, string>;
export declare class MetricsRegistry implements MetricsRegistryLike {
    private readonly registry;
    private readonly counters;
    private readonly gauges;
    constructor(registry?: Registry);
    register(): void;
    counter(name: string, help?: string, labels?: string[]): Counter<string>;
    gauge(name: string, help?: string, labels?: string[]): Gauge<string>;
    inc(name: string, value?: number, labels?: LabelValues): void;
    set(name: string, value: number, labels?: LabelValues): void;
    exposition(): Promise<string>;
    getRegistry(): Registry;
}
export {};
