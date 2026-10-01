import {load} from 'cheerio';
import {mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
const pairs = [['psamtikseneb','chrysler-museum-art-712254'],['irethoreru','fine-arts-museums-san-francisco-20022a-b'],['iwefaa2','pahma-6-19912'],['anonymous1','pahma-6-19927'],['amenirdis','pahma-5-1404c'],['psamtik','pahma-5-522']];
await mkdir('public/images/coffins',{recursive:true});
const manifest=[];
for(const [slug,path] of pairs) {
 const source='https://3dcoffins.berkeley.edu/coffins/'+path;
 const response=await fetch(source); if(!response.ok) throw new Error(source);
 const $=load(await response.text());
 const images=$('img').toArray().filter(el=>Number($(el).attr('width'))>300);
 if(!images.length) throw new Error('No object image: '+slug);
 const url=new URL($(images[0]).attr('src'),source).href;
 const photo=await fetch(url); if(!photo.ok) throw new Error(url);
 await sharp(Buffer.from(await photo.arrayBuffer())).resize({width:1200,withoutEnlargement:true}).jpeg({quality:90}).toFile('public/images/coffins/'+slug+'.jpg');
 manifest.push({slug,source,image:url}); console.log(slug,url);
}
await writeFile('data/photography-manifest.json',JSON.stringify(manifest,null,2));
