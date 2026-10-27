import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import type { Coffin } from '@/lib/collection';
import type { DisplayModelAssets } from '@/lib/data/display-assets';
import type { CoffinData } from '@/lib/data/schema';

/** Below the workspace: what the object is, where it lives, and how it was recorded. */
export function ObjectContext({
  coffin,
  data,
  assets,
}: {
  coffin: Coffin;
  data: CoffinData;
  assets: DisplayModelAssets;
}) {
  const kinds = (kind: string) => data.annotations.filter((a) => a.kind === kind).length;
  return (
    <section className="object-context" aria-labelledby="about-title">
      <div className="object-context__text">
        <p className="eyebrow">About the object</p>
        <h2 id="about-title">{coffin.subtitle}</h2>
        <p>{coffin.description}</p>
        <div className="link-row">
          <a href={`https://3dcoffins.berkeley.edu/coffins/${coffin.source}`} className="text-link">
            Collection record <ArrowUpRight size={14} aria-hidden="true" />
          </a>
          <a href={data.source} className="text-link">
            Annotation edition <ArrowUpRight size={14} aria-hidden="true" />
          </a>
          <Link className="text-link" href="/research">
            Sources and method <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
      <dl className="spec-list">
        <div>
          <dt>Collection</dt>
          <dd>
            {coffin.museum}, {coffin.location}
          </dd>
        </div>
        <div>
          <dt>Accession</dt>
          <dd className="mono">{coffin.accession}</dd>
        </div>
        <div>
          <dt>Annotations</dt>
          <dd>
            {kinds('inscription')} inscriptions · {kinds('interpretation')} notes ·{' '}
            {kinds('vocabulary')} vocabulary entries · {data.areas.length} mapped regions
          </dd>
        </div>
        <div>
          <dt>Model</dt>
          <dd>
            {assets.geometry.triangles.toLocaleString('en-US')} triangles ·{' '}
            {assets.materials.filter((m) => m.texture).length} photographic textures
          </dd>
        </div>
      </dl>
    </section>
  );
}

export function NextExhibitLink({ next, index }: { next: Coffin; index: number }) {
  return (
    <Link className="next-exhibit" href={`/exhibits/${next.slug}`} prefetch={false}>
      <span className="eyebrow">Next object · {String(index + 1).padStart(2, '0')}</span>
      <strong>{next.name}</strong>
      <ArrowRight size={28} aria-hidden="true" />
    </Link>
  );
}
