import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { collection } from '@/lib/collection';
import { CoffinDataError, findIntegrityProblems, parseCoffinData } from './validate';

function rawEdition(slug: string): unknown {
  return JSON.parse(readFileSync(path.join(process.cwd(), 'data/coffins', `${slug}.json`), 'utf8'));
}

describe('imported editions', () => {
  it.each(collection.map((c) => c.slug))('%s passes schema and link checks', (slug) => {
    expect(() => parseCoffinData(rawEdition(slug), slug)).not.toThrow();
  });

  it('match the totals recorded by the import (314 entries, 607 regions)', () => {
    const editions = collection.map((c) => parseCoffinData(rawEdition(c.slug), c.slug));
    expect(editions.reduce((n, e) => n + e.annotations.length, 0)).toBe(314);
    expect(editions.reduce((n, e) => n + e.areas.length, 0)).toBe(607);
  });
});

describe('integrity checks', () => {
  const base = () =>
    parseCoffinData(rawEdition('psamtikseneb'), 'psamtikseneb') as ReturnType<typeof parseCoffinData>;

  it('reports a region pointing at a missing entry', () => {
    const data = base();
    data.areas[0] = { ...data.areas[0], textId: 'nope' };
    expect(findIntegrityProblems(data).join('\n')).toMatch(/missing annotation "nope"/);
  });

  it('reports an entry listing a missing region', () => {
    const data = base();
    data.annotations[0] = { ...data.annotations[0], areaIds: ['ghost'] };
    expect(findIntegrityProblems(data).join('\n')).toMatch(/missing region "ghost"/);
  });

  it('reports duplicate ids', () => {
    const data = base();
    data.areas.push({ ...data.areas[0] });
    expect(findIntegrityProblems(data).join('\n')).toMatch(/appears 2 times/);
  });

  it('rejects malformed coordinates with a path to the problem', () => {
    const raw = rawEdition('psamtikseneb') as { areas: { lines: number[][] }[] };
    raw.areas[0].lines[0] = [1, 2, 3];
    expect(() => parseCoffinData(raw, 'psamtikseneb')).toThrow(CoffinDataError);
    expect(() => parseCoffinData(raw, 'psamtikseneb')).toThrow(/areas\.0\.lines\.0/);
  });

  it('rejects a file whose slug does not match its name', () => {
    expect(() => parseCoffinData(rawEdition('psamtik'), 'psamtikseneb')).toThrow(/expected "psamtikseneb"/);
  });
});
