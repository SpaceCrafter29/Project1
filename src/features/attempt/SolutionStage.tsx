import { MathText } from '../../components/MathText';
import { Button, Card } from '../../components/ui';
import { isDemo, useConfig } from '../../lib/config';
import type { StageProps } from '../SessionView';
import { AttemptCapture } from './AttemptCapture';
import type { AttemptUpdater } from './assess';

export function SolutionStage({ session, update, go }: StageProps) {
  const config = useConfig();
  const problem = session.problem!.transcript;
  const attempt = session.attempt;
  const updateAttempt: AttemptUpdater = (fn) =>
    update((d) => {
      if (d.attempt) fn(d.attempt);
    });

  if (attempt?.confirmed) {
    return (
      <Card title="Your solution" testId="solution-summary">
        <ol className="steps-plain">
          {attempt.steps.map((s) => (
            <li key={s.id}>
              <MathText text={s.text} />
            </li>
          ))}
        </ol>
        <div className="actions">
          <Button variant="primary" onClick={() => go('feedback')}>
            {attempt.assessment ? 'See feedback' : 'Check my solution'}
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              update((d) => {
                if (d.attempt) d.pastAttempts.push(d.attempt);
                d.attempt = null;
                d.correction = null;
              })
            }
            data-testid="new-version"
          >
            Submit a new version
          </Button>
        </div>
        {session.pastAttempts.length > 0 && (
          <p className="muted small">Earlier versions are kept: {session.pastAttempts.length}.</p>
        )}
      </Card>
    );
  }

  return (
    <div className="stack">
      <Card title="Problem">
        <MathText text={problem} block className="problem-text" />
      </Card>
      <AttemptCapture
        problem={problem}
        attempt={attempt}
        onRecognized={(a) =>
          update((d) => {
            d.attempt = a;
          })
        }
        updateAttempt={updateAttempt}
        onConfirm={() => go('feedback')}
        onDiscard={() =>
          update((d) => {
            d.attempt = null;
          })
        }
        sampleUrl={isDemo(config) ? '/samples/solution.png' : undefined}
      />
    </div>
  );
}
