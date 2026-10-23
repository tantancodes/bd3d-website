import {
  LinearMipmapLinearFilter,
  SRGBColorSpace,
  Texture,
  type Group,
  type Material,
  type Mesh,
  type MeshStandardMaterial,
  type Object3D,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import type { DisplayModelAssets, TextureTier } from '@/lib/data/display-assets';

export type ByteCounter = (bytes: number) => void;

export class AssetLoadError extends Error {
  constructor(
    readonly url: string,
    message: string,
  ) {
    super(`${message} (${url})`);
    this.name = 'AssetLoadError';
  }
}

/** Fetches a file and reports bytes as they arrive, so progress reflects the real download. */
export async function fetchBytes(
  url: string,
  signal: AbortSignal,
  onBytes: ByteCounter,
): Promise<ArrayBuffer> {
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new AssetLoadError(url, 'Network error');
  }
  if (!response.ok) throw new AssetLoadError(url, `HTTP ${response.status}`);
  if (!response.body) {
    const buffer = await response.arrayBuffer();
    onBytes(buffer.byteLength);
    return buffer;
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    length += value.byteLength;
    onBytes(value.byteLength);
  }
  const out = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out.buffer;
}

/** Downloads and decodes the meshopt-compressed GLB. */
export async function loadGeometry(
  assets: DisplayModelAssets,
  signal: AbortSignal,
  onBytes: ByteCounter,
): Promise<Group> {
  const buffer = await fetchBytes(assets.geometry.url, signal, onBytes);
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  try {
    const gltf = await loader.parseAsync(buffer, '');
    return gltf.scene;
  } catch {
    throw new AssetLoadError(assets.geometry.url, 'Could not decode geometry');
  }
}

/**
 * Downloads one texture and decodes it with createImageBitmap, which decodes off the main
 * thread in modern browsers. UVs follow the glTF convention, so no flip is needed.
 */
export async function loadTexture(
  url: string,
  signal: AbortSignal,
  onBytes: ByteCounter,
  anisotropy = 1,
): Promise<Texture> {
  const buffer = await fetchBytes(url, signal, onBytes);
  const type = url.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
  let image: ImageBitmap;
  try {
    // Match the upload state three.js uses for sRGB textures (no colour-space conversion,
    // no premultiplication); a mismatch makes the browser re-decode during upload.
    // The source photographs carry no ICC profiles, so pixels are unchanged.
    image = await createImageBitmap(new Blob([buffer], { type }), {
      colorSpaceConversion: 'none',
      premultiplyAlpha: 'none',
    });
  } catch {
    throw new AssetLoadError(url, 'Could not decode texture');
  }
  const texture = new Texture(image);
  texture.flipY = false;
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  // Set before the first upload; three.js clamps it to the GPU's maximum. Changing it later
  // would require re-uploading the whole texture.
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

/** Texture URLs keyed by material name for one tier. */
export function textureUrls(assets: DisplayModelAssets, tier: TextureTier): Map<string, string> {
  const urls = new Map<string, string>();
  for (const material of assets.materials)
    if (material.texture) urls.set(material.name, material.texture.tiers[tier].url);
  return urls;
}

export function tierBytes(assets: DisplayModelAssets, tier: TextureTier): number {
  return assets.materials.reduce(
    (sum, material) => sum + (material.texture ? material.texture.tiers[tier].bytes : 0),
    0,
  );
}

function meshMaterials(object: Object3D): MeshStandardMaterial[] {
  const materials: MeshStandardMaterial[] = [];
  object.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh) return;
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material])
      materials.push(material as MeshStandardMaterial);
  });
  return materials;
}

/** Assigns textures by material name. Returns the textures that were replaced. */
export function applyTextures(object: Object3D, textures: Map<string, Texture>): Texture[] {
  const replaced: Texture[] = [];
  for (const material of meshMaterials(object)) {
    const texture = textures.get(material.name);
    if (!texture) continue;
    if (material.map && material.map !== texture) replaced.push(material.map);
    material.map = texture;
    material.needsUpdate = true;
  }
  return replaced;
}

/** Releases every GPU resource owned by a loaded model. */
export function disposeModel(object: Object3D) {
  const seen = new Set<Material>();
  object.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      if (seen.has(material)) continue;
      seen.add(material);
      (material as MeshStandardMaterial).map?.dispose();
      material.dispose();
    }
  });
}
