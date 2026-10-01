'use client';
import { useEffect, useRef, useState } from 'react';
declare global { interface Window { parseResLite:(s:string)=>unknown; ResContext:new()=>{emSize:number}; makeDivision:(r:unknown,l:number,c:unknown,p:boolean)=>{render:(c:HTMLCanvasElement)=>void}; } }
export default function Hieroglyphs({value,unicode,label,ready,unavailable}:{value:string;unicode?:string;label:string;ready:boolean;unavailable?:boolean}){
 const ref=useRef<HTMLCanvasElement>(null),[failed,setFailed]=useState(false);
 useEffect(()=>{
  let cancelled=false;
  if(!ready||unicode||!ref.current)return;
  Promise.all([document.fonts.load('35px NewGardiner'),document.fonts.load('35px HieroglyphicAux')]).then(()=>{
   if(cancelled||!ref.current)return;
   const context=new window.ResContext();context.emSize=32;
   window.makeDivision(window.parseResLite(value),Number.MAX_VALUE,context,false).render(ref.current);
   ref.current.dataset.rendered='true';
  }).catch(()=>{if(!cancelled)setFailed(true);});
  return()=>{cancelled=true;};
 },[value,ready,unicode]);
 if(failed||(unavailable&&!unicode))return <p>Transcription rendering is unavailable. Consult the source edition.</p>;
 return <div className="hieroglyph-scroll" tabIndex={0} aria-label="Scrollable hieroglyphic transcription">{unicode ? <span className="unicode-hieroglyphs" role="img" aria-label={`Hieroglyphic transcription: ${label}`}>{unicode}</span> : <canvas ref={ref} role="img" aria-label={`Hieroglyphic transcription: ${label}`}/>}</div>;
}
