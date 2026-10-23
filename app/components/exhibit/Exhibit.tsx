'use client';
import Link from 'next/link';
import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Keyboard, Link2, Search } from 'lucide-react';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { collection, type Coffin } from '@/lib/collection';
import type { CoffinData } from '@/lib/data/schema';
import type { DisplayModelAssets } from '@/lib/data/display-assets';
import { parseViewerLink, serializeViewerLink } from '@/lib/url-state';
import ModelStage from './ModelStage';
import { NextExhibitLink, ObjectContext } from './ObjectContext';
import ReadingPanel from './ReadingPanel';
import ShortcutSheet from './ShortcutSheet';
import { useExhibitState } from './useExhibitState';
import { useQualitySetting } from './useQualitySetting';
import { useViewerShortcuts } from './useViewerShortcuts';

const pad = (n: number) => String(n).padStart(2, '0');

/** One exhibit: the 3D stage and the reading panel share a single state hook. */
export default function Exhibit({
  coffin,
  data,
  assets,
}: {
  coffin: Coffin;
  data: CoffinData;
  assets: DisplayModelAssets;
}) {
  const reduced = !!useReducedMotion();
  const state = useExhibitState(data, reduced);
  const [expanded, setExpanded] = useState(false);
  const [inspectOpen, setInspectOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [rendererReady, setRendererReady] = useState(false);
  const [rendererFailed, setRendererFailed] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [quality, setQuality] = useQualitySetting();
  const search = useRef<HTMLInputElement>(null);
  const linkApplied = useRef(false);

  const index = collection.findIndex((c) => c.slug === coffin.slug);
  const previous = collection[(index - 1 + collection.length) % collection.length];
  const next = collection[(index + 1) % collection.length];

  const onModelReady = useCallback(() => setModelReady(true), []);

  // Open a shared link once the model is on screen.
  const { applyLink } = state;
  useEffect(() => {
    if (!modelReady || linkApplied.current) return;
    linkApplied.current = true;
    applyLink(parseViewerLink(window.location.search, new Set(data.areas.map((a) => a.id))));
  }, [modelReady, applyLink, data.areas]);

  // Keep the address bar shareable.
  const light = state.lighting.kind === 'raking' ? state.lighting : undefined;
  useEffect(() => {
    if (!linkApplied.current) return;
    const query = serializeViewerLink({
      region: state.selected ?? undefined,
      view: state.view ?? undefined,
      light: light && { azimuth: light.azimuth, elevation: light.elevation },
    });
    const url = `${window.location.pathname}${query}`;
    if (url !== `${window.location.pathname}${window.location.search}`)
      window.history.replaceState(window.history.state, '', url);
  }, [state.selected, state.view, light]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy this link', window.location.href);
    }
  };

  useViewerShortcuts({
    onEscape: () => {
      if (shortcutsOpen) return setShortcutsOpen(false);
      if (state.openWord) state.closeWord();
      setInspectOpen(false);
      setExpanded(false);
    },
    onReset: () => state.sendCamera('reset'),
    onToggleRegions: state.toggleRegions,
    onToggleExpanded: () => setExpanded((e) => !e),
    onToggleInspect: () => setInspectOpen((o) => !o),
    onView: (view) => state.sendCamera(`view:${view}`),
    onCycle: state.cycle,
    onFocusSearch: () => {
      setExpanded(false);
      search.current?.focus();
    },
    onShowShortcuts: () => setShortcutsOpen(true),
  });

  return (
    <div className={`exhibit-page${expanded ? ' is-expanded' : ''}`}>
      <a className="skip-link" href="#annotation-panel">
        Skip to annotations
      </a>
      {/* Nederhof's ResLite renderer draws the hieroglyphs; loaded once per exhibit page. */}
      <Script
        src="/vendor/nederhof/reslite.js"
        onReady={() => setRendererReady(true)}
        onError={() => setRendererFailed(true)}
      />
      <header className="topbar exhibit-header">
        <nav className="topbar__crumbs" aria-label="Breadcrumb">
          <Link href="/" className="wordmark" aria-label="BD3D home">
            BD<span>3D</span>
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/#collection" className="back-link">
            Collection
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{coffin.name}</span>
        </nav>
        <nav className="pager" aria-label="Objects">
          <Link
            className="icon-button"
            href={`/exhibits/${previous.slug}`}
            prefetch={false}
            aria-label={`Previous object: ${previous.name}`}
          >
            <ArrowLeft size={16} />
          </Link>
          <span className="mono">
            {pad(index + 1)} / {pad(collection.length)}
          </span>
          <Link
            className="icon-button"
            href={`/exhibits/${next.slug}`}
            prefetch={false}
            aria-label={`Next object: ${next.name}`}
          >
            <ArrowRight size={16} />
          </Link>
        </nav>
        <div className="topbar__actions">
          <Link className="button button--ghost" href="/search" aria-label="Search the collection">
            <Search size={14} aria-hidden="true" />
            <span>Search collection</span>
          </Link>
          <button
            className="button button--ghost"
            onClick={copyLink}
            aria-label={copied ? 'Link copied' : 'Copy link to this view'}
          >
            {copied ? (
              <Check size={14} aria-hidden="true" />
            ) : (
              <Link2 size={14} aria-hidden="true" />
            )}
            <span aria-hidden="true">{copied ? 'Link copied' : 'Copy link'}</span>
          </button>
          <span className="sr-only" role="status">
            {copied ? 'Link copied to the clipboard' : ''}
          </span>
          <button
            className="icon-button"
            onClick={() => setShortcutsOpen(true)}
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard size={16} />
          </button>
        </div>
      </header>

      <main className="workspace">
        <ModelStage
          coffin={coffin}
          data={data}
          assets={assets}
          state={state}
          reduced={reduced}
          expanded={expanded}
          onExpandedChange={setExpanded}
          inspectOpen={inspectOpen}
          onInspectChange={setInspectOpen}
          quality={quality}
          onQuality={setQuality}
          onReady={onModelReady}
          modelReady={modelReady}
        />
        <ReadingPanel
          ref={search}
          coffin={coffin}
          data={data}
          state={state}
          rendererReady={rendererReady}
          rendererFailed={rendererFailed}
        />
      </main>

      <ObjectContext coffin={coffin} data={data} assets={assets} />
      <NextExhibitLink next={next} index={(index + 1) % collection.length} />
      {shortcutsOpen && <ShortcutSheet onClose={() => setShortcutsOpen(false)} />}
    </div>
  );
}
