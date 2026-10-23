import { describe, expect, it } from 'vitest';
import type { Annotation } from '@/lib/data/schema';
import {
  adjacentKind,
  cycleLocation,
  displayTitle,
  filterAnnotations,
  searchableText,
} from './annotations';

const entry = (over: Partial<Annotation>): Annotation => ({
  id: 'a',
  title: 'center-columns',
  kind: 'inscription',
  description: '',
  fragments: [],
  areaIds: ['r1'],
  ...over,
});

describe('annotation search', () => {
  const entries = [
    entry({
      id: 'center',
      fragments: [
        {
          hieroglyphs: '',
          hieroglyphUnicode: '',
          transliteration: 'pr=f m ꜣḫt',
          translation: 'as he emerges from the horizon,',
        },
      ],
    }),
    entry({
      id: 'nut',
      kind: 'interpretation',
      title: 'nut',
      description: 'Nut spreads her wings',
    }),
    entry({ id: 'lex10', kind: 'vocabulary', title: 'ꜣḫt', description: 'ꜣḫt n (f) horizon' }),
  ];

  it('matches translations and transliterations case-insensitively', () => {
    expect(filterAnnotations(entries, 'inscription', 'HORIZON').map((e) => e.id)).toEqual([
      'center',
    ]);
    expect(filterAnnotations(entries, 'inscription', 'ꜣḫt').map((e) => e.id)).toEqual(['center']);
  });

  it('only returns entries of the requested kind', () => {
    expect(filterAnnotations(entries, 'vocabulary', 'horizon').map((e) => e.id)).toEqual(['lex10']);
  });

  it('returns every entry of a kind for an empty query', () => {
    expect(filterAnnotations(entries, 'interpretation', '')).toHaveLength(1);
  });

  it('includes titles and notes in the searchable text', () => {
    expect(searchableText(entries[1])).toContain('wings');
  });
});

describe('location cycling', () => {
  const ids = ['a', 'b', 'c'];
  it('moves forward and wraps', () => {
    expect(cycleLocation(ids, 'a', 1)).toBe('b');
    expect(cycleLocation(ids, 'c', 1)).toBe('a');
  });
  it('moves backward and wraps', () => {
    expect(cycleLocation(ids, 'a', -1)).toBe('c');
  });
});

describe('tabs and titles', () => {
  it('arrow keys wrap through the three kinds', () => {
    expect(adjacentKind('vocabulary', 1)).toBe('inscription');
    expect(adjacentKind('inscription', -1)).toBe('vocabulary');
  });
  it('shows hyphenated source titles with spaces', () => {
    expect(displayTitle(entry({ title: 'shining-top' }))).toBe('shining top');
  });
});
