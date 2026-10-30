import { useState } from 'react';
import { ImageInput } from '../../components/ImageInput';
import { MathText } from '../../components/MathText';
import { Button, Card, ErrorBox } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import type { Attempt } from '../../session/types';
import { newAttempt, type AttemptUpdater } from './assess';

/** Photo of a handwritten solution -> recognized steps -> student corrects and confirms. */
export function AttemptCapture({
  problem,
  attempt,
  intendedIdea,
  onRecognized,
  updateAttempt,
  onConfirm,
  onDiscard,
  sampleUrl,
}: {
  problem: string;
  attempt: Attempt | null;
  intendedIdea?: string;
  onRecognized: (attempt: Attempt) => void;
  updateAttempt: AttemptUpdater;
  onConfirm: () => void;
  onDiscard: () => void;
  sampleUrl?: string;
}) {
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const recognize = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await api.recognize({ problem, images, intendedIdea });
      onRecognized(newAttempt(images, result.steps, result.unreadable, intendedIdea));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!attempt) {
    return (
      <Card title={intendedIdea ? 'Photograph your own version' : 'Photograph your solution'} testId="attempt-upload">
        <p>
          Write your solution by hand on paper – thinking with a pen works better than typing. Then take a photo of
          each page.
        </p>
        <ImageInput
          images={images}
          onChange={setImages}
          max={6}
          testId="attempt-images"
          sample={sampleUrl ? { label: 'Use sample solution', url: sampleUrl } : undefined}
        />
        {error && <ErrorBox message={error} onRetry={() => void recognize()} />}
        <div className="actions">
          <Button variant="primary" disabled={images.length === 0} busy={busy} onClick={() => void recognize()} data-testid="read-solution">
            Read my solution
          </Button>
        </div>
      </Card>
    );
  }

  const nextId = () => {
    const used = new Set(attempt.steps.map((s) => s.id));
    let n = attempt.steps.length + 1;
    while (used.has(`s${n}`)) n++;
    return `s${n}`;
  };

  return (
    <Card title="Did I read your solution correctly?" testId="confirm-steps">
      <p className="muted">
        Fix reading errors only – keep your mathematics as you wrote it, even if you now see a mistake. You can submit a
        new version later.
      </p>
      <div className="split">
        <div className="split-images sticky">
          {attempt.images.map((src, i) => (
            <img key={i} src={src} alt={`Solution page ${i + 1}`} className="source-image" />
          ))}
        </div>
        <ol className="step-editor">
          {attempt.steps.map((step, i) => (
            <li key={step.id} className={attempt.unclearSteps.includes(step.id) ? 'unclear' : ''}>
              <div className="step-editor-head">
                <span className="step-label">Step {i + 1}</span>
                {attempt.unclearSteps.includes(step.id) && <span className="pill pill-warn">hard to read</span>}
                <span className="step-tools">
                  <button
                    type="button"
                    className="link"
                    disabled={i === 0}
                    onClick={() =>
                      updateAttempt((d) => {
                        [d.steps[i - 1], d.steps[i]] = [d.steps[i], d.steps[i - 1]];
                      })
                    }
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="link"
                    disabled={i === attempt.steps.length - 1}
                    onClick={() =>
                      updateAttempt((d) => {
                        [d.steps[i + 1], d.steps[i]] = [d.steps[i], d.steps[i + 1]];
                      })
                    }
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="link"
                    onClick={() =>
                      updateAttempt((d) => {
                        d.steps.splice(i + 1, 0, { id: nextId(), text: '' });
                      })
                    }
                  >
                    + step below
                  </button>
                  <button
                    type="button"
                    className="link danger"
                    disabled={attempt.steps.length === 1}
                    onClick={() =>
                      updateAttempt((d) => {
                        d.steps.splice(i, 1);
                      })
                    }
                  >
                    delete
                  </button>
                </span>
              </div>
              <textarea
                value={step.text}
                rows={Math.max(2, Math.ceil(step.text.length / 70))}
                onChange={(e) =>
                  updateAttempt((d) => {
                    d.steps[i].text = e.target.value;
                    d.unclearSteps = d.unclearSteps.filter((id) => id !== step.id);
                  })
                }
                data-testid={`step-text-${i + 1}`}
              />
              <MathText text={step.text} block className="step-preview" />
            </li>
          ))}
        </ol>
      </div>
      {attempt.unreadable.length > 0 && (
        <div className="uncertain">
          <strong>Parts I could not read:</strong> {attempt.unreadable.join(' · ')}
        </div>
      )}
      <div className="actions">
        <Button
          variant="primary"
          disabled={attempt.steps.every((s) => !s.text.trim())}
          onClick={() => {
            updateAttempt((d) => {
              d.steps = d.steps.filter((s) => s.text.trim()).map((s, i) => ({ id: `s${i + 1}`, text: s.text.trim() }));
              d.unclearSteps = [];
              d.confirmed = true;
            });
            onConfirm();
          }}
          data-testid="confirm-steps-btn"
        >
          Yes, that's what I wrote
        </Button>
        <Button variant="ghost" onClick={onDiscard}>
          Use other photos
        </Button>
      </div>
    </Card>
  );
}
