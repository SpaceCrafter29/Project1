// Plane geometry helpers available as `geo` inside every sandboxed check and figure.
// Points are plain [x, y] arrays so model-written code stays short and JSON-friendly.

export type P = [number, number];

const EPS = 1e-7;
const scaleOf = (...xs: number[]) => Math.max(1, ...xs.map(Math.abs));

function add(a: P, b: P): P {
  return [a[0] + b[0], a[1] + b[1]];
}
function sub(a: P, b: P): P {
  return [a[0] - b[0], a[1] - b[1]];
}
function scale(a: P, k: number): P {
  return [a[0] * k, a[1] * k];
}
function dot(a: P, b: P): number {
  return a[0] * b[0] + a[1] * b[1];
}
function cross(a: P, b: P): number {
  return a[0] * b[1] - a[1] * b[0];
}
function len(v: P): number {
  return Math.hypot(v[0], v[1]);
}
function dist(a: P, b: P): number {
  return len(sub(a, b));
}
function lerp(a: P, b: P, t: number): P {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
function mid(a: P, b: P): P {
  return lerp(a, b, 0.5);
}
function approx(x: number, y: number, eps = EPS): boolean {
  return Math.abs(x - y) <= eps * scaleOf(x, y);
}

/** Angle ABC at vertex B, in degrees (0..180). */
function angle(a: P, b: P, c: P): number {
  const u = sub(a, b);
  const v = sub(c, b);
  return (Math.atan2(Math.abs(cross(u, v)), dot(u, v)) * 180) / Math.PI;
}

/** Intersection of line p1p2 with line q1q2, or null if parallel. */
function intersect(p1: P, p2: P, q1: P, q2: P): P | null {
  const r = sub(p2, p1);
  const s = sub(q2, q1);
  const d = cross(r, s);
  if (Math.abs(d) < 1e-12 * scaleOf(len(r) * len(s))) return null;
  const t = cross(sub(q1, p1), s) / d;
  return add(p1, scale(r, t));
}

/** Foot of the perpendicular from p to line ab. */
function foot(p: P, a: P, b: P): P {
  const ab = sub(b, a);
  return add(a, scale(ab, dot(sub(p, a), ab) / dot(ab, ab)));
}

function reflect(p: P, a: P, b: P): P {
  return sub(scale(foot(p, a, b), 2), p);
}

function rotate(p: P, center: P, degrees: number): P {
  const t = (degrees * Math.PI) / 180;
  const v = sub(p, center);
  return add(center, [v[0] * Math.cos(t) - v[1] * Math.sin(t), v[0] * Math.sin(t) + v[1] * Math.cos(t)]);
}

function circumcenter(a: P, b: P, c: P): P {
  const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
  const sq = (p: P) => p[0] * p[0] + p[1] * p[1];
  return [
    (sq(a) * (b[1] - c[1]) + sq(b) * (c[1] - a[1]) + sq(c) * (a[1] - b[1])) / d,
    (sq(a) * (c[0] - b[0]) + sq(b) * (a[0] - c[0]) + sq(c) * (b[0] - a[0])) / d,
  ];
}

function incenter(a: P, b: P, c: P): P {
  const la = dist(b, c);
  const lb = dist(c, a);
  const lc = dist(a, b);
  const s = la + lb + lc;
  return [(la * a[0] + lb * b[0] + lc * c[0]) / s, (la * a[1] + lb * b[1] + lc * c[1]) / s];
}

function centroid(...pts: P[]): P {
  return scale(pts.reduce(add, [0, 0] as P), 1 / pts.length);
}

function orthocenter(a: P, b: P, c: P): P {
  // H = A + B + C - 2O
  return sub(add(add(a, b), c), scale(circumcenter(a, b, c), 2));
}

function signedArea(...pts: P[]): number {
  let s = 0;
  for (let i = 0; i < pts.length; i++) s += cross(pts[i], pts[(i + 1) % pts.length]);
  return s / 2;
}

function area(...pts: P[]): number {
  return Math.abs(signedArea(...pts));
}

function collinear(a: P, b: P, c: P, eps = EPS): boolean {
  return Math.abs(cross(sub(b, a), sub(c, a))) <= eps * scaleOf(dist(a, b) * dist(a, c));
}

function parallel(a: P, b: P, c: P, d: P, eps = EPS): boolean {
  return Math.abs(cross(sub(b, a), sub(d, c))) <= eps * scaleOf(dist(a, b) * dist(c, d));
}

function perpendicular(a: P, b: P, c: P, d: P, eps = EPS): boolean {
  return Math.abs(dot(sub(b, a), sub(d, c))) <= eps * scaleOf(dist(a, b) * dist(c, d));
}

function concyclic(a: P, b: P, c: P, d: P, eps = EPS): boolean {
  if (collinear(a, b, c)) return false;
  const o = circumcenter(a, b, c);
  return approx(dist(o, d), dist(o, a), eps);
}

/** Intersections of line ab with the circle (center, r). */
function lineCircle(a: P, b: P, center: P, r: number): P[] {
  const f = foot(center, a, b);
  const h2 = r * r - dist(center, f) ** 2;
  if (h2 < -EPS * r * r) return [];
  const dir = scale(sub(b, a), 1 / dist(a, b));
  const h = Math.sqrt(Math.max(0, h2));
  return h === 0 ? [f] : [add(f, scale(dir, -h)), add(f, scale(dir, h))];
}

function circleCircle(c1: P, r1: number, c2: P, r2: number): P[] {
  const d = dist(c1, c2);
  if (d === 0 || d > r1 + r2 || d < Math.abs(r1 - r2)) return [];
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
  const m = add(c1, scale(sub(c2, c1), a / d));
  const perp: P = [-(c2[1] - c1[1]) / d, (c2[0] - c1[0]) / d];
  return h === 0 ? [m] : [add(m, scale(perp, h)), add(m, scale(perp, -h))];
}

function pointOnCircle(center: P, r: number, degrees: number): P {
  const t = (degrees * Math.PI) / 180;
  return [center[0] + r * Math.cos(t), center[1] + r * Math.sin(t)];
}

function rand(min = -10, max = 10): number {
  return min + Math.random() * (max - min);
}

function randPoint(r = 10): P {
  return [rand(-r, r), rand(-r, r)];
}

/** A random triangle that is not close to degenerate. */
function randTriangle(r = 10): [P, P, P] {
  for (;;) {
    const t: [P, P, P] = [randPoint(r), randPoint(r), randPoint(r)];
    if (Math.min(angle(t[1], t[0], t[2]), angle(t[0], t[1], t[2]), angle(t[0], t[2], t[1])) > 5) return t;
  }
}

/** A random convex quadrilateral ABCD (counter-clockwise). */
function randConvexQuad(r = 10): [P, P, P, P] {
  for (;;) {
    const angles = [0, 1, 2, 3].map((i) => (i * 90 + rand(5, 85)) % 360).sort((x, y) => x - y);
    const q = angles.map((a) => pointOnCircle([0, 0], rand(0.4 * r, r), a)) as [P, P, P, P];
    const turns = q.map((p, i) => cross(sub(q[(i + 1) % 4], p), sub(q[(i + 2) % 4], q[(i + 1) % 4])));
    if (turns.every((t) => t > 1e-3 * r * r)) return q;
  }
}

export const geo = {
  add,
  sub,
  scale,
  dot,
  cross,
  len,
  dist,
  lerp,
  mid,
  approx,
  angle,
  intersect,
  foot,
  reflect,
  rotate,
  circumcenter,
  circumradius: (a: P, b: P, c: P) => dist(circumcenter(a, b, c), a),
  incenter,
  inradius: (a: P, b: P, c: P) => (2 * area(a, b, c)) / (dist(a, b) + dist(b, c) + dist(c, a)),
  centroid,
  orthocenter,
  signedArea,
  area,
  collinear,
  parallel,
  perpendicular,
  concyclic,
  lineCircle,
  circleCircle,
  pointOnCircle,
  rand,
  randPoint,
  randTriangle,
  randConvexQuad,
};

export type Geo = typeof geo;

/** One-line reference for prompts, kept next to the implementation. */
export const GEO_REFERENCE = `geo helpers (points are [x, y] arrays, angles in degrees): add, sub, scale(p,k), dot, cross, len(v), dist(a,b), lerp(a,b,t), mid(a,b), approx(x,y,eps?), angle(a,b,c) = angle at b, intersect(p1,p2,q1,q2) (lines; null if parallel), foot(p,a,b), reflect(p,a,b), rotate(p,center,deg), circumcenter(a,b,c), circumradius(a,b,c), incenter(a,b,c), inradius(a,b,c), centroid(...pts), orthocenter(a,b,c), area(...pts), signedArea(...pts), collinear(a,b,c), parallel(a,b,c,d), perpendicular(a,b,c,d), concyclic(a,b,c,d), lineCircle(a,b,center,r), circleCircle(c1,r1,c2,r2), pointOnCircle(center,r,deg), rand(min,max), randPoint(r), randTriangle(r), randConvexQuad(r).`;
