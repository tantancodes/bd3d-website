import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseCoffinData } from '@/lib/data/validate';
import type { Annotation } from '@/lib/data/schema';
import { buildLexicon, gloss, lookup, tokenize } from './vocabulary';

const vocab = (id: string, title: string, description = `${title} n thing`): Annotation => ({
  id,
  title,
  kind: 'vocabulary',
  description,
  fragments: [],
  areaIds: [`${id}:0`],
});

describe('tokenize', () => {
  it('keeps words, spaces and punctuation in order', () => {
    const tokens = tokenize('pr=f m ꜣḫt,');
    expect(tokens.map((t) => t.text).join('')).toBe('pr=f m ꜣḫt,');
    expect(tokens.filter((t) => t.word).map((t) => t.text)).toEqual(['pr=f', 'm', 'ꜣḫt']);
  });
});

describe('lookup', () => {
  const lexicon = buildLexicon([
    vocab('a', 'ꜣḫt'),
    vocab('b', 'pr'),
    vocab('c', 'jr='),
    vocab('n1', 'n', 'n prep to'),
    vocab('n2', 'n', 'n neg not'),
  ]);
  it('matches exact spellings', () =>
    expect(lookup(lexicon, 'ꜣḫt').map((e) => e.id)).toEqual(['a']));
  it('matches a headword written with "="', () =>
    expect(lookup(lexicon, 'jr=ṯn').map((e) => e.id)).toEqual(['c']));
  it('falls back to the stem before a suffix pronoun', () =>
    expect(lookup(lexicon, 'pr=f').map((e) => e.id)).toEqual(['b']));
  it('returns every homograph instead of guessing', () =>
    expect(lookup(lexicon, 'n').map((e) => e.id)).toEqual(['n1', 'n2']));
  it('does not stem or guess', () => expect(lookup(lexicon, 'prj')).toEqual([]));
  it('strips the repeated headword from the gloss', () =>
    expect(gloss(vocab('x', 'ꜣḫt', 'ꜣḫt n (f) horizon'))).toBe('n (f) horizon'));
});

describe('imported vocabulary', () => {
  it('links words in Psamtik-Seneb lines to entries that have surface regions', () => {
    const data = parseCoffinData(
      JSON.parse(readFileSync('data/coffins/psamtikseneb.json', 'utf8')),
      'psamtikseneb',
    );
    const lexicon = buildLexicon(data.annotations);
    const horizon = lookup(lexicon, 'ꜣḫt');
    expect(horizon).toHaveLength(1);
    expect(horizon[0].areaIds.length).toBeGreaterThan(0);
  });
});
