import '@fontsource-variable/unbounded';
import '@fontsource-variable/geologica';
import '@fontsource-variable/jetbrains-mono';
import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import QRCode from 'qrcode';
import { createHub } from './hub.js';
import { createHeroGlobe } from './herogl.js';
import { createFilm } from './film.js';
import { createAnamorph } from './anamorph.js';
import { createShapes } from './shapes.js';
import { quality, frame as qualityFrame } from './quality.js';
import { BOT_URL, T } from './i18n.js';

gsap.registerPlugin(ScrollTrigger);
gsap.ticker.lagSmoothing(0);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
// ?still=1 plays no motion (no opening, no loops): same as the reduced-motion setting
const pref = { get: () => { try { return localStorage.getItem('ss-still') === '1'; } catch { return false; } }, set: (v) => { try { v ? localStorage.setItem('ss-still', '1') : localStorage.removeItem('ss-still'); } catch { /* ignore */ } } };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).has('still') || pref.get();
if (reduced) document.body.classList.add('still');
let introDone = false;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/* ---------- language ---------- */
const lang = 'en'; // the site is in English only

/* ---------- Zukko, drawn once and reused ---------- */
const owlSvg = ({ body = '#5560D6', wing = '#2E3597', happy = false, look = [0, 0], shadow = true } = {}) => `<svg viewBox="0 0 120 120" aria-hidden="true">${shadow ? '<ellipse cx="60" cy="112" rx="30" ry="5" fill="rgba(11,16,56,.25)"/>' : ''}<path d="M26 62 C10 70 12 92 30 98 C30 84 32 72 26 62Z" fill="${wing}"/><path d="M94 62 C110 70 108 92 90 98 C90 84 88 72 94 62Z" fill="${wing}"/><path d="M60 18 C88 18 98 40 98 66 C98 92 82 106 60 106 C38 106 22 92 22 66 C22 40 32 18 60 18Z" fill="${body}"/><path d="M60 52 C78 52 84 66 84 80 C84 96 74 102 60 102 C46 102 36 96 36 80 C36 66 42 52 60 52Z" fill="#E9EEFF"/><path d="M50 80 q5 4 10 0 q5 4 10 0 M46 90 q7 5 14 0 q7 5 14 0" stroke="#B8C2F2" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M36 26 L30 10 L48 22Z" fill="${body}"/><path d="M84 26 L90 10 L72 22Z" fill="${body}"/><circle cx="44" cy="46" r="15" fill="#fff"/><circle cx="76" cy="46" r="15" fill="#fff"/>${happy ? '<path d="M36 48 q8 -9 16 0" stroke="#0B1038" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M68 48 q8 -9 16 0" stroke="#0B1038" stroke-width="4.5" fill="none" stroke-linecap="round"/>' : `<circle cx="${45 + look[0]}" cy="${47 + look[1]}" r="6.5" fill="#0B1038"/><circle cx="${77 + look[0]}" cy="${47 + look[1]}" r="6.5" fill="#0B1038"/><circle cx="${47 + look[0]}" cy="${45 + look[1]}" r="2" fill="#fff"/><circle cx="${79 + look[0]}" cy="${45 + look[1]}" r="2" fill="#fff"/>`}<path d="M55 56 L65 56 L60 66Z" fill="#2DE2C4"/><circle cx="34" cy="60" r="5" fill="#B79CFF" opacity=".7"/><circle cx="86" cy="60" r="5" fill="#B79CFF" opacity=".7"/></svg>`;
$('#miniOwl').innerHTML = owlSvg({ look: [3, -4], shadow: false });
$('#owl2').innerHTML = owlSvg({ body: '#3B4BFF', wing: '#2230C8', happy: true });

