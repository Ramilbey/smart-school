// "Shapes you can hold": a geometry lesson with your own hand.
// The shapes are made by the original hand-figure app (github.com/olimoverkinjon/hand-figure), used exactly as published:
// its files are in vendor/hand-figure and are built, unchanged, into public/hand-figure. It opens in a frame here, when the
// visitor presses the button. This file is only the wrapper around it: the button, a voice that explains each shape,
// English labels for what the app says in Uzbek, and the numbers of the shape (faces, edges, vertices).
// Before the app, the page tells a short story as you scroll (buildStory below): a hook, a question and a follow-up.
//
// Privacy: the camera is read inside the browser by the app. Nothing is recorded or sent anywhere.
import gsap from 'gsap';
import { T } from './i18n.js';
import { parseHud, parseMessage, shapeFacts } from './handHud.js';

const L = T.en;

/* ---------- the voice ---------- */

function createVoice(clips, onText) {
  const audio = new Audio();
  audio.preload = 'auto';
  let on = true, current = null, pending = null, hideTimer = 0;
  const lastAt = {};
  const show = (text, ms) => { onText(text); clearTimeout(hideTimer); hideTimer = setTimeout(() => { if (!current) onText(''); }, ms); };

  function play(id) {
    const clip = clips[id];
    if (!clip) return;
    current = id;
    lastAt[id] = Date.now();
    show(clip.text, (clip.seconds + 1.5) * 1000);
    if (!on) { current = null; return; }
    audio.src = clip.file;
    audio.play().catch(() => { current = null; }); // blocked: the caption is still there
  }
  audio.addEventListener('ended', () => {
    current = null;
    if (pending) { const next = pending; pending = null; play(next); }
    else hideTimer = setTimeout(() => { if (!current) onText(''); }, 1400);
  });

  return {
    /** Say a line. If another one is playing, this waits for it (only the newest waiting line is kept). */
    say(id, { minGap = 0, now = false } = {}) {
      if (!clips[id]) return;
      if (minGap && Date.now() - (lastAt[id] ?? 0) < minGap) return;
      if (now) { pending = null; audio.pause(); current = null; return play(id); }
      if (current && on) { if (current !== id) pending = id; return; }
      play(id);
    },
    get busy() { return Boolean(current) && on; },
    setOn(v) { on = v; if (!on) { audio.pause(); current = null; pending = null; } },
    get on() { return on; },
    stop() { audio.pause(); current = null; pending = null; onText(''); },
  };
}

/* ---------- the story that leads to the app ---------- */

/**
 * The chapter is pinned while you scroll through it. The timeline below runs from 0 to 100 over that scroll:
 *   0-36   a textbook page with a drawing of a cube appears, the cube is drawn, "A cube on paper isn't a cube."
 *          and the page turns edge-on to show that it is only flat
 *   37-66  the page steps back; the question, and under it the follow-up: "Care to check it out?"
 *   68-82  the story folds away and the app's frame comes in
 *   82-100 the frame stays, so there is time to use it before the page scrolls on
 */
