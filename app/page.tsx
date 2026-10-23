import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { collection } from '@/lib/collection';
import { getCoffinData } from '@/lib/data/load';
import SiteHeader from './components/site/SiteHeader';
import SiteFooter from './components/site/SiteFooter';
import CollectionBrowser, { type CollectionItem } from './components/home/CollectionBrowser';

export default async function Home() {
  const items: CollectionItem[] = await Promise.all(
    collection.map(async (coffin) => {
      const data = (await getCoffinData(coffin.slug))!;
      return { ...coffin, entries: data.annotations.length, regions: data.areas.length };
    }),
  );
  const entries = items.reduce((n, c) => n + c.entries, 0);
  const regions = items.reduce((n, c) => n + c.regions, 0);
  const museums = new Set(items.map((c) => c.museum)).size;
  const featured = items[0];

  return (
    <>
      <a className="skip-link" href="#collection">
        Skip to collection
      </a>
      <SiteHeader />
      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__copy">
            <p className="eyebrow">UC Berkeley · The Book of the Dead in 3D</p>
            <h1 id="hero-title">Read ancient Egyptian coffins where the words were written.</h1>
            <p className="hero__lede">
              Six coffins as photogrammetric models. Every annotated inscription is mapped to its
              place on the surface, with hieroglyphs, transliteration and translation side by side.
            </p>
            <div className="hero__actions">
              <Link
                className="button button--primary button--large"
                href={`/exhibits/${featured.slug}`}
                prefetch={false}
              >
                Open {featured.name} <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link className="button button--large" href="/search">
                Search the inscriptions
              </Link>
            </div>
            <dl className="stats">
              <div>
                <dt>Objects</dt>
                <dd>{items.length}</dd>
              </div>
              <div>
                <dt>Annotated entries</dt>
                <dd>{entries}</dd>
              </div>
              <div>
                <dt>Mapped regions</dt>
                <dd>{regions}</dd>
              </div>
              <div>
                <dt>Collections</dt>
                <dd>{museums}</dd>
              </div>
            </dl>
          </div>
          <Link
            className="hero__figure"
            href={`/exhibits/${featured.slug}`}
            prefetch={false}
            aria-label={`Enter the ${featured.name} exhibit`}
          >
            <Image
              src={`/images/coffins/${featured.slug}.jpg`}
              alt={`The coffin of ${featured.name}`}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 46vw"
            />
            <span className="hero__caption">
              <span>{featured.name}</span>
              <span className="mono">
                {featured.museum} · {featured.accession}
              </span>
            </span>
          </Link>
        </section>

        <section
          id="collection"
          className="section collection-section"
          aria-labelledby="collection-title"
        >
          <div className="section__heading">
            <p className="eyebrow">The collection</p>
            <h2 id="collection-title">Six objects in three collections</h2>
            <p>
              Each exhibit opens the model with its published annotation edition. Choose an object
              to turn it, select an outlined region, and read what is written there.
            </p>
          </div>
          <CollectionBrowser items={items} />
        </section>

        <section className="section method" aria-labelledby="method-title">
          <div className="section__heading">
            <p className="eyebrow">How it works</p>
            <h2 id="method-title">A surface, a text, and the link between them</h2>
          </div>
          <ol className="method__steps">
            <li>
              <span className="mono">01</span>
              <h3>Scanned</h3>
              <p>
                Each coffin was photographed from every side and reconstructed as a textured 3D
                model. The photographs carry the fine detail of paint and carving.
              </p>
            </li>
            <li>
              <span className="mono">02</span>
              <h3>Mapped</h3>
              <p>
                Editors drew {regions} regions on the models and linked each to an inscription, an
                interpretive note or a dictionary entry.
              </p>
            </li>
            <li>
              <span className="mono">03</span>
              <h3>Read</h3>
              <p>
                Select a region to read it, or a line of text to find it on the object. Words in a
                transliteration lead to their entries and every place they occur.
              </p>
            </li>
          </ol>
          <Link className="text-link" href="/research">
            Sources, method and editorial limits <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
