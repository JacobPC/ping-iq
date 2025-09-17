"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.booleanCheck = booleanCheck;
exports.timedCheck = timedCheck;
exports.httpGetCheck = httpGetCheck;
exports.tcpPortCheck = tcpPortCheck;
exports.clientPingCheck = clientPingCheck;
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
function httpGetCheck(name, url, timeoutMs = 2000, fetchImpl) {
    return async () => {
        const fetchFn = fetchImpl ?? globalThis.fetch;
        const controller = new AbortController();
        const to = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetchFn(url, { signal: controller.signal });
            clearTimeout(to);
            return { name, status: res.ok ? 'ok' : 'fail', details: { status: res.status } };
        }
        catch (e) {
            clearTimeout(to);
            return { name, status: 'fail', error: e instanceof Error ? e.message : String(e) };
        }
    };
}
function tcpPortCheck(name, host, port, timeoutMs = 2000) {
    return async () => {
        const net = await Promise.resolve().then(() => __importStar(require('node:net')));
        return await new Promise((resolve) => {
            const socket = new net.Socket();
            const timer = setTimeout(() => { socket.destroy(); resolve({ name, status: 'fail', error: 'timeout' }); }, timeoutMs);
            socket.connect(port, host, () => {
                clearTimeout(timer);
                socket.end();
                resolve({ name, status: 'ok' });
            });
            socket.on('error', (err) => { clearTimeout(timer); resolve({ name, status: 'fail', error: String(err?.message || err) }); });
        });
    };
}
function clientPingCheck(name, fn) {
    return async () => {
        try {
            await Promise.resolve(fn());
            return { name, status: 'ok' };
        }
        catch (e) {
            return { name, status: 'fail', error: e instanceof Error ? e.message : String(e) };
        }
    };
}