function buildStory(root, onProgress) {
  const $ = (sel) => root.querySelector(sel);
  const $$ = (sel) => [...root.querySelectorAll(sel)];
  const hook = $$('#shHook .ln > span'), question = $$('#shQ .ln > span'), follow = $('#shFollow');
  const page = $('#shPage'), draw = $$('#shPage .draw'), hidden = $('#shPage .hid'), notes = $$('#shPage .note');
  const story = $('#shStory'), lab = $('#shLab'), stage = $('#shStage');
  const narrow = innerWidth < 900;

  gsap.set([...hook, ...question], { yPercent: 112 });
  gsap.set(follow, { autoAlpha: 0, y: 22 });
  gsap.set(page, { autoAlpha: 0, y: narrow ? 60 : 130, rotationY: -18, rotationZ: -5, transformOrigin: '50% 50%' });
  gsap.set(draw, { strokeDashoffset: 1 });
  gsap.set([hidden, ...notes], { autoAlpha: 0 });
  gsap.set(lab, { autoAlpha: 0 });
  gsap.set(stage, { scale: 0.93, y: 30 });

  return gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: $('#shRun'), start: 'top top', end: 'bottom bottom', scrub: 0.6, onUpdate: (self) => onProgress(self.progress) },
  })
    .to(page, { autoAlpha: 1, y: 0, rotationY: -10, rotationZ: -3, duration: 10, ease: 'power3.out' }, 0)
    .to(draw, { strokeDashoffset: 0, duration: 4, stagger: 1.1, ease: 'power1.inOut' }, 3)
    .to([hidden, ...notes], { autoAlpha: 1, duration: 4, stagger: 1 }, 11)
    // the hook
    .to(hook, { yPercent: 0, duration: 6, stagger: 5, ease: 'power3.out' }, 9)
    // the page is turned sideways: it is only flat
    .to(page, { rotationY: 84, duration: 6, ease: 'power2.inOut' }, 23)
    .to(page, { rotationY: -10, duration: 6, ease: 'power2.inOut' }, 29.5)
    // the hook leaves and the page steps back
    .to(hook, { yPercent: -112, duration: 5, stagger: 1.2, ease: 'power2.in' }, 37)
    .to(page, { x: narrow ? 0 : '6vw', scale: 0.8, autoAlpha: 0.22, rotationY: -22, duration: 9, ease: 'power2.inOut' }, 37)
    // the question, and under it the follow-up
    .to(question, { yPercent: 0, duration: 7, stagger: 4, ease: 'power3.out' }, 42)
    .to(follow, { autoAlpha: 1, y: 0, duration: 6, ease: 'power3.out' }, 54)
    // the story folds away and the frame with the app comes in
    .to(story, { autoAlpha: 0, y: -50, duration: 8, ease: 'power2.in' }, 68)
    .to(lab, { autoAlpha: 1, duration: 9, ease: 'power2.out' }, 72)
    .to(stage, { scale: 1, y: 0, duration: 10, ease: 'power3.out' }, 72)
    .to({}, { duration: 0.01 }, 100);
}

/* ---------- the chapter ---------- */

