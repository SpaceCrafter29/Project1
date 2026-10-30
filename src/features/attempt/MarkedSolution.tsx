import type { StepStatusValue } from '../../../shared/schemas';
import { MathText } from '../../components/MathText';
import type { Attempt } from '../../session/types';

export interface StepMark {
  stepId: string;
  index: number;
  status: StepStatusValue;
  wording: number;
  improve: boolean;
}

const SYMBOL: Record<StepStatusValue, string> = { valid: '✓', gap: '?', error: '✗', unclear: '~' };

/** Scrolls to a step's comment in the same assessment (an own version has its own) and flashes it. */
function goToStep(from: HTMLElement, index: number) {
  const scope = from.closest('[data-testid="assessment"]') ?? document;
  const el = scope.querySelector<HTMLElement>(`[data-testid="review-${index + 1}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.remove('flash');
  void el.offsetWidth; // restart the animation
  el.classList.add('flash');
}

/**
 * The student's own photo, marked like a corrected paper: boxes where something is
 * wrong, missing, unclear or imprecisely worded, a tick where a step is fine.
 */
export function MarkedSolution({ attempt, marks }: { attempt: Attempt; marks: StepMark[] }) {
  const boxes = attempt.boxes ?? {};
  if (Object.keys(boxes).length === 0) return null;
  return (
    <section className="marked-solution card" data-testid="marked-solution">
      <header className="card-header">
        <h3>Your solution, marked</h3>
      </header>
      <p className="muted small">Tap a mark to jump to the comment.</p>
      {attempt.images.map((src, page) => (
        <div key={page} className="marked-page">
          <img src={src} alt={`Your solution, page ${page + 1}`} />
          {marks.map((m) => {
            const box = boxes[m.stepId];
            if (!box || box.page !== page) return null;
            const fine = m.status === 'valid' && m.wording === 0 && !m.improve;
            const kind = m.status !== 'valid' ? m.status : m.wording > 0 ? 'wording' : m.improve ? 'improve' : 'fine';
            const label = `Step ${m.index + 1}: ${m.status}${m.wording ? `, ${m.wording} wording note${m.wording > 1 ? 's' : ''}` : ''}`;
            return (
              <button
                key={m.stepId}
                type="button"
                className={`mark-box mark-${kind}`}
                style={{ left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.w * 100}%`, height: `${box.h * 100}%` }}
                onClick={(e) => goToStep(e.currentTarget, m.index)}
                aria-label={`${label} – show the comment`}
                data-testid={`mark-${m.index + 1}`}
              >
                <span className="mark-badge">
                  {fine ? '✓' : m.status !== 'valid' ? SYMBOL[m.status] : '✎'} {m.index + 1}
                </span>
              </button>
            );
          })}
        </div>
      ))}
      <p className="mark-legend small">
        <span>✗ error</span> <span>? gap</span> <span>~ unclear</span> <span>✎ wording or improvement</span> <span>✓ fine</span>
      </p>
    </section>
  );
}

/**
 * The student's step with the quoted spots highlighted. Quotes that are not an exact
 * piece of the text, or that would cut through a formula, are simply not highlighted.
 */
export function HighlightedStep({ text, quotes }: { text: string; quotes: { quote: string; kind: string }[] }) {
  const ranges: { start: number; end: number; kind: string }[] = [];
  for (const { quote, kind } of quotes) {
    const q = quote.trim();
    if (q.length < 3) continue;
    const start = text.indexOf(q);
    if (start < 0) continue;
    const end = start + q.length;
    const dollarsBefore = (text.slice(0, start).match(/\$/g) ?? []).length;
    const dollarsInside = (q.match(/\$/g) ?? []).length;
    if (dollarsBefore % 2 !== 0 || dollarsInside % 2 !== 0) continue;
    if (ranges.some((r) => start < r.end && end > r.start)) continue;
    ranges.push({ start, end, kind });
  }
  if (ranges.length === 0) return <MathText text={text} block className="step-text" />;
  ranges.sort((a, b) => a.start - b.start);
  const parts: { text: string; kind?: string }[] = [];
  let at = 0;
  for (const r of ranges) {
    if (r.start > at) parts.push({ text: text.slice(at, r.start) });
    parts.push({ text: text.slice(r.start, r.end), kind: r.kind });
    at = r.end;
  }
  if (at < text.length) parts.push({ text: text.slice(at) });
  return (
    <div className="step-text">
      {parts.map((p, i) =>
        p.kind ? (
          <mark key={i} className={`hl hl-${p.kind}`}>
            <MathText text={p.text} />
          </mark>
        ) : (
          <MathText key={i} text={p.text} />
        ),
      )}
    </div>
  );
}
