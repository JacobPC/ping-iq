export function setupGracefulShutdown(state: { maintenance: boolean; readinessCache?: any }, options?: { signals?: NodeJS.Signals[]; drainMs?: number; onSignal?: (signal: string) => void }) {
  const signals = options?.signals ?? ['SIGTERM', 'SIGINT'];
  const drainMs = options?.drainMs ?? 0;
  const handlers: Array<() => void> = [];
  for (const sig of signals) {
    const handler = () => {
      options?.onSignal?.(sig);
      state.maintenance = true;
      state.readinessCache = undefined;
      if (drainMs > 0) setTimeout(() => process.exit(0), drainMs);
      else process.exit(0);
    };
    process.on(sig, handler);
    handlers.push(() => process.off(sig, handler));
  }
  return () => { handlers.forEach((fn) => fn()); };
}


