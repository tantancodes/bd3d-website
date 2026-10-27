import type { Annotation } from '@/lib/data/schema';

export type Token = { text: string; word: boolean };

const SEPARATORS = /(\s+|[.,;:!?()[\]⸢⸣<>{}]+)/;
const SEPARATOR_ONLY = /^(\s+|[.,;:!?()[\]⸢⸣<>{}]+)$/;

/** Splits a transliteration line into words and the separators between them. */
export function tokenize(transliteration: string): Token[] {
  return transliteration
    .split(SEPARATORS)
    .filter((part) => part.length > 0)
    .map((text) => ({ text, word: !SEPARATOR_ONLY.test(text) }));
}

/** Vocabulary entries of one edition, indexed by headword. Homographs share a key. */
export type Lexicon = Map<string, Annotation[]>;

export function buildLexicon(entries: Annotation[]): Lexicon {
  const lexicon: Lexicon = new Map();
  for (const entry of entries) {
    if (entry.kind !== 'vocabulary') continue;
    lexicon.set(entry.title, [...(lexicon.get(entry.title) ?? []), entry]);
  }
  return lexicon;
}

/**
 * Headword entries for one transliterated word. Exact spelling only: the word itself, then
 * the word up to and including a suffix-pronoun "=", then the stem before "=" (pr=f → pr).
 * No morphology or stemming is attempted, so a missing match means "not matched", not
 * "not in the vocabulary".
 */
export function lookup(lexicon: Lexicon, word: string): Annotation[] {
  const candidates = [word];
  const clitic = word.indexOf('=');
  if (clitic > 0) candidates.push(word.slice(0, clitic + 1), word.slice(0, clitic));
  for (const candidate of candidates) {
    const entries = lexicon.get(candidate);
    if (entries?.length) return entries;
  }
  return [];
}

/** Gloss text without the repeated headword ("ꜣḫt n (f) horizon" → "n (f) horizon"). */
export function gloss(entry: Annotation): string {
  return entry.description.startsWith(entry.title)
    ? entry.description.slice(entry.title.length).trim()
    : entry.description;
}
