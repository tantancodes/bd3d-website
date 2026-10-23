'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { NeutralToneMapping, PCFShadowMap, type Texture, type WebGLRenderer } from 'three';
import type { DisplayModelAssets, TextureTier } from '@/lib/data/display-assets';
import { CAMERA_FOV, HOME_POSITION } from '@/lib/scene/camera';
import { PREVIEW_TIER } from '@/lib/scene/quality';
import CoffinScene, { type SceneProps } from './CoffinScene';
import { useCoffinModel, type Progress } from './useCoffinModel';

type Props = SceneProps & {
  assets: DisplayModelAssets;
  /** Tier to load after the preview; null until the device has been profiled. */
  targetTier: TextureTier | null;
  maxDpr: number;
  onReady: () => void;
  onTierChange: (tier: TextureTier) => void;
  /** Reports gl.MAX_TEXTURE_SIZE once the WebGL context exists. */
  onCapabilities: (maxTextureSize: number) => void;
};

const MB = 1048576;
const formatMB = (bytes: number) => `${(bytes / MB).toFixed(1)} MB`;

function LoadingPanel({ progress }: { progress: Progress }) {
  const fraction = progress.total ? Math.min(1, progress.loaded / progress.total) : 0;
  return (
    <div className="stage-status" role="status" aria-live="polite">
      <p className="stage-status__title">Bringing the object into view</p>
      <div
        className="progress"
        role="progressbar"
        aria-label="Model download"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(fraction * 100)}
      >
        <span style={{ transform: `scaleX(${fraction})` }} />
      </div>
      <p className="stage-status__meta">
        {formatMB(progress.loaded)} of {formatMB(progress.total)} · geometry and preview textures
      </p>
    </div>
  );
}

function ErrorPanel({ source, onRetry }: { source: string; onRetry: () => void }) {
  return (
    <div className="stage-status stage-status--error" role="alert">
      <p className="stage-status__title">The model could not load.</p>
      <p className="stage-status__meta">You can still read the inscriptions in the panel.</p>
      <div className="stage-status__actions">
        <button className="button button--primary" onClick={onRetry}>
          Try again
        </button>
        <a className="button" href={source} target="_blank" rel="noreferrer">
          Original viewer ↗
        </a>
      </div>
    </div>
  );
}

/** The WebGL viewing room: loading, errors, progressive textures and the canvas. */
export default function ModelRoom({
  assets,
  targetTier,
  maxDpr,
  onReady,
  onTierChange,
  onCapabilities,
  ...scene
}: Props) {
  const [attempt, setAttempt] = useState(0);
  const renderer = useRef<WebGLRenderer | null>(null);
  const prepare = useCallback((texture: Texture) => renderer.current?.initTexture(texture), []);
  const model = useCoffinModel(
    assets,
    targetTier ?? PREVIEW_TIER,
    attempt,
    scene.anisotropy,
    prepare,
  );
  const ready = model.phase === 'ready';
  const tier = ready ? model.tier : null;

  useEffect(() => {
    if (ready) onReady();
  }, [ready, onReady]);
  useEffect(() => {
    if (tier) onTierChange(tier);
  }, [tier, onTierChange]);

  return (
    <>
      <Canvas
        className="stage-canvas"
        frameloop="demand"
        shadows={{ type: PCFShadowMap }}
        dpr={[1, Math.min(maxDpr, typeof window === 'undefined' ? 1 : window.devicePixelRatio)]}
        camera={{ position: HOME_POSITION.toArray(), fov: CAMERA_FOV, near: 0.05, far: 60 }}
        gl={{
          antialias: true,
          toneMapping: NeutralToneMapping,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          renderer.current = gl;
          gl.domElement.setAttribute('role', 'img');
          gl.domElement.setAttribute(
            'aria-label',
            `Interactive 3D model. Use the viewer controls and the annotation list to explore without dragging.`,
          );
          onCapabilities(gl.capabilities.maxTextureSize);
        }}
        fallback={
          <div className="stage-status stage-status--error">
            <p className="stage-status__title">3D requires WebGL.</p>
            <p className="stage-status__meta">The inscriptions remain available in the panel.</p>
          </div>
        }
      >
        {ready && <CoffinScene object={model.object} version={model.version} {...scene} />}
      </Canvas>
      {model.phase === 'loading' && <LoadingPanel progress={model.progress} />}
      {model.phase === 'error' && (
        <ErrorPanel source={scene.data.source} onRetry={() => setAttempt((n) => n + 1)} />
      )}
      {ready && model.upgrade && (
        <div className="stage-chip stage-chip--progress" role="status">
          <span className="spinner" aria-hidden="true" />
          Loading {model.upgrade.tier} px textures ·{' '}
          {Math.round((model.upgrade.loaded / Math.max(1, model.upgrade.total)) * 100)}%
        </div>
      )}
      {ready && model.upgradeFailed && (
        <div className="stage-chip" role="status">
          Higher-resolution textures could not load. Showing {model.tier} px.
        </div>
      )}
    </>
  );
}
