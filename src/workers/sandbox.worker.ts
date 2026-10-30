// Runs one piece of model-written JavaScript, isolated from the page.
// A fresh worker is used per run and terminated by the caller on timeout.
import { executeCode, toPlain } from '../../shared/codecheck';

interface WorkerScope {
  postMessage(message: unknown): void;
  onmessage: ((event: MessageEvent<{ code: string }>) => void) | null;
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
  const done = (payload: Record<string, unknown>) => post({ ...payload, ms: performance.now() - started });
  try {
    Promise.resolve(executeCode(event.data.code)).then(
      (value) => done({ status: 'ok', value: toPlain(value) }),
      (err: unknown) => done({ status: 'error', error: String((err as Error)?.message ?? err) }),
    );
  } catch (err) {
    done({ status: 'error', error: String((err as Error)?.message ?? err) });
  }
};
