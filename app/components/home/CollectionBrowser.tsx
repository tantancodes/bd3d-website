'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowUpRight, Search, X } from 'lucide-react';
import type { Coffin } from '@/lib/collection';

export type CollectionItem = Coffin & { entries: number; regions: number };

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
                >
                  <div className="exhibit-card__image">
                    <Image
                      src={`/images/coffins/${c.slug}.jpg`}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw"
                    />
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
                  <ArrowUpRight className="exhibit-card__arrow" size={18} aria-hidden="true" />
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
