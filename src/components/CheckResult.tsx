import type { CheckRun } from '../session/types';
import { MathText } from './MathText';
import { Details } from './ui';

/** Shows the outcome of a code check, with the code behind a disclosure. */
export function CheckResult({ run, compact = false }: { run: CheckRun; compact?: boolean }) {
  const { outcome } = run;
  const state = !outcome.ran ? 'skipped' : outcome.holds ? 'holds' : 'fails';
  const label = { holds: 'Holds in all tested cases', fails: 'Counterexample found', skipped: 'Could not be tested' }[state];
  return (
    <div className={`check check-${state}`} data-testid="check-result">
      <div className="check-head">
        <span className="check-icon" aria-hidden>
          {state === 'holds' ? '✓' : state === 'fails' ? '✗' : '?'}
        </span>
        <span>
          <strong>Code check:</strong> <MathText text={run.claim} /> — {label}
        </span>
      </div>
      {outcome.detail && <p className="check-detail">{outcome.detail}</p>}
      {!compact && (
        <Details summary="Show code">
          <pre className="code">{run.code}</pre>
        </Details>
      )}
    </div>
  );
}
