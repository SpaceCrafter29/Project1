// The sandbox worker as its own file, served with a strict CSP (see server/index.ts).
// The single-file demo build swaps in workerFactory.standalone.ts (see vite.config.ts).
export const createSandboxWorker = () =>
  new Worker(new URL('../workers/sandbox.worker.ts', import.meta.url), { type: 'module' });
