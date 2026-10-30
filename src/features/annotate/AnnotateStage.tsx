import { useState } from 'react';
import type { ChatTurn } from '../../../shared/api';
import { ChatThread } from '../../components/ChatThread';
import { PenCanvas, type Point } from '../../components/PenCanvas';
import { Button, Card, Empty } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { cropDataUrl, downscale, strokeBox } from '../../lib/image';
import type { Annotation } from '../../session/types';
import { uid } from '../../session/useSession';
import type { StageProps } from '../SessionView';

export function AnnotateStage({ session, update }: StageProps) {
  const attempt = session.attempt!;
  const problem = session.problem!.transcript;
  const [activeId, setActiveId] = useState<string | null>(attempt.annotations.at(-1)?.id ?? null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [penOn, setPenOn] = useState(true);

  const addMarking = async (page: number, stroke: Point[], size: { width: number; height: number }) => {
    const bbox = strokeBox(stroke, size.width, size.height);
    const crop = await cropDataUrl(attempt.images[page], bbox);
    const annotation: Annotation = { id: uid('m_'), page, stroke, bbox, crop, messages: [] };
    update((d) => {
      d.attempt!.annotations.push(annotation);
    });
    setActiveId(annotation.id);
  };

  const ask = async (annotation: Annotation, question: string) => {
    setBusyId(annotation.id);
    setErrors((e) => ({ ...e, [annotation.id]: '' }));
    const history: ChatTurn[] = annotation.messages;
    update((d) => {
      d.attempt!.annotations.find((a) => a.id === annotation.id)!.messages.push({ role: 'user', text: question });
    });
    try {
      const fullImage = await downscale(attempt.images[annotation.page], 1024);
      const reply = await api.ask({
        problem,
        question,
        history,
        studentSteps: attempt.steps,
        context: { kind: 'image', crop: annotation.crop, fullImage },
      });
      update((d) => {
        d.attempt!.annotations.find((a) => a.id === annotation.id)!.messages.push({ role: 'coach', text: reply.answer });
      });
    } catch (err) {
      setErrors((e) => ({ ...e, [annotation.id]: errorMessage(err) }));
    } finally {
      setBusyId(null);
    }
  };

  const remove = (id: string) => {
    update((d) => {
      d.attempt!.annotations = d.attempt!.annotations.filter((a) => a.id !== id);
    });
    if (activeId === id) setActiveId(null);
  };

  const labelOf = (id: string) => String(attempt.annotations.findIndex((a) => a.id === id) + 1);

  return (
    <div className="annotate">
      <div className="annotate-pages">
        <div className="annotate-toolbar">
          <p className="lead">
            Circle a spot in your solution with the pen (or mouse, or finger), then ask about it – or just tap “Explain
            this”.
          </p>
          <Button variant={penOn ? 'primary' : 'secondary'} onClick={() => setPenOn((p) => !p)} data-testid="pen-toggle">
            {penOn ? 'Pen on' : 'Pen off – scrolling'}
          </Button>
        </div>
        {attempt.images.map((src, page) => (
          <PenCanvas
            key={page}
            src={src}
            markings={attempt.annotations
              .filter((a) => a.page === page)
              .map((a) => ({ id: a.id, label: labelOf(a.id), stroke: a.stroke }))}
            activeId={activeId}
            onStroke={(stroke, size) => void addMarking(page, stroke, size)}
            onSelect={setActiveId}
            enabled={penOn}
            testId={`pen-page-${page + 1}`}
          />
        ))}
      </div>
      <aside className="annotate-threads">
        <h3>Your markings</h3>
        {attempt.annotations.length === 0 && <Empty>No markings yet. Draw around a part of your solution.</Empty>}
        {attempt.annotations.map((a) => (
          <Card
            key={a.id}
            className={`annotation ${a.id === activeId ? 'active' : ''}`}
            title={`Marking ${labelOf(a.id)}`}
            aside={
              <Button variant="ghost" onClick={() => remove(a.id)} aria-label={`Delete marking ${labelOf(a.id)}`}>
                Delete
              </Button>
            }
            testId={`annotation-${labelOf(a.id)}`}
          >
            <button type="button" className="crop-button" onClick={() => setActiveId(a.id)}>
              <img src={a.crop} alt={`Marked region ${labelOf(a.id)}`} className="crop" />
            </button>
            {a.id === activeId || a.messages.length > 0 ? (
              <ChatThread
                messages={a.messages}
                onSend={(q) => void ask(a, q)}
                busy={busyId === a.id}
                error={errors[a.id]}
                quickActions={a.messages.length === 0 ? ['Explain this', 'Is this step correct?'] : []}
                placeholder="Ask about this spot…"
              />
            ) : null}
          </Card>
        ))}
      </aside>
    </div>
  );
}