/* ---------- headlines: words rise out of a mask ---------- */
const rvTrig = new Map();
function words(raw) {
  const out = []; let acc = false, prevEnd = true;
  for (const part of raw.split('*')) {
    const ws = part.split(/\s+/).filter(Boolean);
    ws.forEach((w, i) => out.push({ w, acc, glue: i === 0 && !prevEnd && !/^\s/.test(part) }));
    if (part) prevEnd = /\s$/.test(part); acc = !acc;
  }
  return out;
}
function renderRV(el) {
  const key = el.dataset.i18n || el.dataset.i18nRich;
  const raw = T[lang][key] ?? '';
  el.setAttribute('aria-label', raw.replace(/\*/g, ''));
  el.innerHTML = words(raw).map(({ w, acc, glue }, i) => (i && !glue ? ' ' : '') + `<span class="w" aria-hidden="true"><span class="${acc ? 'acc' : ''}">${w}</span></span>`).join('');
  rvTrig.get(el)?.kill();
  if (reduced || (el.id === 'h1' && introDone)) return;
  const inner = el.querySelectorAll('.w > span');
  gsap.set(inner, { yPercent: 115, rotate: 6 });
  const t = el.id === 'h1' ? null : gsap.to(inner, { yPercent: 0, rotate: 0, duration: 1.1, ease: 'expo.out', stagger: 0.05, scrollTrigger: { trigger: el, start: 'top 88%' } });
  if (t) rvTrig.set(el, t.scrollTrigger);
}
function heroHeadline() { if (reduced) return; gsap.to('#h1 .w > span', { yPercent: 0, rotate: 0, duration: 1.3, ease: 'expo.out', stagger: 0.06 }); }

/* words that light up as you scroll past */
let litTweens = [];
function litWords() {
  litTweens.forEach((t) => { t.scrollTrigger?.kill(); t.kill(); }); litTweens = [];
  if (reduced) return;
  $$('.lit').forEach((el) => {
    const ws = el.textContent.trim().split(/\s+/);
    el.innerHTML = ws.map((w) => `<span class="lw">${w}</span>`).join(' ');
    litTweens.push(gsap.fromTo(el.querySelectorAll('.lw'), { opacity: 0.2 }, { opacity: 1, ease: 'none', stagger: 0.12, scrollTrigger: { trigger: el, start: 'top 88%', end: 'bottom 55%', scrub: true } }));
  });
}

/* ---------- the sample class, the report ---------- */
function renderDots() {
  const kinds = [[24, '#2DE2C4', '#12B79C'], [8, '#B79CFF', '#8C6BFF'], [3, '#DDE3FF', '#C5CCF2']];
  $('#dots35').innerHTML = kinds.map(([n, bg, edge]) => Array.from({ length: n }, () => `<span style="background:${bg};box-shadow:0 3px 0 ${edge}"></span>`).join('')).join('');
}
const REPORT = [['Aziza', '111011'], ['Bobur', '111001'], ['Dilnoza', '111111'], ['Jasur', '101001'], ['Kamola', '111110'], ['Madina', '011111'], ['Sardor', '001011']];
function renderReport() {
  const head = `<div class="r-row r-head"><span>${T[lang].student}</span>${[1, 2, 3, 4, 5, 6].map((q) => `<span class="${q === 4 ? 'miss' : ''}">Q${q}</span>`).join('')}<span class="end">${T[lang].score}</span></div>`;
  const rows = REPORT.map(([name, bits]) => `<div class="r-row"><span>${name}</span>${[...bits].map((b, q) => `<span class="${b === '1' ? 'ok' : 'no'}${q === 3 ? ' miss' : ''}">${b === '1' ? '✓' : '✗'}</span>`).join('')}<span class="end">${[...bits].filter((b) => b === '1').length}/6</span></div>`).join('');
  $('#reportGrid').innerHTML = head + rows;
}

