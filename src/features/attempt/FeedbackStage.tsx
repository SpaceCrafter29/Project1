import { useEffect, useRef, useState } from 'react';
import { Button, Card, ErrorBox, Spinner } from '../../components/ui';
import { errorMessage } from '../../lib/api';
import type { StageProps } from '../SessionView';
import { AssessmentView } from './AssessmentView';
import { assessAttempt, type AttemptUpdater } from './assess';

const PROGRESS = [
  'Reading each step…',
  'Double-checking every critique independently…',
  'Testing claims with code…',
];

export function FeedbackStage({ session, update, go }: StageProps) {
  const attempt = session.attempt!;
  const problem = session.problem!.transcript;
  const updateAttempt: AttemptUpdater = (fn) =>
    update((d) => {
      if (d.attempt) fn(d.attempt);
    });

  return (
    <div className="stack">
      {attempt.assessment ? (
        <>
          <AssessmentView problem={problem} attempt={attempt} updateAttempt={updateAttempt} />
          <div className="actions">
            <Button variant="primary" onClick={() => go('ask')}>
              Ask about a spot with the pen
            </Button>
            <Button onClick={() => go('fix')}>Fix your approach</Button>
            <Button onClick={() => go('learn')}>Other approaches</Button>
          </div>
        </>
      ) : (
        <RunAssessment
          attemptId={attempt.id}
          run={() => assessAttempt(problem, attempt)}
          onDone={(assessment) =>
            update((d) => {
              if (d.attempt?.id === attempt.id) d.attempt.assessment = assessment;
            })
          }
        />
      )}
    </div>
  );
}

/** Starts the evaluation pipeline once and shows progress. Reused for own versions of alternatives. */
export function RunAssessment<T>({
  attemptId,
  run,
  onDone,
}: {
  attemptId: string;
  run: () => Promise<T>;
  onDone: (result: T) => void;
}) {
  const [phase, setPhase] = useState(0);
  const [error, setError] = useState('');
  const started = useRef<string | null>(null);

  const start = () => {
    setError('');
    setPhase(0);
    const timer = setInterval(() => setPhase((p) => Math.min(p + 1, PROGRESS.length - 1)), 2500);
    run()
      .then(onDone, (err) => setError(errorMessage(err)))
      .finally(() => clearInterval(timer));
  };

  useEffect(() => {
    if (started.current === attemptId) return;
    started.current = attemptId;
    start();
  }, [attemptId]);

  return (
    <Card title="Checking your solution" testId="assessing">
      {error ? <ErrorBox message={error} onRetry={start} /> : <Spinner label={PROGRESS[phase]} />}
    </Card>
  );
}
