import { ChevronLeft, ChevronRight, Eye, EyeOff, Minus, Plus, RotateCcw } from 'lucide-react';
import type { CameraCommandKind } from '@/lib/scene/camera';

type Props = {
  onCamera: (kind: CameraCommandKind) => void;
  showRegions: boolean;
  onToggleRegions: () => void;
};

/** Button controls for the camera, so the model can be explored without dragging. */
export default function CameraToolbar({ onCamera, showRegions, onToggleRegions }: Props) {
  return (
    <div className="camera-toolbar" role="group" aria-label="Model controls">
      <button onClick={() => onCamera('reset')} aria-label="Reset view" title="Reset view (R)">
        <RotateCcw size={17} />
      </button>
      <i />
      <button onClick={() => onCamera('left')} aria-label="Rotate left">
        <ChevronLeft size={18} />
      </button>
      <button onClick={() => onCamera('right')} aria-label="Rotate right">
        <ChevronRight size={18} />
      </button>
      <i />
      <button onClick={() => onCamera('in')} aria-label="Zoom in">
        <Plus size={18} />
      </button>
      <button onClick={() => onCamera('out')} aria-label="Zoom out">
        <Minus size={18} />
      </button>
      <i />
      <button
        onClick={onToggleRegions}
        aria-label={showRegions ? 'Hide region outlines' : 'Show region outlines'}
        aria-pressed={showRegions}
      >
        {showRegions ? <Eye size={18} /> : <EyeOff size={18} />}
      </button>
    </div>
  );
}
