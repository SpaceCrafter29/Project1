// The sandbox worker embedded in the single-file demo (a classic worker from a blob URL).
import InlineSandboxWorker from '../workers/sandbox.worker.ts?worker&inline';

export const createSandboxWorker = () => new InlineSandboxWorker();
