'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { ArrowLeft, ArrowRight, ArrowUpRight, RotateCcw, Plus, Minus, ChevronLeft, ChevronRight, Eye, EyeOff, Maximize, Minimize, Search, BookOpen, X } from 'lucide-react';
import { collection, type Coffin, type CoffinData, type Inscription } from '@/lib/collection';
import type { CameraCommand } from './ModelRoom';
import Hieroglyphs from './Hieroglyphs';
const ModelRoom=dynamic(()=>import('./ModelRoom'),{ssr:false,loading:()=> <div className="model-loading standalone" role="status">Preparing the 3D gallery…</div>});
type Tab='inscription'|'interpretation'|'vocabulary';
export default function Exhibit({coffin,data}:{coffin:Coffin;data:CoffinData}) {
 const reduced=!!useReducedMotion();
 const [focusSerial,setFocusSerial]=useState(0);
 const [rendererReady,setRendererReady]=useState(false);
 const [rendererFailed,setRendererFailed]=useState(false);
 const [modelReady,setModelReady]=useState(false);
 const onModelReady=useCallback(()=>setModelReady(true),[]);
 const [tab,setTab]=useState<Tab>('inscription'),[selected,setSelected]=useState<string|null>(null),[query,setQuery]=useState(''),[showRegions,setShowRegions]=useState(true),[expanded,setExpanded]=useState(false),[help,setHelp]=useState(false),[layer,setLayer]=useState('All layers');
 const [command,setCommand]=useState<CameraCommand>({kind:'reset',serial:0});
 const panel=useRef<HTMLDivElement>(null);
 const stage=useRef<HTMLElement>(null);
 const expandButton=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  if(!expanded)return;
  const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  const trigger=expandButton.current;trigger?.focus();
  const trap=(e:KeyboardEvent)=>{if(e.key!=='Tab')return;const items=stage.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled]),a[href]');if(!items?.length)return;const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}};
  document.addEventListener('keydown',trap);return()=>{document.body.style.overflow=previousOverflow;document.removeEventListener('keydown',trap);trigger?.focus();};
 },[expanded]);
 const current=data.areas.find(a=>a.id===selected), annotation=data.annotations.find(a=>a.id===current?.textId);
 const available=data.annotations.filter(a=>a.kind===tab);
 const results=available.filter(a=>`${a.title} ${a.description} ${a.fragments.map(f=>f.translation+' '+f.transliteration).join(' ')}`.toLowerCase().includes(query.toLowerCase()));
 const visibleIds=new Set(results.map(a=>a.id));
 const regions=data.areas.filter(a=>visibleIds.has(a.textId));
 function selectRegion(id:string) {setFocusSerial(n=>n+1);setSelected(id);const region=data.areas.find(a=>a.id===id);if(region){const item=data.annotations.find(a=>a.id===region.textId);if(item)setTab(item.kind);requestAnimationFrame(()=>document.getElementById(`annotation-${region.textId}`)?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'nearest'}));}}
 function choose(a:Inscription){setFocusSerial(n=>n+1);setSelected(a.areaIds[0]);}
 function camera(kind:CameraCommand['kind']){if(kind==='reset')setSelected(null);setCommand(c=>({kind,serial:c.serial+1}));}
 function cycle(delta:number){if(!annotation)return;setFocusSerial(n=>n+1);const i=annotation.areaIds.indexOf(selected!);setSelected(annotation.areaIds[(i+delta+annotation.areaIds.length)%annotation.areaIds.length]);}
 useEffect(()=>{const handler=(e:KeyboardEvent)=>{if(e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement||e.target instanceof HTMLTextAreaElement)return;if(e.key==='Escape'){setExpanded(false);setHelp(false);}if(!e.ctrlKey&&!e.metaKey&&!e.altKey&&e.key.toLowerCase()==='r'){setSelected(null);setCommand(c=>({kind:'reset',serial:c.serial+1}));}};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[]);
 const index=collection.findIndex(c=>c.slug===coffin.slug), next=collection[(index+1)%collection.length];
 return <main className={`exhibit-page ${expanded?'is-expanded':''}`}>
  <a className="skip-link" href="#annotation-panel">Skip to annotations</a><Script src="/vendor/nederhof/reslite.js" onReady={()=>setRendererReady(true)} onError={()=>setRendererFailed(true)}/><header className="exhibit-header"><Link href="/#collection" className="back-link"><ArrowLeft size={17}/> Collection</Link><Link href="/" className="wordmark">BD<span>3D</span><i/></Link><span>EXHIBIT {String(index+1).padStart(2,'0')} / 06</span></header>
  <motion.div className="exhibit-intro" initial={reduced?false:{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{duration:.7}}><div><p className="eyebrow">{coffin.accession} · {coffin.period}</p><h1>{coffin.name}</h1></div><p>{coffin.subtitle}<span>{coffin.museum}</span></p></motion.div>
  <div className="exhibit-workspace">
    <section ref={stage} role={expanded?'dialog':'region'} aria-modal={expanded||undefined} className="model-stage" data-model-ready={modelReady} aria-label={`Interactive 3D model of ${coffin.name}`}>
      <div className="stage-top"><span><span className="status-dot"/> THE OBJECT IN THREE DIMENSIONS</span><button ref={expandButton} onClick={()=>setExpanded(!expanded)} aria-label={expanded?'Show reading panel':'Expand model'}>{expanded?<Minimize size={18}/>:<Maximize size={18}/>}</button></div>
      <ModelRoom data={data} regions={regions} selected={selected} focusSerial={focusSerial} onSelect={selectRegion} command={command} reduced={reduced} showRegions={showRegions} onReady={onModelReady}/>
      <div className="stage-bottom"><p>Drag to rotate · Scroll to zoom<br/><span>Select an outlined region to read its story</span></p><button onClick={()=>setHelp(!help)} aria-expanded={help} aria-label="Viewer help">?</button></div>
      <div className="camera-toolbar" role="group" aria-label="Model controls"><button onClick={()=>camera('reset')} aria-label="Reset view" title="Reset view (R)"><RotateCcw size={17}/></button><i/><button onClick={()=>camera('left')} aria-label="Rotate left"><ChevronLeft size={18}/></button><button onClick={()=>camera('right')} aria-label="Rotate right"><ChevronRight size={18}/></button><i/><button onClick={()=>camera('in')} aria-label="Zoom in"><Plus size={18}/></button><button onClick={()=>camera('out')} aria-label="Zoom out"><Minus size={18}/></button><i/><button onClick={()=>setShowRegions(!showRegions)} aria-label={showRegions?'Hide region outlines':'Show region outlines'} aria-pressed={showRegions}>{showRegions?<Eye size={18}/>:<EyeOff size={18}/>}</button></div>
      {help && <div className="help-panel"><button onClick={()=>setHelp(false)} aria-label="Close help"><X size={17}/></button><h3>Take a closer look</h3><p>Drag with one finger or your mouse to orbit. Pinch or scroll to zoom. Use the arrow buttons to rotate without dragging.</p><p>Choose an inscription to see its original mapped region. Some texts share a region or occur in several locations. Use the location arrows to visit each one.</p><p><kbd>R</kbd> Reset view <kbd>Esc</kbd> Close expanded view</p></div>}
      <motion.div className="gallery-door door-left" initial={reduced?false:{x:0}} animate={{x:'-100%'}} transition={{duration:1,ease:[.76,0,.24,1]}}/><motion.div className="gallery-door door-right" initial={reduced?false:{x:0}} animate={{x:'100%'}} transition={{duration:1,ease:[.76,0,.24,1]}}/>
    </section>
    <aside className="reading-panel" aria-label="Object annotations" ref={panel}>
      <div className="reading-header"><p className="eyebrow">READ THE SURFACE</p><h2>Words for eternity.</h2><p>Follow a text to its place on the object.</p></div>
      <div className="annotation-tabs" role="tablist" aria-label="Annotation type">{(['inscription','interpretation','vocabulary'] as Tab[]).map(t=><button key={t} id={`tab-${t}`} role="tab" aria-selected={tab===t} aria-controls="annotation-panel" tabIndex={tab===t?0:-1} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const tabs:Tab[]=['inscription','interpretation','vocabulary'];const next=tabs[(tabs.indexOf(t)+(e.key==='ArrowRight'?1:2))%3];setTab(next);setSelected(null);setQuery('');document.getElementById('tab-'+next)?.focus();}}} onClick={()=>{setTab(t);setSelected(null);setQuery('');}}>{t==='inscription'?'Inscriptions':t==='interpretation'?'Stories':'Vocabulary'}</button>)}</div>
      <div className="annotation-options"><div className="search-box"><Search size={15}/><input aria-label="Search annotations" placeholder={`Search ${tab==='vocabulary'?'words':'annotations'}…`} value={query} onChange={e=>{setQuery(e.target.value);setSelected(null);}}/></div>{tab==='inscription' && <select aria-label="Visible linguistic layer" value={layer} onChange={e=>setLayer(e.target.value)}>{['All layers','Translation','Transliteration','Hieroglyphs'].map(l=><option key={l}>{l}</option>)}</select>}</div>
      <div tabIndex={0} className="annotation-list" id="annotation-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
       {results.map((a,i)=><article className={`annotation ${a.id===annotation?.id?'selected':''}`} key={a.id} id={`annotation-${a.id}`}><button className="annotation-title" onClick={()=>choose(a)} aria-pressed={a.id===annotation?.id}><span>{String(i+1).padStart(2,'0')}</span><span className="annotation-heading">{a.title.replaceAll('-',' ')}</span><ArrowUpRight size={17}/></button>
        {a.id===annotation?.id && <div className="location-control"><span role="status">Location {a.areaIds.indexOf(selected!)+1} of {a.areaIds.length}</span><div><button disabled={a.areaIds.length<2} onClick={()=>cycle(-1)} aria-label="Previous location"><ChevronLeft size={17}/></button><button disabled={a.areaIds.length<2} onClick={()=>cycle(1)} aria-label="Next location"><ChevronRight size={17}/></button></div></div>}
        {a.description && <p className="annotation-description">{a.description}</p>}
        {a.fragments.map((f,j)=><div className="fragment" key={j}>{(f.hieroglyphs || f.hieroglyphUnicode) && (layer==='All layers'||layer==='Hieroglyphs') && <Hieroglyphs unavailable={rendererFailed} ready={rendererReady} unicode={f.hieroglyphUnicode} value={f.hieroglyphs} label={f.transliteration||f.translation}/>} {(layer==='All layers'||layer==='Transliteration')&&<p className="transliteration">{f.transliteration}</p>}{(layer==='All layers'||layer==='Translation')&&<p className="translation">{f.translation}</p>}</div>)}
       </article>)}
       {!results.length && <div className="annotation-empty"><BookOpen size={24}/><h3>{query?'No matching annotations':'No entries in this edition'}</h3><p>{query?'Try a different word or phrase.':'This object’s source edition does not include this type of annotation.'}</p></div>}
      </div><div className="annotation-credit">Annotations: Rita Lucarelli, Kea Johnston{coffin.slug==='psamtikseneb'?', Matthew Whealton':''} & Mark-Jan Nederhof. <a href={data.source} target="_blank" rel="noreferrer">Source edition <ArrowUpRight size={12}/></a></div>
    </aside>
  </div>
  <section className="object-context"><div><p className="eyebrow">ABOUT THE OBJECT</p><h2>{coffin.subtitle}</h2><p>{coffin.description}</p><a href={`https://3dcoffins.berkeley.edu/coffins/${coffin.source}`} className="text-link">Full collection record <ArrowUpRight size={16}/></a><Link className="text-link provenance-link" href="/research">Sources & methodology <ArrowUpRight size={16}/></Link></div><dl><div><dt>COLLECTION</dt><dd>{coffin.museum}</dd></div><div><dt>ACCESSION</dt><dd>{coffin.accession}</dd></div><div><dt>ANNOTATION METHOD</dt><dd>Linked surface regions & linguistic layers</dd></div></dl></section>
  <Link className="next-exhibit" href={`/exhibits/${next.slug}`} prefetch={false}><span>NEXT EXHIBIT</span><strong>{next.name}</strong><ArrowRight size={30}/></Link>
 </main>;
}
