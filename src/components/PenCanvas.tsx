import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';

export interface Point {
  x: number;
  y: number;
}

/** A rectangle in natural image pixels. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Marking {
  id: string;
  label: string;
  box: Box;
}

type DragMode = 'move' | 'tl' | 'tr' | 'bl' | 'br';
const CORNERS: Exclude<DragMode, 'move'>[] = ['tl', 'tr', 'bl', 'br'];

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/** Moves or resizes a box by (dx, dy), keeping it inside the image and not too small. */
export function dragBox(box: Box, mode: DragMode, dx: number, dy: number, width: number, height: number): Box {
  const min = 0.03 * Math.max(width, height);
  if (mode === 'move') {
    return {
      ...box,
      x: Math.min(Math.max(0, box.x + dx), width - box.w),
      y: Math.min(Math.max(0, box.y + dy), height - box.h),
    };
  }
  let x0 = box.x;
  let y0 = box.y;
  let x1 = box.x + box.w;
  let y1 = box.y + box.h;
  if (mode === 'tl' || mode === 'bl') x0 = Math.min(Math.max(0, x0 + dx), x1 - min);
  if (mode === 'tr' || mode === 'br') x1 = Math.max(Math.min(width, x1 + dx), x0 + min);
  if (mode === 'tl' || mode === 'tr') y0 = Math.min(Math.max(0, y0 + dy), y1 - min);
  if (mode === 'bl' || mode === 'br') y1 = Math.max(Math.min(height, y1 + dy), y0 + min);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/**
 * An image with a pen layer. A freehand stroke becomes a rounded box around its
 * extreme points; the selected box can be moved and resized at its corners, like a
 * crop frame, with everything outside dimmed. Coordinates are natural image pixels.
 */
export function PenCanvas({
  src,
  markings,
  activeId,
  onStroke,
  onSelect,
  onBoxChange,
  enabled = true,
  testId,
}: {
  src: string;
  markings: Marking[];
  activeId?: string | null;
  onStroke: (stroke: Point[], size: { width: number; height: number }) => void;
  onSelect?: (id: string) => void;
  onBoxChange?: (id: string, box: Box) => void;
  /** When false the image can be scrolled/zoomed normally (touch devices). */
  enabled?: boolean;
  testId?: string;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef<Point[] | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [live, setLive] = useState<{ id: string; box: Box } | null>(null);

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
    for (const m of markings) {
      if (m.id === activeId) continue; // the selected box is the interactive frame on top
      const x = m.box.x / sx;
      const y = m.box.y / sy;
      roundedRect(ctx, x, y, m.box.w / sx, m.box.h / sy, 14);
      ctx.fillStyle = 'rgba(255, 212, 59, 0.14)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(224, 168, 0, 0.95)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#ffd43b';
      ctx.beginPath();
      ctx.arc(x + 4, y + 4, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1f1f1f';
      ctx.font = "bold 13px 'Comic Sans MS', 'Comic Neue', cursive";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(m.label, x + 4, y + 4);
    }
    const stroke = drawing.current;
    if (stroke && stroke.length > 1) {
      ctx.strokeStyle = 'rgba(224, 168, 0, 0.95)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      stroke.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x / sx, p.y / sy) : ctx.lineTo(p.x / sx, p.y / sy)));
      ctx.stroke();
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

  const toImage = (clientX: number, clientY: number): Point => {
    const rect = imgRef.current!.getBoundingClientRect();
    const { sx, sy } = scale();
    return { x: (clientX - rect.left) * sx, y: (clientY - rect.top) * sy };
  };

  // ---- freehand drawing on the canvas
  const onDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = [toImage(event.clientX, event.clientY)];
  };
  const onMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current.push(toImage(event.clientX, event.clientY));
    redraw();
  };
  const onUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const stroke = drawing.current;
    drawing.current = null;
    if (!stroke) return;
    const img = imgRef.current!;
    const xs = stroke.map((p) => p.x);
    const ys = stroke.map((p) => p.y);
    const extent = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    if (stroke.length < 3 || extent < 0.02 * img.naturalWidth) {
      // A tap: select the box under the pointer, if any.
      const p = toImage(event.clientX, event.clientY);
      const hit = markings.find((m) => p.x >= m.box.x && p.x <= m.box.x + m.box.w && p.y >= m.box.y && p.y <= m.box.y + m.box.h);
      if (hit) onSelect?.(hit.id);
      redraw();
      return;
    }
    onStroke(stroke, { width: img.naturalWidth, height: img.naturalHeight });
    redraw();
  };

  // ---- moving / resizing the selected box (listeners on window, so fast drags do not escape)
  const startDrag = (marking: Marking, mode: DragMode) => (event: ReactPointerEvent) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    onSelect?.(marking.id);
    const start = toImage(event.clientX, event.clientY);
    const { naturalWidth: width, naturalHeight: height } = imgRef.current!;
    let current = marking.box;
    const move = (e: PointerEvent) => {
      const p = toImage(e.clientX, e.clientY);
      current = dragBox(marking.box, mode, p.x - start.x, p.y - start.y, width, height);
      setLive({ id: marking.id, box: current });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      setLive(null);
      if (current !== marking.box) onBoxChange?.(marking.id, current);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  const active = markings.find((m) => m.id === activeId);
  const shown = active && (live?.id === active.id ? live.box : active.box);
  const pct = (b: Box): CSSProperties => ({
    left: `${(b.x / natural.width) * 100}%`,
    top: `${(b.y / natural.height) * 100}%`,
    width: `${(b.w / natural.width) * 100}%`,
    height: `${(b.h / natural.height) * 100}%`,
  });

  return (
    <div className="pen-canvas" data-testid={testId}>
      <img
        ref={imgRef}
        src={src}
        alt="Your solution"
        onLoad={() => {
          const img = imgRef.current!;
          setSize({ w: img.clientWidth, h: img.clientHeight });
          setNatural({ width: img.naturalWidth, height: img.naturalHeight });
        }}
      />
      <canvas
        ref={canvasRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => {
          drawing.current = null;
          redraw();
        }}
        style={{ width: size.w, height: size.h, pointerEvents: enabled ? 'auto' : 'none' }}
        aria-label="Draw around a part of your solution to ask about it"
      />
      {active && shown && natural.width > 0 && (
        <div className="lens-box" style={pct(shown)} onPointerDown={startDrag(active, 'move')} data-testid="lens-box">
          <span className="lens-label">{active.label}</span>
          {CORNERS.map((c) => (
            <span
              key={c}
              className={`lens-corner ${c}`}
              onPointerDown={startDrag(active, c)}
              role="presentation"
              data-testid={`lens-corner-${c}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
