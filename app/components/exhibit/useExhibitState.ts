'use client';
import { useCallback, useMemo, useState } from 'react';
import type { Annotation, AnnotationKind, CoffinData } from '@/lib/data/schema';
import type { CameraCommand, CameraCommandKind } from '@/lib/scene/camera';
import {
  cycleLocation,
  filterAnnotations,
  regionsForEntries,
  type LinguisticLayer,
} from '@/lib/annotations';

/**
 * All viewer state for one exhibit, and the transitions between states. Components read
 * derived values from here and call actions; none of them own selection logic.
 */
export function useExhibitState(data: CoffinData, reducedMotion: boolean) {
  const [tab, setTabState] = useState<AnnotationKind>('inscription');
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQueryState] = useState('');
  const [layer, setLayer] = useState<LinguisticLayer>('All layers');
  const [showRegions, setShowRegions] = useState(true);
  const [focusSerial, setFocusSerial] = useState(0);
  const [command, setCommand] = useState<CameraCommand>({ kind: 'reset', serial: 0 });

  const region = data.areas.find((area) => area.id === selected);
  const annotation = data.annotations.find((entry) => entry.id === region?.textId);
  const results = useMemo(
    () => filterAnnotations(data.annotations, tab, query),
    [data.annotations, tab, query],
  );
  const regions = useMemo(() => regionsForEntries(data, results), [data, results]);

  /** Select a surface region (from the model) and reveal its entry in the panel. */
  const selectRegion = useCallback(
    (id: string) => {
      setFocusSerial((n) => n + 1);
      setSelected(id);
      const picked = data.areas.find((area) => area.id === id);
      const entry = picked && data.annotations.find((a) => a.id === picked.textId);
      if (!picked || !entry) return;
      setTabState(entry.kind);
      requestAnimationFrame(() =>
        document
          .getElementById(`annotation-${picked.textId}`)
          ?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'nearest' }),
      );
    },
    [data, reducedMotion],
  );

  /** Select an entry (from the panel) and frame its first location on the model. */
  const chooseEntry = useCallback((entry: Annotation) => {
    setFocusSerial((n) => n + 1);
    setSelected(entry.areaIds[0]);
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
    if (kind === 'reset') setSelected(null);
    setCommand((current) => ({ kind, serial: current.serial + 1 }));
  }, []);

  /** Switching tabs clears the selection and the search, as each tab is its own list. */
  const setTab = useCallback((next: AnnotationKind) => {
    setTabState(next);
    setSelected(null);
    setQueryState('');
  }, []);

  const setQuery = useCallback((next: string) => {
    setQueryState(next);
    setSelected(null);
  }, []);

  return {
    tab,
    selected,
    query,
    layer,
    showRegions,
    focusSerial,
    command,
    annotation,
    results,
    regions,
    setTab,
    setQuery,
    setLayer,
    toggleRegions: () => setShowRegions((shown) => !shown),
    selectRegion,
    chooseEntry,
    cycle,
    sendCamera,
  };
}

export type ExhibitState = ReturnType<typeof useExhibitState>;
