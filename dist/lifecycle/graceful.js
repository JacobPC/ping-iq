"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupGracefulShutdown = setupGracefulShutdown;
function setupGracefulShutdown(state, options) {
    const signals = options?.signals ?? ['SIGTERM', 'SIGINT'];
    const drainMs = options?.drainMs ?? 0;
    const handlers = [];
    for (const sig of signals) {
        const handler = () => {
            options?.onSignal?.(sig);
            state.maintenance = true;
            state.readinessCache = undefined;
            if (drainMs > 0)
                setTimeout(() => process.exit(0), drainMs);
            else
                process.exit(0);
        };
        process.on(sig, handler);
        handlers.push(() => process.off(sig, handler));
    }
    return () => { handlers.forEach((fn) => fn()); };
}
