'use client';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { SHORTCUTS } from './useViewerShortcuts';

/** Keyboard reference, shown as a modal dialog. */
export default function ShortcutSheet({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="sheet"
      aria-labelledby="shortcuts-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
    >
      <header className="sheet__header">
        <h2 id="shortcuts-title">Keyboard shortcuts</h2>
        <button
          className="icon-button icon-button--small"
          onClick={onClose}
          aria-label="Close shortcuts"
        >
          <X size={15} />
        </button>
      </header>
      <dl className="shortcuts">
        {SHORTCUTS.map((s) => (
          <div key={s.label}>
            <dt>
              {s.keys.map((k) => (k === '–' ? <span key={k}>–</span> : <kbd key={k}>{k}</kbd>))}
            </dt>
            <dd>{s.label}</dd>
          </div>
        ))}
      </dl>
      <p className="sheet__note">
        Drag to orbit, scroll or pinch to zoom, right-drag or two-finger drag to pan. Click an
        outlined region to read its entry.
      </p>
    </dialog>
  );
}