export function createShapes(root, { reduced = false } = {}) {
  const $ = (id) => root.querySelector(`#${id}`);
  const el = {
    lab: $('shLab'), stage: $('shStage'), ask: $('shAsk'), start: $('shStart'), demo: $('shDemo'), stop: $('shStop'), mute: $('shMute'), cap: $('shCap'),
    name: $('shName'), base: $('shBase'), faces: $('shFaces'), edges: $('shEdges'), verts: $('shVerts'), euler: $('shEuler'), nums: $('shNums'),
  };
  const state = { running: false, frame: null, caption: '', status: '', fingers: null, lastHandAt: 0, timer: 0, away: 0, seen: new Set(), eulerSaid: false, secondSaid: false };

  /* one message bubble on the stage: what the voice says, or else the status (looking for a hand, camera blocked…) */
  const refresh = () => {
    const text = state.caption || state.status;
    el.cap.textContent = text;
    el.cap.classList.toggle('on', Boolean(text));
  };
  const setStatus = (text) => { if (state.status !== text) { state.status = text; refresh(); } };

  const voiceClips = {};
  const voice = createVoice(voiceClips, (t) => { state.caption = t; refresh(); });
  fetch('media/shapes/voice.json')
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => { if (data?.clips) Object.assign(voiceClips, data.clips); })
    .catch(() => { /* no voice: the chapter still works */ });

  /* the numbers of the shape on the screen */
  function showFacts(fingers) {
    const f = shapeFacts(fingers);
    if (!f) return;
    el.name.textContent = f.name;
    const val = (v) => (v === null ? '–' : String(v));
    el.base.textContent = f.base === 'round' ? L.shRound : val(f.base);
    el.faces.textContent = val(f.faces);
    el.edges.textContent = val(f.edges);
    el.verts.textContent = val(f.vertices);
    el.euler.textContent = f.euler ? `${f.vertices} − ${f.edges} + ${f.faces} = ${f.vertices - f.edges + f.faces}` : fingers === 0 ? L.shNoEuler : '';
    el.nums.hidden = false;
  }
  const clearFacts = () => { el.name.textContent = ''; el.euler.textContent = ''; el.nums.hidden = true; };

  /* a new shape: show its numbers and explain it */
  function onShape(fingers) {
    showFacts(fingers);
    state.seen.add(fingers);
    voice.say(`n${fingers}`);
    if (!state.eulerSaid && [3, 4, 5].every((n) => state.seen.has(n))) { state.eulerSaid = true; voice.say('euler'); }
    if (!state.secondSaid && fingers >= 3) {
      state.secondSaid = true;
      setTimeout(() => voice.say('second'), 11000); // after the line about the shape, so they do not talk over each other
    }
  }

  /* look at what the app says on its own screen, once every quarter of a second */
  function read() {
    const doc = state.frame?.contentDocument;
    if (!doc) return;
    const hud = parseHud(doc.getElementById('hud')?.textContent);
    const statusEl = doc.getElementById('status');
    const kind = statusEl && Number(doc.defaultView.getComputedStyle(statusEl).opacity) > 0.5 ? parseMessage(statusEl.textContent) : null;
    const now = Date.now();
    if (hud.hand) {
      state.lastHandAt = now;
      if (hud.fingers !== state.fingers) { state.fingers = hud.fingers; onShape(hud.fingers); }
      setStatus('');
    } else if (kind === 'denied') setStatus(L.shErrDenied);
    else if (kind === 'failed') setStatus(L.shErrStart);
    else if (kind === 'loading') setStatus(L.shLoading);
    else {
      setStatus(L.shLooking);
      if (now - state.lastHandAt > 9000) voice.say('wait', { minGap: 25000 });
    }
    if (kind === 'denied' || kind === 'failed') voice.say('nocam', { minGap: 30000 });
  }

  function open(demo) {
    if (state.running) return;
    state.running = true;
    state.fingers = null;
    state.lastHandAt = Date.now();
    el.ask.classList.add('gone');
    el.stop.hidden = false;
    clearFacts();
    setStatus(demo ? '' : L.shAsking);
    if (!demo) voice.say('intro', { now: true }); // inside the click, so the browser lets the voice play
    const f = document.createElement('iframe');
    f.className = 'sh-frame';
    f.title = 'Hand tracking: raise a hand and a 3D shape appears above it';
    f.setAttribute('allow', 'camera');
    f.addEventListener('load', () => {
      try {
        const doc = f.contentDocument;
        // The app writes its status in Uzbek. Hide those two lines; this chapter shows the same things in English.
        const style = doc.createElement('style');
        style.textContent = '#hud, #status { display: none !important; }';
        doc.head.append(style);
        if (demo) setStatus('');
      } catch { /* a frame from another site cannot be read; the chapter then only shows the app */ }
    });
    f.src = demo ? 'hand-figure/index.html?demo' : 'hand-figure/index.html';
    el.stage.insertBefore(f, el.ask);
    state.frame = f;
    state.timer = setInterval(read, 250);
  }

  function close() {
    if (!state.running) return;
    state.running = false;
    clearInterval(state.timer);
    const f = state.frame;
    try { f?.contentDocument?.getElementById('cam')?.srcObject?.getTracks().forEach((t) => t.stop()); } catch { /* already gone */ }
    f?.remove();
    state.frame = null;
    state.fingers = null;
    el.ask.classList.remove('gone');
    el.stop.hidden = true;
    voice.stop();
    setStatus('');
    clearFacts();
  }

  el.start.addEventListener('click', () => open(false));
  el.demo.addEventListener('click', () => open(true));
  el.stop.addEventListener('click', close);
  el.mute.addEventListener('click', () => {
    const on = !voice.on;
    voice.setOn(on);
    el.mute.setAttribute('aria-pressed', String(!on));
    el.mute.textContent = on ? L.shVoiceOn : L.shVoiceOff;
  });
  el.mute.textContent = L.shVoiceOn;
  clearFacts();

  // the camera switches off when the chapter has been out of sight for a moment, or the tab is hidden
  new IntersectionObserver(([e]) => {
    clearTimeout(state.away);
    if (!e.isIntersecting && state.running) state.away = setTimeout(close, 2500);
  }, { threshold: 0 }).observe(root);
  document.addEventListener('visibilitychange', () => { if (document.hidden) close(); });

  // the story: the frame of the app can be used once it has come in; going back up switches the camera off
  if (!reduced) {
    buildStory(root, (p) => {
      el.lab.classList.toggle('on', p > 0.78);
      if (p < 0.7 && state.running) close();
    });
  }

  return { close };
}
