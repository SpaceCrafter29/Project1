import {
  interpretCheck,
  interpretTable,
  type CodeRunResult,
  type Table,
} from '../../shared/codecheck';
import type { CheckRun } from '../session/types';

export const CHECK_TIMEOUT_MS = 3000;

/** Runs code in a fresh Web Worker; terminates it after the time limit. */
export function runInSandbox(code: string, timeoutMs = CHECK_TIMEOUT_MS): Promise<CodeRunResult> {
  return new Promise((resolve) => {
    const started = performance.now();
    const worker = new Worker(new URL('../workers/sandbox.worker.ts', import.meta.url), { type: 'module' });
    const timer = setTimeout(() => {
      worker.terminate();
      resolve({ status: 'timeout', ms: performance.now() - started });
    }, timeoutMs);
    worker.onmessage = (event: MessageEvent<CodeRunResult>) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(event.data);
    };
    worker.onerror = (event) => {
      clearTimeout(timer);
      worker.terminate();
      resolve({ status: 'error', error: event.message || 'Worker error', ms: performance.now() - started });
    };
    worker.postMessage({ code });
  });
}

export async function runCheck(claim: string, code: string, source: CheckRun['source']): Promise<CheckRun> {
  const result = await runInSandbox(code);
  return { claim, code, source, outcome: interpretCheck(result) };
}

export async function runTable(code: string): Promise<{ table?: Table; error?: string }> {
  const result = interpretTable(await runInSandbox(code));
  return result.ok ? { table: result.table } : { error: result.error };
}
