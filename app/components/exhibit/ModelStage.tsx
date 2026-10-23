'use client';
import dynamic from 'next/dynamic';
import { useCallback, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Maximize, Minimize } from 'lucide-react';
import type { Coffin } from '@/lib/collection';
import type { CoffinData } from '@/lib/data/schema';
import CameraToolbar from './CameraToolbar';
import HelpPanel from './HelpPanel';
import type { ExhibitState } from './useExhibitState';
import { useExpandedStage } from './useExpandedStage';
import { useViewerShortcuts } from './useViewerShortcuts';

// WebGL only runs in the browser; the reading panel renders on the server meanwhile.
const ModelRoom = dynamic(() => import('../viewer/ModelRoom'), {
  ssr: false,
  loading: () => (
    <div className="model-loading standalone" role="status">
      Preparing the 3D gallery…
    </div>
  ),
});

const DOOR_TRANSITION = { duration: 1, ease: [0.76, 0, 0.24, 1] as const };

type Props = {
  coffin: Coffin;
  data: CoffinData;
  state: ExhibitState;
  reduced: boolean;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
};

export default function ModelStage({
  coffin,
  data,
  state,
  reduced,
  expanded,
  onExpandedChange,
}: Props) {
  const [help, setHelp] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const onModelReady = useCallback(() => setModelReady(true), []);
  const stage = useRef<HTMLElement>(null);
  const expandButton = useRef<HTMLButtonElement>(null);

  useExpandedStage(expanded, stage, expandButton);
  useViewerShortcuts({
    onEscape: () => {
      onExpandedChange(false);
      setHelp(false);
    },
    onReset: () => state.sendCamera('reset'),
  });

  return (
    <section
      ref={stage}
      role={expanded ? 'dialog' : 'region'}
      aria-modal={expanded || undefined}
      className="model-stage"
      data-model-ready={modelReady}
      aria-label={`Interactive 3D model of ${coffin.name}`}
    >
      <div className="stage-top">
        <span>
          <span className="status-dot" /> THE OBJECT IN THREE DIMENSIONS
        </span>
        <button
          ref={expandButton}
          onClick={() => onExpandedChange(!expanded)}
          aria-label={expanded ? 'Show reading panel' : 'Expand model'}
        >
          {expanded ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>
      <ModelRoom
        data={data}
        regions={state.regions}
        selected={state.selected}
        focusSerial={state.focusSerial}
        onSelect={state.selectRegion}
        command={state.command}
        reduced={reduced}
        showRegions={state.showRegions}
        onReady={onModelReady}
      />
      <div className="stage-bottom">
        <p>
          Drag to rotate · Scroll to zoom
          <br />
          <span>Select an outlined region to read its story</span>
        </p>
        <button onClick={() => setHelp(!help)} aria-expanded={help} aria-label="Viewer help">
          ?
        </button>
      </div>
      <CameraToolbar
        onCamera={state.sendCamera}
        showRegions={state.showRegions}
        onToggleRegions={state.toggleRegions}
      />
      {help && <HelpPanel onClose={() => setHelp(false)} />}
      <motion.div
        className="gallery-door door-left"
        initial={reduced ? false : { x: 0 }}
        animate={{ x: '-100%' }}
        transition={DOOR_TRANSITION}
      />
      <motion.div
        className="gallery-door door-right"
        initial={reduced ? false : { x: 0 }}
        animate={{ x: '100%' }}
        transition={DOOR_TRANSITION}
      />
    </section>
  );
}
