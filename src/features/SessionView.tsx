import { Spinner } from '../components/ui';
import { href, navigate, type TabId } from '../lib/router';
import type { Session } from '../session/types';
import { useSession, type Updater } from '../session/useSession';
import { AlternativesStage } from './alternatives/AlternativesStage';
import { AnnotateStage } from './annotate/AnnotateStage';
import { FeedbackStage } from './attempt/FeedbackStage';
import { SolutionStage } from './attempt/SolutionStage';
import { CorrectionStage } from './correction/CorrectionStage';
import { ProblemStage } from './problem/ProblemStage';
import { WorkStage } from './work/WorkStage';

export interface StageProps {
  session: Session;
  update: Updater;
  go: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string; enabled: (s: Session) => boolean; locked: string }[] = [
  { id: 'problem', label: 'Problem', enabled: () => true, locked: '' },
  { id: 'work', label: 'Work on it', enabled: (s) => !!s.problem?.confirmed, locked: 'Confirm the problem text first.' },
  { id: 'solution', label: 'Final solution', enabled: (s) => !!s.problem?.confirmed, locked: 'Confirm the problem text first.' },
  { id: 'feedback', label: 'Feedback', enabled: (s) => !!s.attempt?.confirmed, locked: 'Upload your solution and confirm how it was read first.' },
  { id: 'ask', label: 'Ask with pen', enabled: (s) => !!s.attempt?.assessment, locked: 'Get feedback on your solution first.' },
  { id: 'fix', label: 'Fix your approach', enabled: (s) => !!s.attempt?.assessment, locked: 'Get feedback on your solution first.' },
  { id: 'learn', label: 'Other approaches', enabled: (s) => !!s.attempt?.assessment, locked: 'Get feedback on your solution first.' },
];

export function SessionView({ id, tab }: { id: string; tab: TabId }) {
  const { session, update, missing } = useSession(id);

  if (missing) {
    return (
      <p>
        This problem was not found on this device. <a href={href({ name: 'home' })}>Back to your problems</a>
      </p>
    );
  }
  if (!session) return <Spinner label="Loading…" />;

  const go = (t: TabId) => navigate({ name: 'session', id, tab: t });
  const current = TABS.find((t) => t.id === tab)!;
  const props: StageProps = { session, update, go };

  return (
    <div className="session">
      <nav className="tabs" aria-label="Steps">
        {TABS.map((t, i) => {
          const enabled = t.enabled(session);
          return (
            <a
              key={t.id}
              href={enabled ? href({ name: 'session', id, tab: t.id }) : undefined}
              className={`tab ${t.id === tab ? 'active' : ''} ${enabled ? '' : 'disabled'}`}
              aria-current={t.id === tab ? 'step' : undefined}
              aria-disabled={!enabled}
              data-testid={`tab-${t.id}`}
            >
              <span className="tab-num">{i + 1}</span>
              {t.label}
            </a>
          );
        })}
      </nav>
      {!current.enabled(session) ? (
        <p className="locked">{current.locked}</p>
      ) : (
        <div className="stage" data-testid={`stage-${tab}`}>
          {tab === 'problem' && <ProblemStage {...props} />}
          {tab === 'work' && <WorkStage {...props} />}
          {tab === 'solution' && <SolutionStage {...props} />}
          {tab === 'feedback' && <FeedbackStage {...props} />}
          {tab === 'ask' && <AnnotateStage {...props} />}
          {tab === 'fix' && <CorrectionStage {...props} />}
          {tab === 'learn' && <AlternativesStage {...props} />}
        </div>
      )}
    </div>
  );
}
