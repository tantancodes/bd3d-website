'use client';
import Link from 'next/link';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { KIND_LABELS, ANNOTATION_KINDS } from '@/lib/annotations';
import type { AnnotationKind } from '@/lib/data/schema';
import { entryHref, searchCollection, type SearchEntry } from '@/lib/search';

const PAGE = 60;
const EXAMPLES = ['Osiris', 'horizon', 'ꜣḫ', 'offering', 'Nut'];

function Highlight({ text, query }: { text: string; query: string }) {
  const needle = query.trim().toLowerCase();
  if (!needle) return <>{text}</>;
  const at = text.toLowerCase().indexOf(needle);
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark>{text.slice(at, at + needle.length)}</mark>
      {text.slice(at + needle.length)}
    </>
  );
}

/** Trims long text to a window around the first match. */
function excerpt(text: string, query: string, size = 180) {
  if (text.length <= size) return text;
  const at = Math.max(0, text.toLowerCase().indexOf(query.trim().toLowerCase()));
  const start = Math.max(0, Math.min(at - 50, text.length - size));
  return `${start > 0 ? '…' : ''}${text.slice(start, start + size).trim()}${start + size < text.length ? '…' : ''}`;
}

export default function SearchClient({
  index,
  objects,
  initialQuery,
}: {
  index: SearchEntry[];
  objects: { slug: string; name: string }[];
  initialQuery: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [kind, setKind] = useState<AnnotationKind | 'all'>('all');
  const [slug, setSlug] = useState('all');
  // Paging resets whenever the query changes.
  const [paging, setPaging] = useState({ query: initialQuery, limit: PAGE });
  const deferred = useDeferredValue(query);
  const limit = paging.query === deferred ? paging.limit : PAGE;
  const setLimit = (next: number) => setPaging({ query: deferred, limit: next });

  // Keep ?q= in the address bar so a search can be shared.
  useEffect(() => {
    const url = deferred ? `?q=${encodeURIComponent(deferred)}` : window.location.pathname;
    window.history.replaceState(window.history.state, '', url);
  }, [deferred]);

  const results = useMemo(
    () => searchCollection(index, deferred, { kind, slug }),
    [index, deferred, kind, slug],
  );

  return (
    <section className="search" aria-label="Search the collection">
      <div className="search__controls">
        <label className="search-field search-field--hero">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            aria-label="Search all inscriptions"
            placeholder="A word in English or transliteration"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </label>
        <div className="search__filters">
          <div className="segmented" role="group" aria-label="Entry type">
            <button aria-pressed={kind === 'all'} onClick={() => setKind('all')}>
              All
            </button>
            {ANNOTATION_KINDS.map((k) => (
              <button key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>
                {KIND_LABELS[k]}
              </button>
            ))}
          </div>
          <select
            className="select"
            aria-label="Object"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          >
            <option value="all">All objects</option>
            {objects.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        {!query && (
          <p className="search__examples">
            Try{' '}
            {EXAMPLES.map((example, i) => (
              <span key={example}>
                <button className="text-button" onClick={() => setQuery(example)}>
                  {example}
                </button>
                {i < EXAMPLES.length - 1 ? ', ' : ''}
              </span>
            ))}
          </p>
        )}
      </div>

      <p className="search__count" role="status">
        {results.length} {results.length === 1 ? 'result' : 'results'}
        {deferred ? ` for “${deferred}”` : ''}
      </p>
      {results.length ? (
        <ol className="results">
          {results.slice(0, limit).map((entry) => (
            <li key={`${entry.slug}:${entry.id}`} className="result">
              <Link href={entryHref(entry)} prefetch={false}>
                <p className="result__meta">
                  <span>{entry.object}</span>
                  <span>{KIND_LABELS[entry.kind]}</span>
                  {entry.locations > 1 && <span>{entry.locations} locations</span>}
                </p>
                <h3 className={entry.kind === 'vocabulary' ? 'translit' : undefined}>
                  <Highlight text={entry.title} query={deferred} />
                </h3>
                {entry.text && (
                  <p className="result__text">
                    <Highlight text={excerpt(entry.text, deferred)} query={deferred} />
                  </p>
                )}
                {entry.kind !== 'vocabulary' && entry.transliteration && (
                  <p className="result__translit translit">
                    <Highlight
                      text={excerpt(entry.transliteration, deferred, 120)}
                      query={deferred}
                    />
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <div className="empty-state empty-state--wide">
          <h3>No entries match.</h3>
          <p>Search is by exact spelling. Transliterations use ꜣ, ꜥ, ḥ, ḫ, ẖ, š, ṯ and ḏ.</p>
        </div>
      )}
      {results.length > limit && (
        <button className="button search__more" onClick={() => setLimit(limit + PAGE)}>
          Show more ({results.length - limit} remaining)
        </button>
      )}
    </section>
  );
}
