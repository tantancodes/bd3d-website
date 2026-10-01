'use client';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
declare global { interface Window { parseResLite:(s:string)=>unknown; ResContext:new()=>{emSize:number}; makeDivision:(r:unknown,l:number,c:unknown,p:boolean)=>{render:(c:HTMLCanvasElement)=>void}; } }
export default function Hieroglyphs({value,label}:{value:string;label:string}){
 const ref=useRef<HTMLCanvasElement>(null), [ready,setReady]=useState(false);
 useEffect(()=>{let cancelled=false;if(!ready||!ref.current)return;Promise.all([document.fonts.load('35px NewGardiner'),document.fonts.load('35px HieroglyphicAux')]).then(()=>{if(cancelled||!ref.current)return;const context=new window.ResContext();context.emSize=32;window.makeDivision(window.parseResLite(value),Number.MAX_VALUE,context,false).render(ref.current);});return()=>{cancelled=true;};},[value,ready]);
 return <><Script src="/vendor/nederhof/reslite.js" onReady={()=>setReady(true)}/><div className="hieroglyph-scroll"><canvas ref={ref} role="img" aria-label={`Hieroglyphic transcription: ${label}`}/></div></>;
}
