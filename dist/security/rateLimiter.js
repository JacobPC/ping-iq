"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryRateLimiter = void 0;
class InMemoryRateLimiter {
    constructor(options) {
        this.buckets = new Map();
        this.capacity = Math.max(1, options.capacity);
        this.refillPerSecond = Math.max(0, options.refillPerSecond);
    }
    refill(state, now) {
        const elapsedSec = (now - state.lastRefill) / 1000;
        const refillTokens = elapsedSec * this.refillPerSecond;
        if (refillTokens > 0) {
            state.tokens = Math.min(this.capacity, state.tokens + refillTokens);
            state.lastRefill = now;
        }
    }
    tryConsume(key, tokens = 1) {
        const now = Date.now();
        let state = this.buckets.get(key);
        if (!state) {
            state = { tokens: this.capacity, lastRefill: now };
            this.buckets.set(key, state);
        }
        this.refill(state, now);
        if (state.tokens >= tokens) {
            state.tokens -= tokens;
            return true;
        }
        return false;
    }
}
exports.InMemoryRateLimiter = InMemoryRateLimiter;
