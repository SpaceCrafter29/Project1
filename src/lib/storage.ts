// Local persistence in IndexedDB. Behind a small interface so a Firestore-backed
// store can replace it later without touching the UI.
import type { Session } from '../session/types';

export interface SessionStore {
  list(): Promise<Session[]>;
  get(id: string): Promise<Session | undefined>;
  put(session: Session): Promise<void>;
  remove(id: string): Promise<void>;
}

const DB_NAME = 'olympiad-coach';
const STORE = 'sessions';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        tx.oncomplete = () => {
          db.close();
          resolve(req.result);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      }),
  );
}

/** Falls back to memory when IndexedDB is unavailable (private mode, blocked storage). */
class MemoryStore implements SessionStore {
  private data = new Map<string, Session>();
  async list() {
    return [...this.data.values()];
  }
  async get(id: string) {
    return this.data.get(id);
  }
  async put(session: Session) {
    this.data.set(session.id, session);
  }
  async remove(id: string) {
    this.data.delete(id);
  }
}

class IndexedDbStore implements SessionStore {
  async list() {
    const all = await run<Session[]>('readonly', (s) => s.getAll() as IDBRequest<Session[]>);
    return all.sort((a, b) => b.updatedAt - a.updatedAt);
  }
  get(id: string) {
    return run<Session | undefined>('readonly', (s) => s.get(id) as IDBRequest<Session | undefined>);
  }
  async put(session: Session) {
    await run('readwrite', (s) => s.put(session));
  }
  async remove(id: string) {
    await run('readwrite', (s) => s.delete(id));
  }
}

let store: SessionStore | null = null;

export async function getStore(): Promise<SessionStore> {
  if (store) return store;
  try {
    const candidate = new IndexedDbStore();
    await candidate.list();
    store = candidate;
  } catch {
    store = new MemoryStore();
  }
  return store;
}
