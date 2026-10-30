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
          <img src="/favicon.svg" alt="" width={28} height={28} />
          <span>Olympiad Coach</span>
        </a>
        <nav>
          <a href={href({ name: 'home' })}>My problems</a>
        </nav>
      </header>
      {isDemo(config) && (
        <div className="demo-banner" data-testid="demo-banner">
          Demo mode: no API key is configured, so the coach answers with a scripted example (IMO 1964, Problem 1).
        </div>
      )}
      <main className="main">{route.name === 'home' ? <Home /> : <SessionView key={route.id} id={route.id} tab={route.tab} />}</main>
      <Footer />
    </div>
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
        <h1>Learn to find the proof yourself.</h1>
        <p>
          Photograph an olympiad problem, get hints one stage at a time, solve it on paper, and let the coach check
          your own solution step by step – without giving the answer away.
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
          <strong>Understand</strong> it with hints you reveal one by one.
        </li>
        <li>
          <strong>Solve</strong> it on paper and photograph your solution.
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
  if (s.hints.revealed > 0) return `${s.hints.revealed}/6 hint stages`;
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
