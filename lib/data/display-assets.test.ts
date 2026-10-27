import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';
import { Box3 } from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { collection } from '@/lib/collection';
import { displayAssets } from './display-assets';

const publicFile = (url: string) => path.join(process.cwd(), 'public', url);
const sha256 = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex');

describe('display derivatives', () => {
  it('exist for every catalogued object', () => {
    for (const { slug } of collection) expect(displayAssets(slug)).toBeDefined();
  });

  it.each(collection.map((c) => c.slug))(
    '%s: files match the manifest and their recorded sources',
    (slug) => {
      const model = displayAssets(slug)!;
      expect(sha256(publicFile(model.geometry.url))).toBe(model.geometry.sha256);
      expect(sha256(publicFile(model.geometry.source.url))).toBe(model.geometry.source.sha256);
      for (const material of model.materials) {
        if (!material.texture) continue;
        expect(sha256(publicFile(material.texture.source.url))).toBe(material.texture.source.sha256);
        for (const tier of Object.values(material.texture.tiers))
          expect(readFileSync(publicFile(tier.url)).byteLength).toBe(tier.bytes);
      }
    },
  );

  it.each(collection.map((c) => c.slug))(
    '%s: compressed geometry keeps the source bounds within quantization error',
    async (slug) => {
      const model = displayAssets(slug)!;
      await MeshoptDecoder.ready;
      const io = new NodeIO()
        .registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
        .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
      const doc = await io.read(publicFile(model.geometry.url));
      const { min, max } = getBounds(doc.getRoot().listScenes()[0]);
      const source = new Box3().setFromObject(
        new OBJLoader().parse(readFileSync(publicFile(model.geometry.source.url), 'utf8')),
      );
      const extent = Math.max(...source.max.clone().sub(source.min).toArray());
      // 16-bit quantization over the longest side: error well below 1/10,000 of the object.
      const tolerance = extent / 10000;
      source.min.toArray().forEach((v, i) => expect(Math.abs(min[i] - v)).toBeLessThan(tolerance));
      source.max.toArray().forEach((v, i) => expect(Math.abs(max[i] - v)).toBeLessThan(tolerance));
    },
  );
});
