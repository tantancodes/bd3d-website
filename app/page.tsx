import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { collection } from '@/lib/collection';
import { getCoffinData } from '@/lib/data/load';
import SiteHeader from './components/site/SiteHeader';
import SiteFooter from './components/site/SiteFooter';
import CollectionBrowser, { type CollectionItem } from './components/home/CollectionBrowser';
import Emblem from './components/home/Emblem';
import Intro from './components/home/Intro';
import RevealText from './components/home/RevealText';

export default async function Home() {
  const items: CollectionItem[] = await Promise.all(
    collection.map(async (coffin) => {
      const data = (await getCoffinData(coffin.slug))!;
      return { ...coffin, entries: data.annotations.length, regions: data.areas.length };
    }),
  );
  const entries = items.reduce((n, c) => n + c.entries, 0);
  const regions = items.reduce((n, c) => n + c.regions, 0);
  const featured = items[0];

  return (
    <>
      <Intro />
      <a className="skip-link" href="#collection">
        Skip to collection
      </a>
      <SiteHeader />
      <main>
        <section className="hero" aria-labelledby="hero-title">
          <Emblem className="hero__emblem" title="BD3D" />
          <h1 id="hero-title">
            <RevealText text="Read ancient coffins where the words were written." />
          </h1>
          <p className="hero__lede hero__in">
            Six Egyptian coffins in 3D. Select any inscription to read it in hieroglyphs,
            transliteration and translation, on the surface where it was carved.
          </p>
          <div className="hero__actions hero__in">
            <Link className="button button--primary button--large" href="#collection">
              Enter the collection
            </Link>
            <Link className="text-link" href="/search">
              Search the inscriptions <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <Link
            className="hero__product hero__in"
            href={`/exhibits/${featured.slug}`}
            prefetch={false}
            aria-label={`Enter the ${featured.name} exhibit`}
          >
            <picture>
              <source
                media="(max-width: 640px)"
                srcSet="/images/product/viewer-mobile.jpg"
                width={640}
                height={800}
              />
              <img
                src="/images/product/viewer.jpg"
                alt={`The BD3D viewer: the coffin of ${featured.name} with its central inscription selected`}
                width={1440}
                height={900}
                fetchPriority="high"
              />
            </picture>
          </Link>
        </section>

        <section
          id="collection"
          className="section collection-section"
          aria-labelledby="collection-title"
        >
          <div className="section__heading">
            <h2 id="collection-title">Six coffins, three collections</h2>
            <p>
              {entries} entries mapped to {regions} regions on the surface. Choose an object, turn
              it, and select an outlined region to read what is written there.
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
