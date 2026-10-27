import { Vector3 } from 'three';

/**
 * Lighting for inspecting the scan. Angles are relative to the viewer, so "from the left"
 * means screen-left whatever the orbit position.
 *
 * - azimuth: direction the light comes from, around the view axis
 *   (0° right, 90° top, 180° left, 270° bottom).
 * - elevation: angle between the light and the picture plane
 *   (90° straight from the viewer, ~10° grazing across the surface).
 */
export type RakingLight = { azimuth: number; elevation: number };

export type LightingMode = { kind: 'gallery' } | ({ kind: 'raking' } & RakingLight);

export const GALLERY: LightingMode = { kind: 'gallery' };

export type LightingPreset = { id: string; label: string; mode: LightingMode };

export const LIGHTING_PRESETS: LightingPreset[] = [
  { id: 'gallery', label: 'Gallery', mode: GALLERY },
  { id: 'left', label: 'Raking left', mode: { kind: 'raking', azimuth: 180, elevation: 12 } },
  { id: 'right', label: 'Raking right', mode: { kind: 'raking', azimuth: 0, elevation: 12 } },
  { id: 'top', label: 'Raking top', mode: { kind: 'raking', azimuth: 90, elevation: 12 } },
  { id: 'front', label: 'Frontal', mode: { kind: 'raking', azimuth: 90, elevation: 70 } },
];

export const ELEVATION_RANGE = [5, 90] as const;

export function clampLight(light: RakingLight): RakingLight {
  const azimuth = ((Math.round(light.azimuth) % 360) + 360) % 360;
  const elevation = Math.min(
    ELEVATION_RANGE[1],
    Math.max(ELEVATION_RANGE[0], Math.round(light.elevation)),
  );
  return { azimuth, elevation };
}

/** Unit vector from the target towards the light, in camera space (+z towards the viewer). */
export function lightDirection({ azimuth, elevation }: RakingLight): Vector3 {
  const az = (azimuth * Math.PI) / 180;
  const el = (elevation * Math.PI) / 180;
  return new Vector3(Math.cos(el) * Math.cos(az), Math.cos(el) * Math.sin(az), Math.sin(el));
}

export function presetFor(mode: LightingMode): LightingPreset | undefined {
  return LIGHTING_PRESETS.find((preset) =>
    preset.mode.kind === 'gallery'
      ? mode.kind === 'gallery'
      : mode.kind === 'raking' &&
        preset.mode.azimuth === mode.azimuth &&
        preset.mode.elevation === mode.elevation,
  );
}
