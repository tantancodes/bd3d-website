import { notFound } from 'next/navigation';
import { collection, getCoffin } from '@/lib/collection';
import { getCoffinData } from '@/lib/coffin-data';
import Exhibit from '@/app/components/Exhibit';
export function generateStaticParams() { return collection.map(({slug})=>({slug})); }
export async function generateMetadata({params}: {params: Promise<{slug: string}>}) {
  const coffin = getCoffin((await params).slug);
  return { title: coffin ? `${coffin.name} — Book of the Dead in 3D` : 'Exhibit not found' };
}
export default async function ExhibitPage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params;
  const coffin = getCoffin(slug), data = await getCoffinData(slug);
  if (!coffin || !data) notFound();
  return <Exhibit coffin={coffin} data={data} />;
}
