import { useEffect, useMemo, useRef, useState } from 'react';
import type { SolutionStep } from '../../../shared/api';
import { parseParts } from '../../../shared/parts';
import { CheckResult } from '../../components/CheckResult';
import { ImageInput } from '../../components/ImageInput';
import { MathText } from '../../components/MathText';
import { Button, Card, Details, ErrorBox, Spinner, Taped } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { demoSample, isDemo, useConfig } from '../../lib/config';
import { runCheck } from '../../lib/sandbox';
import { problemText } from '../../session/problem';
import type { CoachingRound } from '../../session/types';
import { uid } from '../../session/useSession';
import { newAttempt } from '../attempt/assess';
import { ProblemCard } from '../problem/ProblemCard';
import type { StageProps } from '../SessionView';
import { HintToolView } from './HintTool';

const LEVEL = { 1: 'a direction', 2: 'more concrete', 3: 'very concrete' } as const;

/** Parts whose first tip is being requested, so a remount does not ask twice. */
const openingInFlight = new Set<string>();

/**
 * The tip loop: one tip, work on paper, photograph the progress, get the next tip –
 * made for exactly where the student is – until they submit a full solution.
 * Problems with parts (a), (b), … get one loop per part.
 */
export function WorkStage({ session, update, go }: StageProps) {
  const config = useConfig();
  const problem = problemText(session.problem!);
  const { parts } = useMemo(() => parseParts(session.problem!.transcript), [session.problem]);
  const multi = parts.length >= 2;
  const allRounds = session.coaching ?? [];
  const partOf = (r: CoachingRound) => r.part ?? (multi ? parts[0].label : '');
  const lastOf = (label: string) => allRounds.filter((r) => partOf(r) === label).at(-1);
  const done = session.partsDone ?? [];
  const active = !multi
    ? ''
    : parts.some((p) => p.label === session.activePart)
      ? session.activePart!
      : (parts.find((p) => !done.includes(p.label)) ?? parts[parts.length - 1]).label;
  const activeIndex = parts.findIndex((p) => p.label === active);
  const activePart = multi ? parts[activeIndex] : null;
  const nextPart = multi ? parts[activeIndex + 1] : undefined;
  const rounds = allRounds.filter((r) => partOf(r) === active);
  const last = rounds[rounds.length - 1];
  const [images, setImages] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [draft, setDraft] = useState<{ steps: SolutionStep[]; unreadable: string[] } | null>(null);
  const [busy, setBusy] = useState<'read' | 'tip' | null>(null);
  const [error, setError] = useState('');
  const latestTip = useRef<HTMLLIElement>(null);

  const requestTip = async (progressImages: string[], steps: SolutionStep[]) => {
    setBusy('tip');
    setError('');
    try {
      const hint = await api.nextHint({
        problem,
        progress: steps,
        previousProgress: last?.steps ?? [],
        note: note.trim(),
        history: rounds.map((r) => ({ hint: r.hint.hint, level: r.hint.level })),
        part: activePart,
        earlierParts: parts.slice(0, Math.max(0, activeIndex)).map((p) => ({
          label: p.label,
          work: (lastOf(p.label)?.steps ?? []).map((s) => s.text),
        })),
      });
      const check = hint.check_code ? await runCheck(hint.check_claim || 'A claim in your work', hint.check_code, 'tip') : undefined;
      const round: CoachingRound = {
        id: uid('r_'),
        createdAt: Date.now(),
        part: active,
        images: progressImages,
        steps,
        note: note.trim(),
        hint,
        check,
      };
      update((d) => {
        d.coaching = [...(d.coaching ?? []), round];
      });
      setImages([]);
      setNote('');
      setDraft(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    const key = `${session.id}:${active}`;
    if (rounds.length > 0 || openingInFlight.has(key)) return;
    openingInFlight.add(key);
    void requestTip([], []).finally(() => openingInFlight.delete(key));
  }, [session.id, active]);

  const switchPart = (label: string) => {
    setDraft(null);
    setImages([]);
    setNote('');
    setError('');
    update((d) => {
      d.activePart = label;
    });
  };

  const finishPart = () => {
    update((d) => {
      d.partsDone = [...new Set([...(d.partsDone ?? []), active])];
    });
    if (nextPart) switchPart(nextPart.label);
  };

  useEffect(() => {
    if (rounds.length > 1) latestTip.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [rounds.length]);

  const readProgress = async () => {
    setBusy('read');
    setError('');
    try {
      const result = await api.recognize({ problem, images, partial: true });
      setDraft({ steps: result.steps.map((s, i) => ({ id: `s${i + 1}`, text: s.text })), unreadable: result.unreadable });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const confirmDraft = () => {
    if (!draft) return;
    const steps = draft.steps.filter((s) => s.text.trim()).map((s, i) => ({ id: `s${i + 1}`, text: s.text.trim() }));
    void requestTip(images, steps);
  };

  /**
   * A complete attempt from the loop goes straight to the full check, without photographing
   * it again. With parts, the latest work on every part is combined.
   */
  const submitRound = (round: CoachingRound) => {
    const sources = multi ? parts.map((p) => lastOf(p.label)).filter((r): r is CoachingRound => !!r) : [round];
    const attempt = newAttempt(
      [...new Set(sources.flatMap((r) => r.images))],
      sources.flatMap((r) => r.steps).map((s) => ({ text: s.text, unclear: false })),
      [],
    );
    attempt.confirmed = true;
    update((d) => {
      if (d.attempt) d.pastAttempts.push(d.attempt);
      d.attempt = attempt;
      d.correction = null;
    });
    go('feedback');
  };

  return (
    <div className="stack">
      <ProblemCard problem={session.problem!} />
      {multi && activePart && (
        <div className="part-focus" data-testid="part-focus">
          <nav className="part-tabs" aria-label="Parts of the problem">
            {parts.map((p) => (
              <button
                key={p.label}
                type="button"
                className={`part-tab ${p.label === active ? 'active' : ''} ${done.includes(p.label) ? 'done' : ''}`}
                aria-current={p.label === active ? 'step' : undefined}
                onClick={() => switchPart(p.label)}
                data-testid={`part-${p.label}`}
              >
                Part ({p.label}){done.includes(p.label) ? ' ✓' : ''}
              </button>
            ))}
          </nav>
          <div className="part-statement">
            <span className="part-label">({activePart.label})</span>
            <MathText text={activePart.text} />
          </div>
        </div>
      )}
      <p className="lead">
        Work on paper as far as you can. Whenever you are stuck – or want to know whether you are on track – photograph
        your work. The next tip is made for exactly where you are, and it never gives the answer away.
      </p>

      <ol className="tip-loop">
        {rounds.map((r, i) => {
          const focus = r.hint.focus_step ? r.steps.find((s) => s.id === r.hint.focus_step) : undefined;
          return (
            <li key={r.id} className="tip-round" ref={i === rounds.length - 1 ? latestTip : undefined} data-testid={`tip-${i + 1}`}>
              {(r.images.length > 0 || r.note) && (
                <div className="tip-progress">
                  <span className="tip-who">{r.images.length > 0 ? 'Your progress' : 'You'}</span>
                  {r.images.length > 0 && (
                    <div className="tip-photos">
                      {r.images.map((src, j) => (
                        <Taped key={j}>
                          <img src={src} alt={`Progress, page ${j + 1}`} />
                        </Taped>
                      ))}
                    </div>
                  )}
                  {r.note && <p className="tip-note">“{r.note}”</p>}
                  {r.steps.length > 0 && r.images.length > 0 && (
                    <Details summary={`What the coach read (${r.steps.length} lines)`}>
                      <ol className="steps-plain">
                        {r.steps.map((s) => (
                          <li key={s.id}>
                            <MathText text={s.text} />
                          </li>
                        ))}
                      </ol>
                    </Details>
                  )}
                </div>
              )}
              <div className={`tip-card status-${r.hint.status}`}>
                <div className="tip-head">
                  <span className="tip-title">Tip {i + 1}</span>
                  <span className="tip-level">{LEVEL[r.hint.level as 1 | 2 | 3] ?? ''}</span>
                </div>
                {r.hint.progress && (
                  <p className="tip-ack">
                    <MathText text={r.hint.progress} />
                  </p>
                )}
                {focus && (
                  <blockquote className="tip-focus">
                    <MathText text={focus.text} />
                  </blockquote>
                )}
                <MathText text={r.hint.hint} block className="tip-text" />
                {r.hint.question && (
                  <p className="self-question">
                    <MathText text={r.hint.question} />
                  </p>
                )}
                {r.check && <CheckResult run={r.check} compact />}
                {r.hint.tool !== 'none' && <HintToolView tool={r.hint.tool} session={session} update={update} />}
                {r.hint.status === 'complete' && r.images.length > 0 && i === rounds.length - 1 && (
                  <div className="actions">
                    <Button variant="primary" onClick={() => submitRound(r)} data-testid="submit-from-tip">
                      Check this as my final solution
                    </Button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {rounds.length === 0 && (
        <Card title={multi ? `Your first tip for part (${active})` : 'Your first tip'}>
          {error ? (
            <ErrorBox message={error} onRetry={() => void requestTip([], [])} />
          ) : (
            <Spinner label="Reading the problem and preparing a first tip…" />
          )}
        </Card>
      )}

      {rounds.length > 0 && (
        <Card title={multi ? `Your turn – part (${active})` : 'Your turn'} className="your-turn" testId="your-turn">
          {draft ? (
            <div data-testid="progress-confirm">
              <p className="muted">Did I read your work correctly? Fix reading errors only – the tip is based on this.</p>
              <ol className="step-editor">
                {draft.steps.map((s, i) => (
                  <li key={s.id}>
                    <div className="step-editor-head">
                      <span className="step-label">Line {i + 1}</span>
                      <span className="step-tools">
                        <button
                          type="button"
                          className="link"
                          onClick={() => setDraft({ ...draft, steps: draft.steps.filter((x) => x.id !== s.id) })}
                        >
                          delete
                        </button>
                      </span>
                    </div>
                    <textarea
                      value={s.text}
                      rows={Math.max(1, Math.ceil(s.text.length / 70))}
                      onChange={(e) =>
                        setDraft({ ...draft, steps: draft.steps.map((x) => (x.id === s.id ? { ...x, text: e.target.value } : x)) })
                      }
                    />
                    <MathText text={s.text} block className="step-preview" />
                  </li>
                ))}
              </ol>
              {draft.unreadable.length > 0 && (
                <div className="uncertain">
                  <strong>Parts I could not read:</strong> {draft.unreadable.join(' · ')}
                </div>
              )}
            </div>
          ) : (
            <>
              <p>Photograph what you have so far – computations, sketches, half-finished ideas all count.</p>
              <ImageInput
                images={images}
                onChange={setImages}
                max={6}
                testId="progress-images"
                samples={
                  isDemo(config) ? [{ label: 'Use sample progress', url: demoSample('progress', session.problem!.topic) }] : []
                }
              />
            </>
          )}
          <label className="field">
            <span>Anything to add? (optional)</span>
            <textarea
              value={note}
              rows={2}
              placeholder="e.g. I'm stuck at … / I don't understand what … means"
              onChange={(e) => setNote(e.target.value)}
              data-testid="tip-note"
            />
          </label>
          {error && <ErrorBox message={error} />}
          <div className="actions">
            {draft ? (
              <>
                <Button variant="primary" busy={busy === 'tip'} onClick={confirmDraft} data-testid="next-tip">
                  Looks right – give me the next tip
                </Button>
                <Button variant="ghost" onClick={() => setDraft(null)}>
                  Use other photos
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="primary"
                  disabled={images.length === 0}
                  busy={busy === 'read'}
                  onClick={() => void readProgress()}
                  data-testid="read-progress"
                >
                  Read my progress
                </Button>
                <Button busy={busy === 'tip'} onClick={() => void requestTip([], last?.steps ?? [])} data-testid="tip-without-photo">
                  Tip without a new photo
                </Button>
              </>
            )}
            {nextPart && (
              <Button variant="ghost" onClick={finishPart} data-testid="next-part">
                Part ({active}) done – on to ({nextPart.label})
              </Button>
            )}
            <Button variant="ghost" onClick={() => go('solution')} data-testid="go-solve">
              I'm done – check my full solution
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
