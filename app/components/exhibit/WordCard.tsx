import { Crosshair, X } from 'lucide-react';
import type { Annotation } from '@/lib/data/schema';
import { gloss } from '@/lib/vocabulary';

type Props = {
  word: string;
  entries: Annotation[];
  selectedRegion: string | null;
  onShow: (regionId: string) => void;
  onClose: () => void;
};

/**
 * Dictionary entries for one transliterated word. The match is by spelling against the
 * edition's own vocabulary; it does not claim which English word translates it.
 */
export default function WordCard({ word, entries, selectedRegion, onShow, onClose }: Props) {
  return (
    <div className="word-card" role="group" aria-label={`Vocabulary for ${word}`}>
      <div className="word-card__header">
        <span className="word-card__label">Vocabulary match</span>
        <button
          className="icon-button icon-button--small"
          onClick={onClose}
          aria-label="Close vocabulary"
        >
          <X size={14} />
        </button>
      </div>
      {entries.map((entry) => {
        const index = selectedRegion ? entry.areaIds.indexOf(selectedRegion) : -1;
        const next = entry.areaIds[(index + 1) % entry.areaIds.length];
        const count = entry.areaIds.length;
        return (
          <div className="word-card__entry" key={entry.id}>
            <p>
              <span className="translit">{entry.title}</span>{' '}
              <span className="gloss">{gloss(entry)}</span>
            </p>
            <div className="word-card__actions">
              <span className="meta">
                {index >= 0
                  ? `Location ${index + 1} of ${count}`
                  : `${count} ${count === 1 ? 'location' : 'locations'} on the object`}
              </span>
              <button className="button button--small" onClick={() => onShow(next)}>
                <Crosshair size={13} />
                {index >= 0 && count > 1 ? 'Next location' : 'Show on object'}
              </button>
            </div>
          </div>
        );
      })}
      {entries.length > 1 && (
        <p className="word-card__note">
          This spelling matches {entries.length} entries in the edition’s vocabulary.
        </p>
      )}
    </div>
  );
}
