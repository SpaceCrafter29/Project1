import { describe, expect, it } from 'vitest';
import { parseParts, partOfStep } from '../../shared/parts';
import { dragBox } from '../../src/components/PenCanvas';
import { DEMO_PROBLEM } from '../../server/llm/mock/scripts/numberTheory';
import { GEOMETRY_PROBLEM } from '../../server/llm/mock/scripts/geometry';

describe('parseParts', () => {
  it('splits problems with parts on separate lines', () => {
    const { stem, parts } = parseParts(DEMO_PROBLEM);
    expect(stem).toBe('');
    expect(parts.map((p) => p.label)).toEqual(['a', 'b']);
    expect(parts[0].text).toMatch(/^Find all positive integers/);
    expect(parts[1].text).toMatch(/^Prove that there is no/);
  });

  it('keeps the shared set-up as the stem', () => {
    const { stem, parts } = parseParts(GEOMETRY_PROBLEM);
    expect(stem).toMatch(/^Let \$ABCD\$ be a convex quadrilateral/);
    expect(parts.map((p) => p.label)).toEqual(['a', 'b']);
    expect(parts[1].text).toMatch(/area of \$MNPQ\$ is half/);
  });

  it('finds inline markers, but only as a run a, b, c …', () => {
    expect(parseParts('Let x > 0. (a) Show A. (b) Show B. (c) Show C.').parts.map((p) => p.label)).toEqual(['a', 'b', 'c']);
    expect(parseParts('Prove the statement (b) from the lemma.').parts).toEqual([]);
    expect(parseParts('Only (a) Show this.').parts).toEqual([]);
  });

  it('tells which part a solution step starts', () => {
    expect(partOfStep('(b) The area of MNPQ is …')).toBe('b');
    expect(partOfStep('Hence 7 | 2^n - 1 exactly when … Answer (a): n = 3k.')).toBeNull();
  });
});

describe('dragBox (crop frame)', () => {
  const box = { x: 100, y: 100, w: 200, h: 100 };
  it('moves inside the image', () => {
    expect(dragBox(box, 'move', 50, -20, 1000, 800)).toEqual({ x: 150, y: 80, w: 200, h: 100 });
    expect(dragBox(box, 'move', 2000, 2000, 1000, 800)).toEqual({ x: 800, y: 700, w: 200, h: 100 });
  });

  it('resizes from each corner and never inverts or leaves the image', () => {
    expect(dragBox(box, 'br', 40, 30, 1000, 800)).toEqual({ x: 100, y: 100, w: 240, h: 130 });
    expect(dragBox(box, 'tl', -500, -500, 1000, 800)).toEqual({ x: 0, y: 0, w: 300, h: 200 });
    const squeezed = dragBox(box, 'tr', -1000, 1000, 1000, 800);
    expect(squeezed.w).toBeCloseTo(30);
    expect(squeezed.h).toBeCloseTo(30);
    expect(squeezed.x).toBe(100);
  });
});
