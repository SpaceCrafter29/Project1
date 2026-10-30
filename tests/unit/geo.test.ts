import { describe, expect, it } from 'vitest';
import { executeCode, interpretCheck, interpretFigure, toPlain } from '../../shared/codecheck';
import { geo, type P } from '../../shared/geo';
import { GEO_CODE, GEOMETRY_PROBLEM, GEOMETRY_STEPS, geometry } from '../../server/llm/mock/scripts/geometry';
import { imageSize } from '../../server/llm/mock/mockProvider';

describe('geo helpers', () => {
  const A: P = [0, 0];
  const B: P = [4, 0];
  const C: P = [0, 3];

  it('measures distances, angles and areas', () => {
    expect(geo.dist(B, C)).toBe(5);
    expect(geo.angle(B, A, C)).toBeCloseTo(90);
    expect(geo.area(A, B, C)).toBe(6);
    expect(geo.signedArea(A, C, B)).toBe(-6);
    expect(geo.mid(B, C)).toEqual([2, 1.5]);
  });

  it('constructs classical points', () => {
    expect(geo.circumcenter(A, B, C)).toEqual([2, 1.5]);
    expect(geo.circumradius(A, B, C)).toBeCloseTo(2.5);
    expect(geo.orthocenter(A, B, C)[0]).toBeCloseTo(0);
    expect(geo.orthocenter(A, B, C)[1]).toBeCloseTo(0);
    expect(geo.inradius(A, B, C)).toBeCloseTo(1);
    expect(geo.foot([2, 5], A, B)).toEqual([2, 0]);
    expect(geo.intersect(A, [1, 1], [0, 2], [2, 0])).toEqual([1, 1]);
    expect(geo.intersect(A, B, C, [4, 3])).toBeNull();
  });

  it('tests incidences with a tolerance', () => {
    expect(geo.collinear(A, [1, 1], [3, 3 + 1e-12])).toBe(true);
    expect(geo.collinear(A, [1, 1], [3, 3.1])).toBe(false);
    expect(geo.concyclic([1, 0], [0, 1], [-1, 0], [0, -1])).toBe(true);
    expect(geo.parallel(A, B, C, [7, 3])).toBe(true);
    expect(geo.perpendicular(A, B, A, C)).toBe(true);
    expect(geo.lineCircle([-5, 0], [5, 0], [0, 0], 2)).toEqual([
      [-2, 0],
      [2, 0],
    ]);
  });

  it('produces non-degenerate random configurations', () => {
    for (let i = 0; i < 200; i++) {
      const [p, q, r, s] = geo.randConvexQuad();
      const turns = [p, q, r, s].map((x, k, all) =>
        geo.cross(geo.sub(all[(k + 1) % 4], x), geo.sub(all[(k + 2) % 4], all[(k + 1) % 4])),
      );
      expect(turns.every((t) => t > 0)).toBe(true);
    }
  });
});

describe('figures', () => {
  const free: Record<string, P> = { A: [-6, -3], B: [5, -4], C: [7, 3], D: [-3, 5] };
  const run = (code: string, args = free) => ({ status: 'ok' as const, value: toPlain(executeCode(code, { free: args })), ms: 1 });

  it('runs construction code with the draggable points and reads the figure', () => {
    const result = interpretFigure(run(GEO_CODE.figure), free);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result.figure.points)).toEqual(['A', 'B', 'C', 'D', 'M', 'N', 'P', 'Q']);
    expect(result.figure.polygons[1]).toEqual({ points: ['M', 'N', 'P', 'Q'], fill: true });
    const m = Object.fromEntries(result.figure.measures.map((x) => [x.label, Number(x.value)]));
    expect(m['area MNPQ'] * 2).toBeCloseTo(m['area ABCD'], 3);
  });

  it('drops broken parts and accepts lenient formats', () => {
    const value = {
      points: { A: [0, 0], B: { x: 3, y: 0 }, C: [0, 'x'] },
      segments: [['A', 'B'], ['A', 'Z']],
      circles: [{ center: 'A', through: 'B' }, { center: [1, 1], radius: -2 }],
      polygons: [['A', 'B', 'Q']],
      measures: { AB: 3, ok: true },
    };
    const result = interpretFigure({ status: 'ok', value, ms: 1 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result.figure.points)).toEqual(['A', 'B']);
    expect(result.figure.segments).toEqual([['A', 'B']]);
    expect(result.figure.circles).toEqual([{ center: [0, 0], radius: 3 }]);
    expect(result.figure.polygons).toEqual([]);
    expect(result.figure.measures).toEqual([
      { label: 'AB', value: '3' },
      { label: 'ok', value: 'yes' },
    ]);
  });

  it('reports failures', () => {
    expect(interpretFigure({ status: 'timeout', ms: 1000 }).ok).toBe(false);
    expect(interpretFigure({ status: 'ok', value: { points: {} }, ms: 1 }).ok).toBe(false);
  });
});

describe('geometry demo checks', () => {
  const check = (code: string) => interpretCheck({ status: 'ok', value: toPlain(executeCode(code)), ms: 1 });

  it('confirms the true claims on random quadrilaterals', () => {
    expect(check(GEO_CODE.areaHalf).holds).toBe(true);
    expect(check(GEO_CODE.parallelSides).holds).toBe(true);
    expect(check(GEO_CODE.vectorsEqual).holds).toBe(true);
  });

  it('finds concrete counterexamples to the false ones', () => {
    const product = check(GEO_CODE.productOfSides);
    expect(product.holds).toBe(false);
    expect(product.detail).toMatch(/area of MNPQ = .* but MN · NP = /);
    expect(check(GEO_CODE.diagonalFormula).holds).toBe(false);
    expect(check(GEO_CODE.similar).holds).toBe(false);
  });

  it('quotes its critiques verbatim from the scripted steps', () => {
    expect(geometry.matches(GEOMETRY_PROBLEM)).toBe(true);
    for (const [i, v] of Object.entries(geometry.verdicts)) {
      if (v.status === 'gap' || v.status === 'error') {
        expect(GEOMETRY_STEPS[Number(i)].replace(/\s+/g, '')).toContain(v.quote.replace(/\s+/g, ''));
      }
    }
  });
});

describe('demo image routing', () => {
  it('reads PNG and JPEG sizes from data URLs', () => {
    const png = Buffer.alloc(24);
    png.writeUInt32BE(0x89504e47, 0);
    png.writeUInt32BE(1012, 16);
    png.writeUInt32BE(544, 20);
    expect(imageSize(`data:image/png;base64,${png.toString('base64')}`)).toEqual({ width: 1012, height: 544 });

    // SOI, an APP0 segment of length 4, then SOF0 with height 300 and width 800.
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x01, 0x2c, 0x03, 0x20, 0x03]);
    expect(imageSize(`data:image/jpeg;base64,${jpeg.toString('base64')}`)).toEqual({ width: 800, height: 300 });
  });
});
