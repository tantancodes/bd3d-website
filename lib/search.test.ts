import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { collection } from '@/lib/collection';
import { parseCoffinData } from '@/lib/data/validate';
import { buildSearchIndex, entryHref, searchCollection } from './search';

const editions = collection.map((coffin) => ({
  coffin,
  data: parseCoffinData(
    JSON.parse(readFileSync(`data/coffins/${coffin.slug}.json`, 'utf8')),
    coffin.slug,
  ),
}));
const index = buildSearchIndex(editions);

describe('collection search index', () => {
  it('contains every annotation entry once', () => expect(index).toHaveLength(314));

  it('ranks an exact headword above passing mentions', () => {
    const results = searchCollection(index, 'ꜣḫt');
    expect(results[0].kind).toBe('vocabulary');
    expect(results[0].title).toBe('ꜣḫt');
  });

  it('finds English words in translations across objects', () => {
    const objects = new Set(searchCollection(index, 'osiris').map((r) => r.slug));
    expect(objects.size).toBeGreaterThan(1);
  });

  it('filters by kind and object', () => {
    const results = searchCollection(index, '', { kind: 'inscription', slug: 'amenirdis' });
    expect(results.every((r) => r.kind === 'inscription' && r.slug === 'amenirdis')).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  it('links to a real region of the entry', () => {
    const entry = index[0];
    const data = editions.find((e) => e.coffin.slug === entry.slug)!.data;
    expect(data.areas.some((a) => a.id === entry.region)).toBe(true);
    expect(entryHref(entry)).toMatch(new RegExp(`^/exhibits/${entry.slug}\\?region=`));
  });
});
