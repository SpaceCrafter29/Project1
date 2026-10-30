import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { interpretFigure, type Figure } from '../../shared/codecheck';
import type { P } from '../../shared/geo';
import { FigureRunner } from '../lib/sandbox';

interface View {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Bounding box (in SVG coordinates, y flipped) around all points and circles. */
function fit(figure: Figure): View {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const [x, y] of Object.values(figure.points)) {
    xs.push(x);
    ys.push(-y);
  }
  for (const c of figure.circles) {
    xs.push(c.center[0] - c.radius, c.center[0] + c.radius);
    ys.push(-c.center[1] - c.radius, -c.center[1] + c.radius);
  }
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const size = Math.max(x1 - x0, y1 - y0, 1);
  const pad = size * 0.18;
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: Math.max(y1 - y0 + 2 * pad, size * 0.5) };
}

/**
 * An interactive geometry figure: model-written construction code runs in the sandbox
 * every time a yellow point is dragged, so the student can see what stays the same.
 */
export function GeoFigure({
  code,
  initial,
  onMeasures,
  testId,
}: {
  code: string;
  initial: Record<string, P>;
  onMeasures?: (measures: Figure['measures']) => void;
  testId?: string;
}) {
  const runner = useMemo(() => new FigureRunner(), []);
  const svgRef = useRef<SVGSVGElement>(null);
  const [free, setFree] = useState<Record<string, P>>(initial);
  const [figure, setFigure] = useState<Figure | null>(null);
  const [view, setView] = useState<View | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState<string | null>(null);
  const busy = useRef(false);
  const queued = useRef<Record<string, P> | null>(null);
  const onMeasuresRef = useRef(onMeasures);
  onMeasuresRef.current = onMeasures;

  useEffect(() => () => runner.dispose(), [runner]);

  // Re-run the construction for the latest positions; drags that arrive meanwhile are coalesced.
  useEffect(() => {
    queued.current = free;
    if (busy.current) return;
    const pump = async () => {
      busy.current = true;
      while (queued.current) {
        const args = queued.current;
        queued.current = null;
        const result = interpretFigure(await runner.run(code, { free: args }), args);
        if (result.ok) {
          setFigure(result.figure);
          setError('');
          setView((v) => v ?? fit(result.figure));
          onMeasuresRef.current?.(result.figure.measures);
        } else {
          setError(result.error);
        }
      }
      busy.current = false;
    };
    void pump();
  }, [code, free, runner]);

  const toMath = (event: PointerEvent): P | null => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const pt = new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse());
    return [pt.x, -pt.y];
  };

  const move = (name: string, p: P) => setFree((f) => ({ ...f, [name]: p }));

  const onKey = (name: string) => (event: KeyboardEvent) => {
    if (!view) return;
    const step = view.w * 0.02;
    const d: Record<string, P> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    const delta = d[event.key];
    if (!delta) return;
    event.preventDefault();
    const p = free[name];
    move(name, [p[0] + delta[0], p[1] + delta[1]]);
  };

  if (!figure || !view) {
    return (
      <div className="geo-figure" data-testid={testId}>
        <p className="muted">{error || 'Drawing the figure…'}</p>
      </div>
    );
  }

  const r = view.w * 0.013;
  const font = view.w * 0.045;
  const pt = (name: string) => figure.points[name];
  const far = view.w * 10;
  const centerOf = (names: string[]) => {
    const ps = names.map(pt);
    return [ps.reduce((s, p) => s + p[0], 0) / ps.length, ps.reduce((s, p) => s + p[1], 0) / ps.length] as P;
  };
  const middle = centerOf(Object.keys(figure.points));

  return (
    <div className="geo-figure" data-testid={testId}>
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        className={dragging ? 'dragging' : ''}
        role="img"
        aria-label="Interactive figure"
      >
        {figure.polygons.map((poly, i) => (
          <polygon
            key={`poly${i}`}
            points={poly.points.map((n) => `${pt(n)[0]},${-pt(n)[1]}`).join(' ')}
            className={poly.fill ? 'geo-poly fill' : 'geo-poly'}
          />
        ))}
        {figure.circles.map((c, i) => (
          <circle key={`c${i}`} cx={c.center[0]} cy={-c.center[1]} r={c.radius} className="geo-circle" />
        ))}
        {figure.lines.map(([a, b], i) => {
          const [ax, ay] = pt(a);
          const [bx, by] = pt(b);
          const len = Math.hypot(bx - ax, by - ay) || 1;
          const dx = ((bx - ax) / len) * far;
          const dy = ((by - ay) / len) * far;
          return <line key={`l${i}`} x1={ax - dx} y1={-(ay - dy)} x2={ax + dx} y2={-(ay + dy)} className="geo-line" />;
        })}
        {figure.segments.map(([a, b], i) => (
          <line key={`s${i}`} x1={pt(a)[0]} y1={-pt(a)[1]} x2={pt(b)[0]} y2={-pt(b)[1]} className="geo-segment" />
        ))}
        {Object.entries(figure.points).map(([name, [x, y]]) => {
          const isFree = name in free;
          // Put the label on the side away from the middle of the figure.
          const dx = x - middle[0];
          const dy = y - middle[1];
          const d = Math.hypot(dx, dy) || 1;
          const lx = x + (dx / d) * font * 0.9;
          const ly = -(y + (dy / d) * font * 0.9);
          return (
            <g key={name} className={isFree ? 'geo-point free' : 'geo-point'}>
              <text x={lx} y={ly} fontSize={font} textAnchor="middle" dominantBaseline="central">
                {name}
              </text>
              <circle cx={x} cy={-y} r={isFree ? r * 1.25 : r} />
              {isFree && (
                <circle
                  cx={x}
                  cy={-y}
                  r={r * 3.5}
                  className="geo-handle"
                  tabIndex={0}
                  role="slider"
                  aria-label={`Point ${name}: drag or use arrow keys`}
                  aria-valuetext={`${x.toFixed(2)}, ${y.toFixed(2)}`}
                  data-testid={`handle-${name}`}
                  onKeyDown={onKey(name)}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setDragging(name);
                  }}
                  onPointerMove={(e) => {
                    if (dragging !== name) return;
                    const p = toMath(e);
                    if (p) move(name, p);
                  }}
                  onPointerUp={() => setDragging(null)}
                  onPointerCancel={() => setDragging(null)}
                />
              )}
            </g>
          );
        })}
      </svg>
      <div className="geo-side">
        {Object.keys(free).length > 0 && <p className="geo-hint">Drag the yellow points.</p>}
        {figure.measures.length > 0 && (
          <dl className="geo-measures" data-testid="measures">
            {figure.measures.map((m) => (
              <div key={m.label}>
                <dt>{m.label}</dt>
                <dd>{m.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <button
          type="button"
          className="link"
          onClick={() => {
            setFree({ ...initial });
            setView(null);
          }}
        >
          reset figure
        </button>
        {error && <p className="error-text small">{error}</p>}
      </div>
    </div>
  );
}
