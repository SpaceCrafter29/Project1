import { produce, type Draft } from 'immer';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getStore } from '../lib/storage';
import type { Session } from './types';

export type Updater = (recipe: (draft: Draft<Session>) => void) => void;

export function uid(prefix = ''): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function newSession(): Session {
  const now = Date.now();
  return {
    id: uid('p_'),
    createdAt: now,
    updatedAt: now,
    problem: null,
    hints: { revealed: 0 },
    attempt: null,
    pastAttempts: [],
    correction: null,
    alternatives: null,
  };
}

/** Loads a session, exposes an immer-based updater, and saves changes (debounced). */
export function useSession(id: string): { session: Session | null; update: Updater; missing: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [missing, setMissing] = useState(false);
  const dirty = useRef(false);
  const latest = useRef<Session | null>(null);
  latest.current = session;

  // Save pending changes when leaving the session view.
  useEffect(
    () => () => {
      if (dirty.current && latest.current) {
        dirty.current = false;
        const pending = latest.current;
        void getStore().then((store) => store.put(pending));
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    setSession(null);
    setMissing(false);
    getStore()
      .then((store) => store.get(id))
      .then((s) => {
        if (cancelled) return;
        if (s) setSession(s);
        else setMissing(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!session || !dirty.current) return;
    const timer = setTimeout(() => {
      dirty.current = false;
      void getStore().then((store) => store.put(session));
    }, 300);
    return () => clearTimeout(timer);
  }, [session]);

  const update: Updater = useCallback((recipe) => {
    dirty.current = true;
    setSession((prev) =>
      prev
        ? produce(prev, (draft) => {
            recipe(draft);
            draft.updatedAt = Date.now();
          })
        : prev,
    );
  }, []);

  return { session, update, missing };
}
