import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { collection, getCoffin } from '@/lib/collection';
import { getCoffinData } from '@/lib/data/load';
import { displayAssets } from '@/lib/data/display-assets';
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
  return <Exhibit key={slug} coffin={coffin} data={data} assets={assets} />;
}
