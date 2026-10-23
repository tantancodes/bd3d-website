'use client';
import { useCallback, useSyncExternalStore } from 'react';
import { isQualitySetting, type QualitySetting } from '@/lib/scene/quality';

const KEY = 'bd3d.quality';
const EVENT = 'bd3d-quality';
/** Used when storage is unavailable, so a choice still applies for this visit. */
let memory: QualitySetting | null = null;

function read(): QualitySetting {
  if (memory) return memory;
  try {
    const stored = window.localStorage.getItem(KEY);
    return isQualitySetting(stored) ? stored : 'auto';
  } catch {
    // Storage can be unavailable (private mode, blocked site data).
    return 'auto';
  }
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(EVENT, callback);
  };
}

/** The reader's texture-quality choice, remembered in this browser when storage allows. */
export function useQualitySetting() {
  const setting = useSyncExternalStore(subscribe, read, () => 'auto' as const);
  const update = useCallback((next: QualitySetting) => {
    try {
      window.localStorage.setItem(KEY, next);
      memory = null;
    } catch {
      memory = next;
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [setting, update] as const;
}
