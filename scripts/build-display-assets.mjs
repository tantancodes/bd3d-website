#!/usr/bin/env node
/**
 * Builds web display derivatives from the imported source models. Sources are never
 * modified; each derivative records the SHA-256 of the file it was made from.
 *
 *   public/models/<slug>/<name>.obj|.mtl|*.jpg   source (provenance record, unchanged)
 *   public/models/<slug>/display/geometry.glb    meshopt-compressed, quantized geometry
 *   public/models/<slug>/display/<tex>-1024.webp preview texture tier
 *   public/models/<slug>/display/<tex>-2048.webp standard texture tier
 *   (high tier serves the original 4096² JPEG bytes, so it has no derivative)
 *   data/display-assets.json                     manifest read by the app
 *
 * Geometry transformations (all documented on the research page):
 * - Vertices with identical position, normal and UV are merged (weld); none are moved.
 * - V texture coordinates are flipped to the glTF convention (v' = 1 − v).
 * - Models without source normals get smooth vertex normals computed from the mesh.
 * - Positions are quantized to 16 bits per axis (KHR_mesh_quantization), UVs to 16 bits,
 *   normals to 10 bits, then compressed with EXT_meshopt_compression.
 *
 * Usage: node scripts/build-display-assets.mjs
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Document, NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions';
import { quantize, reorder, weld } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

const root = process.cwd();
const TIERS = [
  { size: 1024, quality: 82 },
  { size: 2048, quality: 88 },
];

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
const rel = (p) => path.relative(path.join(root, 'public'), p).split(path.sep).join('/');

/** Minimal MTL reader: material name → { diffuse texture file, diffuse colour }. */
function parseMtl(text) {
  const materials = new Map();
  let current = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith('newmtl ')) {
      current = { map: null, kd: [1, 1, 1] };
      materials.set(line.slice(7).trim(), current);
    } else if (current && /^map_Kd\s/i.test(line)) current.map = line.split(/\s+/).pop();
    else if (current && /^Kd\s/.test(line)) current.kd = line.split(/\s+/).slice(1, 4).map(Number);
  }
  return materials;
}

/** MTL colours are sRGB-encoded; glTF base colour factors are linear. */
const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

/**
 * Smooth vertex normals for a non-indexed triangle list: area-weighted face normals summed
 * over every corner that shares a position. Used only when the OBJ has no normals.
 */
function smoothNormals(positions) {
  const sums = new Map();
  const key = (i) => `${positions[i]},${positions[i + 1]},${positions[i + 2]}`;
  for (let t = 0; t < positions.length; t += 9) {
    const [ax, ay, az, bx, by, bz, cx, cy, cz] = positions.subarray(t, t + 9);
    const ux = bx - ax,
      uy = by - ay,
      uz = bz - az;
    const vx = cx - ax,
      vy = cy - ay,
      vz = cz - az;
    const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
    for (let c = 0; c < 3; c++) {
      const k = key(t + c * 3);
      const sum = sums.get(k) ?? [0, 0, 0];
      sum[0] += n[0];
      sum[1] += n[1];
      sum[2] += n[2];
      sums.set(k, sum);
    }
  }
  const normalsOut = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    const [x, y, z] = sums.get(key(i));
    const length = Math.hypot(x, y, z) || 1;
    normalsOut[i] = x / length;
    normalsOut[i + 1] = y / length;
    normalsOut[i + 2] = z / length;
  }
  return normalsOut;
}

/** Source normals present? (OBJLoader computes flat normals otherwise.) */
const hasSourceNormals = (objText) => /^vn\s/m.test(objText);

