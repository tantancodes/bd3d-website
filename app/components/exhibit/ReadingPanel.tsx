import { ArrowUpRight, BookOpen, Search } from 'lucide-react';
import { formatCredits, type Coffin } from '@/lib/collection';
import type { CoffinData } from '@/lib/data/schema';
import {
  ANNOTATION_KINDS,
  KIND_LABELS,
  LINGUISTIC_LAYERS,
  adjacentKind,
  type LinguisticLayer,
} from '@/lib/annotations';
import AnnotationCard from './AnnotationCard';
import type { ExhibitState } from './useExhibitState';

type Props = {
  coffin: Coffin;
  data: CoffinData;
  state: ExhibitState;
  rendererReady: boolean;
  rendererFailed: boolean;
};

export default function ReadingPanel({
  coffin,
  data,
  state,
  rendererReady,
  rendererFailed,
}: Props) {
  const { tab, query, results, annotation } = state;
  return (
    <aside className="reading-panel" aria-label="Object annotations">
      <div className="reading-header">
        <p className="eyebrow">READ THE SURFACE</p>
        <h2>Words for eternity.</h2>
        <p>Follow a text to its place on the object.</p>
      </div>
      <div className="annotation-tabs" role="tablist" aria-label="Annotation type">
        {ANNOTATION_KINDS.map((kind) => (
          <button
            key={kind}
            id={`tab-${kind}`}
            role="tab"
            aria-selected={tab === kind}
            aria-controls="annotation-panel"
            tabIndex={tab === kind ? 0 : -1}
            onKeyDown={(event) => {
              if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
              event.preventDefault();
              const next = adjacentKind(kind, event.key === 'ArrowRight' ? 1 : -1);
              state.setTab(next);
              document.getElementById(`tab-${next}`)?.focus();
            }}
            onClick={() => state.setTab(kind)}
          >
            {KIND_LABELS[kind]}
          </button>
        ))}
      </div>
      <div className="annotation-options">
        <div className="search-box">
          <Search size={15} />
          <input
            aria-label="Search annotations"
            placeholder={`Search ${tab === 'vocabulary' ? 'words' : 'annotations'}…`}
            value={query}
            onChange={(event) => state.setQuery(event.target.value)}
          />
        </div>
        {tab === 'inscription' && (
          <select
            aria-label="Visible linguistic layer"
            value={state.layer}
            onChange={(event) => state.setLayer(event.target.value as LinguisticLayer)}
          >
            {LINGUISTIC_LAYERS.map((layer) => (
              <option key={layer}>{layer}</option>
            ))}
          </select>
        )}
      </div>
      <div
        tabIndex={0}
        className="annotation-list"
        id="annotation-panel"
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
      >
        {results.map((entry, i) => (
          <AnnotationCard
            key={entry.id}
            entry={entry}
            index={i}
            active={entry.id === annotation?.id}
            selectedRegion={state.selected}
            layer={state.layer}
            rendererReady={rendererReady}
            rendererFailed={rendererFailed}
            onChoose={state.chooseEntry}
            onCycle={state.cycle}
          />
        ))}
        {!results.length && (
          <div className="annotation-empty">
            <BookOpen size={24} />
            <h3>{query ? 'No matching annotations' : 'No entries in this edition'}</h3>
            <p>
              {query
                ? 'Try a different word or phrase.'
                : 'This object’s source edition does not include this type of annotation.'}
            </p>
          </div>
        )}
      </div>
      <div className="annotation-credit">
        Annotations: {formatCredits(coffin.annotators)}.{' '}
        <a href={data.source} target="_blank" rel="noreferrer">
          Source edition <ArrowUpRight size={12} />
        </a>
      </div>
    </aside>
  );
}
