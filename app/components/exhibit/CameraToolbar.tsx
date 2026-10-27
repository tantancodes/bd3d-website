import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  RotateCcw,
  ScanLine,
  SunMedium,
} from 'lucide-react';
import type { CameraCommandKind } from '@/lib/scene/camera';

type Props = {
  onCamera: (kind: CameraCommandKind) => void;
  showRegions: boolean;
  onToggleRegions: () => void;
  inspectOpen: boolean;
  onToggleInspect: () => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  expandRef: React.Ref<HTMLButtonElement>;
};

/** Viewer controls. Every camera action is available without dragging. */
export default function CameraToolbar({
  onCamera,
  showRegions,
  onToggleRegions,
  inspectOpen,
  onToggleInspect,
  expanded,
  onToggleExpanded,
  expandRef,
}: Props) {
  return (
    <div className="toolbar" role="toolbar" aria-label="Model controls">
      <button
        className="icon-button"
        onClick={() => onCamera('reset')}
        aria-label="Reset view"
        title="Reset view (R)"
      >
        <RotateCcw size={16} />
      </button>
      <span className="toolbar__divider" aria-hidden="true" />
      <button
        className="icon-button"
        onClick={() => onCamera('left')}
        aria-label="Rotate left"
        title="Rotate left"
      >
        <ChevronLeft size={17} />
      </button>
      <button
        className="icon-button"
        onClick={() => onCamera('right')}
        aria-label="Rotate right"
        title="Rotate right"
      >
        <ChevronRight size={17} />
      </button>
      <button
        className="icon-button"
        onClick={() => onCamera('in')}
        aria-label="Zoom in"
        title="Zoom in"
      >
        <Plus size={16} />
      </button>
      <button
        className="icon-button"
        onClick={() => onCamera('out')}
        aria-label="Zoom out"
        title="Zoom out"
      >
        <Minus size={16} />
      </button>
      <span className="toolbar__divider" aria-hidden="true" />
      <button
        className="toolbar__toggle"
        onClick={onToggleRegions}
        aria-label={showRegions ? 'Hide region outlines' : 'Show region outlines'}
        aria-pressed={showRegions}
        title="Region outlines (O)"
      >
        <ScanLine size={15} />
        <span>Regions</span>
      </button>
      <button
        className="toolbar__toggle"
        onClick={onToggleInspect}
        aria-label="Lighting and quality"
        aria-expanded={inspectOpen}
        aria-controls="inspect-panel"
        title="Lighting and quality (L)"
      >
        <SunMedium size={15} />
        <span>Light</span>
      </button>
      <button
        ref={expandRef}
        className="icon-button"
        onClick={onToggleExpanded}
        aria-label={expanded ? 'Show reading panel' : 'Expand model'}
        title={expanded ? 'Show reading panel (Esc)' : 'Expand model (F)'}
      >
        {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>
    </div>
  );
}
