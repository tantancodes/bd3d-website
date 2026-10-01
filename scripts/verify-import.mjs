import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const manifest=JSON.parse(await readFile('data/import-manifest.json','utf8'));
let verified=0;
for(const entry of manifest){
 if(entry.path.startsWith('data/sources/'))continue;
 const bytes=await readFile(entry.path);
 assert.equal(bytes.length,entry.bytes,entry.path);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256,entry.path);
 verified++;
}
for(const entry of manifest.filter(e=>e.path.startsWith('data/sources/'))){
 const slug=entry.path.split('/').pop().replace('.html','');
 const data=JSON.parse(await readFile(`data/coffins/${slug}.json`,'utf8'));
 assert.equal(new Set(data.annotations.map(a=>a.id)).size,data.annotations.length);
 for(const a of data.annotations){assert(a.areaIds.length>0);for(const id of a.areaIds)assert(data.areas.some(r=>r.id===id&&r.textId===a.id));}
 for(const r of data.areas){assert(r.lines.length>=3);assert(r.lines.flat().every(Number.isFinite));}
 // Source snapshots are an optional local cache. SHA validation anchors comparison to the recorded edition.
 let html;try{html=await readFile(entry.path);}catch{console.log(slug+': linked data validated; source snapshot not cached');continue;}
 assert.equal(createHash('sha256').update(html).digest('hex'),entry.sha256);
 const calls=name=>[...html.toString().matchAll(new RegExp(`${name}\\(([^;]+)\\);`,'g'))].map(m=>JSON.parse('['+m[1]+']'));
 const lines=calls('addLine3D'),areas=calls('addArea3D'),links=calls('addTagId');
 assert.deepEqual(data.model.quaternion,calls('addModel')[0].slice(1,5));
 for(const region of data.areas){
  assert.deepEqual(region.lines,lines.filter(l=>l[0]===region.id).map(l=>l.slice(1)));
  assert.deepEqual(region.direction,areas.find(a=>a[0]===region.id).slice(1,4));
  assert(links.some(l=>l[0]===region.id&&l[1]===region.textId));
 }
 console.log(`${slug}: ${data.annotations.length} entries, ${data.areas.length} linked regions match source coordinates and IDs exactly`);
}
console.log(`${verified} source assets verified by size and SHA-256`);
