// The opening: the Smart Schools loading animation.
// This file is tiny on purpose. It is the first script on the page, so the animation starts the moment it arrives,
// while main.js (the page itself: 3D, scroll animation, everything heavy) is still downloading beside it.
// On a slow connection the visitor watches the animation instead of a blank screen. main.js takes over through window.__ssBoot:
//   done      the animation has finished (or Skip / Escape was pressed)
//   onDone    main.js sets this to run its own start-up when that happens
import { createLoader } from './smartLoader.ts';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  || new URLSearchParams(location.search).has('still')
  || (() => { try { return localStorage.getItem('ss-still') === '1'; } catch { return false; } })();

// The handover object is made by whichever of boot.js and main.js runs first, and both use the same one.
const ctl = (window.__ssBoot = window.__ssBoot || { done: false, onDone: null, started: false, finish() { if (this.done) return; this.done = true; this.onDone && this.onDone(); } });
ctl.started = true;

if (!reduced) {
  const boot = document.getElementById('boot');
  const bootn = document.getElementById('bootn');
  document.body.classList.add('booting');
  const loader = createLoader(document.getElementById('bootsvg'), { width: innerWidth, height: innerHeight, fade: false });
  boot.classList.add('on'); // the counter and Skip fade in together with the ring
  const t0 = performance.now();
  const step = (now) => {
    if (ctl.done) return;
    const t = (now - t0) / 1000;
    loader.setTime(Math.min(t, loader.settled));
    // never says 100 until the page is really there: main.js sets it
    bootn.textContent = String(Math.min(99, Math.round(Math.min(1, t / (loader.settled + 0.4)) * 100))).padStart(3, '0');
    if (t < loader.settled + 0.8) requestAnimationFrame(step); else ctl.finish();
  };
  requestAnimationFrame(step);
  document.getElementById('skip').addEventListener('click', () => ctl.finish());
  addEventListener('keydown', (e) => { if (e.key === 'Escape') ctl.finish(); });
}
