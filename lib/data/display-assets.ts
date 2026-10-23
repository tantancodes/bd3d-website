import manifest from '@/data/display-assets.json';

/** Texture resolution tiers. 4096 serves the original source JPEG; others are WebP derivatives. */
export const TEXTURE_TIERS = [1024, 2048, 4096] as const;
export type TextureTier = (typeof TEXTURE_TIERS)[number];

export type TextureFile = { url: string; bytes: number; width: number; height: number };

export type DisplayMaterial = {
  name: string;
  texture: {
    source: { url: string; sha256: string };
    tiers: Record<TextureTier, TextureFile>;
  } | null;
};

export type DisplayModelAssets = {
  geometry: {
    url: string;
    bytes: number;
    sha256: string;
    triangles: number;
    vertices: number;
    /** False when smooth normals were computed because the OBJ had none. */
    sourceNormals: boolean;
    source: { url: string; bytes: number; sha256: string };
  };
  materials: DisplayMaterial[];
};

const models = manifest.models as unknown as Record<string, DisplayModelAssets>;

/** Display derivatives for one object, built by `scripts/build-display-assets.mjs`. */
export function displayAssets(slug: string): DisplayModelAssets | undefined {
  return models[slug];
}

/** Bytes to download for the geometry plus every texture at one tier. */
export function downloadSize(assets: DisplayModelAssets, tier: TextureTier): number {
  return (
    assets.geometry.bytes +
    assets.materials.reduce((sum, m) => sum + (m.texture ? m.texture.tiers[tier].bytes : 0), 0)
  );
}

/**
 * GPU memory for the textures at one tier: RGBA8 with a full mip chain (×4/3).
 * Computed from the texture dimensions, not read from the driver.
 */
export function textureMemory(assets: DisplayModelAssets, tier: TextureTier): number {
  return assets.materials.reduce((sum, m) => {
    if (!m.texture) return sum;
    const { width, height } = m.texture.tiers[tier];
    return sum + (width * height * 4 * 4) / 3;
  }, 0);
}
