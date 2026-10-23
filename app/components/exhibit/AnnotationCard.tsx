import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Annotation } from '@/lib/data/schema';
import { displayTitle, showsLayer } from '@/lib/annotations';
import { gloss } from '@/lib/vocabulary';
import Hieroglyphs from './Hieroglyphs';
import TransliterationLine from './TransliterationLine';
import WordCard from './WordCard';
import type { ExhibitState } from './useExhibitState';

type Props = {
  entry: Annotation;
  index: number;
  active: boolean;
  hovered: boolean;
  state: ExhibitState;
  rendererReady: boolean;
  rendererFailed: boolean;
};

/** One entry in the reading panel: title, locations, note and interlinear lines. */
export default function AnnotationCard({
  entry,
  index,
  active,
  hovered,
  state,
  rendererReady,
  rendererFailed,
}: Props) {
  const locations = entry.areaIds.length;
  const vocabulary = entry.kind === 'vocabulary';
  const position = state.selected ? entry.areaIds.indexOf(state.selected) : -1;
  return (
    <article
      className={`annotation${active ? ' selected' : ''}${hovered ? ' is-hovered' : ''}`}
      id={`annotation-${entry.id}`}
      onMouseEnter={() => state.hoverEntry(entry.id)}
      onMouseLeave={() => state.hoverEntry(null)}
    >
      <button
        className="annotation-title"
        onClick={() => state.chooseEntry(entry)}
        aria-pressed={active}
      >
        <span className="annotation-index">{String(index + 1).padStart(2, '0')}</span>
        <span className={`annotation-heading${vocabulary ? ' translit' : ''}`}>
          {vocabulary ? entry.title : displayTitle(entry)}
        </span>
        {locations > 1 && <span className="annotation-count">{locations}</span>}
      </button>
      {vocabulary && <p className="annotation-gloss">{gloss(entry)}</p>}
      {active && (
        <div className="location-control">
          <span role="status">
            Location {position + 1} of {locations}
          </span>
          <div>
            <button
              className="icon-button icon-button--small"
              disabled={locations < 2}
              onClick={() => state.cycle(-1)}
              aria-label="Previous location"
              title="Previous location ([)"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              className="icon-button icon-button--small"
              disabled={locations < 2}
              onClick={() => state.cycle(1)}
              aria-label="Next location"
              title="Next location (])"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
      {!vocabulary && entry.description && (
        <p className="annotation-description">{entry.description}</p>
      )}
      {entry.fragments.map((fragment, j) => {
        const keyPrefix = `${entry.id}:${j}`;
        const openHere = state.openWord?.key.startsWith(`${keyPrefix}:`);
        return (
          <div className="fragment" key={j}>
            {(fragment.hieroglyphs || fragment.hieroglyphUnicode) &&
              showsLayer(state.layer, 'Hieroglyphs') && (
                <Hieroglyphs
                  unavailable={rendererFailed}
                  ready={rendererReady}
                  unicode={fragment.hieroglyphUnicode}
                  value={fragment.hieroglyphs}
                  label={fragment.transliteration || fragment.translation}
                />
              )}
            {showsLayer(state.layer, 'Transliteration') && fragment.transliteration && (
              <TransliterationLine
                text={fragment.transliteration}
                keyPrefix={keyPrefix}
                lexicon={state.lexicon}
                state={state}
              />
            )}
            {showsLayer(state.layer, 'Translation') && (
              <p className="translation">{fragment.translation}</p>
            )}
            {openHere && state.openWord && (
              <WordCard
                word={state.openWord.word}
                entries={state.openWord.entryIds
                  .map((id) => state.entries.get(id)!)
                  .filter(Boolean)}
                selectedRegion={state.selected}
                onShow={(regionId) => state.selectRegion(regionId, { keepTab: true })}
                onClose={state.closeWord}
              />
            )}
          </div>
        );
      })}
    </article>
  );
}
