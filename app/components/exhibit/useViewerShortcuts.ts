'use client';
import { useEffect, useRef } from 'react';
import { VIEW_IDS, type ViewId } from '@/lib/scene/camera';

export type ShortcutHandlers = {
  onEscape: () => void;
  onReset: () => void;
  onToggleRegions: () => void;
  onToggleExpanded: () => void;
  onToggleInspect: () => void;
  onView: (view: ViewId) => void;
  onCycle: (delta: number) => void;
  onFocusSearch: () => void;
  onShowShortcuts: () => void;
};

export const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ['R'], label: 'Reset view' },
  { keys: ['1', '–', '5'], label: 'Front, back, left, right, top view' },
  { keys: ['[', ']'], label: 'Previous / next location of the selected entry' },
  { keys: ['O'], label: 'Show or hide region outlines' },
  { keys: ['L'], label: 'Lighting and quality panel' },
  { keys: ['F'], label: 'Expand the model' },
  { keys: ['/'], label: 'Search this object’s annotations' },
  { keys: ['?'], label: 'Show these shortcuts' },
  { keys: ['Esc'], label: 'Close panels and expanded view' },
];

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement
  );
}

/** Global viewer keys. Ignored while typing or when a modifier key is held. */
export function useViewerShortcuts(handlers: ShortcutHandlers) {
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const h = latest.current;
      if (event.key === 'Escape') return h.onEscape();
      if (isTyping(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const index = Number(key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < VIEW_IDS.length)
        return h.onView(VIEW_IDS[index]);
      const actions: Record<string, () => void> = {
        r: h.onReset,
        o: h.onToggleRegions,
        f: h.onToggleExpanded,
        l: h.onToggleInspect,
        '[': () => h.onCycle(-1),
        ']': () => h.onCycle(1),
        '/': h.onFocusSearch,
        '?': h.onShowShortcuts,
      };
      const action = actions[key];
      if (!action) return;
      event.preventDefault();
      action();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
