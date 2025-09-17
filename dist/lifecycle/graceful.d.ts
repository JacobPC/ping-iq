export declare function setupGracefulShutdown(state: {
    maintenance: boolean;
    readinessCache?: any;
}, options?: {
    signals?: NodeJS.Signals[];
    drainMs?: number;
    onSignal?: (signal: string) => void;
}): () => void;
