import { RateLimitOptions } from "../core/types";
export declare class InMemoryRateLimiter {
    private readonly capacity;
    private readonly refillPerSecond;
    private readonly buckets;
    constructor(options: RateLimitOptions);
    private refill;
    tryConsume(key: string, tokens?: number): boolean;
}
