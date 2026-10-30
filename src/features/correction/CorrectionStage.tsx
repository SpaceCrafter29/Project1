import { useState } from 'react';
import { MathText } from '../../components/MathText';
import { Button, Card, ErrorBox, Pill, Spinner, StatusBadge } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { finalVerdict } from '../attempt/assess';
import type { StageProps } from '../SessionView';

const WORKS = {
  yes: { label: 'Yes, it carries', tone: 'good' },
  partly: { label: 'Partly – needs a repair', tone: 'warn' },
  no: { label: 'No, not as it stands', tone: 'bad' },
} as const;

export function CorrectionStage({ session, update, go }: StageProps) {
  const attempt = session.attempt!;
  const problem = session.problem!.transcript;
  const correction = session.correction;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const verdicts = attempt.assessment!.steps.map((r) => {
    const f = finalVerdict(r);
    return { stepId: r.stepId, status: f.status, reason: f.reason };
  });

  const load = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await api.correct({ problem, steps: attempt.steps, verdicts });
      update((d) => {
        d.correction = { approaches: result.approaches, revealed: result.approaches.map(() => 0) };
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!correction) {
    return (
      <Card title="Fix your approach">
        <p>
          The coach works on <em>your</em> way – it does not start a different solution. For each approach you used you
          will see whether it carries, where it breaks, and the smallest repair, as hints you reveal step by step.
        </p>
        {error && <ErrorBox message={error} onRetry={() => void load()} />}
        <div className="actions">
          {busy ? (
            <Spinner label="Looking at your approach…" />
          ) : (
            <Button variant="primary" onClick={() => void load()} data-testid="load-correction">
              Analyze my approach
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="stack">
      <p className="lead">Every correct way is a good way – no matter how long or unusual. Here is how to make yours work.</p>
      {correction.approaches.map((a, i) => {
        const stepIndex = a.fails_at ? attempt.steps.findIndex((s) => s.id === a.fails_at) : -1;
        const step = stepIndex >= 0 ? attempt.steps[stepIndex] : null;
        const verdict = verdicts.find((v) => v.stepId === a.fails_at);
        const confirmed = verdict && (verdict.status === 'gap' || verdict.status === 'error');
        const revealed = correction.revealed[i] ?? 0;
        return (
          <Card key={i} title={<MathText text={a.name} />} testId={`approach-${i + 1}`}>
            <div className="approach-row">
              <h4>Does the approach carry?</h4>
              <p>
                <Pill tone={WORKS[a.approach_works].tone}>{WORKS[a.approach_works].label}</Pill>{' '}
                <MathText text={a.works_why} />
              </p>
            </div>
            {step && (
              <div className="approach-row">
                <h4>Where does it break?</h4>
                <p>
                  At <strong>step {stepIndex + 1}</strong> {verdict && <StatusBadge status={verdict.status} />}
                </p>
                <blockquote>
                  <MathText text={step.text} />
                </blockquote>
                <MathText text={a.fails_why} block />
                {!confirmed && (
                  <p className="muted small">
                    This step was not confirmed as wrong by the independent check – treat this as a doubt, not a verdict.
                  </p>
                )}
                <Button variant="ghost" onClick={() => go('feedback')}>
                  I disagree – discuss this step
                </Button>
              </div>
            )}
            {a.fix_hints.length > 0 && (
              <div className="approach-row">
                <h4>How to repair it</h4>
                {a.fix_hints.slice(0, revealed).map((h, j) => (
                  <p key={j} className="fix-hint">
                    <span className="muted small">{j === 0 ? 'Direction' : 'Detail'}:</span> <MathText text={h} />
                  </p>
                ))}
                {revealed < a.fix_hints.length && (
                  <Button
                    onClick={() =>
                      update((d) => {
                        d.correction!.revealed[i] = revealed + 1;
                      })
                    }
                    data-testid={`reveal-fix-${i + 1}`}
                  >
                    {revealed === 0 ? 'Show the direction' : 'Show more detail'}
                  </Button>
                )}
              </div>
            )}
          </Card>
        );
      })}
      <div className="actions">
        <Button variant="primary" onClick={() => go('solution')}>
          Write an improved version
        </Button>
        <Button onClick={() => go('learn')}>See other approaches</Button>
        <Button variant="ghost" busy={busy} onClick={() => void load()}>
          Analyze again
        </Button>
      </div>
      {error && <ErrorBox message={error} />}
    </div>
  );
}
