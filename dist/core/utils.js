"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nowUtcIso = nowUtcIso;
exports.safeJson = safeJson;
exports.parseIntSafe = parseIntSafe;
exports.toNumberSafe = toNumberSafe;
exports.bytesToMbps = bytesToMbps;
exports.clamp = clamp;
exports.withTimeout = withTimeout;
exports.firstForwardedIp = firstForwardedIp;
function nowUtcIso() {
    return new Date().toISOString();
}
function safeJson(value) {
    return JSON.stringify(value);
}
function parseIntSafe(value, fallback) {
    if (value === undefined)
        return fallback;
    const raw = Array.isArray(value) ? value[0] : value;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : fallback;
}
function toNumberSafe(value, fallback) {
    if (value === undefined)
        return fallback;
    const raw = Array.isArray(value) ? value[0] : value;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
}
function bytesToMbps(bytes, durationMs) {
    if (durationMs <= 0)
        return 0;
    const bits = bytes * 8;
    const seconds = durationMs / 1000;
    return bits / seconds / 1000000;
}
function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}
async function withTimeout(fn, timeoutMs, onTimeout) {
    let timeoutHandle;
    try {
        const timeoutPromise = new Promise((resolve, reject) => {
            timeoutHandle = setTimeout(() => {
                if (onTimeout) {
                    try {
                        resolve(onTimeout());
                    }
                    catch (e) {
                        reject(e);
                    }
                }
                else {
                    reject(new Error(`Operation timed out after ${timeoutMs}ms`));
                }
            }, timeoutMs);
        });
        return await Promise.race([fn(), timeoutPromise]);
    }
    finally {
        if (timeoutHandle)
            clearTimeout(timeoutHandle);
    }
}
function firstForwardedIp(value, fallback) {
    if (!value)
        return fallback;
    const raw = Array.isArray(value) ? value[0] : value;
    const first = raw.split(",")[0]?.trim();
    return first || fallback;
}
