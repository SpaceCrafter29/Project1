import { useMemo, useState } from 'react';
import { decideAll, type AlternativeDecision } from '../../../shared/alternatives';
import { Button, Card, ErrorBox, Spinner } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import type { Alternative } from '../../session/types';
import { uid } from '../../session/useSession';
import type { StageProps } from '../SessionView';
import { AlternativeCard } from './AlternativeCard';

export function AlternativesStage({ session, update }: StageProps) {
  const problem = session.problem!.transcript;
  const alternatives = session.alternatives;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const decisions = useMemo(() => {
    const developed = (alternatives ?? []).filter((a) => a.state === 'done' && a.developed);
    return decideAll(
      developed.map((a) => ({
        id: a.id,
        verification: a.developed!.verification,
        checks: a.checks.map((c) => ({ ...c.outcome, claim: c.claim })),
        answer: a.developed!.solution.final_answer_normalized,
        flawedSteps: Object.entries(a.challenges)
          .filter(([, c]) => c.final === 'step_flawed')
          .map(([id]) => id),
      })),
    );
  }, [alternatives]);

  const propose = async () => {
    setBusy(true);
    setError('');
    try {
      const { ideas } = await api.propose({ problem, steps: session.attempt!.steps });
      update((d) => {
        d.alternatives = ideas.map(
          (idea): Alternative => ({ id: uid('alt_'), idea, state: 'idle', checks: [], expanded: false, threads: [], challenges: {} }),
        );
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!alternatives) {
    return (
      <Card title="Other approaches">
        <p>
          Now that you have your own solution, see how the problem can be approached differently. You get one sentence
          per idea; a full worked solution only when you open it.
        </p>
        {error && <ErrorBox message={error} onRetry={() => void propose()} />}
        <div className="actions">
          {busy ? (
            <Spinner label="Collecting ideas…" />
          ) : (
            <Button variant="primary" onClick={() => void propose()} data-testid="propose">
              Show other approaches
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="stack">
      <p className="lead">
        Each idea is a different principle. Open one to see a complete solution – every solution is checked
        independently before it is shown.
      </p>
      <ol className="alternatives">
        {alternatives.map((alt) => (
          <AlternativeCard
            key={alt.id}
            alt={alt}
            decision={decisions.get(alt.id) as AlternativeDecision | undefined}
            problem={problem}
            updateAlt={(fn) =>
              update((d) => {
                const target = d.alternatives?.find((a) => a.id === alt.id);
                if (target) fn(target as Alternative);
              })
            }
          />
        ))}
      </ol>
    </div>
  );
}
