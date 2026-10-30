import { useEffect, useState } from 'react';
import type { HintStage } from '../../../shared/api';
import type { HintTool } from '../../../shared/schemas';
import { GeoFigure } from '../../components/GeoFigure';
import { MathText } from '../../components/MathText';
import { Details, ErrorBox, Pill, Spinner } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { runTable } from '../../lib/sandbox';
import { problemText } from '../../session/problem';
import type { Hints, Session } from '../../session/types';
import type { Updater } from '../../session/useSession';

type Tool = Exclude<HintTool, 'none'>;

const STAGE: Record<Tool, HintStage> = { simple_words: 1, given_wanted: 2, small_cases: 3, method: 5, skeleton: 6 };
const KEY: Record<Tool, keyof Hints> = {
  simple_words: 'simple',
  given_wanted: 'givenWanted',
  small_cases: 'smallCases',
  method: 'method',
  skeleton: 'skeleton',
};
const TITLE: Record<Tool, string> = {
  simple_words: 'In simple words',
  given_wanted: 'Given / wanted',
  small_cases: 'Small cases',
  method: 'A method that could help',
  skeleton: 'Proof skeleton (no content)',
};

/** Tools are loaded once per problem, even if several tips attach them. */
const loading = new Map<string, Promise<void>>();

/** A tool attached to a tip: loaded on first use and kept with the problem. */
export function HintToolView({ tool, session, update }: { tool: Tool; session: Session; update: Updater }) {
  const data = session.hints[KEY[tool]];
  const [error, setError] = useState('');

  const load = () => {
    const key = `${session.id}:${tool}`;
    let pending = loading.get(key);
    if (!pending) {
      const problem = problemText(session.problem!);
      pending = (async () => {
        const result = await api.hint(problem, STAGE[tool]);
        if (tool === 'small_cases') {
          const cases = result as NonNullable<Hints['smallCases']>;
          // Figures are drawn (and re-run on every drag) by GeoFigure itself.
          const { table, error: tableError } = cases.kind === 'figure' ? {} : await runTable(cases.code);
          update((d) => {
            d.hints.smallCases = { ...cases, table, tableError };
          });
        } else {
          update((d) => {
            (d.hints as Record<string, unknown>)[KEY[tool]] = result;
          });
        }
      })().finally(() => loading.delete(key));
      loading.set(key, pending);
    }
    setError('');
    pending.catch((err) => setError(errorMessage(err)));
  };

  useEffect(() => {
    if (!data) load();
    // Only the tool decides what to load; data arriving must not trigger a reload.
  }, [tool]);

  const title = tool === 'small_cases' && session.hints.smallCases?.kind === 'figure' ? 'Experiment with the figure' : TITLE[tool];
  return (
    <div className="tool-card" data-testid={`tool-${tool}`}>
      <h4>{title}</h4>
      {error ? <ErrorBox message={error} onRetry={load} /> : !data ? <Spinner label="Preparing…" /> : <ToolContent tool={tool} hints={session.hints} />}
    </div>
  );
}

function ToolContent({ tool, hints }: { tool: Tool; hints: Hints }) {
  switch (tool) {
    case 'simple_words': {
      const h = hints.simple!;
      return (
        <>
          <MathText text={h.explanation} block />
          {h.glossary.length > 0 && (
            <dl className="glossary">
              {h.glossary.map((g, i) => (
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
      );
    }
    case 'given_wanted': {
      const h = hints.givenWanted!;
      return (
        <div className="given-wanted">
          <div>
            <h4>Given</h4>
            <ul>
              {h.given.map((g, i) => (
                <li key={i}>
                  <MathText text={g} />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Wanted</h4>
            <ul>
              {h.wanted.map((w, i) => (
                <li key={i}>
                  <MathText text={w} />
                </li>
              ))}
            </ul>
          </div>
          {h.notes && (
            <p className="note">
              <MathText text={h.notes} />
            </p>
          )}
        </div>
      );
    }
    case 'small_cases': {
      const h = hints.smallCases!;
      return (
        <>
          <MathText text={h.intro} block />
          {h.kind === 'figure' ? (
            <GeoFigure code={h.code} initial={h.free_points} testId="figure" />
          ) : h.table ? (
            <div className="table-wrap">
              <table className="cases" data-testid="cases-table">
                <thead>
                  <tr>
                    {h.table.columns.map((c, i) => (
                      <th key={i}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {h.table.rows.map((row, i) => (
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
            <ErrorBox message={`The table could not be computed: ${h.tableError ?? 'unknown error'}`} />
          )}
          {h.what_to_look_for && (
            <p className="self-question">
              <MathText text={h.what_to_look_for} />
            </p>
          )}
          <Details summary={h.kind === 'figure' ? 'Show the code that draws this figure' : 'Show the code that computed this table'}>
            <pre className="code">{h.code}</pre>
          </Details>
        </>
      );
    }
    case 'method': {
      const h = hints.method!;
      return (
        <>
          <p>
            <Pill tone="accent">{h.method}</Pill>
          </p>
          <p className="principle">
            <MathText text={h.principle_sentence} />
          </p>
          <MathText text={h.why_here} block />
          {h.self_question && (
            <p className="self-question">
              Ask yourself: <MathText text={h.self_question} />
            </p>
          )}
        </>
      );
    }
    case 'skeleton':
      return (
        <ol className="skeleton">
          {hints.skeleton!.parts.map((p, i) => (
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
      );
  }
}
