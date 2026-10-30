import katex from 'katex';
import 'katex/dist/katex.min.css';
import { memo } from 'react';

const MATH = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|(?<!\\)\$((?:\\\$|[^$])+?)\$/g;

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function plain(s: string): string {
  return escapeHtml(s.replace(/\\\$/g, '$'))
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

function tex(source: string, displayMode: boolean): string {
  try {
    return katex.renderToString(source, { displayMode, throwOnError: false, strict: 'ignore', output: 'html' });
  } catch {
    return `<code>${escapeHtml(source)}</code>`;
  }
}

/** Renders text with $inline$, $$display$$, \(..\) and \[..\] math as HTML. */
export function mathToHtml(text: string): string {
  let html = '';
  let last = 0;
  for (const m of text.matchAll(MATH)) {
    html += plain(text.slice(last, m.index));
    const display = m[1] ?? m[2];
    html += display !== undefined ? tex(display, true) : tex((m[3] ?? m[4]).trim(), false);
    last = m.index! + m[0].length;
  }
  return html + plain(text.slice(last));
}

export const MathText = memo(function MathText({
  text,
  block = false,
  className,
}: {
  text: string;
  block?: boolean;
  className?: string;
}) {
  const Tag = block ? 'div' : 'span';
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: mathToHtml(text) }} />;
});
