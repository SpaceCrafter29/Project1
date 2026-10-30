import { useState } from 'react';
import type { ChatTurn } from '../../../shared/api';
import type { StepStatusValue } from '../../../shared/schemas';
import { scoreRange } from '../../../shared/verdict';
import { ChatThread } from '../../components/ChatThread';
import { CheckResult } from '../../components/CheckResult';
import { MathText } from '../../components/MathText';
import { Button, Card, Details, GradeMark, Pill, StatusBadge } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { runCheck } from '../../lib/sandbox';
import type { Attempt, StepReview } from '../../session/types';
import { finalVerdict, type AttemptUpdater } from './assess';

export function AssessmentView({
  problem,
  attempt,
  updateAttempt,
}: {
  problem: string;
  attempt: Attempt;
  updateAttempt: AttemptUpdater;
}) {
  const assessment = attempt.assessment!;
  const finals = assessment.steps.map(finalVerdict);
  const range = scoreRange(
    assessment.score,
    assessment.steps.map((s, i) => ({ firstPass: s.evaluated, final: finals[i] })),
  );
  const counts = finals.reduce(
    (acc, f) => ({ ...acc, [f.status]: acc[f.status] + 1 }),
    { valid: 0, gap: 0, error: 0, unclear: 0 } as Record<StepStatusValue, number>,
  );

  return (
    <div className="stack" data-testid="assessment">
      <Card className="score-card">
        <GradeMark value={range.low === range.high ? String(range.low) : `${range.low}–${range.high}`} testId="score" />
        <div>
          <p className="muted small">
            Estimated olympiad score{range.low !== range.high && ' – the range depends on the steps marked unclear'}
          </p>
          <MathText text={assessment.summary} block />
          <p className="legend">
            <span className="tally tally-valid">✓ {counts.valid} valid</span>
            <span className="tally tally-gap">? {counts.gap} gap</span>
            <span className="tally tally-error">✗ {counts.error} error</span>
            <span className="tally tally-unclear">~ {counts.unclear} unclear</span>
          </p>
          {assessment.ideaUsed && assessment.ideaUsed !== 'n/a' && (
            <p className="idea-used" data-testid="idea-used">
              <strong>Did you use the idea?</strong> <Pill tone={assessment.ideaUsed === 'yes' ? 'good' : 'warn'}>{assessment.ideaUsed}</Pill>{' '}
              <MathText text={assessment.ideaComment ?? ''} />
            </p>
          )}
        </div>
      </Card>
      <p className="muted small">
        A step is only marked as a gap or an error when the coach quotes it, gives concrete evidence, and an independent
        second check could not defend it. Everything doubtful is marked <em>unclear</em>.
      </p>
      <ol className="step-reviews">
        {attempt.steps.map((step, i) => {
          const review = assessment.steps.find((r) => r.stepId === step.id);
          if (!review) return null;
          return (
            <StepReviewCard
              key={step.id}
              index={i}
              stepText={step.text}
              review={review}
              problem={problem}
              attempt={attempt}
              updateReview={(fn) =>
                updateAttempt((d) => {
                  const r = d.assessment!.steps.find((x) => x.stepId === step.id)!;
                  fn(r as StepReview);
                })
              }
            />
          );
        })}
      </ol>
    </div>
  );
}

function StepReviewCard({
  index,
  stepText,
  review,
  problem,
  attempt,
  updateReview,
}: {
  index: number;
  stepText: string;
  review: StepReview;
  problem: string;
  attempt: Attempt;
  updateReview: (fn: (r: StepReview) => void) => void;
}) {
  const final = finalVerdict(review);
  const ev = review.evaluated;
  const [open, setOpen] = useState(review.discussion.length > 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const send = async (text: string) => {
    setBusy(true);
    setError('');
    let history: ChatTurn[] = [...review.discussion, { role: 'user', text }];
    updateReview((r) => {
      r.discussion.push({ role: 'user', text });
    });
    const critique = { status: ev.status, reason: ev.reason, quote: ev.quote, evidence: ev.evidence };
    try {
      // At most one automatic follow-up after a code check, so the coach can interpret the result.
      for (let round = 0; round < 2; round++) {
        const reply = await api.discuss({ problem, steps: attempt.steps, stepId: review.stepId, critique, history });
        history = [...history, { role: 'coach', text: reply.reply }];
        updateReview((r) => {
          r.discussion.push({ role: 'coach', text: reply.reply });
          if (reply.outcome !== 'clarify') r.discussionOutcome = reply.outcome;
          if (reply.outcome === 'open') r.openPoint = reply.open_point;
        });
        if (!reply.check_code || round > 0) break;
        const check = await runCheck(reply.check_claim || 'Disputed claim', reply.check_code, 'discussion');
        const verdict = !check.outcome.ran ? 'could not be tested' : check.outcome.holds ? 'holds in all tested cases' : 'counterexample found';
        const checkText = `${check.claim}: ${verdict}. ${check.outcome.detail}`;
        history = [...history, { role: 'check', text: checkText }];
        updateReview((r) => {
          r.discussion.push({ role: 'check', text: checkText });
        });
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className={`step-review status-${final.status}`} data-testid={`review-${index + 1}`}>
      <div className="step-review-student">
        <span className="step-label">{index + 1}.</span>
        <MathText text={stepText} block className="step-text" />
      </div>
      <div className="step-review-margin">
        <StatusBadge status={final.status} />
        {(final.status === 'gap' || final.status === 'error') && ev.quote && (
          <p className="quote">
            “<MathText text={ev.quote} />”
          </p>
        )}
        <MathText text={final.reason} block />
        {(final.status === 'gap' || final.status === 'error') && ev.evidence && (
          <p className="evidence">
            <strong>Evidence:</strong> <MathText text={ev.evidence} />
          </p>
        )}
        {final.status === 'unclear' && (
          <p className="muted small">The coach is not sure here. Please check this step yourself, or discuss it.</p>
        )}
        {review.check && <CheckResult run={review.check} compact />}
        <Details summary="Check details" testId="check-details">
          <ul className="notes">
            <li>First reading: {ev.status}</li>
            {final.notes.map((n, i) => (
              <li key={i}>
                <MathText text={n} />
              </li>
            ))}
          </ul>
          {review.check && (
            <pre className="code" aria-label="Code used for the check">
              {review.check.code}
            </pre>
          )}
        </Details>
        {!open && (
          <div className="actions">
            {final.status !== 'valid' ? (
              <Button variant="ghost" onClick={() => setOpen(true)} data-testid="disagree">
                I think my step is right
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setOpen(true)}>
                Ask about this step
              </Button>
            )}
          </div>
        )}
      </div>
      {open && (
        <div className="discussion">
          <p className="muted small">
            Discuss as equals: explain what you meant. The coach judges only by mathematics – and will say so if you
            are right.
          </p>
          <ChatThread
            messages={review.discussion}
            onSend={(t) => void send(t)}
            busy={busy}
            error={error}
            placeholder="Explain what you meant in this step…"
            testId="discussion"
          />
        </div>
      )}
    </li>
  );
}
