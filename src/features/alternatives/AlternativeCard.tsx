import { useState } from 'react';
import type { AlternativeDecision } from '../../../shared/alternatives';
import type { ChatTurn } from '../../../shared/api';
import { ChatThread } from '../../components/ChatThread';
import { CheckResult } from '../../components/CheckResult';
import { MarkableSteps } from '../../components/MarkableSteps';
import { MathText } from '../../components/MathText';
import { Button, Card, Details, ErrorBox, Pill, Spinner } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { isDemo, useConfig } from '../../lib/config';
import { runCheck } from '../../lib/sandbox';
import type { Alternative, CheckRun } from '../../session/types';
import { uid } from '../../session/useSession';
import { AssessmentView } from '../attempt/AssessmentView';
import { AttemptCapture } from '../attempt/AttemptCapture';
import { assessAttempt, type AttemptUpdater } from '../attempt/assess';
import { RunAssessment } from '../attempt/FeedbackStage';

type AltUpdater = (fn: (a: Alternative) => void) => void;

const CHALLENGE = "That's not right?";

export function AlternativeCard({
  alt,
  decision,
  problem,
  updateAlt,
}: {
  alt: Alternative;
  decision?: AlternativeDecision;
  problem: string;
  updateAlt: AltUpdater;
}) {
  const develop = async () => {
    updateAlt((a) => {
      Object.assign(a, { state: 'developing', error: undefined, expanded: true, developed: undefined, checks: [], challenges: {}, threads: [] });
    });
    try {
      const developed = await api.develop({ problem, idea: alt.idea });
      updateAlt((a) => {
        a.state = 'checking';
        a.developed = developed;
      });
      const specs = [
        ...developed.solution.checks.map((c) => ({ ...c, source: 'solver' as const })),
        ...developed.verification.checks.map((c) => ({ ...c, source: 'verifier' as const })),
      ];
      const checks = await Promise.all(specs.map((s) => runCheck(s.claim, s.code, s.source)));
      updateAlt((a) => {
        a.checks = checks;
        a.state = 'done';
      });
    } catch (err) {
      updateAlt((a) => {
        a.state = 'failed';
        a.error = errorMessage(err);
      });
    }
  };

  const toggle = () => {
    if (!alt.expanded && alt.state === 'idle') void develop();
    else
      updateAlt((a) => {
        a.expanded = !a.expanded;
      });
  };

  return (
    <li className={`alt-card ${alt.expanded ? 'open' : ''}`} data-testid="alternative">
      <div className="alt-head">
        <div>
          <Pill tone="accent">{alt.idea.principle}</Pill>
          <p className="alt-one-liner">
            <MathText text={alt.idea.one_liner} />
          </p>
        </div>
        <Button variant={alt.expanded ? 'ghost' : 'primary'} onClick={toggle} data-testid="toggle-alternative">
          {alt.expanded ? 'Hide' : 'Show this approach'}
        </Button>
      </div>
      {alt.expanded && (
        <div className="alt-body">
          {(alt.state === 'developing' || alt.state === 'checking') && (
            <Spinner
              label={alt.state === 'developing' ? 'Writing a complete solution and checking it independently…' : 'Testing its claims with code…'}
            />
          )}
          {alt.state === 'failed' && <ErrorBox message={alt.error ?? 'Failed'} onRetry={() => void develop()} />}
          {alt.state === 'done' && decision?.verdict === 'discarded' && (
            <div className="discarded" data-testid="alternative-discarded">
              <p>
                This idea could not be turned into a solution that passed our checks, so no solution is shown. The idea
                itself may still be worth thinking about.
              </p>
              <Details summary="Check details">
                <ul className="notes">
                  {decision.reasons.map((r, i) => (
                    <li key={i}>
                      <MathText text={r} />
                    </li>
                  ))}
                </ul>
              </Details>
              <Button onClick={() => void develop()}>Try again</Button>
            </div>
          )}
          {alt.state === 'done' && decision && decision.verdict !== 'discarded' && (
            <SolutionView alt={alt} decision={decision} problem={problem} updateAlt={updateAlt} />
          )}
        </div>
      )}
    </li>
  );
}

