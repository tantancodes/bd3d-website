import type { TextureTier } from '@/lib/data/display-assets';

export const QUALITY_LEVELS = ['low', 'standard', 'high'] as const;
export type QualityLevel = (typeof QUALITY_LEVELS)[number];
export type QualitySetting = QualityLevel | 'auto';

export type QualityProfile = {
  /** Texture tier loaded after the preview. */
  textures: TextureTier;
  /** Upper bound for the device pixel ratio used by the renderer. */
  maxDpr: number;
  /** Anisotropic filtering cap; keeps inscriptions legible at grazing angles. */
  anisotropy: number;
  label: string;
  description: string;
};

export const QUALITY: Record<QualityLevel, QualityProfile> = {
  low: {
    textures: 1024,
    maxDpr: 1,
    anisotropy: 2,
    label: 'Low',
    description: '1024 px textures. For older phones and slow connections.',
  },
  standard: {
    textures: 2048,
    maxDpr: 1.5,
    anisotropy: 4,
    label: 'Standard',
    description: '2048 px textures. Phones, tablets and most laptops.',
  },
  high: {
    textures: 4096,
    maxDpr: 2,
    anisotropy: 8,
    label: 'Full resolution',
    description: 'Original 4096 px photographs. Desktop GPUs.',
  },
};

/** Textures shown first, so the object appears quickly at every level. */
export const PREVIEW_TIER: TextureTier = 1024;

/** What the browser tells us about the device. Every field is optional. */
export type DeviceProfile = {
  coarsePointer?: boolean;
  /** Shorter side of the screen in CSS pixels. */
  shortSide?: number;
  /** navigator.deviceMemory (GiB, Chromium only). */
  deviceMemory?: number;
  /** gl.MAX_TEXTURE_SIZE */
  maxTextureSize?: number;
  saveData?: boolean;
  effectiveType?: string;
};

/**
 * Picks a level from device signals. Unknown values are treated as capable, because
 * Safari and Firefox expose no memory or connection hints; texture-size limits are hard.
 */
export function autoQuality(device: DeviceProfile): QualityLevel {
  if (device.maxTextureSize !== undefined && device.maxTextureSize < 2048) return 'low';
  if (device.saveData || device.effectiveType === 'slow-2g' || device.effectiveType === '2g')
    return 'low';
  if (device.deviceMemory !== undefined && device.deviceMemory <= 2) return 'low';
  if (device.maxTextureSize !== undefined && device.maxTextureSize < 4096) return 'standard';
  if (device.coarsePointer) return 'standard';
  if (device.effectiveType === '3g') return 'standard';
  if (device.deviceMemory !== undefined && device.deviceMemory < 8) return 'standard';
  return 'high';
}

export function resolveQuality(setting: QualitySetting, device: DeviceProfile): QualityLevel {
  return setting === 'auto' ? autoQuality(device) : setting;
}

export function isQualitySetting(value: unknown): value is QualitySetting {
  return value === 'auto' || QUALITY_LEVELS.includes(value as QualityLevel);
}

/** Reads the browser's device hints. Call only in the browser. */
export function readDeviceProfile(maxTextureSize?: number): DeviceProfile {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  return {
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    shortSide: Math.min(window.screen.width, window.screen.height),
    deviceMemory: nav.deviceMemory,
    maxTextureSize,
    saveData: nav.connection?.saveData,
    effectiveType: nav.connection?.effectiveType,
  };
}
