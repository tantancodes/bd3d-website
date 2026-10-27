import type { Annotation, AnnotationKind, CoffinData, Region } from '@/lib/data/schema';

export const ANNOTATION_KINDS: readonly AnnotationKind[] = [
  'inscription',
  'interpretation',
  'vocabulary',
];

export const KIND_LABELS: Record<AnnotationKind, string> = {
  inscription: 'Inscriptions',
  interpretation: 'Stories',
  vocabulary: 'Vocabulary',
};

export const LINGUISTIC_LAYERS = [
  'All layers',
  'Translation',
  'Transliteration',
  'Hieroglyphs',
] as const;
export type LinguisticLayer = (typeof LINGUISTIC_LAYERS)[number];

export function showsLayer(
  selected: LinguisticLayer,
  layer: Exclude<LinguisticLayer, 'All layers'>,
) {
  return selected === 'All layers' || selected === layer;
}

/** Tab reached by the arrow keys from `current` (wraps around). */
export function adjacentKind(current: AnnotationKind, direction: 1 | -1): AnnotationKind {
  const i = ANNOTATION_KINDS.indexOf(current);
  return ANNOTATION_KINDS[(i + direction + ANNOTATION_KINDS.length) % ANNOTATION_KINDS.length];
}

/** Lower-cased text a query is matched against: title, note, translations, transliterations. */
export function searchableText(entry: Annotation): string {
  const fragments = entry.fragments.map((f) => `${f.translation} ${f.transliteration}`).join(' ');
  return `${entry.title} ${entry.description} ${fragments}`.toLowerCase();
}

/** Entries of one kind whose searchable text contains `query` (case-insensitive substring). */
export function filterAnnotations(
  entries: Annotation[],
  kind: AnnotationKind,
  query: string,
): Annotation[] {
  const needle = query.toLowerCase();
  return entries.filter((entry) => entry.kind === kind && searchableText(entry).includes(needle));
}

/** Surface regions belonging to the given entries. */
export function regionsForEntries(data: CoffinData, entries: Annotation[]): Region[] {
  const ids = new Set(entries.map((entry) => entry.id));
  return data.areas.filter((region) => ids.has(region.textId));
}

/** Next or previous occurrence of an entry on the object, wrapping around. */
export function cycleLocation(areaIds: string[], current: string | null, delta: number): string {
  const index = current ? areaIds.indexOf(current) : -1;
  return areaIds[(index + delta + areaIds.length) % areaIds.length];
}

/** Source titles use hyphens as word separators (e.g. "shining-top"). */
export function displayTitle(entry: Annotation): string {
  return entry.title.replaceAll('-', ' ');
}
