'use client';
import Link from 'next/link';
import { useState } from 'react';
import { motion, useMotionValueEvent, useScroll, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
export default function FloatingNav() {
  const { scrollY } = useScroll();
  const [floating, setFloating] = useState(false);
  const reduced = useReducedMotion();
  useMotionValueEvent(scrollY, 'change', value => setFloating(value > 160));
  return <motion.header className={`site-header ${floating ? 'is-floating' : ''}`} layout={!reduced} transition={{duration:.35}}>
    <Link className="wordmark" href="/" aria-label="Book of the Dead in 3D home">BD<span>3D</span><i /></Link>
    <nav aria-label="Main navigation"><Link href="/#collection">The collection</Link><Link href="/#project">The project</Link><Link href="/research">Research <ArrowUpRight size={13}/></Link></nav>
    <span className="header-note">ANCIENT OBJECTS. NEW PERSPECTIVES.</span>
  </motion.header>;
}
