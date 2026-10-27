'use client';
import dynamic from 'next/dynamic';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { Coffin } from '@/lib/collection';
import type { CoffinData } from '@/lib/data/schema';
import type { DisplayModelAssets, TextureTier } from '@/lib/data/display-assets';
import {
  QUALITY,
  readDeviceProfile,
  resolveQuality,
  type QualitySetting,
} from '@/lib/scene/quality';
import CameraToolbar from './CameraToolbar';
import InspectPanel from './InspectPanel';
import ViewSwitcher from './ViewSwitcher';
import type { ExhibitState } from './useExhibitState';
import { useExpandedStage } from './useExpandedStage';

// WebGL only runs in the browser; the reading panel renders on the server meanwhile.
const ModelRoom = dynamic(() => import('../viewer/ModelRoom'), {
  ssr: false,
  loading: () => (
    <div className="stage-status" role="status">
      <p className="stage-status__title">Preparing the viewer…</p>
    </div>
  ),
});

type Props = {
  coffin: Coffin;
  data: CoffinData;
  assets: DisplayModelAssets;
  state: ExhibitState;
  reduced: boolean;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  inspectOpen: boolean;
  onInspectChange: (open: boolean) => void;
  quality: QualitySetting;
  onQuality: (setting: QualitySetting) => void;
  onReady: () => void;
  modelReady: boolean;
};

export default function ModelStage({
  coffin,
  data,
  assets,
  state,
  reduced,
  expanded,
  onExpandedChange,
  inspectOpen,
  onInspectChange,
  quality,
  onQuality,
  onReady,
  modelReady,
}: Props) {
  const [maxTextureSize, setMaxTextureSize] = useState<number | null>(null);
  const [shownTier, setShownTier] = useState<TextureTier | null>(null);
  const stage = useRef<HTMLElement>(null);
  const expandButton = useRef<HTMLButtonElement>(null);
  useExpandedStage(expanded, stage, expandButton);

  const resolved = useMemo(
    () => (maxTextureSize ? resolveQuality(quality, readDeviceProfile(maxTextureSize)) : null),
    [quality, maxTextureSize],
  );
  const profile = resolved ? QUALITY[resolved] : null;
  const onCapabilities = useCallback((size: number) => setMaxTextureSize(size), []);

  return (
    <section
      ref={stage}
      role={expanded ? 'dialog' : 'region'}
      aria-modal={expanded || undefined}
      className="model-stage"
      data-model-ready={modelReady}
      data-texture-tier={shownTier ?? ''}
      aria-label={`Interactive 3D model of ${coffin.name}`}
    >
      <ModelRoom
        assets={assets}
        targetTier={profile?.textures ?? null}
        maxDpr={profile?.maxDpr ?? 1.5}
        onReady={onReady}
        onTierChange={setShownTier}
        onCapabilities={onCapabilities}
        data={data}
        pickable={state.pickable}
        outlined={state.outlined}
        states={state.regionStates}
        showRegions={state.showRegions}
        labelFor={state.labelFor}
        focusSerial={state.focusSerial}
        command={state.command}
        reduced={reduced}
        lighting={state.lighting}
        anisotropy={profile?.anisotropy ?? 4}
        shadows={resolved !== null && resolved !== 'low'}
        onSelect={state.selectRegion}
        onHover={state.hoverRegion}
      />

      <p className="stage-chip stage-chip--meta">
        {data.areas.length} regions · {data.annotations.length} entries
      </p>
      <div className="stage-views">
        <ViewSwitcher active={state.view} onView={(view) => state.sendCamera(`view:${view}`)} />
      </div>

      {inspectOpen && (
        <InspectPanel
          lighting={state.lighting}
          onLighting={state.setLighting}
          quality={quality}
          resolved={resolved}
          shownTier={shownTier}
          onQuality={onQuality}
          onClose={() => onInspectChange(false)}
        />
      )}

      <div className="stage-bottom">
        <CameraToolbar
          onCamera={state.sendCamera}
          showRegions={state.showRegions}
          onToggleRegions={state.toggleRegions}
          inspectOpen={inspectOpen}
          onToggleInspect={() => onInspectChange(!inspectOpen)}
          expanded={expanded}
          onToggleExpanded={() => onExpandedChange(!expanded)}
          expandRef={expandButton}
        />
      </div>
      <p className="stage-hint" aria-hidden="true">
        Drag to orbit · Scroll to zoom · <kbd>?</kbd> shortcuts
      </p>
    </section>
  );
}
