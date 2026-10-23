import { X } from 'lucide-react';

export default function HelpPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="help-panel">
      <button onClick={onClose} aria-label="Close help">
        <X size={17} />
      </button>
      <h3>Take a closer look</h3>
      <p>
        Drag with one finger or your mouse to orbit. Pinch or scroll to zoom. Use the arrow buttons
        to rotate without dragging.
      </p>
      <p>
        Choose an inscription to see its original mapped region. Some texts share a region or occur
        in several locations. Use the location arrows to visit each one.
      </p>
      <p>
        <kbd>R</kbd> Reset view <kbd>Esc</kbd> Close expanded view
      </p>
    </div>
  );
}
