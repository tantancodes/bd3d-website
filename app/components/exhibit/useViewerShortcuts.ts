'use client';
import { useEffect, useRef } from 'react';

type Shortcuts = { onEscape: () => void; onReset: () => void };

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement
  );
}

/** Global viewer keys: Esc closes overlays, R resets the view. Ignored while typing. */
export function useViewerShortcuts(shortcuts: Shortcuts) {
  const latest = useRef(shortcuts);
  useEffect(() => {
    latest.current = shortcuts;
  });
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return;
      if (event.key === 'Escape') latest.current.onEscape();
      if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === 'r')
        latest.current.onReset();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
