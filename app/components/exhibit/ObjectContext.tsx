import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import type { Coffin } from '@/lib/collection';

export function ObjectContext({ coffin }: { coffin: Coffin }) {
  return (
    <section className="object-context">
      <div>
        <p className="eyebrow">ABOUT THE OBJECT</p>
        <h2>{coffin.subtitle}</h2>
        <p>{coffin.description}</p>
        <a href={`https://3dcoffins.berkeley.edu/coffins/${coffin.source}`} className="text-link">
          Full collection record <ArrowUpRight size={16} />
        </a>
        <Link className="text-link provenance-link" href="/research">
          Sources & methodology <ArrowUpRight size={16} />
        </Link>
      </div>
      <dl>
        <div>
          <dt>COLLECTION</dt>
          <dd>{coffin.museum}</dd>
        </div>
        <div>
          <dt>ACCESSION</dt>
          <dd>{coffin.accession}</dd>
        </div>
        <div>
          <dt>ANNOTATION METHOD</dt>
          <dd>Linked surface regions & linguistic layers</dd>
        </div>
      </dl>
    </section>
  );
}

export function NextExhibitLink({ next }: { next: Coffin }) {
  return (
    <Link className="next-exhibit" href={`/exhibits/${next.slug}`} prefetch={false}>
      <span>NEXT EXHIBIT</span>
      <strong>{next.name}</strong>
      <ArrowRight size={30} />
    </Link>
  );
}
