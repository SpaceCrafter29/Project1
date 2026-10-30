import type { Problem } from './types';

/** The problem as the model sees it: the confirmed text plus the confirmed figure description. */
export function problemText(problem: Problem): string {
  const figure = problem.figure?.trim();
  return figure ? `${problem.transcript.trim()}\n\nFigure: ${figure}` : problem.transcript.trim();
}
