import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { cache } from 'react';
import { getCoffin, type CoffinData } from './collection';
export const getCoffinData = cache(async (slug: string): Promise<CoffinData | null> => {
  if (!getCoffin(slug)) return null;
  return JSON.parse(await readFile(path.join(process.cwd(), 'data/coffins', `${slug}.json`), 'utf8'));
});
