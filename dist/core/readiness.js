"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.booleanCheck = booleanCheck;
exports.timedCheck = timedCheck;
function booleanCheck(name, fn) {
    return async () => {
        try {
            const ok = await Promise.resolve(fn());
            return { name, status: ok ? "ok" : "fail" };
        }
        catch (e) {
            return { name, status: "fail", error: e instanceof Error ? e.message : String(e) };
        }
    };
}
function timedCheck(name, fn) {
    return async () => {
        const start = Date.now();
        try {
            await Promise.resolve(fn());
            return { name, status: "ok", durationMs: Date.now() - start };
        }
        catch (e) {
            return { name, status: "fail", durationMs: Date.now() - start, error: e instanceof Error ? e.message : String(e) };
        }
    };
}
