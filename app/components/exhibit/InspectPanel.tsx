import { X } from 'lucide-react';
import {
  ELEVATION_RANGE,
  GALLERY,
  LIGHTING_PRESETS,
  clampLight,
  presetFor,
  type LightingMode,
} from '@/lib/scene/lighting';
import {
  QUALITY,
  QUALITY_LEVELS,
  type QualityLevel,
  type QualitySetting,
} from '@/lib/scene/quality';
import type { TextureTier } from '@/lib/data/display-assets';

type Props = {
  lighting: LightingMode;
  onLighting: (mode: LightingMode) => void;
  quality: QualitySetting;
  resolved: QualityLevel | null;
  shownTier: TextureTier | null;
  onQuality: (setting: QualitySetting) => void;
  onClose: () => void;
};

/** Lighting presets, raking-light angles and texture quality. */
export default function InspectPanel({
  lighting,
  onLighting,
  quality,
  resolved,
  shownTier,
  onQuality,
  onClose,
}: Props) {
  const raking = lighting.kind === 'raking' ? lighting : null;
  const active = presetFor(lighting)?.id;
  const setAngle = (patch: Partial<{ azimuth: number; elevation: number }>) => {
    const base = raking ?? { azimuth: 180, elevation: 12 };
    onLighting({ kind: 'raking', ...clampLight({ ...base, ...patch }) });
  };

  return (
    <section id="inspect-panel" className="inspect-panel" aria-labelledby="inspect-title">
      <header className="inspect-panel__header">
        <h2 id="inspect-title">Light</h2>
        <button
          className="icon-button icon-button--small"
          onClick={onClose}
          aria-label="Close lighting panel"
        >
          <X size={15} />
        </button>
      </header>

      <div className="chips" role="group" aria-label="Lighting presets">
        {LIGHTING_PRESETS.map((preset) => (
          <button
            key={preset.id}
            aria-pressed={active === preset.id}
            onClick={() => onLighting(preset.mode)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <label className="slider">
        <span className="slider__label">
          Direction <output>{raking ? `${raking.azimuth}°` : '—'}</output>
        </span>
        <input
          type="range"
          min={0}
          max={359}
          step={1}
          value={raking?.azimuth ?? 180}
          onChange={(e) => setAngle({ azimuth: Number(e.target.value) })}
          aria-valuetext={raking ? `${raking.azimuth} degrees` : 'Gallery lighting'}
        />
      </label>
      <label className="slider">
        <span className="slider__label">
          Elevation <output>{raking ? `${raking.elevation}°` : '—'}</output>
        </span>
        <input
          type="range"
          min={ELEVATION_RANGE[0]}
          max={ELEVATION_RANGE[1]}
          step={1}
          value={raking?.elevation ?? 12}
          onChange={(e) => setAngle({ elevation: Number(e.target.value) })}
          aria-valuetext={
            raking ? `${raking.elevation} degrees above the surface` : 'Gallery lighting'
          }
        />
      </label>
      {raking && (
        <button className="text-button" onClick={() => onLighting(GALLERY)}>
          Back to gallery light
        </button>
      )}
      <p className="inspect-panel__note">
        A single light at a low angle shades the scanned geometry by its real shape. These models
        record fine carving in the photographs rather than the mesh, so raking light reveals form
        and relief, not individual signs.
      </p>

      <label className="field">
        <span className="field__label">Texture quality</span>
        <select value={quality} onChange={(e) => onQuality(e.target.value as QualitySetting)}>
          <option value="auto">Automatic{resolved ? ` (${QUALITY[resolved].label})` : ''}</option>
          {QUALITY_LEVELS.map((level) => (
            <option key={level} value={level}>
              {QUALITY[level].label}
            </option>
          ))}
        </select>
      </label>
      <p className="inspect-panel__note">
        {resolved ? QUALITY[resolved].description : 'Checking this device…'}
        {shownTier ? ` Showing ${shownTier} px textures.` : ''}
      </p>
    </section>
  );
}
