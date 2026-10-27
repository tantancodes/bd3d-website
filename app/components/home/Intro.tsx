import Emblem from './Emblem';
import IntroController from './IntroController';

/**
 * First-visit intro: the emblem draws itself, then rises into its place above the
 * headline. Pure CSS, decided before first paint by the inline script:
 * - plays once per browser session;
 * - skipped with reduced motion, without JavaScript, or when storage is unavailable.
 */
const decide = `try{var d=document.documentElement,m=matchMedia('(prefers-reduced-motion: reduce)').matches;if(sessionStorage.getItem('bd3d.intro')||m){d.classList.add('intro-seen')}else{sessionStorage.setItem('bd3d.intro','1');d.classList.add('intro-play')}}catch(e){document.documentElement.classList.add('intro-seen')}`;

export default function Intro() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: decide }} />
      <div className="intro" aria-hidden="true">
        <Emblem className="intro__emblem" drawn />
      </div>
      <IntroController />
    </>
  );
}