async function buildGeometry(objText, mtl, outFile) {
  const group = new OBJLoader().parse(objText);
  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene();
  const mesh = doc.createMesh('coffin');
  const materials = new Map();
  const materialFor = (name) => {
    if (!materials.has(name)) {
      const source = mtl.get(name);
      // Textured materials take their colour from the texture; untextured ones keep Kd.
      const color = source && !source.map ? source.kd.map(srgbToLinear) : [1, 1, 1];
      materials.set(
        name,
        doc
          .createMaterial(name)
          .setBaseColorFactor([...color, 1])
          .setMetallicFactor(0)
          .setRoughnessFactor(0.85),
      );
    }
    return materials.get(name);
  };
  const keepNormals = hasSourceNormals(objText);

  group.traverse((object) => {
    if (!object.isMesh) return;
    const geometry = object.geometry;
    const objMaterials = Array.isArray(object.material) ? object.material : [object.material];
    const groups = geometry.groups.length
      ? geometry.groups
      : [{ start: 0, count: geometry.attributes.position.count, materialIndex: 0 }];
    for (const { start, count, materialIndex } of groups) {
      const name = objMaterials[materialIndex]?.name || [...mtl.keys()][0];
      const slice = (attribute, size) =>
        attribute.array.slice(start * size, (start + count) * size);
      const positions = slice(geometry.attributes.position, 3);
      const primitive = doc
        .createPrimitive()
        .setMaterial(materialFor(name))
        .setAttribute(
          'POSITION',
          doc.createAccessor().setType('VEC3').setArray(positions).setBuffer(buffer),
        );
      if (geometry.attributes.uv) {
        const uvs = slice(geometry.attributes.uv, 2);
        for (let i = 1; i < uvs.length; i += 2) uvs[i] = 1 - uvs[i];
        primitive.setAttribute(
          'TEXCOORD_0',
          doc.createAccessor().setType('VEC2').setArray(uvs).setBuffer(buffer),
        );
      }
      const normalArray =
        keepNormals && geometry.attributes.normal
          ? slice(geometry.attributes.normal, 3)
          : smoothNormals(positions);
      primitive.setAttribute(
        'NORMAL',
        doc.createAccessor().setType('VEC3').setArray(normalArray).setBuffer(buffer),
      );
      mesh.addPrimitive(primitive);
    }
  });
  scene.addChild(doc.createNode('coffin').setMesh(mesh));

  await MeshoptEncoder.ready;
  doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({
    method: EXTMeshoptCompression.EncoderMethod.QUANTIZE,
  });
  await doc.transform(
    weld(),
    reorder({ encoder: MeshoptEncoder }),
    quantize({ quantizePosition: 16, quantizeNormal: 10, quantizeTexcoord: 16 }),
  );
  doc.createExtension(KHRMeshQuantization).setRequired(true);

  const io = new NodeIO()
    .registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
    .registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
  const glb = await io.writeBinary(doc);
  await writeFile(outFile, glb);
  let triangles = 0;
  let vertices = 0;
  for (const prim of mesh.listPrimitives()) {
    vertices += prim.getAttribute('POSITION').getCount();
    triangles += (prim.getIndices()?.getCount() ?? prim.getAttribute('POSITION').getCount()) / 3;
  }
  return {
    bytes: glb.byteLength,
    sha256: sha256(glb),
    triangles,
    vertices,
    sourceNormals: keepNormals,
    materials: [...materials.keys()],
  };
}

async function buildTextures(sourceFile, displayDir) {
  const source = await readFile(sourceFile);
  const base = path.basename(sourceFile, path.extname(sourceFile));
  const { width, height } = await sharp(source).metadata();
  const tiers = {
    4096: { url: '/' + rel(sourceFile), bytes: source.byteLength, width, height, original: true },
  };
  for (const { size, quality } of TIERS) {
    const out = path.join(displayDir, `${base}-${size}.webp`);
    const data = await sharp(source)
      .resize(size, size, { fit: 'inside', kernel: 'lanczos3' })
      .webp({ quality, effort: 6, smartSubsample: true })
      .toBuffer();
    await writeFile(out, data);
    tiers[size] = { url: '/' + rel(out), bytes: data.byteLength, width: size, height: size };
  }
  return { source: { url: '/' + rel(sourceFile), sha256: sha256(source) }, tiers };
}

const manifest = { generatedBy: 'scripts/build-display-assets.mjs', models: {} };
const editions = (await readdir(path.join(root, 'data/coffins'))).filter((f) =>
  f.endsWith('.json'),
);
for (const file of editions.sort()) {
  const edition = JSON.parse(await readFile(path.join(root, 'data/coffins', file), 'utf8'));
  const dir = path.join(root, 'public/models', edition.slug);
  const displayDir = path.join(dir, 'display');
  await mkdir(displayDir, { recursive: true });
  const objFile = path.join(dir, `${edition.model.name}.obj`);
  const mtlFile = path.join(dir, `${edition.model.name}.mtl`);
  const objText = await readFile(objFile, 'utf8');
  const mtlText = await readFile(mtlFile, 'utf8');
  const mtl = parseMtl(mtlText);

  const geometry = await buildGeometry(objText, mtl, path.join(displayDir, 'geometry.glb'));
  const materials = [];
  for (const name of geometry.materials) {
    const source = mtl.get(name);
    if (!source) throw new Error(`${edition.slug}: material "${name}" is missing from the MTL`);
    if (!source.map) {
      materials.push({ name, texture: null });
      continue;
    }
    materials.push({ name, texture: await buildTextures(path.join(dir, source.map), displayDir) });
  }
  const objBuffer = Buffer.from(objText);
  manifest.models[edition.slug] = {
    geometry: {
      url: `/models/${edition.slug}/display/geometry.glb`,
      bytes: geometry.bytes,
      sha256: geometry.sha256,
      triangles: geometry.triangles,
      vertices: geometry.vertices,
      sourceNormals: geometry.sourceNormals,
      source: {
        url: '/' + rel(objFile),
        bytes: (await stat(objFile)).size,
        sha256: sha256(objBuffer),
      },
    },
    materials,
  };
  const textured = materials.filter((m) => m.texture);
  const tex = textured.reduce((sum, m) => sum + m.texture.tiers[2048].bytes, 0);
  console.log(
    `${edition.slug.padEnd(13)} obj ${(objBuffer.byteLength / 1048576).toFixed(2)} MB → glb ${(geometry.bytes / 1048576).toFixed(2)} MB` +
      ` · ${textured.length} textures, 2048 tier ${(tex / 1048576).toFixed(2)} MB · ${geometry.triangles} tris` +
      (geometry.sourceNormals ? '' : ' · normals computed'),
  );
}
await writeFile(
  path.join(root, 'data/display-assets.json'),
  JSON.stringify(manifest, null, 2) + '\n',
);
console.log('wrote data/display-assets.json');
