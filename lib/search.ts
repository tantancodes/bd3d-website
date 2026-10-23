import type { Coffin } from '@/lib/collection';
import type { AnnotationKind, CoffinData } from '@/lib/data/schema';
import { displayTitle } from '@/lib/annotations';
import { gloss } from '@/lib/vocabulary';

/** One searchable entry across the collection, small enough to ship to the browser. */
export type SearchEntry = {
  slug: string;
  object: string;
  id: string;
  kind: AnnotationKind;
  title: string;
  /** Translation lines, interpretation note or vocabulary gloss. */
  text: string;
  transliteration: string;
  /** First surface region, used for the deep link. */
  region: string;
  locations: number;
};

export function buildSearchIndex(editions: { coffin: Coffin; data: CoffinData }[]): SearchEntry[] {
  return editions.flatMap(({ coffin, data }) =>
    data.annotations.map((entry) => ({
      slug: coffin.slug,
      object: coffin.name,
      id: entry.id,
      kind: entry.kind,
      title: entry.kind === 'vocabulary' ? entry.title : displayTitle(entry),
      text:
        entry.kind === 'vocabulary'
          ? gloss(entry)
          : [entry.description, ...entry.fragments.map((f) => f.translation)]
              .filter(Boolean)
              .join(' '),
      transliteration: entry.fragments.map((f) => f.transliteration).join(' '),
      region: entry.areaIds[0],
      locations: entry.areaIds.length,
    })),
  );
}

export type SearchFilters = { kind?: AnnotationKind | 'all'; slug?: string | 'all' };

/**
 * Case-insensitive search. Ranking: exact headword/title, then title prefix, then a match
 * anywhere in the title, then translation or transliteration text.
 */
export function searchCollection(
  index: SearchEntry[],
  query: string,
  { kind = 'all', slug = 'all' }: SearchFilters = {},
): SearchEntry[] {
  const needle = query.trim().toLowerCase();
  const scoped = index.filter(
    (entry) => (kind === 'all' || entry.kind === kind) && (slug === 'all' || entry.slug === slug),
  );
  if (!needle) return scoped;
  const scored: { entry: SearchEntry; score: number }[] = [];
  for (const entry of scoped) {
    const title = entry.title.toLowerCase();
    const body = `${entry.text} ${entry.transliteration}`.toLowerCase();
    const score =
      title === needle
        ? 4
        : title.startsWith(needle)
          ? 3
          : title.includes(needle)
            ? 2
            : body.includes(needle)
              ? 1
              : 0;
    if (score) scored.push({ entry, score });
  }
  return scored.sort((a, b) => b.score - a.score).map(({ entry }) => entry);
}

/** Link that opens the exhibit focused on the entry's first location. */
export function entryHref(entry: Pick<SearchEntry, 'slug' | 'region'>): string {
  return `/exhibits/${entry.slug}?region=${encodeURIComponent(entry.region)}`;
}
