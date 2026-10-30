import { STANDALONE } from './api';

// The single-file demo embeds the sample photos; the server build serves them from /samples.
const embedded: Record<string, string> = STANDALONE
  ? import.meta.glob('../../public/samples/*.png', { eager: true, query: '?inline', import: 'default' })
  : {};

export function sampleUrl(file: string): string {
  return STANDALONE ? embedded[`../../public/samples/${file}`] : `/samples/${file}`;
}
