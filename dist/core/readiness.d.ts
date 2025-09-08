import { ReadinessCheck } from "./types";
export declare function booleanCheck(name: string, fn: () => boolean | Promise<boolean>): ReadinessCheck;
export declare function timedCheck(name: string, fn: () => Promise<void> | void): ReadinessCheck;
