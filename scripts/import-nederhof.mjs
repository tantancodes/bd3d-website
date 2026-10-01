/** Import data, never execute JavaScript from the source pages. */
import { load } from 'cheerio';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const host = 'https://sites.cs.st-andrews.ac.uk/people/mn31/egyptian/coffins/';
const slugs = ['psamtikseneb', 'irethoreru', 'iwefaa2', 'anonymous1', 'amenirdis', 'psamtik'];
const manifest = [];
async function download(url, path) {
  let bytes;
  try { bytes = await readFile(new URL(path, root)); } catch {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status}: ${url}`);
    bytes = Buffer.from(await response.arrayBuffer());
    await writeFile(new URL(path, root), bytes);
  }
  manifest.push({ path, source: url, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  return bytes;
}
for (const slug of slugs) {
  const base = host + slug + '/';
  await mkdir(new URL(`public/models/${slug}/`, root), { recursive: true });
  await mkdir(new URL(`data/sources/`, root), { recursive: true });
  const html = (await download(base, `data/sources/${slug}.html`)).toString();
  const $ = load(html);
  const call = (name) => [...html.matchAll(new RegExp(`${name}\\(([^;]+)\\);`, 'g'))].map(m => JSON.parse('[' + m[1] + ']'));
  const model = call('addModel')[0];
  if (!model) throw new Error(`No model in ${slug}`);
  const [name, ...settings] = model;
  const areas = Object.fromEntries(call('addArea3D').map(([id, x, y, z, rotation, dash]) => [id, { id, direction: [x,y,z], rotation, dash, textId: null, lines: [] }]));
  for (const [id, ...line] of call('addLine3D')) { if (areas[id]) areas[id].lines.push(line); }
  for (const [id, textId] of call('addTagId')) { if (areas[id]) areas[id].textId = textId; }
  const clean = s => s.replace(/\s+/g, ' ').trim();
  const annotations = [];
  $('.focusable').each((_, el) => {
    const node = $(el), id = node.attr('id');
    const linked = Object.values(areas).filter(a => a.textId === id);
    if (!linked.length) return;
    const fragments = [];
    node.find('.frag').each((_, frag) => {
      const f = $(frag);
      fragments.push({ hieroglyphs: clean(f.find('canvas.res').text()), hieroglyphUnicode: clean(f.find('.unihi').text()), transliteration: clean(f.find('.al').text()), translation: clean(f.find('.tr').text()) });
    });
    const copy = node.clone(); copy.find('canvas, .frag, .popupref, h2, h3').remove();
    const isVocab = id.startsWith('lex');
    annotations.push({ id, title: clean(node.find('h2,h3').first().text()) || (isVocab ? clean(node.find('.al').text()) : id.replace(/^text:/, '')), kind: isVocab ? 'vocabulary' : fragments.length ? 'inscription' : 'interpretation', description: clean(copy.text()), fragments, areaIds: linked.map(a => a.id) });
  });
  await writeFile(new URL(`data/coffins/${slug}.json`, root), JSON.stringify({ slug, source: base, model: { name, quaternion: settings.slice(0,4), settings }, areas: Object.values(areas).filter(a => a.textId && a.lines.length), annotations }, null, 2));
  await download(base + name + '.obj', `public/models/${slug}/${name}.obj`);
  const mtl = (await download(base + name + '.mtl', `public/models/${slug}/${name}.mtl`)).toString();
  const textures = [...new Set([...mtl.matchAll(/^map_\w+\s+(.+)$/gm)].map(m => m[1].trim()))];
  for (const texture of textures) {
    if (texture.includes('/') || texture.includes('..')) throw new Error(`Unexpected texture path: ${texture}`);
    await download(base + texture, `public/models/${slug}/${texture}`);
  }
  console.log(slug, annotations.length, 'annotations;', Object.keys(areas).length, 'regions;', textures.length, 'textures');
}
await mkdir(new URL('public/vendor/nederhof/', root), { recursive: true });
for (const name of ['reslite.js','NewGardiner.ttf','HieroglyphicAux.ttf']) await download(host+'psamtik/'+name, 'public/vendor/nederhof/'+name);
await download(host+'amenirdis/NewGardinerComposed.otf', 'public/vendor/nederhof/NewGardinerComposed.otf');
await writeFile(new URL('data/import-manifest.json', root), JSON.stringify(manifest, null, 2));
