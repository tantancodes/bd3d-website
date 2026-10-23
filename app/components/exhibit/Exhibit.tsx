'use client';
import Link from 'next/link';
import Script from 'next/script';
import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { collection, type Coffin } from '@/lib/collection';
import type { CoffinData } from '@/lib/data/schema';
import ModelStage from './ModelStage';
import { NextExhibitLink, ObjectContext } from './ObjectContext';
import ReadingPanel from './ReadingPanel';
import { useExhibitState } from './useExhibitState';

/** One exhibit page: the 3D stage and the reading panel share a single state hook. */
export default function Exhibit({ coffin, data }: { coffin: Coffin; data: CoffinData }) {
  const reduced = !!useReducedMotion();
  const state = useExhibitState(data, reduced);
  const [expanded, setExpanded] = useState(false);
  const [rendererReady, setRendererReady] = useState(false);
  const [rendererFailed, setRendererFailed] = useState(false);

  const index = collection.findIndex((c) => c.slug === coffin.slug);
  const next = collection[(index + 1) % collection.length];

  return (
    <main className={`exhibit-page ${expanded ? 'is-expanded' : ''}`}>
      <a className="skip-link" href="#annotation-panel">
        Skip to annotations
      </a>
      {/* Nederhof's ResLite renderer draws the hieroglyphs; loaded once per exhibit page. */}
      <Script
        src="/vendor/nederhof/reslite.js"
        onReady={() => setRendererReady(true)}
        onError={() => setRendererFailed(true)}
      />
      <header className="exhibit-header">
        <Link href="/#collection" className="back-link">
          <ArrowLeft size={17} /> Collection
        </Link>
        <Link href="/" className="wordmark">
          BD<span>3D</span>
          <i />
        </Link>
        <span>
          EXHIBIT {String(index + 1).padStart(2, '0')} /{' '}
          {String(collection.length).padStart(2, '0')}
        </span>
      </header>
      <motion.div
        className="exhibit-intro"
        initial={reduced ? false : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <div>
          <p className="eyebrow">
            {coffin.accession} · {coffin.period}
          </p>
          <h1>{coffin.name}</h1>
        </div>
        <p>
          {coffin.subtitle}
          <span>{coffin.museum}</span>
        </p>
      </motion.div>
      <div className="exhibit-workspace">
        <ModelStage
          coffin={coffin}
          data={data}
          state={state}
          reduced={reduced}
          expanded={expanded}
          onExpandedChange={setExpanded}
        />
        <ReadingPanel
          coffin={coffin}
          data={data}
          state={state}
          rendererReady={rendererReady}
          rendererFailed={rendererFailed}
        />
      </div>
      <ObjectContext coffin={coffin} />
      <NextExhibitLink next={next} />
    </main>
  );
}