function SolutionView({
  alt,
  decision,
  problem,
  updateAlt,
}: {
  alt: Alternative;
  decision: AlternativeDecision;
  problem: string;
  updateAlt: AltUpdater;
}) {
  const { solution, verification, repaired } = alt.developed!;
  const steps = solution.steps;
  const plainSteps = steps.map((s) => ({ id: s.id, text: s.justification ? `${s.text} (because: ${s.justification})` : s.text }));
  const [penMode, setPenMode] = useState(false);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [busyThread, setBusyThread] = useState<string | null>(null);
  const [threadError, setThreadError] = useState('');
  const [challenge, setChallenge] = useState<{ stepId: string; concern: string } | null>(null);
  const [challengeBusy, setChallengeBusy] = useState(false);
  const [challengeError, setChallengeError] = useState('');

  const openThread = (stepIds: string[]) => {
    const key = [...stepIds].sort().join(',');
    const existing = alt.threads.find((t) => [...t.stepIds].sort().join(',') === key);
    if (existing) {
      setActiveThread(existing.id);
      return;
    }
    const id = uid('t_');
    updateAlt((a) => {
      a.threads.push({ id, stepIds, messages: [] });
    });
    setActiveThread(id);
    setPenMode(false);
  };

  const ask = async (threadId: string, question: string) => {
    const thread = alt.threads.find((t) => t.id === threadId)!;
    const history: ChatTurn[] = thread.messages;
    setBusyThread(threadId);
    setThreadError('');
    updateAlt((a) => {
      a.threads.find((t) => t.id === threadId)!.messages.push({ role: 'user', text: question });
    });
    try {
      const reply = await api.ask({
        problem,
        question,
        history,
        context: {
          kind: 'text',
          marked: plainSteps.filter((s) => thread.stepIds.includes(s.id)),
          solution: plainSteps,
        },
      });
      updateAlt((a) => {
        a.threads.find((t) => t.id === threadId)!.messages.push({ role: 'coach', text: reply.answer });
      });
    } catch (err) {
      setThreadError(errorMessage(err));
    } finally {
      setBusyThread(null);
    }
  };

  /** Re-checks one step independently (spec D); code can overrule the verdict into "unclear". */
  const challengeStep = async (stepId: string, concern: string) => {
    const result = await api.challenge({ problem, solution: plainSteps, stepId, concern });
    let check: CheckRun | undefined;
    if (result.check_code) check = await runCheck(result.check_claim || 'Claim of this step', result.check_code, 'challenge');
    const holds = check?.outcome.ran ? check.outcome.holds : null;
    let final = result.verdict;
    if (final === 'step_flawed' && holds === true) final = 'unclear';
    if (final === 'step_valid' && holds === false) final = 'unclear';
    updateAlt((a) => {
      a.challenges[stepId] = { concern, result, check, final };
    });
    return { final, explanation: result.explanation };
  };

  const runChallenge = async () => {
    if (!challenge) return;
    setChallengeBusy(true);
    setChallengeError('');
    try {
      await challengeStep(challenge.stepId, challenge.concern);
      setChallenge(null);
    } catch (err) {
      setChallengeError(errorMessage(err));
    } finally {
      setChallengeBusy(false);
    }
  };

  /** "That's not right?" on a pen marking: re-check every marked step and answer in the thread. */
  const challengeThread = async (threadId: string, concern: string) => {
    const thread = alt.threads.find((t) => t.id === threadId)!;
    setBusyThread(threadId);
    setThreadError('');
    updateAlt((a) => {
      a.threads.find((t) => t.id === threadId)!.messages.push({ role: 'user', text: concern });
    });
    try {
      for (const stepId of thread.stepIds) {
        const { final, explanation } = await challengeStep(stepId, concern);
        const verdict = final === 'step_valid' ? 'the step holds' : final === 'step_flawed' ? 'you are right, the step is flawed' : 'not sure';
        updateAlt((a) => {
          a.threads.find((t) => t.id === threadId)!.messages.push({ role: 'coach', text: `Re-checked ${stepId}: ${verdict}. ${explanation}` });
        });
      }
    } catch (err) {
      setThreadError(errorMessage(err));
    } finally {
      setBusyThread(null);
    }
  };

  const highlighted = alt.threads.find((t) => t.id === activeThread)?.stepIds ?? [];

  return (
    <div className="solution" data-testid="alternative-solution">
      <p className="principle">
        <strong>Principle:</strong> <MathText text={alt.idea.principle_sentence} />
      </p>
      {decision.verdict === 'unverified' && (
        <div className="unverified" data-testid="unverified">
          <Pill tone="warn">not verified</Pill>
          <ul className="notes">
            {decision.reasons
              .filter((r) => !r.startsWith('Code confirmed'))
              .map((r, i) => (
                <li key={i}>
                  <MathText text={r} />
                </li>
              ))}
          </ul>
        </div>
      )}
      {decision.verdict === 'logic_only' && (
        <p className="muted small" data-testid="logic-only">
          Only logically checked – no part of this solution could be tested numerically.
        </p>
      )}
      <div className="solution-toolbar">
        <Button variant={penMode ? 'primary' : 'secondary'} onClick={() => setPenMode((p) => !p)} data-testid="pen-mode">
          {penMode ? 'Pen on – circle steps to ask' : 'Mark with pen'}
        </Button>
      </div>
      <MarkableSteps
        steps={steps}
        penMode={penMode}
        highlighted={highlighted}
        onMark={openThread}
        renderStep={(s) => {
          const ch = alt.challenges[s.id];
          const review = verification.steps.find((v) => v.id === s.id);
          return (
            <div className="solution-step" data-testid={`alt-step-${s.id}`}>
              <div className="solution-step-main">
                <span className="step-label">{s.id}</span>
                <div>
                  <MathText text={s.text} block />
                  {s.justification && (
                    <p className="justification">
                      <MathText text={s.justification} />
                    </p>
                  )}
                  {review && review.follows !== 'yes' && (
                    <p className="step-doubt">
                      <Pill tone="warn">not fully justified</Pill>{' '}
                      <MathText text={[review.hidden_assumptions, review.comment].filter(Boolean).join(' – ')} />
                    </p>
                  )}
                </div>
              </div>
              <div className="step-tools">
                <button type="button" className="link" onClick={() => openThread([s.id])}>
                  Ask
                </button>
                <button
                  type="button"
                  className="link"
                  onClick={() => setChallenge({ stepId: s.id, concern: CHALLENGE })}
                  data-testid={`challenge-${s.id}`}
                >
                  {CHALLENGE}
                </button>
              </div>
              {challenge?.stepId === s.id && (
                <div className="challenge-form">
                  <textarea
                    rows={2}
                    value={challenge.concern}
                    onChange={(e) => setChallenge({ stepId: s.id, concern: e.target.value })}
                  />
                  <div className="actions">
                    <Button variant="primary" busy={challengeBusy} onClick={() => void runChallenge()} data-testid="send-challenge">
                      Re-check this step
                    </Button>
                    <Button variant="ghost" onClick={() => setChallenge(null)}>
                      Cancel
                    </Button>
                  </div>
                  {challengeError && <ErrorBox message={challengeError} />}
                </div>
              )}
              {ch && (
                <div className={`challenge-result challenge-${ch.final}`} data-testid="challenge-result">
                  <strong>
                    {ch.final === 'step_valid'
                      ? 'Re-checked: the step holds.'
                      : ch.final === 'step_flawed'
                        ? 'Re-checked: you are right, this step is flawed.'
                        : 'Re-checked: not sure – please think it through yourself.'}
                  </strong>{' '}
                  <MathText text={ch.result.explanation} />
                  {ch.check && <CheckResult run={ch.check} compact />}
                </div>
              )}
            </div>
          );
        }}
      />
      {alt.threads.length > 0 && (
        <div className="threads">
          {alt.threads.map((t) => (
            <Card
              key={t.id}
              className={`thread ${t.id === activeThread ? 'active' : ''}`}
              title={`Question about ${t.stepIds.join(', ')}`}
              testId="step-thread"
            >
              <ChatThread
                messages={t.messages}
                onSend={(q) => void (q === CHALLENGE ? challengeThread(t.id, q) : ask(t.id, q))}
                busy={busyThread === t.id}
                error={t.id === activeThread ? threadError : undefined}
                quickActions={t.messages.length === 0 ? ['Explain this', 'Why does this follow?', CHALLENGE] : [CHALLENGE]}
                placeholder="Ask about these steps…"
              />
            </Card>
          ))}
        </div>
      )}
      {solution.final_answer && (
        <p className="final-answer">
          <strong>Result:</strong> <MathText text={solution.final_answer} />
        </p>
      )}
      <div className="why">
        <h4>Why the idea works</h4>
        <MathText text={solution.why_it_works} block />
        <h4>When to try it</h4>
        <MathText text={solution.when_to_try} block />
      </div>
      <Details summary="Check details" testId="alt-check-details">
        <ul className="notes">
          <li>Independent review: {verification.overall}{repaired && ' (after one repair of the first draft)'}</li>
          {verification.steps
            .filter((s) => s.follows !== 'yes' || s.comment || s.hidden_assumptions)
            .map((s) => (
              <li key={s.id}>
                {s.id}: {s.follows} {s.hidden_assumptions && `– hidden assumptions: ${s.hidden_assumptions}`} {s.comment}
              </li>
            ))}
          {decision.reasons.map((r, i) => (
            <li key={`r${i}`}>
              <MathText text={r} />
            </li>
          ))}
        </ul>
        {alt.checks.map((c, i) => (
          <CheckResult key={i} run={c} />
        ))}
      </Details>
      <OwnVersion alt={alt} problem={problem} updateAlt={updateAlt} />
    </div>
  );
}

