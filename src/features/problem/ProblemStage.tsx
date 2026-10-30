import { useState } from 'react';
import { ImageInput } from '../../components/ImageInput';
import { MathText } from '../../components/MathText';
import { Button, Card, ErrorBox, Pill } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { isDemo, useConfig } from '../../lib/config';
import type { StageProps } from '../SessionView';

export function ProblemStage({ session, update, go }: StageProps) {
  const config = useConfig();
  const [images, setImages] = useState<string[]>(session.problem?.images ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const problem = session.problem;

  const read = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await api.transcribe({ images });
      update((d) => {
        d.problem = { images, transcript: result.text, topic: result.topic, uncertain: result.uncertain, confirmed: false };
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!problem) {
    return (
      <Card title="Upload the problem">
        <p>Take a photo or a screenshot of the problem statement. The coach will read it and ask you to confirm.</p>
        <ImageInput
          images={images}
          onChange={setImages}
          max={3}
          testId="problem-images"
          sample={isDemo(config) ? { label: 'Use sample problem', url: '/samples/problem.png' } : undefined}
        />
        {error && <ErrorBox message={error} onRetry={read} />}
        <div className="actions">
          <Button variant="primary" disabled={images.length === 0} busy={busy} onClick={read} data-testid="read-problem">
            Read the problem
          </Button>
        </div>
      </Card>
    );
  }

  if (!problem.confirmed) {
    return (
      <Card title="Did I read this correctly?" testId="confirm-problem">
        <p className="muted">Compare with your image and fix anything that was misread. Formulas use LaTeX, e.g. $2^n - 1$.</p>
        <div className="split">
          <div className="split-images">
            {problem.images.map((src, i) => (
              <img key={i} src={src} alt={`Problem page ${i + 1}`} className="source-image" />
            ))}
          </div>
          <div>
            <label className="field">
              <span>Problem text</span>
              <textarea
                value={problem.transcript}
                rows={8}
                onChange={(e) =>
                  update((d) => {
                    d.problem!.transcript = e.target.value;
                  })
                }
                data-testid="problem-text"
              />
            </label>
            <div className="preview">
              <span className="muted small">Preview</span>
              <MathText text={problem.transcript} block />
            </div>
            {problem.uncertain.length > 0 && (
              <div className="uncertain">
                <strong>I was unsure about:</strong>
                <ul>
                  {problem.uncertain.map((u, i) => (
                    <li key={i}>
                      <MathText text={u} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="actions">
          <Button
            variant="primary"
            disabled={!problem.transcript.trim()}
            onClick={() => {
              update((d) => {
                d.problem!.confirmed = true;
              });
              go('understand');
            }}
            data-testid="confirm-problem-btn"
          >
            Yes, that's right
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              update((d) => {
                d.problem = null;
              })
            }
          >
            Use another image
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="The problem"
      aside={problem.topic ? <Pill tone="accent">{problem.topic}</Pill> : undefined}
      testId="problem-confirmed"
    >
      <MathText text={problem.transcript} block className="problem-text" />
      <div className="actions">
        <Button variant="primary" onClick={() => go('understand')}>
          Understand it step by step
        </Button>
        <Button onClick={() => go('solution')}>I'm ready to solve it on paper</Button>
        <Button
          variant="ghost"
          onClick={() =>
            update((d) => {
              d.problem!.confirmed = false;
            })
          }
        >
          Edit text
        </Button>
      </div>
    </Card>
  );
}
