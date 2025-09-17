import { ReadinessCheck } from "./types";
export declare function booleanCheck(name: string, fn: () => boolean | Promise<boolean>): ReadinessCheck;
export declare function timedCheck(name: string, fn: () => Promise<void> | void): ReadinessCheck;
export declare function httpGetCheck(name: string, url: string, timeoutMs?: number, fetchImpl?: typeof fetch): ReadinessCheck;
export declare function tcpPortCheck(name: string, host: string, port: number, timeoutMs?: number): ReadinessCheck;
export declare function clientPingCheck(name: string, fn: () => Promise<void> | void): ReadinessCheck;
