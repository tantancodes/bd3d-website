import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { preload } from 'react-dom';
import { collection, getCoffin } from '@/lib/collection';
import { getCoffinData } from '@/lib/data/load';
import { displayAssets } from '@/lib/data/display-assets';
import { PREVIEW_TIER } from '@/lib/scene/quality';
import Exhibit from '@/app/components/exhibit/Exhibit';

export function generateStaticParams() {
  return collection.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const coffin = getCoffin((await params).slug);
  if (!coffin) return { title: 'Object not found' };
  const description = `${coffin.name}, ${coffin.period}, ${coffin.museum}. Explore the 3D model and read its inscriptions in place.`;
  return {
    title: coffin.name,
    description,
    openGraph: {
      title: `${coffin.name} · BD3D`,
      description,
      images: [`/images/coffins/${coffin.slug}.jpg`],
    },
  };
}

export default async function ExhibitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const coffin = getCoffin(slug);
  const data = await getCoffinData(slug);
  const assets = displayAssets(slug);
  if (!coffin || !data || !assets) notFound();
  // Start the first-view downloads while the viewer's JavaScript is still loading.
  // `fetch()` in the loader reuses these responses (same URL, mode and credentials).
  preload(assets.geometry.url, { as: 'fetch', crossOrigin: 'anonymous' });
  for (const material of assets.materials)
    if (material.texture)
      preload(material.texture.tiers[PREVIEW_TIER].url, { as: 'fetch', crossOrigin: 'anonymous' });
  return <Exhibit key={slug} coffin={coffin} data={data} assets={assets} />;
}
