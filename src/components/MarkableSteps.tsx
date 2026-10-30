import { useEffect, useRef, type PointerEvent, type ReactNode } from 'react';

/**
 * A list of text steps with an optional pen layer: circling steps selects them
 * (the text equivalent of cropping an image region).
 */
export function MarkableSteps<T extends { id: string }>({
  steps,
  penMode,
  highlighted,
  onMark,
  renderStep,
}: {
  steps: T[];
  penMode: boolean;
  highlighted: string[];
  onMark: (stepIds: string[]) => void;
  renderStep: (step: T, index: number) => ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stroke = useRef<{ x: number; y: number }[] | null>(null);

  const resize = () => {
    const canvas = canvasRef.current;
    const box = containerRef.current;
    if (!canvas || !box) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = box.clientWidth * dpr;
    canvas.height = box.clientHeight * dpr;
    canvas.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  useEffect(() => {
    if (!penMode) return;
    resize();
    const box = containerRef.current!;
    const observer = new ResizeObserver(resize);
    observer.observe(box);
    return () => observer.disconnect();
  }, [penMode]);

  const point = (e: PointerEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const draw = () => {
    const ctx = canvasRef.current?.getContext('2d');
    const box = containerRef.current;
    if (!ctx || !box) return;
    ctx.clearRect(0, 0, box.clientWidth, box.clientHeight);
    const s = stroke.current;
    if (!s || s.length < 2) return;
    ctx.strokeStyle = 'rgba(214, 69, 65, 0.85)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    s.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
  };

  const finish = () => {
    const s = stroke.current;
    stroke.current = null;
    draw();
    const box = containerRef.current;
    if (!s || s.length < 3 || !box) return;
    const x0 = Math.min(...s.map((p) => p.x));
    const x1 = Math.max(...s.map((p) => p.x));
    const y0 = Math.min(...s.map((p) => p.y));
    const y1 = Math.max(...s.map((p) => p.y));
    const origin = box.getBoundingClientRect();
    const hits = [...box.querySelectorAll<HTMLElement>('[data-step-id]')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        const top = r.top - origin.top;
        const left = r.left - origin.left;
        return top < y1 && top + r.height > y0 && left < x1 && left + r.width > x0;
      })
      .map((el) => el.dataset.stepId!);
    if (hits.length > 0) onMark(hits);
  };

  return (
    <div ref={containerRef} className={`markable ${penMode ? 'pen-on' : ''}`}>
      <ol className="solution-steps">
        {steps.map((step, i) => (
          <li key={step.id} data-step-id={step.id} className={highlighted.includes(step.id) ? 'highlighted' : ''}>
            {renderStep(step, i)}
          </li>
        ))}
      </ol>
      {penMode && (
        <canvas
          ref={canvasRef}
          className="markable-canvas"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            stroke.current = [point(e)];
          }}
          onPointerMove={(e) => {
            if (!stroke.current) return;
            stroke.current.push(point(e));
            draw();
          }}
          onPointerUp={finish}
          onPointerCancel={() => {
            stroke.current = null;
            draw();
          }}
          aria-label="Circle steps to ask about them"
        />
      )}
    </div>
  );
}
