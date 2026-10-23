import { forwardRef } from 'react';
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

/** The inspector: object label, annotation tabs, search and the reading list. */
const ReadingPanel = forwardRef<HTMLInputElement, Props>(function ReadingPanel(
  { coffin, data, state, rendererReady, rendererFailed },
  searchRef,
) {
  const { tab, query, results, annotation } = state;
  const counts = Object.fromEntries(
    ANNOTATION_KINDS.map((kind) => [kind, data.annotations.filter((a) => a.kind === kind).length]),
  );
  return (
    <aside className="reading-panel" aria-label="Object and annotations">
      <header className="object-label exhibit-intro">
        <p className="object-label__accession">{coffin.accession}</p>
        <h1>{coffin.name}</h1>
        <dl>
          <div>
            <dt>Period</dt>
            <dd>{coffin.period}</dd>
          </div>
          <div>
            <dt>Material</dt>
            <dd>{coffin.material}</dd>
          </div>
          <div>
            <dt>Collection</dt>
            <dd>{coffin.museum}</dd>
          </div>
        </dl>
      </header>
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
            <span className="tab-count" aria-hidden="true">
              {counts[kind]}
            </span>
          </button>
        ))}
      </div>
      <div className="panel-tools">
        <label className="search-field">
          <Search size={14} aria-hidden="true" />
          <input
            ref={searchRef}
            aria-label="Search annotations"
            placeholder={`Search ${tab === 'vocabulary' ? 'words' : 'translations'}`}
            value={query}
            onChange={(event) => state.setQuery(event.target.value)}
          />
          <kbd aria-hidden="true">/</kbd>
        </label>
        {tab === 'inscription' && (
          <select
            className="select"
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
            hovered={entry.id === state.hoveredEntry}
            state={state}
            rendererReady={rendererReady}
            rendererFailed={rendererFailed}
          />
        ))}
        {!results.length && (
          <div className="empty-state">
            <BookOpen size={22} aria-hidden="true" />
            <h3>{query ? 'No matching annotations' : 'No entries in this edition'}</h3>
            <p>
              {query
                ? 'Try a different word, or search the whole collection.'
                : 'This object’s source edition does not include this type of annotation.'}
            </p>
          </div>
        )}
      </div>
      <footer className="panel-credit">
        Annotations: {formatCredits(coffin.annotators)}.{' '}
        <a href={data.source} target="_blank" rel="noreferrer">
          Source edition <ArrowUpRight size={12} aria-hidden="true" />
        </a>
      </footer>
    </aside>
  );
});

export default ReadingPanel;
