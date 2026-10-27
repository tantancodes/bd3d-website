import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { cache } from 'react';
import { getCoffin } from '@/lib/collection';
import type { CoffinData } from './schema';
import { parseCoffinData } from './validate';

/**
 * Reads and validates one edition. Unknown slugs return `null`; a malformed or
 * inconsistent file throws at build time instead of failing inside the 3D scene.
 */
export const getCoffinData = cache(async (slug: string): Promise<CoffinData | null> => {
  if (!getCoffin(slug)) return null;
  const file = path.join(process.cwd(), 'data/coffins', `${slug}.json`);
  return parseCoffinData(JSON.parse(await readFile(file, 'utf8')), slug);
});
