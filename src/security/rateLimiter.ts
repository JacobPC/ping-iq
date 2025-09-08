import { RateLimitOptions } from "../core/types";

interface TokenBucketState {
  tokens: number;
  lastRefill: number; // epoch ms
}

export class InMemoryRateLimiter {
  private readonly capacity: number;
  private readonly refillPerSecond: number;
  private readonly buckets: Map<string, TokenBucketState> = new Map();

  constructor(options: RateLimitOptions) {
    this.capacity = Math.max(1, options.capacity);
    this.refillPerSecond = Math.max(0, options.refillPerSecond);
  }

  private refill(state: TokenBucketState, now: number) {
    const elapsedSec = (now - state.lastRefill) / 1000;
    const refillTokens = elapsedSec * this.refillPerSecond;
    if (refillTokens > 0) {
      state.tokens = Math.min(this.capacity, state.tokens + refillTokens);
      state.lastRefill = now;
    }
  }

  public tryConsume(key: string, tokens = 1): boolean {
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


