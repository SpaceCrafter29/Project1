import { useSyncExternalStore } from 'react';

export type TabId = 'problem' | 'work' | 'solution' | 'feedback' | 'ask' | 'fix' | 'learn';

export type Route = { name: 'home' } | { name: 'session'; id: string; tab: TabId };

const TABS: TabId[] = ['problem', 'work', 'solution', 'feedback', 'ask', 'fix', 'learn'];

export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'p' && parts[1]) {
    const requested = parts[2] === 'understand' ? 'work' : parts[2]; // old links
    const tab = TABS.includes(requested as TabId) ? (requested as TabId) : 'problem';
    return { name: 'session', id: parts[1], tab };
  }
  return { name: 'home' };
}

export function href(route: Route): string {
  return route.name === 'home' ? '#/' : `#/p/${route.id}/${route.tab}`;
}

export function navigate(route: Route): void {
  window.location.hash = href(route);
  window.scrollTo({ top: 0 });
}

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash);
  return parseRoute(hash);
}
