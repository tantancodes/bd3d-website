'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowDown, ArrowRight, ArrowUpRight, Box, Search, X } from 'lucide-react';
import { collection } from '@/lib/collection';
import FloatingNav from './FloatingNav';
export default function HomeContent() {
  const [query,setQuery] = useState(''), [filter,setFilter] = useState('All objects');
  const reduced = useReducedMotion();
  const filtered = collection.filter(c => (filter === 'All objects' || c.material === filter) && `${c.name} ${c.museum} ${c.accession}`.toLowerCase().includes(query.toLowerCase()));
  return <><a className="skip-link" href="#collection">Skip to collection</a><FloatingNav/>
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span className="status-dot"/> A DIGITAL COLLECTION · UC BERKELEY</p>
          <motion.h1 id="hero-title" initial={reduced ? false : {opacity:0,y:22}} animate={{opacity:1,y:0}} transition={{duration:.8}}>A world<br/>beyond<br/><span>the surface.</span></motion.h1>
          <div className="hero-bottom"><p>Ancient Egyptian coffins.<br/>Extraordinary lives. Stories written<br/>to last an eternity.</p><Link className="round-link" href="#collection" aria-label="Explore the collection"><ArrowDown size={24}/></Link></div>
        </div>
        <Link href="/exhibits/psamtikseneb" className="hero-art" aria-label="Enter the Psamtik-Seneb exhibit">
          <span className="art-index">OBJECT 01 / 06</span>
          <div className="hero-orbit" aria-hidden="true"/>
          <Image src="/images/coffins/psamtikseneb.jpg" fill sizes="(max-width: 700px) 100vw, 50vw" className="hero-object" alt="The painted coffin of Psamtik-Seneb" priority/>
          <div className="hero-art-caption"><span>Psamtik-Seneb<small>Chrysler Museum of Art · 71.2254</small></span><span className="enter-circle"><ArrowUpRight size={24}/></span></div>
          <span className="vertical-label">THE BOOK OF THE DEAD IN 3D</span>
        </Link>
      </section>
      <div className="intro-strip"><span>THE BOOK OF THE DEAD IN 3D</span><p>A closer encounter with ancient Egypt.<br/>Explore the objects. Follow the inscriptions. Find the human stories.</p><span className="strip-mark" aria-hidden="true">↗</span></div>
      <section id="collection" className="collection-section">
        <div className="section-heading"><div><p className="eyebrow">01 — THE COLLECTION</p><h2>Six objects.<br/><span>Countless stories.</span></h2></div><p>Step into an exhibit of your own.<br/>Turn each coffin in three dimensions and<br/>read the words inscribed on its surface.</p></div>
        <div className="collection-tools"><div className="filters" aria-label="Filter by material">{['All objects','Wood','Stone'].map(f=><button key={f} aria-pressed={filter===f} onClick={()=>setFilter(f)}>{f}{f==='All objects' && <sup>06</sup>}</button>)}</div><div className="search-box"><Search size={16}/><input aria-label="Search the collection" placeholder="Find an object, name, or museum" value={query} onChange={e=>setQuery(e.target.value)}/>{query && <button onClick={()=>setQuery('')} aria-label="Clear search"><X size={15}/></button>}</div></div>
        <p className="sr-only" role="status">{filtered.length} objects found</p>
        <div className="collection-grid">{filtered.map(c=><motion.article key={c.slug} initial={reduced ? false : {opacity:0,y:25}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.12}} transition={{duration:.55}}>
          <Link className="exhibit-card" href={`/exhibits/${c.slug}`}>
            <div className="card-image" style={{backgroundColor:c.color}}><span className="card-number">{String(collection.indexOf(c)+1).padStart(2,'0')}</span><Image src={`/images/coffins/${c.slug}.jpg`} alt={`Coffin of ${c.name}`} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"/><span className="card-entry">Enter exhibit <ArrowUpRight size={19}/></span><span className="model-tag"><Box size={13}/> EXPLORE IN 3D</span></div>
            <div className="card-heading"><h3>{c.name}</h3><ArrowUpRight size={23}/></div><p>{c.subtitle}</p><div className="card-meta"><span>{c.museum}</span><span>{c.accession}</span></div>
          </Link>
        </motion.article>)}</div>
        {!filtered.length && <div className="empty-state"><h3>No objects found.</h3><p>Try a name, museum, or accession number.</p><button onClick={()=>{setQuery('');setFilter('All objects');}}>Reset filters <ArrowRight size={16}/></button></div>}
      </section>
      <section className="project-section" id="project"><p className="eyebrow">02 — LOOK CLOSER</p><div className="project-grid"><h2>More than<br/>an object.<br/><em>A life.</em></h2><div><p className="project-lead">A coffin was a place of transformation. Its images and words were made to protect a person on their journey beyond death.</p><p>The Book of the Dead in 3D brings these surfaces into view. Photogrammetry and linked scholarly annotations make it possible to move between the object, its inscriptions, and their meaning.</p><Link className="text-link" href="/research">Discover the research <ArrowUpRight size={19}/></Link></div></div><div className="project-features"><span><b>01</b> Explore from every angle</span><span><b>02</b> Read the original inscriptions</span><span><b>03</b> Connect words to their surfaces</span></div></section>
    </main><footer className="site-footer"><Link className="wordmark" href="/">BD<span>3D</span><i/></Link><p>The Book of the Dead in 3D<br/><span>Objects preserved. Knowledge shared.</span></p><a href="https://3dcoffins.berkeley.edu/">Visit the Berkeley project <ArrowUpRight size={15}/></a></footer>
  </>;
}
