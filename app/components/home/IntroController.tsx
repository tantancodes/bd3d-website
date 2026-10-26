'use client';
import { useEffect } from 'react';

/** Total intro length; keep in sync with the keyframes in site.css. */
const INTRO_MS = 2100;

/**
 * Ends the intro: after it has played, on any click or key press (skip), and on unmount,
 * so returning to the home page within the visit never replays it.
 */
export default function IntroController() {
  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains('intro-play')) return;
    const finish = () => {
      root.classList.remove('intro-play');
      root.classList.add('intro-seen');
    };
    const skip = () => {
      root.classList.add('intro-skip');
      finish();
    };
    const timer = window.setTimeout(finish, INTRO_MS);
    window.addEventListener('pointerdown', skip, { once: true });
    window.addEventListener('keydown', skip, { once: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
      finish();
    };
  }, []);
  return null;
}