function OwnVersion({ alt, problem, updateAlt }: { alt: Alternative; problem: string; updateAlt: AltUpdater }) {
  const config = useConfig();
  const [open, setOpen] = useState(!!alt.ownAttempt);
  const attempt = alt.ownAttempt;
  const updateAttempt: AttemptUpdater = (fn) =>
    updateAlt((a) => {
      if (a.ownAttempt) fn(a.ownAttempt);
    });

  if (!open) {
    return (
      <div className="own-version">
        <p>Learned something? Write the solution with this idea yourself and let the coach check it.</p>
        <Button variant="primary" onClick={() => setOpen(true)} data-testid="own-version">
          Write my own version with this idea
        </Button>
      </div>
    );
  }

  return (
    <div className="own-version">
      <h4>Your own version</h4>
      {!attempt?.confirmed ? (
        <AttemptCapture
          problem={problem}
          attempt={attempt ?? null}
          intendedIdea={alt.idea.one_liner}
          onRecognized={(a) =>
            updateAlt((x) => {
              x.ownAttempt = a;
            })
          }
          updateAttempt={updateAttempt}
          onConfirm={() => undefined}
          onDiscard={() =>
            updateAlt((x) => {
              x.ownAttempt = undefined;
            })
          }
          sampleUrl={isDemo(config) ? '/samples/own-version.png' : undefined}
        />
      ) : !attempt.assessment ? (
        <RunAssessment
          attemptId={attempt.id}
          run={() => assessAttempt(problem, attempt)}
          onDone={(assessment) =>
            updateAttempt((d) => {
              d.assessment = assessment;
            })
          }
        />
      ) : (
        <AssessmentView problem={problem} attempt={attempt} updateAttempt={updateAttempt} />
      )}
    </div>
  );
}
