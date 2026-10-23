import { CoffinDataSchema, type CoffinData } from './schema';

export class CoffinDataError extends Error {
  constructor(
    readonly slug: string,
    readonly problems: string[],
  ) {
    super(`Invalid annotation data for "${slug}":\n- ${problems.join('\n- ')}`);
    this.name = 'CoffinDataError';
  }
}

/**
 * Checks the links between surfaces and entries that the schema alone cannot express.
 * Returns a list of human-readable problems; an empty list means the edition is consistent.
 */
export function findIntegrityProblems(data: CoffinData): string[] {
  const problems: string[] = [];
  const regionIds = new Map<string, number>();
  const annotationIds = new Map<string, number>();
  for (const region of data.areas) regionIds.set(region.id, (regionIds.get(region.id) ?? 0) + 1);
  for (const entry of data.annotations)
    annotationIds.set(entry.id, (annotationIds.get(entry.id) ?? 0) + 1);

  for (const [id, count] of regionIds)
    if (count > 1) problems.push(`region id "${id}" appears ${count} times`);
  for (const [id, count] of annotationIds)
    if (count > 1) problems.push(`annotation id "${id}" appears ${count} times`);

  for (const region of data.areas) {
    if (!annotationIds.has(region.textId))
      problems.push(`region "${region.id}" links to missing annotation "${region.textId}"`);
  }
  for (const entry of data.annotations) {
    for (const areaId of entry.areaIds) {
      const region = data.areas.find((r) => r.id === areaId);
      if (!region) problems.push(`annotation "${entry.id}" lists missing region "${areaId}"`);
      else if (region.textId !== entry.id)
        problems.push(
          `annotation "${entry.id}" lists region "${areaId}", which links back to "${region.textId}"`,
        );
    }
  }
  return problems;
}

/** Parses untrusted JSON into typed edition data, or throws a descriptive `CoffinDataError`. */
export function parseCoffinData(raw: unknown, expectedSlug: string): CoffinData {
  const result = CoffinDataSchema.safeParse(raw);
  if (!result.success) {
    throw new CoffinDataError(
      expectedSlug,
      result.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`),
    );
  }
  const problems = findIntegrityProblems(result.data);
  if (result.data.slug !== expectedSlug)
    problems.unshift(`slug is "${result.data.slug}", expected "${expectedSlug}"`);
  if (problems.length) throw new CoffinDataError(expectedSlug, problems);
  return result.data;
}
