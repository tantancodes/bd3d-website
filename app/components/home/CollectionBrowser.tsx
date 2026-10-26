'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowUpRight, Search, X } from 'lucide-react';
import type { Coffin } from '@/lib/collection';

export type CollectionItem = Coffin & { entries: number; regions: number };

const SIDES = ['top', 'right', 'bottom', 'left'] as const;

/** The edge of the card the pointer crossed, from its angle to the card's centre. */
function sideOf(event: React.PointerEvent<HTMLElement>) {
  const box = event.currentTarget.getBoundingClientRect();
  const x =
    (event.clientX - box.left - box.width / 2) *
    (box.width > box.height ? box.height / box.width : 1);
  const y =
    (event.clientY - box.top - box.height / 2) *
    (box.height > box.width ? box.width / box.height : 1);
  return SIDES[Math.round(Math.atan2(y, x) / (Math.PI / 2) + 5) % 4];
}

/** Direction-aware hover: the veil slides in from the edge the pointer entered by, and out the edge it left by. */
function enter(event: React.PointerEvent<HTMLElement>) {
  if (event.pointerType !== 'mouse') return;
  const card = event.currentTarget;
  card.dataset.from = sideOf(event);
  delete card.dataset.hover;
  void card.offsetWidth; // start the veil at the entry edge before it moves in
  card.dataset.hover = '';
}
function leave(event: React.PointerEvent<HTMLElement>) {
  if (event.pointerType !== 'mouse') return;
  const card = event.currentTarget;
  card.dataset.from = sideOf(event);
  delete card.dataset.hover;
}

const FILTERS = ['All objects', 'Wood', 'Stone'] as const;
type Filter = (typeof FILTERS)[number];

export default function CollectionBrowser({ items }: { items: CollectionItem[] }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All objects');
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter(
      (c) =>
        (filter === 'All objects' || c.material === filter) &&
        `${c.name} ${c.museum} ${c.accession} ${c.period}`.toLowerCase().includes(needle),
    );
  }, [items, query, filter]);
  const reset = () => {
    setQuery('');
    setFilter('All objects');
  };

  return (
    <>
      <div className="collection-tools">
        <div className="segmented" role="group" aria-label="Filter by material">
          {FILTERS.map((f) => (
            <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f}
              {f === 'All objects' && <span className="mono"> {items.length}</span>}
            </button>
          ))}
        </div>
        <label className="search-field search-field--wide">
          <Search size={15} aria-hidden="true" />
          <input
            aria-label="Search the collection"
            placeholder="Object, name, museum or accession"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              className="icon-button icon-button--small"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </label>
      </div>
      <p className="sr-only" role="status">
        {filtered.length} objects found
      </p>
      {filtered.length ? (
        <ol className="collection-grid">
          {filtered.map((c) => {
            const number = items.indexOf(c) + 1;
            return (
              <li key={c.slug} className="exhibit-card">
                <Link
                  href={`/exhibits/${c.slug}`}
                  prefetch={false}
                  aria-label={`${c.name}, ${c.museum}`}
                  onPointerEnter={enter}
                  onPointerLeave={leave}
                >
                  <div className="exhibit-card__image">
                    <Image
                      src={`/images/coffins/${c.slug}.jpg`}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw"
                    />
                    <div className="exhibit-card__veil" aria-hidden="true">
                      <span className="mono">{c.regions} regions</span>
                      <span className="exhibit-card__open">
                        Open exhibit <ArrowUpRight size={16} />
                      </span>
                    </div>
                  </div>
                  <div className="exhibit-card__body">
                    <p className="exhibit-card__meta">
                      <span className="mono">{String(number).padStart(2, '0')}</span>
                      <span>{c.material}</span>
                    </p>
                    <h3>{c.name}</h3>
                    <p className="exhibit-card__period">{c.period}</p>
                    <p className="exhibit-card__museum">
                      {c.museum} · <span className="mono">{c.accession}</span>
                    </p>
                    <p className="exhibit-card__counts">
                      {c.entries} entries · {c.regions} mapped regions
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="empty-state empty-state--wide">
          <h3>No objects found.</h3>
          <p>Try another name, museum or accession number.</p>
          <button className="button" onClick={reset}>
            Reset filters
          </button>
        </div>
      )}
    </>
  );
}