/* ---------- the cut slider: only 12 pieces line both edges up ---------- */
const CUTS = [2, 3, 4, 6, 12];
const bars = $('#bars');
bars.innerHTML = ['b1', 'b2'].map((c) => `<div class="bar ${c}"><div class="fill" style="width:${c === 'b1' ? 75 : 66.6667}%"></div><div class="grid"></div><div class="edge" style="left:${c === 'b1' ? 75 : 66.6667}%"></div></div>`).join('');
const barEls = $$('.bar', bars);
const cutIn = $('#cut');
function setCut(animate = true) {
  const idx = +cutIn.value, n = CUTS[idx];
  cutIn.style.setProperty('--fillp', `${(idx / 4) * 100}%`);
  $('#pcs').textContent = `${n} ${T[lang].pieces}`;
  const fr = [3 / 4, 2 / 3];
  const ok = fr.map((f) => Math.abs(f * n - Math.round(f * n)) < 1e-9);
  barEls.forEach((b, k) => {
    b.classList.toggle('ok', ok[k]);
    $('.grid', b).innerHTML = Array.from({ length: n - 1 }, (_, i) => `<i style="left:${((i + 1) / n) * 100}%"></i>`).join('');
    if (animate && !reduced) gsap.from($$('.grid i', b), { scaleY: 0, duration: 0.35, stagger: 0.015, ease: 'back.out(2)' });
  });
  $('#lblA').textContent = ok[0] ? `3/4 = ${0.75 * n} / ${n}` : '3/4';
  $('#lblB').textContent = ok[1] ? `2/3 = ${(2 / 3) * n} / ${n}` : '2/3';
  const L = T[lang];
  $('#cutmsg').textContent = ok[0] && ok[1] ? L.cut12 : ok[0] ? L.cut4 : ok[1] ? L.cut3 : L.cutNone;
}
cutIn.addEventListener('input', () => setCut(true));

function applyLang() {
  document.documentElement.lang = lang;
  $$('[data-i18n]:not(.rv)').forEach((el) => { const v = T[lang][el.dataset.i18n]; if (v != null) el.textContent = v; });
  $$('.rv').forEach(renderRV);
  $('#ph1').src = 'shots/en-bazaar.webp'; $('#ph2').src = 'shots/en-line.webp';
  renderReport(); setCut(false); litWords();
  if (typeof anText === 'function') { anText(); wrapSaying(); }
  if (typeof anamP !== 'undefined' && T[lang].anWord !== anWordNow) { anWordNow = T[lang].anWord; anamP.then((a) => a?.setWord(anWordNow)); }
  if (booted) ScrollTrigger.refresh();
}

/* ---------- links, QR ---------- */
for (const id of ['#cta-top', '#cta-hero', '#cta-bot']) $(id).href = BOT_URL;
QRCode.toString(BOT_URL, { type: 'svg', margin: 0, color: { dark: '#0B1038', light: '#ffffff' } }).then((svg) => { $('#qr').innerHTML = svg; });
renderDots();

/* ---------- sections (the header turns light or dark with the one under it) ---------- */
const secs = $$('[data-ch]');

/* the opening globe (scroll-driven); with reduced motion or no WebGL the skyline picture is shown straight away */
const hgRun = $('#hgRun'), hgCv = $('#hgCanvas'), hgPic = $('#hgPic');
let hg = null, hgP = 0, hgT = performance.now(), hgPos = -1;
const hgWords = $$('#hgCopy p'), hgDim = $('#hgDim');
if (!reduced) { try { hg = createHeroGlobe(hgCv, { reduced }); } catch (e) { document.body.classList.add('hg-fallback'); } }
/* the film chapter: the slats, the opening of the blinds and the growing frame (see film.js) */
const filmRun = $('#filmRun');
/* the shapes chapter: the original hand-figure app in a frame, with a voice (see shapes.js) */
createShapes($('#shapes'), { reduced });
const film = createFilm({ pin: $('#filmPin'), stage: $('#filmStage'), wall: $('#slats'), title: $('#filmTitle'), note: $('#filmNote'), shade: $('#vshade'), video: $('#vid') }, { reduced });
let filmP = 0, filmE = 0, filmT = performance.now();
const sm = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

