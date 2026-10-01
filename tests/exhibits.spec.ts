import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {surfaceTarget} from './surface-points';
const slugs=['psamtikseneb','irethoreru','iwefaa2','anonymous1','amenirdis','psamtik'];
for(const slug of slugs){
 test(`${slug}: assets, layers, camera, annotations and repeat locations`,async({page})=>{
  const errors:string[]=[];const requested:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(r.url().includes('/models/'))requested.push(r.url());});
  await page.goto(`/exhibits/${slug}`);
  await expect(page.locator('.model-stage')).toHaveAttribute('data-model-ready','true');
  await expect(page.locator('.model-stage canvas')).toBeVisible();
  await expect(page.locator('.hieroglyph-scroll').first()).toBeVisible();
  if(slug==='amenirdis') await expect(page.locator('.unicode-hieroglyphs')).toHaveCount(3);
  else await expect.poll(()=>page.locator('.hieroglyph-scroll canvas:not([data-rendered=true])').count()).toBe(0);
  await page.screenshot({path:`test-results/${slug}-desktop.png`});
  expect(requested.length).toBeGreaterThan(2);
  expect(requested.every(url=>url.includes(`/models/${slug}/`))).toBeTruthy();
  const canvas=page.locator('.model-stage canvas');
  const bounds=await canvas.boundingBox();if(!bounds)throw new Error('Canvas missing');
  const point=surfaceTarget(slug,bounds.width,bounds.height);
  await canvas.click({position:{x:point.x,y:point.y}});
  await expect(page.locator(`[id="annotation-${point.id}"] .annotation-title`)).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Reset view',exact:true}).click();
  await expect(canvas).toHaveAttribute('data-camera','0.0000,0.0000,7.3000');
  const first=page.locator('.annotation-title').first();
  await first.click();await expect(first).toHaveAttribute('aria-pressed','true');
  await expect(page.getByText(/Location 1 of/)).toBeVisible();
  await expect(canvas).not.toHaveAttribute('data-camera','0.0000,0.0000,7.3000');
  const beforeZoom=await canvas.getAttribute('data-camera');
  await page.getByRole('button',{name:'Zoom in',exact:true}).click();
  await expect(canvas).not.toHaveAttribute('data-camera',beforeZoom!);
  await page.getByRole('button',{name:'Zoom out',exact:true}).click();
  await page.getByRole('button',{name:'Rotate right',exact:true}).click();
  await page.getByRole('button',{name:'Reset view',exact:true}).click();
  await expect(page.locator('.annotation.selected')).toHaveCount(0);
  await expect(canvas).toHaveAttribute('data-camera','0.0000,0.0000,7.3000');
  await canvas.hover();
  await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
  await page.mouse.down();await page.mouse.move(bounds.x+bounds.width/2+80,bounds.y+bounds.height/2+20,{steps:8});await page.mouse.up();
  await expect(canvas).not.toHaveAttribute('data-camera','0.0000,0.0000,7.3000');
  for(const layer of ['Translation','Transliteration','Hieroglyphs','All layers']){
   await page.getByRole('combobox',{name:'Visible linguistic layer'}).selectOption(layer);
   await expect(page.locator('.translation').first()).toBeVisible({visible:layer==='Translation'||layer==='All layers'});
   if(layer==='Hieroglyphs'||layer==='All layers')await expect(page.locator('.hieroglyph-scroll').first()).toBeVisible();
  }
  const data=JSON.parse(readFileSync(`data/coffins/${slug}.json`,'utf8'));
  const repeated=data.annotations.find((a:{kind:string;areaIds:string[]})=>a.kind==='vocabulary'&&a.areaIds.length>1)||data.annotations.find((a:{areaIds:string[]})=>a.areaIds.length>1);
  if(repeated){
   await page.getByRole('tab',{name:repeated.kind==='vocabulary'?'Vocabulary':repeated.kind==='interpretation'?'Stories':'Inscriptions',exact:true}).click();
   await page.locator(`[id="annotation-${repeated.id}"] .annotation-title`).click();
   await page.getByRole('button',{name:'Next location',exact:true}).click();
   await expect(page.getByText(`Location 2 of ${repeated.areaIds.length}`,{exact:true})).toBeVisible();
   await page.getByRole('button',{name:'Previous location',exact:true}).click();
   await expect(page.getByText(`Location 1 of ${repeated.areaIds.length}`,{exact:true})).toBeVisible();
  }
  await page.getByRole('button',{name:'Expand model',exact:true}).click();
  await expect(page.locator('.reading-panel')).toBeHidden();
  await page.keyboard.press('Escape');await expect(page.locator('.reading-panel')).toBeVisible();
  expect(errors).toEqual([]);
 });
}
test('geometry failure preserves reading and retries successfully',async({page})=>{
 await page.route('**/models/psamtik/*.obj',r=>r.abort());
 await page.goto('/exhibits/psamtik');
 await expect(page.getByText('The model could not load.')).toBeVisible();
 await expect(page.locator('.translation').first()).toBeVisible();
 await page.unroute('**/models/psamtik/*.obj');
 await page.getByRole('button',{name:'Try again',exact:true}).click();
 await expect(page.locator('.model-stage')).toHaveAttribute('data-model-ready','true');
});
test('texture failure is reported instead of silently showing an untextured object',async({page})=>{
 await page.route('**/models/psamtik/*.jpg',r=>r.abort());
 await page.goto('/exhibits/psamtik');
 await expect(page.getByText('The model could not load.')).toBeVisible();
});
test('loading state remains visible while geometry is delayed',async({page})=>{
 let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/models/psamtik/*.obj',async r=>{await gate;await r.continue();});
 await page.goto('/exhibits/psamtik');
 await expect(page.getByText('Bringing the object into view')).toBeVisible();
 release();await expect(page.locator('.model-stage')).toHaveAttribute('data-model-ready','true');
});
