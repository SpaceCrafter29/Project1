import {
  interpretCheck,
  interpretTable,
  type CodeRunResult,
  type RunArgs,
  type Table,
} from '../../shared/codecheck';
import type { CheckRun } from '../session/types';

export const CHECK_TIMEOUT_MS = 3000;

const newWorker = () => new Worker(new URL('../workers/sandbox.worker.ts', import.meta.url), { type: 'module' });

/** Runs code in a fresh Web Worker; terminates it after the time limit. */
export function runInSandbox(code: string, timeoutMs = CHECK_TIMEOUT_MS, args?: RunArgs): Promise<CodeRunResult> {
  return new Promise((resolve) => {
    const started = performance.now();
    const worker = newWorker();
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
    worker.postMessage({ code, args });
  });
}

/**
 * Keeps one sandbox worker alive for an interactive figure: re-running the
 * construction on every drag would be too slow with a fresh worker each time.
 */
export class FigureRunner {
  private worker: Worker | null = null;
  private nextId = 0;
  private pending = new Map<number, (r: CodeRunResult) => void>();

  run(code: string, args: RunArgs, timeoutMs = 1000): Promise<CodeRunResult> {
    const worker = this.ensure();
    const id = ++this.nextId;
    const started = performance.now();
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.reset({ status: 'timeout', ms: performance.now() - started });
      }, timeoutMs);
      this.pending.set(id, (r) => {
        clearTimeout(timer);
        resolve(r);
      });
      worker.postMessage({ id, code, args });
    });
  }

  dispose(): void {
    this.reset({ status: 'error', error: 'stopped', ms: 0 });
  }

  private ensure(): Worker {
    if (this.worker) return this.worker;
    const worker = newWorker();
    worker.onmessage = (event: MessageEvent<CodeRunResult & { id: number }>) => {
      const done = this.pending.get(event.data.id);
      this.pending.delete(event.data.id);
      done?.(event.data);
    };
    worker.onerror = (event) => this.reset({ status: 'error', error: event.message || 'Worker error', ms: 0 });
    this.worker = worker;
    return worker;
  }

  /** Stops a stuck or broken worker and answers everything still waiting. */
  private reset(result: CodeRunResult): void {
    this.worker?.terminate();
    this.worker = null;
    for (const done of this.pending.values()) done(result);
    this.pending.clear();
  }
}

export async function runCheck(claim: string, code: string, source: CheckRun['source']): Promise<CheckRun> {
  const result = await runInSandbox(code);
  return { claim, code, source, outcome: interpretCheck(result) };
}

export async function runTable(code: string): Promise<{ table?: Table; error?: string }> {
  const result = interpretTable(await runInSandbox(code));
  return result.ok ? { table: result.table } : { error: result.error };
}