/* ---------- the question: an anamorphic sculpture ---------- */
let anAligned = false, anWordNow = T[lang].anWord, anProg = reduced ? 1 : 0;
// the saying lights up word by word while the sculpture resolves
function wrapSaying() { const el = $('#anSaying'); el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="lw">${w}</span>`).join(' '); lightSaying(); }
function lightSaying() { const ws = $$('#anSaying .lw'); ws.forEach((w, i) => { w.style.opacity = reduced ? 1 : String(0.18 + 0.82 * clamp((anProg - 0.14) / 0.5 * ws.length - i, 0, 1)); }); }
function anText() {
  const t = anAligned ? T[lang].anOn.replace('{w}', T[lang].anWord) : T[lang].anOff;
  $('#anRange').setAttribute('aria-valuetext', t);
  $('#anResolve').classList.toggle('on', anAligned); $('#anResolve').setAttribute('aria-pressed', String(anAligned));
}
const anamP = createAnamorph({ canvas: $('#anCanvas'), stage: $('#anStage'), range: $('#anRange'), angleEl: $('#anAngle'), btnResolve: $('#anResolve'), btnChange: $('#anChange'), hint: $('#anHint'), run: $('#anRun'), reduced, onProgress: (p) => { anProg = p; lightSaying(); }, word: anWordNow, onState: (a) => { anAligned = a; anText(); } }).catch((e) => { console.warn('anamorph', e); return null; });

/* a device that cannot keep up even at the lowest resolution gets the opening as a picture instead of the 3D globe */
quality.onLite(() => {
  document.body.classList.add('hg-fallback');
  hg = null;
  ScrollTrigger.refresh();
});

/* ---------- the AI hub ---------- */
const hub = createHub($('#hub'), $('#hub2'), { reduced });

/* ---------- opening: the Smart Schools loading animation ---------- */
let booted = false;
const boot = $('#boot');
function finishBoot() {
  if (booted) return;
  booted = true;
  const bn = document.getElementById('bootn'); if (bn) bn.textContent = '100';
  boot.classList.add('gone');
  document.body.classList.remove('booting');
  setTimeout(() => boot.remove(), reduced ? 0 : 1200);
  measure();
  heroIntro();
  ScrollTrigger.refresh();
}
if (reduced) {
  boot.remove(); booted = true; document.body.classList.remove('booting');
} else {
  // the animation itself runs in boot.js (a separate, tiny script); this page takes over when it has finished or was skipped
  const bootCtl = (window.__ssBoot = window.__ssBoot || { done: false, onDone: null, started: false, finish() { if (this.done) return; this.done = true; this.onDone && this.onDone(); } });
  if (bootCtl.done) finishBoot(); else bootCtl.onDone = finishBoot;
  // boot.js blocked or missing: never leave the visitor under the loader
  setTimeout(() => { if (!bootCtl.started) finishBoot(); }, 6000);
}
applyLang();

/* ---------- Zukko comes alive ---------- */
const heroSet = [];
if (!reduced) {
  gsap.set('.disc', { scale: 0, transformOrigin: '50% 50%' });
  gsap.set('#owl', { y: 90, scale: 0.6, opacity: 0, transformOrigin: '50% 100%' });
  gsap.set('.chip', { scale: 0, opacity: 0 });
  gsap.set('.hero-copy > :not(h1)', { y: 28, opacity: 0 });
  gsap.set('#dots35 span', { scale: 0 });
  gsap.set('.hero-wires', { opacity: 0 });
  gsap.set('.lid', { scaleY: 0, transformOrigin: '50% 0%' });
}
function heroIntro() {
  if (reduced) return;
  introDone = true;
  heroHeadline();
  const tl = gsap.timeline({ delay: 0.1 });
  tl.to('.disc', { scale: 1, duration: 1.1, ease: 'back.out(1.5)' })
    .to('#owl', { y: 0, scale: 1, opacity: 1, duration: 0.9, ease: 'back.out(1.7)' }, 0.3)
    .to('.chip', { scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(2)', stagger: 0.14 }, 0.7)
    .to('.hero-wires', { opacity: 0.75, duration: 0.8 }, 1.1)
    .to('.hero-copy > :not(h1)', { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.1 }, 0.5)
    .to('#dots35 span', { scale: 1, duration: 0.5, ease: 'back.out(3)', stagger: 0.02 }, 1.0);
  tl.add(() => {
    gsap.to('#owl', { y: -10, duration: 2.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    ['.c1', '.c2', '.c3', '.c4'].forEach((s, i) => gsap.to(s, { y: i % 2 ? 9 : -9, duration: 2.4 + i * 0.5, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: i * 0.3 }));
    const blink = () => gsap.timeline({ delay: 2 + Math.random() * 3, onComplete: blink }).to('.lid', { scaleY: 1, duration: 0.07 }).to('.lid', { scaleY: 0, duration: 0.11 });
    blink();
    const n = { v: 0 }; gsap.to(n, { v: 24, duration: 1.6, ease: 'power2.out', onUpdate: () => { $('#chip24').textContent = Math.round(n.v); } });
  }, 1.6);
}
addEventListener('pointermove', (e) => {
  if (reduced || e.pointerType !== 'mouse') return;
  const r = $('#owl').getBoundingClientRect();
  const dx = clamp((e.clientX - (r.left + r.width / 2)) / (innerWidth * 0.5), -1, 1), dy = clamp((e.clientY - (r.top + r.height * 0.4)) / (innerHeight * 0.5), -1, 1);
  gsap.to('#pupils', { x: dx * 3.2, y: dy * 2.6, duration: 0.35, overwrite: 'auto' });
  gsap.to('#zukko', { rotation: dx * 4, duration: 0.7, overwrite: 'auto', transformOrigin: '50% 90%' });
});

/* ---------- where everything is on the page ---------- */
const topBar = $('#top-bar');
const pageTop = (el) => el.getBoundingClientRect().top + scrollY;
let M = {};
function measure() { M = { vh: innerHeight, narrow: innerWidth < 900 }; }
measure();
addEventListener('resize', () => { measure(); hub.fit(); hg && hg.resize(); ScrollTrigger.refresh(); });
addEventListener('load', () => { measure(); hub.fit(); ScrollTrigger.refresh(); });
document.fonts?.ready.then(() => { measure(); hub.fit(); ScrollTrigger.refresh(); });

const DARK = ['hero', 'film', 'black', 'blue', 'ink', 'deep', 'anam', 'shapes'];
let tNow = 0;
function tick(now) {
  tNow = now / 1000;
  qualityFrame(now);
  const vh = M.vh;
  let ch = 0, dark = false;
  secs.forEach((s, k) => { const r = s.getBoundingClientRect(); if (r.top <= vh * 0.5) ch = k; if (r.top <= 44 && r.bottom > 44) dark = DARK.some((c) => s.classList.contains(c)); });
  topBar.classList.toggle('dark', dark);
  topBar.classList.toggle('clear', secs[0].getBoundingClientRect().bottom > 64);
  if (hg) {
    /* the opening follows the scroll with a soft ease, so wheel notches and fast flicks never make it jump */
    const hr = hgRun.getBoundingClientRect(), sc = -hr.top, hp = clamp(sc / (vh * 3.4)); /* the first 3.4 screens are the globe and the picture; the rest of the run is the words */
    const t2 = performance.now(), dtS = Math.min(0.1, (t2 - hgT) / 1000); hgT = t2;
    const inView = hr.bottom > -40 && hr.top < vh + 40;
    /* the words: the next line rises from below and tilts into the middle, the one before tilts away upwards */
    const cs = sc - vh * 3.4, posT = clamp(cs < vh * 0.6 ? -1 + cs / (vh * 0.6) : (cs - vh * 0.6) / (vh * 0.8), -1, hgWords.length - 1);
    if (!inView) { hgP = hp; hgPos = posT; } else { hgP += (hp - hgP) * (1 - Math.exp(-dtS * 5)); if (Math.abs(hp - hgP) < 0.0004) hgP = hp; }
    if (inView) {
      const pic = sm(0.9, 1, hgP);
      hgPic.style.opacity = pic.toFixed(4); hgPic.style.transform = 'scale(' + (1.08 - 0.08 * pic).toFixed(4) + ')';
      hgCv.style.opacity = (1 - sm(0.93, 1, hgP)).toFixed(4);
      if (hgP < 0.99) hg.frame(hgP, tNow);
      hgPos += (posT - hgPos) * (1 - Math.exp(-dtS * 6)); if (Math.abs(posT - hgPos) < 0.0005) hgPos = posT;
      const step = clamp(vh * 0.3, 170, 300); let show = 0;
      hgWords.forEach((el, i) => {
        const o = i - hgPos, a = Math.abs(o), op = Math.pow(clamp(1 - a * 1.7), 1.3);
        el.style.opacity = op.toFixed(3); show = Math.max(show, op);
        el.style.transform = `translate3d(0, ${(o * step).toFixed(1)}px, 0) rotateX(${(-o * 62).toFixed(2)}deg) scale(${(1 - a * 0.05).toFixed(3)})`;
      });
      hgDim.style.opacity = (show * 0.95 * sm(0.9, 1, hgP)).toFixed(3);
    }
  }
  {
    /* the film chapter eases the same way: soft, so a wheel notch never makes the blinds jump */
    const fr = filmRun.getBoundingClientRect(), t3 = performance.now(), dt3 = Math.min(0.1, (t3 - filmT) / 1000); filmT = t3;
    const inV = fr.bottom > -40 && fr.top < vh * 1.4, target = clamp(-fr.top / Math.max(1, fr.height - vh * 1.8)), enter = clamp(1 - fr.top / vh);
    if (!inV) { filmP = target; filmE = enter; }
    else { const k = 1 - Math.exp(-dt3 * 5); filmP += (target - filmP) * k; filmE += (enter - filmE) * k; if (Math.abs(target - filmP) < 0.0004) filmP = target; if (Math.abs(enter - filmE) < 0.0004) filmE = enter; film.frame(filmP, filmE); }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

/* ---------- scroll motion on the page itself (GSAP) ---------- */
if (!reduced) {
  // the hero sinks back as the first sheet slides over it
  gsap.to('.hero-grid', { y: -70, opacity: 0.35, ease: 'none', scrollTrigger: { trigger: '#question', start: 'top bottom', end: 'top 20%', scrub: true } });
  gsap.from('.card', { y: 70, opacity: 0, duration: 0.9, stagger: 0.14, ease: 'power3.out', scrollTrigger: { trigger: '.cards3', start: 'top 82%' } });
  gsap.from('.ph1', { y: 160, rotate: -14, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.phones', start: 'top 95%', end: 'top 35%', scrub: true } });
  gsap.from('.ph2', { y: 240, rotate: 16, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.phones', start: 'top 95%', end: 'top 25%', scrub: true } });
  gsap.from('.hintbox', { y: 70, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.hintbox', start: 'top 85%' } });
  gsap.from('.steps3 .st', { y: 30, scale: 0.8, opacity: 0, duration: 0.6, stagger: 0.12, ease: 'back.out(2)', scrollTrigger: { trigger: '.steps3', start: 'top 90%' } });
  gsap.from('#miniOwl', { y: 20, rotate: -12, duration: 1.2, ease: 'elastic.out(1,0.4)', scrollTrigger: { trigger: '.hintbox', start: 'top 80%' } });
  gsap.from('.window', { y: 90, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.window', start: 'top 88%' } });
  gsap.from('.r-row', { x: -24, opacity: 0, duration: 0.5, stagger: 0.07, ease: 'power2.out', scrollTrigger: { trigger: '#reportGrid', start: 'top 85%' } });
  gsap.from('.missed', { scale: 0.92, opacity: 0, duration: 0.6, ease: 'back.out(2)', scrollTrigger: { trigger: '.missed', start: 'top 95%' } });
  gsap.from('.try-copy > *, #owl2, .qr', { y: 50, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '.try-row', start: 'top 85%' } });
  gsap.to('#owl2', { y: -8, duration: 2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
}

/* ---------- the film ---------- */
const vid = $('#vid'), vframe = $('#vframe');
$('#play').addEventListener('click', () => { vid.play(); vid.focus(); });
vid.addEventListener('play', () => vframe.classList.add('playing'));
vid.addEventListener('pause', () => vframe.classList.remove('playing'));
vid.addEventListener('ended', () => vframe.classList.remove('playing'));
new IntersectionObserver(([e]) => { if (!e.isIntersecting) vid.pause(); }, { threshold: 0.05 }).observe(vframe);

/* ---------- jumping around ---------- */
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href');
  const el = id === '#top' ? document.body : $(id);
  if (!el) return;
  e.preventDefault();
  scrollTo({ top: id === '#top' ? 0 : pageTop(el) - 40, behavior: reduced ? 'auto' : 'smooth' });
}));
void heroSet;
