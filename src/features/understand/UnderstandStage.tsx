import { useState, type ReactNode } from 'react';
import type { HintStage } from '../../../shared/api';
import { CheckResult } from '../../components/CheckResult';
import { MathText } from '../../components/MathText';
import { Button, Card, Details, ErrorBox, Pill } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { runCheck, runTable } from '../../lib/sandbox';
import type { Hints } from '../../session/types';
import type { StageProps } from '../SessionView';

const STAGES = [
  { n: 1, title: 'In simple words', teaser: 'The problem restated plainly, with technical terms explained.' },
  { n: 2, title: 'Given / wanted', teaser: 'A short overview of what you know and what you need.' },
  { n: 3, title: 'Small cases', teaser: 'A table of the first cases, computed by code.' },
  { n: 4, title: 'Your conjecture', teaser: 'What pattern do you notice? Write it down and get feedback.' },
  { n: 5, title: 'Method hint', teaser: 'A general method that could work here.' },
  { n: 6, title: 'Proof skeleton', teaser: 'The structure of a proof – without content.' },
] as const;

export function UnderstandStage({ session, update, go }: StageProps) {
  const problem = session.problem!.transcript;
  const hints = session.hints;
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<{ stage: number; message: string } | null>(null);

  const reveal = async (n: number) => {
    setBusy(n);
    setError(null);
    try {
      if (n === 4) {
        update((d) => {
          d.hints.revealed = 4;
        });
        return;
      }
      const stage = n as HintStage;
      if (stage === 3) {
        const hint = await api.hint(problem, 3);
        const { table, error: tableError } = await runTable(hint.code);
        update((d) => {
          d.hints.smallCases = { ...hint, table, tableError };
          d.hints.revealed = 3;
        });
        return;
      }
      const result = await api.hint(problem, stage);
      update((d) => {
        const h = d.hints as Hints;
        if (stage === 1) h.simple = result as Hints['simple'];
        if (stage === 2) h.givenWanted = result as Hints['givenWanted'];
        if (stage === 5) h.method = result as Hints['method'];
        if (stage === 6) h.skeleton = result as Hints['skeleton'];
        h.revealed = Math.max(h.revealed, n);
      });
    } catch (err) {
      setError({ stage: n, message: errorMessage(err) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="stack">
      <Card title="Problem">
        <MathText text={problem} block className="problem-text" />
      </Card>
      <p className="lead">
        Try on your own first. Each stage reveals a little more – open only what you need.
      </p>
      {STAGES.map(({ n, title, teaser }) => {
        const revealed = hints.revealed >= n;
        const next = hints.revealed + 1 === n;
        return (
          <Card
            key={n}
            className={`hint-stage ${revealed ? 'revealed' : ''}`}
            title={
              <>
                <span className="stage-num">{n}</span> {title}
              </>
            }
            testId={`hint-${n}`}
          >
            {revealed ? (
              <StageContent n={n} hints={hints} problem={problem} update={update} />
            ) : (
              <div className="hint-locked">
                <span className="muted">{teaser}</span>
                <Button
                  variant={next ? 'primary' : 'secondary'}
                  disabled={!next}
                  busy={busy === n}
                  onClick={() => void reveal(n)}
                  data-testid={`reveal-${n}`}
                >
                  {next ? 'Reveal' : `Open stage ${n - 1} first`}
                </Button>
              </div>
            )}
            {error?.stage === n && <ErrorBox message={error.message} onRetry={() => void reveal(n)} />}
          </Card>
        );
      })}
      <div className="actions">
        <Button variant="primary" onClick={() => go('solution')} data-testid="go-solve">
          Solve it on paper
        </Button>
      </div>
    </div>
  );
}

function StageContent({
  n,
  hints,
  problem,
  update,
}: {
  n: number;
  hints: Hints;
  problem: string;
  update: StageProps['update'];
}): ReactNode {
  switch (n) {
    case 1:
      return (
        hints.simple && (
          <>
            <MathText text={hints.simple.explanation} block />
            {hints.simple.glossary.length > 0 && (
              <dl className="glossary">
                {hints.simple.glossary.map((g, i) => (
                  <div key={i}>
                    <dt>
                      <MathText text={g.term} />
                    </dt>
                    <dd>
                      <MathText text={g.meaning} />
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </>
        )
      );
    case 2:
      return (
        hints.givenWanted && (
          <div className="given-wanted">
            <div>
              <h4>Given</h4>
              <ul>
                {hints.givenWanted.given.map((g, i) => (
                  <li key={i}>
                    <MathText text={g} />
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Wanted</h4>
              <ul>
                {hints.givenWanted.wanted.map((w, i) => (
                  <li key={i}>
                    <MathText text={w} />
                  </li>
                ))}
              </ul>
            </div>
            {hints.givenWanted.notes && (
              <p className="note">
                <MathText text={hints.givenWanted.notes} />
              </p>
            )}
          </div>
        )
      );
    case 3:
      return hints.smallCases && <SmallCasesView data={hints.smallCases} />;
    case 4:
      return <ConjectureBox hints={hints} problem={problem} update={update} />;
    case 5:
      return (
        hints.method && (
          <>
            <p>
              <Pill tone="accent">{hints.method.method}</Pill>
            </p>
            <p className="principle">
              <MathText text={hints.method.principle_sentence} />
            </p>
            <MathText text={hints.method.why_here} block />
            {hints.method.self_question && (
              <p className="self-question">
                Ask yourself: <MathText text={hints.method.self_question} />
              </p>
            )}
          </>
        )
      );
    case 6:
      return (
        hints.skeleton && (
          <ol className="skeleton">
            {hints.skeleton.parts.map((p, i) => (
              <li key={i}>
                <strong>
                  <MathText text={p.label} />
                </strong>
                <span className="skeleton-slot">
                  <MathText text={p.purpose} />
                </span>
              </li>
            ))}
          </ol>
        )
      );
  }
  return null;
}

function SmallCasesView({ data }: { data: NonNullable<Hints['smallCases']> }) {
  return (
    <>
      <MathText text={data.intro} block />
      {data.table ? (
        <div className="table-wrap">
          <table className="cases" data-testid="cases-table">
            <thead>
              <tr>
                {data.table.columns.map((c, i) => (
                  <th key={i}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.table.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ErrorBox message={`The table could not be computed: ${data.tableError ?? 'unknown error'}`} />
      )}
      {data.what_to_look_for && (
        <p className="self-question">
          <MathText text={data.what_to_look_for} />
        </p>
      )}
      <Details summary="Show the code that computed this table">
        <pre className="code">{data.code}</pre>
      </Details>
    </>
  );
}

function ConjectureBox({ hints, problem, update }: { hints: Hints; problem: string; update: StageProps['update'] }) {
  const [text, setText] = useState(hints.conjecture?.text ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const feedback = hints.conjecture?.feedback;

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await api.conjecture({ problem, conjecture: text, table: hints.smallCases?.table });
      const check = result.check_code ? await runCheck(result.check_claim || text, result.check_code, 'conjecture') : undefined;
      update((d) => {
        d.hints.conjecture = { text, feedback: result, check };
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const tone = { consistent: 'good', partly: 'warn', inconsistent: 'bad', unclear: 'neutral' } as const;
  return (
    <div className="conjecture">
      <p>Look at the small cases. What pattern do you notice? Write it in one or two sentences.</p>
      <textarea
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. It seems that … exactly when …"
        data-testid="conjecture-input"
      />
      <div className="actions">
        <Button variant="primary" disabled={!text.trim()} busy={busy} onClick={() => void submit()} data-testid="check-conjecture">
          Check my conjecture
        </Button>
      </div>
      {error && <ErrorBox message={error} onRetry={() => void submit()} />}
      {feedback && (
        <div className="feedback-box" data-testid="conjecture-feedback">
          <Pill tone={tone[feedback.verdict]}>{feedback.verdict}</Pill> <MathText text={feedback.feedback} />
          {feedback.nudge && (
            <p className="self-question">
              <MathText text={feedback.nudge} />
            </p>
          )}
          {hints.conjecture?.check && <CheckResult run={hints.conjecture.check} />}
        </div>
      )}
    </div>
  );
}
