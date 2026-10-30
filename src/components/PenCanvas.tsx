import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';

export interface Point {
  x: number;
  y: number;
}

export interface Marking {
  id: string;
  label: string;
  stroke: Point[];
}

/**
 * An image with a drawing layer. Strokes are reported in natural image pixels,
 * so crops are independent of the on-screen size.
 */
export function PenCanvas({
  src,
  markings,
  activeId,
  onStroke,
  onSelect,
  testId,
}: {
  src: string;
  markings: Marking[];
  activeId?: string | null;
  onStroke: (stroke: Point[], size: { width: number; height: number }) => void;
  onSelect?: (id: string) => void;
  testId?: string;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef<Point[] | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const scale = useCallback(() => {
    const img = imgRef.current!;
    return { sx: img.naturalWidth / img.clientWidth, sy: img.naturalHeight / img.clientHeight };
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.naturalWidth) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = img.clientWidth * dpr;
    canvas.height = img.clientHeight * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, img.clientWidth, img.clientHeight);
    const { sx, sy } = scale();
    const path = (stroke: Point[]) => {
      ctx.beginPath();
      stroke.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x / sx, p.y / sy) : ctx.lineTo(p.x / sx, p.y / sy)));
      ctx.stroke();
    };
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const m of markings) {
      const active = m.id === activeId;
      ctx.strokeStyle = active ? 'rgba(214, 69, 65, 0.9)' : 'rgba(232, 150, 30, 0.75)';
      ctx.lineWidth = active ? 4 : 3;
      path(m.stroke);
      const first = m.stroke.reduce((a, p) => (p.y < a.y ? p : a), m.stroke[0]);
      ctx.fillStyle = active ? '#d64541' : '#e8961e';
      ctx.beginPath();
      ctx.arc(first.x / sx, first.y / sy - 12, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(m.label, first.x / sx, first.y / sy - 12);
    }
    if (drawing.current) {
      ctx.strokeStyle = 'rgba(31, 58, 95, 0.85)';
      ctx.lineWidth = 3;
      path(drawing.current);
    }
  }, [markings, activeId, scale]);

  useEffect(() => {
    redraw();
  }, [redraw, size]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const observer = new ResizeObserver(() => setSize({ w: img.clientWidth, h: img.clientHeight }));
    observer.observe(img);
    return () => observer.disconnect();
  }, []);

  const toImage = (event: PointerEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const { sx, sy } = scale();
    return { x: (event.clientX - rect.left) * sx, y: (event.clientY - rect.top) * sy };
  };

  const onDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = [toImage(event)];
  };
  const onMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current.push(toImage(event));
    redraw();
  };
  const onUp = (event: PointerEvent<HTMLCanvasElement>) => {
    const stroke = drawing.current;
    drawing.current = null;
    if (!stroke) return;
    const img = imgRef.current!;
    const xs = stroke.map((p) => p.x);
    const ys = stroke.map((p) => p.y);
    const extent = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    if (stroke.length < 3 || extent < 0.02 * img.naturalWidth) {
      // A tap: select the marking under the pointer, if any.
      const p = toImage(event);
      const hit = markings.find((m) => {
        const mx = m.stroke.map((q) => q.x);
        const my = m.stroke.map((q) => q.y);
        return p.x >= Math.min(...mx) && p.x <= Math.max(...mx) && p.y >= Math.min(...my) && p.y <= Math.max(...my);
      });
      if (hit) onSelect?.(hit.id);
      redraw();
      return;
    }
    onStroke(stroke, { width: img.naturalWidth, height: img.naturalHeight });
    redraw();
  };

  return (
    <div className="pen-canvas" data-testid={testId}>
      <img ref={imgRef} src={src} alt="Your solution" onLoad={() => setSize({ w: imgRef.current!.clientWidth, h: imgRef.current!.clientHeight })} />
      <canvas
        ref={canvasRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => {
          drawing.current = null;
          redraw();
        }}
        style={{ width: size.w, height: size.h }}
        aria-label="Draw around a part of your solution to ask about it"
      />
    </div>
  );
}
