import { useState } from 'react';
import { ImageInput } from '../../components/ImageInput';
import { MathText } from '../../components/MathText';
import { Button, Card, ErrorBox, Taped } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { isDemo, useConfig } from '../../lib/config';
import { sampleUrl } from '../../lib/samples';
import type { StageProps } from '../SessionView';
import { ProblemCard } from './ProblemCard';

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
        d.problem = {
          images,
          transcript: result.text,
          figure: result.figure,
          topic: result.topic,
          uncertain: result.uncertain,
          confirmed: false,
        };
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
          samples={
            isDemo(config)
              ? [
                  { label: 'Sample: number theory', url: sampleUrl('problem.png') },
                  { label: 'Sample: geometry', url: sampleUrl('geometry-problem.png') },
                ]
              : []
          }
        />
        {error && <ErrorBox message={error} onRetry={read} />}
        <div className="actions">
          <Button variant="primary" disabled={images.length === 0} busy={busy} onClick={read} data-testid="read-problem">
            Read the problem
          </Button>
          {images.length === 0 && <span className="muted small">Add a photo, a screenshot or a sample first.</span>}
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
              <Taped key={i}>
                <img src={src} alt={`Problem page ${i + 1}`} className="source-image" />
              </Taped>
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
            {(problem.figure !== undefined && problem.figure !== '') || problem.topic.toLowerCase().includes('geometry') ? (
              <label className="field">
                <span>The figure, as I understood it</span>
                <textarea
                  value={problem.figure ?? ''}
                  rows={3}
                  placeholder="Describe the figure: points, lines, circles, marked angles…"
                  onChange={(e) =>
                    update((d) => {
                      d.problem!.figure = e.target.value;
                    })
                  }
                  data-testid="problem-figure"
                />
              </label>
            ) : null}
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
              go('work');
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
    <div className="stack" data-testid="problem-confirmed">
      <ProblemCard problem={problem} title={problem.topic ? `The problem · ${problem.topic}` : 'The problem'} />
      <div className="actions">
        <Button variant="primary" onClick={() => go('work')}>
          Start working – get a first tip
        </Button>
        <Button onClick={() => go('solution')}>I already have a full solution</Button>
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
    </div>
  );
}
