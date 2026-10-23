'use client';
import { useEffect, type RefObject } from 'react';

/**
 * While the model is expanded: lock page scroll, keep Tab focus inside the stage, and
 * restore focus to the expand button when it closes.
 */
export function useExpandedStage(
  expanded: boolean,
  stage: RefObject<HTMLElement | null>,
  trigger: RefObject<HTMLButtonElement | null>,
) {
  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const button = trigger.current;
    button?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const items = stage.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href]');
      if (!items?.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', trap);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', trap);
      button?.focus();
    };
  }, [expanded, stage, trigger]);
}
