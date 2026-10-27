'use client';
import { useCallback, useMemo, useState } from 'react';
import type { Annotation, AnnotationKind, CoffinData, Region } from '@/lib/data/schema';
import type { CameraCommand, CameraCommandKind, ViewId } from '@/lib/scene/camera';
import { GALLERY, type LightingMode } from '@/lib/scene/lighting';
import {
  cycleLocation,
  displayTitle,
  filterAnnotations,
  regionsForEntries,
  type LinguisticLayer,
} from '@/lib/annotations';
import { buildLexicon, gloss } from '@/lib/vocabulary';
import type { ViewerLink } from '@/lib/url-state';

/** A transliterated word opened in the reading panel. */
export type OpenWord = { key: string; word: string; entryIds: string[] };

type SelectOptions = { keepTab?: boolean; scroll?: boolean };

/**
 * All viewer state for one exhibit and the transitions between states. Components read
 * derived values and call actions; none of them own selection logic.
 */
export function useExhibitState(data: CoffinData, reducedMotion: boolean) {
  const [tab, setTabState] = useState<AnnotationKind>('inscription');
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQueryState] = useState('');
  const [layer, setLayer] = useState<LinguisticLayer>('All layers');
  const [showRegions, setShowRegions] = useState(true);
  const [focusSerial, setFocusSerial] = useState(0);
  const [command, setCommand] = useState<CameraCommand>({ kind: 'reset', serial: 0 });
  const [view, setView] = useState<ViewId | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [hoveredEntry, setHoveredEntry] = useState<string | null>(null);
  const [hoveredWord, setHoveredWord] = useState<string[] | null>(null);
  const [openWord, setOpenWord] = useState<OpenWord | null>(null);
  const [lighting, setLighting] = useState<LightingMode>(GALLERY);

  const entries = useMemo(() => new Map(data.annotations.map((a) => [a.id, a])), [data]);
  const areas = useMemo(() => new Map(data.areas.map((r) => [r.id, r])), [data]);
  const lexicon = useMemo(() => buildLexicon(data.annotations), [data]);

  const region = selected ? areas.get(selected) : undefined;
  const annotation = region ? entries.get(region.textId) : undefined;
  const results = useMemo(
    () => filterAnnotations(data.annotations, tab, query),
    [data.annotations, tab, query],
  );
  const pickable = useMemo(() => regionsForEntries(data, results), [data, results]);

  /** Regions related to what the reader is pointing at or reading. */
  const related = useMemo(() => {
    const ids = new Set<string>();
    const add = (entryId: string | null | undefined) =>
      entries.get(entryId ?? '')?.areaIds.forEach((id) => ids.add(id));
    add(annotation?.id);
    add(hoveredEntry);
    (hoveredWord ?? openWord?.entryIds ?? []).forEach(add);
    return ids;
  }, [entries, annotation, hoveredEntry, hoveredWord, openWord]);

  const outlined = useMemo(() => {
    const extra: Region[] = [];
    const pickableIds = new Set(pickable.map((r) => r.id));
    for (const id of related) if (!pickableIds.has(id)) extra.push(areas.get(id)!);
    if (region && !pickableIds.has(region.id) && !related.has(region.id)) extra.push(region);
    return extra.length ? [...pickable, ...extra] : pickable;
  }, [pickable, related, region, areas]);

  const regionStates = useMemo(
    () => ({ selected, hovered: hoveredRegion, related }),
    [selected, hoveredRegion, related],
  );

  const labelFor = useCallback(
    (regionId: string) => {
      const entry = entries.get(areas.get(regionId)?.textId ?? '');
      if (!entry) return undefined;
      return entry.kind === 'vocabulary' ? `${entry.title} · ${gloss(entry)}` : displayTitle(entry);
    },
    [entries, areas],
  );

  const scrollToEntry = useCallback(
    (entryId: string) =>
      requestAnimationFrame(() =>
        document
          .getElementById(`annotation-${entryId}`)
          ?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'nearest' }),
      ),
    [reducedMotion],
  );

  /** Select a surface region and frame it. From the model, the panel follows. */
  const selectRegion = useCallback(
    (id: string, { keepTab = false, scroll = true }: SelectOptions = {}) => {
      const picked = areas.get(id);
      const entry = picked && entries.get(picked.textId);
      if (!picked || !entry) return;
      setFocusSerial((n) => n + 1);
      setSelected(id);
      setView(null);
      if (!keepTab) {
        setTabState(entry.kind);
        setOpenWord(null);
        if (scroll) scrollToEntry(entry.id);
      }
    },
    [areas, entries, scrollToEntry],
  );

  /** Select an entry from the panel and frame its first location. */
  const chooseEntry = useCallback((entry: Annotation) => {
    setFocusSerial((n) => n + 1);
    setSelected(entry.areaIds[0]);
    setView(null);
  }, []);

  /** Visit the next or previous occurrence of the selected entry. */
  const cycle = useCallback(
    (delta: number) => {
      if (!annotation) return;
      setFocusSerial((n) => n + 1);
      setSelected(cycleLocation(annotation.areaIds, selected, delta));
    },
    [annotation, selected],
  );

  const sendCamera = useCallback((kind: CameraCommandKind) => {
    if (kind === 'reset') {
      setSelected(null);
      setView(null);
    }
    if (kind.startsWith('view:')) {
      setSelected(null);
      setView(kind.slice(5) as ViewId);
    }
    setCommand((current) => ({ kind, serial: current.serial + 1 }));
  }, []);

  /** Switching tabs clears the selection and the search, as each tab is its own list. */
  const setTab = useCallback((next: AnnotationKind) => {
    setTabState(next);
    setSelected(null);
    setQueryState('');
    setOpenWord(null);
  }, []);

  const setQuery = useCallback((next: string) => {
    setQueryState(next);
    setSelected(null);
  }, []);

  /** Apply a shared link once, after the model is ready. */
  const applyLink = useCallback(
    (link: ViewerLink) => {
      if (link.light) setLighting({ kind: 'raking', ...link.light });
      if (link.region) selectRegion(link.region);
      else if (link.view) sendCamera(`view:${link.view}`);
    },
    [selectRegion, sendCamera],
  );

  return {
    tab,
    selected,
    query,
    layer,
    showRegions,
    focusSerial,
    command,
    view,
    lighting,
    annotation,
    results,
    pickable,
    outlined,
    regionStates,
    lexicon,
    entries,
    openWord,
    hoveredRegion,
    hoveredEntry: hoveredRegion ? (areas.get(hoveredRegion)?.textId ?? null) : null,
    labelFor,
    setTab,
    setQuery,
    setLayer,
    setLighting,
    toggleRegions: () => setShowRegions((shown) => !shown),
    selectRegion,
    chooseEntry,
    cycle,
    sendCamera,
    applyLink,
    hoverRegion: setHoveredRegion,
    hoverEntry: setHoveredEntry,
    hoverWord: setHoveredWord,
    toggleWord: (word: OpenWord) =>
      setOpenWord((current) => (current?.key === word.key ? null : word)),
    closeWord: () => setOpenWord(null),
  };
}

export type ExhibitState = ReturnType<typeof useExhibitState>;
