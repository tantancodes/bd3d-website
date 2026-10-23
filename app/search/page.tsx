import type { Metadata } from 'next';
import { collection } from '@/lib/collection';
import { getCoffinData } from '@/lib/data/load';
import { buildSearchIndex } from '@/lib/search';
import SiteHeader from '../components/site/SiteHeader';
import SiteFooter from '../components/site/SiteFooter';
import SearchClient from '../components/search/SearchClient';

export const metadata: Metadata = {
  title: 'Search the inscriptions',
  description:
    'Search translations, transliterations, notes and vocabulary across all six annotated coffins.',
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const q = (await searchParams).q;
  const initialQuery = (Array.isArray(q) ? q[0] : q)?.slice(0, 120) ?? '';
  const editions = await Promise.all(
    collection.map(async (coffin) => ({ coffin, data: (await getCoffinData(coffin.slug))! })),
  );
  const index = buildSearchIndex(editions);
  return (
    <>
      <SiteHeader current="search" />
      <main className="search-page">
        <header className="page-intro">
          <p className="eyebrow">Search</p>
          <h1>Search the inscriptions</h1>
          <p>
            {index.length} entries across {collection.length} objects: translations,
            transliterations, interpretive notes and vocabulary. Each result opens the object at the
            place where the text is written.
          </p>
        </header>
        <SearchClient
          index={index}
          objects={collection.map(({ slug, name }) => ({ slug, name }))}
          initialQuery={initialQuery}
        />
      </main>
      <SiteFooter />
    </>
  );
}
