import { MathText } from '../../components/MathText';
import { Card, Details, Taped } from '../../components/ui';
import type { Problem } from '../../session/types';

/** The confirmed problem; geometry problems keep the original figure in view. */
export function ProblemCard({ problem, title = 'The problem' }: { problem: Problem; title?: string }) {
  const hasFigure = !!problem.figure?.trim() || problem.topic.toLowerCase().includes('geometry');
  const original = problem.images.map((src, i) => (
    <Taped key={i}>
      <img src={src} alt={`Original page ${i + 1}`} className="source-image" />
    </Taped>
  ));
  return (
    <Card title={title} className={`problem-card ${hasFigure ? 'with-figure' : ''}`} testId="problem-card">
      <div className="problem-card-body">
        <div>
          <MathText text={problem.transcript} block className="problem-text" />
          {problem.figure && (
            <p className="figure-note">
              <span className="muted small">Figure:</span> <MathText text={problem.figure} />
            </p>
          )}
        </div>
        {hasFigure ? <div className="problem-original">{original}</div> : null}
      </div>
      {!hasFigure && problem.images.length > 0 && <Details summary="Show the original image">{original}</Details>}
    </Card>
  );
}
