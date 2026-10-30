// Runs model-written JavaScript, isolated from the page. Checks use a fresh worker per
// run; figures keep one worker while the student drags. Callers terminate it on timeout.
import { executeCode, toPlain, type RunArgs } from '../../shared/codecheck';

interface WorkerScope {
  postMessage(message: unknown): void;
  onmessage: ((event: MessageEvent<{ id?: number; code: string; args?: RunArgs }>) => void) | null;
}

const scope = self as unknown as WorkerScope & Record<string, unknown>;
const post = scope.postMessage.bind(scope);

// No network, storage or nested workers for generated code. Blocked on the whole
// prototype chain; the server also sends a CSP without connect-src for this script.
for (const name of [
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'EventSource',
  'importScripts',
  'indexedDB',
  'caches',
  'BroadcastChannel',
  'Worker',
  'SharedWorker',
  'postMessage',
]) {
  for (let target: object | null = scope; target && target !== Object.prototype; target = Object.getPrototypeOf(target)) {
    try {
      Object.defineProperty(target, name, { value: undefined, configurable: false, writable: false });
    } catch {
      // some properties cannot be redefined in every browser
    }
  }
}

scope.onmessage = (event) => {
  const started = performance.now();
  const { id, code, args } = event.data;
  const done = (payload: Record<string, unknown>) => post({ ...payload, id, ms: performance.now() - started });
  try {
    Promise.resolve(executeCode(code, args)).then(
      (value) => done({ status: 'ok', value: toPlain(value) }),
      (err: unknown) => done({ status: 'error', error: String((err as Error)?.message ?? err) }),
    );
  } catch (err) {
    done({ status: 'error', error: String((err as Error)?.message ?? err) });
  }
};
