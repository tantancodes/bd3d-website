import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Annotation } from '@/lib/data/schema';
import { displayTitle, showsLayer, type LinguisticLayer } from '@/lib/annotations';
import Hieroglyphs from './Hieroglyphs';

type Props = {
  entry: Annotation;
  index: number;
  active: boolean;
  /** Selected region id, used for "Location n of m". */
  selectedRegion: string | null;
  layer: LinguisticLayer;
  rendererReady: boolean;
  rendererFailed: boolean;
  onChoose: (entry: Annotation) => void;
  onCycle: (delta: number) => void;
};

/** One entry in the reading panel: title, location stepper, note and linguistic layers. */
export default function AnnotationCard({
  entry,
  index,
  active,
  selectedRegion,
  layer,
  rendererReady,
  rendererFailed,
  onChoose,
  onCycle,
}: Props) {
  const locations = entry.areaIds.length;
  return (
    <article className={`annotation ${active ? 'selected' : ''}`} id={`annotation-${entry.id}`}>
      <button className="annotation-title" onClick={() => onChoose(entry)} aria-pressed={active}>
        <span>{String(index + 1).padStart(2, '0')}</span>
        <span className="annotation-heading">{displayTitle(entry)}</span>
        <ArrowUpRight size={17} />
      </button>
      {active && (
        <div className="location-control">
          <span role="status">
            Location {entry.areaIds.indexOf(selectedRegion ?? '') + 1} of {locations}
          </span>
          <div>
            <button
              disabled={locations < 2}
              onClick={() => onCycle(-1)}
              aria-label="Previous location"
            >
              <ChevronLeft size={17} />
            </button>
            <button disabled={locations < 2} onClick={() => onCycle(1)} aria-label="Next location">
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      )}
      {entry.description && <p className="annotation-description">{entry.description}</p>}
      {entry.fragments.map((fragment, j) => (
        <div className="fragment" key={j}>
          {(fragment.hieroglyphs || fragment.hieroglyphUnicode) &&
            showsLayer(layer, 'Hieroglyphs') && (
              <Hieroglyphs
                unavailable={rendererFailed}
                ready={rendererReady}
                unicode={fragment.hieroglyphUnicode}
                value={fragment.hieroglyphs}
                label={fragment.transliteration || fragment.translation}
              />
            )}{' '}
          {showsLayer(layer, 'Transliteration') && (
            <p className="transliteration">{fragment.transliteration}</p>
          )}
          {showsLayer(layer, 'Translation') && (
            <p className="translation">{fragment.translation}</p>
          )}
        </div>
      ))}
    </article>
  );
}
