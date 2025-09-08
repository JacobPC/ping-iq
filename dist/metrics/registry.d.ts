import { Metric, MetricsRegistryLike } from "../core/types";
type LabelValues = Record<string, string>;
declare class Counter implements Metric {
    readonly name: string;
    readonly help?: string;
    readonly type: "counter";
    readonly labels?: string[];
    private readonly values;
    constructor(name: string, help?: string, labels?: string[]);
    private key;
    inc(value?: number, labels?: LabelValues): void;
    get(): string;
}
declare class Gauge implements Metric {
    readonly name: string;
    readonly help?: string;
    readonly type: "gauge";
    readonly labels?: string[];
    private readonly values;
    constructor(name: string, help?: string, labels?: string[]);
    private key;
    set(value: number, labels?: LabelValues): void;
    inc(value?: number, labels?: LabelValues): void;
    get(): string;
}
export declare class MetricsRegistry implements MetricsRegistryLike {
    private readonly metricsByName;
    register(metric: Metric): void;
    counter(name: string, help?: string, labels?: string[]): Counter;
    gauge(name: string, help?: string, labels?: string[]): Gauge;
    inc(name: string, value?: number, labels?: LabelValues): void;
    set(name: string, value: number, labels?: LabelValues): void;
    exposition(): string;
}
export {};
