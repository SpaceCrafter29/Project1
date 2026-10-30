import { useEffect, useState } from 'react';
import type { Usage } from '../shared/api';
import { MathText } from './components/MathText';
import { Button } from './components/ui';
import { SessionView } from './features/SessionView';
import { API_CALL_EVENT, api } from './lib/api';
import { isDemo, useConfig } from './lib/config';
import { href, navigate, useRoute } from './lib/router';
import { getStore } from './lib/storage';
import type { Session } from './session/types';
import { newSession } from './session/useSession';

export function App() {
  const route = useRoute();
  const config = useConfig();

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href={href({ name: 'home' })}>
          <BrandDoodle />
          <span>Olympiad Coach</span>
        </a>
        <nav>
          <a href={href({ name: 'home' })}>my problems →</a>
        </nav>
      </header>
      {isDemo(config) && (
        <aside className="demo-banner sticky-note" data-testid="demo-banner">
          <strong>Demo mode</strong> – no API key yet, so the coach answers with scripted examples: a number theory problem
          (IMO 1964/1) and a geometry problem. Use the “Sample” buttons.
        </aside>
      )}
      <main className="main">{route.name === 'home' ? <Home /> : <SessionView key={route.id} id={route.id} tab={route.tab} />}</main>
      <Footer />
    </div>
  );
}

/** Compass-and-triangle doodle used as the logo. */
function BrandDoodle() {
  return (
    <svg className="brand-doodle" viewBox="0 0 48 48" width="40" height="40" aria-hidden>
      <path d="M8 40 L24 8 L40 40 Z" />
      <path d="M24 8 L16 40 M24 8 L33 40" className="thin" />
      <circle cx="24" cy="27" r="9" className="thin" />
      <circle cx="24" cy="8" r="2.4" className="dot" />
    </svg>
  );
}

function Home() {
  const [sessions, setSessions] = useState<Session[] | null>(null);

  useEffect(() => {
    void getStore()
      .then((s) => s.list())
      .then(setSessions);
  }, []);

  const start = async () => {
    const session = newSession();
    await (await getStore()).put(session);
    navigate({ name: 'session', id: session.id, tab: 'problem' });
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this problem and all your work on it?')) return;
    await (await getStore()).remove(id);
    setSessions((list) => list?.filter((s) => s.id !== id) ?? null);
  };

  return (
    <div className="home">
      <section className="hero">
        <h1>
          Learn to find the <span className="marker">proof</span> yourself.
        </h1>
        <p>
          Photograph an olympiad problem and work on it on paper. Whenever you get stuck, photograph your progress and
          get a tip made for exactly where you are – never the answer. At the end the coach checks your solution step
          by step.
        </p>
        <Button variant="primary" onClick={start} data-testid="new-problem">
          New problem
        </Button>
      </section>
      <ol className="how">
        <li>
          <strong>Upload</strong> a photo or screenshot of the problem.
        </li>
        <li>
          <strong>Get one tip</strong> and work on paper as far as you can.
        </li>
        <li>
          <strong>Photograph your progress</strong> – the next tip is made for exactly where you are.
        </li>
        <li>
          <strong>Get feedback</strong> on every step – checked twice, and by code where possible.
        </li>
        <li>
          <strong>Learn</strong> other approaches once you are done.
        </li>
      </ol>
      {sessions && sessions.length > 0 && (
        <section>
          <h2>Your problems</h2>
          <ul className="session-list">
            {sessions.map((s) => (
              <li key={s.id}>
                <a href={href({ name: 'session', id: s.id, tab: 'problem' })}>
                  <MathText text={titleOf(s)} className="session-title" />
                  <span className="muted small">
                    {new Date(s.updatedAt).toLocaleString()} · {progressOf(s)}
                  </span>
                </a>
                <Button variant="ghost" onClick={() => void remove(s.id)} aria-label="Delete problem">
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** First ~100 characters of the problem, cut outside of $…$ so the math still renders. */
function titleOf(s: Session): string {
  const text = s.problem?.transcript.replace(/\s+/g, ' ').trim();
  if (!text) return 'Untitled problem';
  if (text.length <= 100) return text;
  let cut = text.slice(0, 100);
  if ((cut.match(/\$/g)?.length ?? 0) % 2 === 1) cut = cut.slice(0, cut.lastIndexOf('$'));
  return `${cut.trimEnd()} …`;
}

function progressOf(s: Session): string {
  if (s.attempt?.assessment) return 'solution checked';
  if (s.attempt?.confirmed) return 'solution submitted';
  const tips = s.coaching?.length ?? 0;
  if (tips > 0) return tips === 1 ? '1 tip so far' : `${tips} tips so far`;
  if (s.problem?.confirmed) return 'problem confirmed';
  return 'just started';
}

function Footer() {
  const [usage, setUsage] = useState<Usage | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => void api.usage().then(setUsage, () => undefined);
    const later = () => {
      clearTimeout(timer);
      timer = setTimeout(refresh, 300);
    };
    refresh();
    window.addEventListener(API_CALL_EVENT, later);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(API_CALL_EVENT, later);
    };
  }, []);
  return (
    <footer className="footer">
      <p className="disclaimer" data-testid="disclaimer">
        The AI can make mistakes. Check steps that look odd to you, and ask.
      </p>
      {usage && (
        <p className="muted small">
          Model calls since server start: {usage.calls}
          {usage.promptTokens + usage.completionTokens > 0 &&
            ` · ${(usage.promptTokens + usage.completionTokens).toLocaleString()} tokens`}
        </p>
      )}
    </footer>
  );
}
