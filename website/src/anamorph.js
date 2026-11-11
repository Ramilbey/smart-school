// An anamorphic sculpture made of vertical slats. Seen from one viewpoint (angle 0) the slats, each at its own depth,
// line up into one word. From any other viewpoint they are a scattered row of slabs. The slider moves the camera around
// the sculpture. Every slat sits on the line of sight of the pixels it stands for, scaled by its depth, which is why
// only one angle reads.
import * as THREE from 'three';
import gsap from 'gsap';
import { quality } from './quality.js';

const D = 10, H0 = 3.4, MAX = 0.75, PITCH = 11;
const rand = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

async function mask(text) {
  const fam = "'Unbounded Variable','Unbounded',system-ui,sans-serif";
  try { await document.fonts.load(`800 300px ${fam}`); } catch { /* use the fallback font */ }
  const m = document.createElement('canvas'), cx = m.getContext('2d', { willReadFrequently: true });
  const fs = 300;
  cx.font = `800 ${fs}px ${fam}`;
  const tw = Math.ceil(cx.measureText(text).width);
  m.width = tw + 40; m.height = Math.round(fs * 0.9);
  cx.font = `800 ${fs}px ${fam}`; cx.textBaseline = 'alphabetic'; cx.fillStyle = '#fff';
  cx.fillText(text, 20, Math.round(fs * 0.72));
  return { data: cx.getImageData(0, 0, m.width, m.height).data, w: m.width, h: m.height };
}

/* the word, cut into vertical runs: one slat per run (tall ones are cut into pieces), one depth per column. Extra slats sit
   on the same lines of sight at other depths: from the front they hide behind or in front of the word without changing it,
   from the side they make the sculpture far more intricate. */
function slats(m) {
  const { data, w, h } = m, out = [], rr = rand(7);
  let x = 0, c = 0;
  while (x < w - 4) {
    const cw = Math.min(w - x, 8 + Math.floor(rr() * 9)), xc = x + cw / 2, xi = Math.min(w - 1, Math.floor(xc));
    const runs = []; let start = -1;
    for (let y = 0; y < h; y++) {
      const on = data[(y * w + xi) * 4 + 3] > 128;
      if (on && start < 0) start = y;
      if (start >= 0 && (!on || y === h - 1)) { const end = on ? y + 1 : y; if (end - start > 6) runs.push([start, end]); start = -1; }
    }
    const base = 1 + 0.32 * Math.sin(c * 0.83 + 1.1) + 0.22 * Math.sin(c * 0.31 + 2.0) + 0.14 * (rr() - 0.5);
    runs.forEach(([a, b], k) => {
      const pieces = b - a > 110 && rr() < 0.55 ? (rr() < 0.5 ? 2 : 3) : 1;
      const cuts = [a];
      for (let q = 1; q < pieces; q++) cuts.push(Math.round(a + ((b - a) * q) / pieces + (rr() - 0.5) * 16));
      cuts.push(b);
      for (let q = 0; q < pieces; q++) {
        const y0 = cuts[q], y1 = cuts[q + 1];
        if (y1 - y0 < 8) continue;
        const t = clamp(base + k * 0.07 + (pieces > 1 ? (rr() - 0.5) * 0.5 : 0), 0.6, 1.5);
        out.push({ xc, cw, a: y0, b: y1, t, th: 0.08 + rr() * 0.16 });
        const extra = rr() < 0.65 ? 1 + Math.floor(rr() * 2) : 0;
        for (let e = 0; e < extra; e++) {
          // half stand behind the word (hidden from the front), half stand in front as thin sheets (same look from the front)
          const behind = rr() < 0.55;
          const t2 = behind ? clamp(t + 0.14 + rr() * 0.6, 0.6, 1.5) : clamp(t - 0.14 - rr() * 0.4, 0.6, 1.5);
          out.push({ xc, cw, a: y0, b: y1, t: t2, th: behind ? 0.08 + rr() * 0.24 : 0.03 + rr() * 0.04 });
        }
      }
    });
    x += cw; c++;
  }
  return out;
}

export async function createAnamorph(o) {
  const { canvas, stage, range, angleEl, btnResolve, btnChange, hint, reduced, onState, onProgress, word, run } = o;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: quality.antialias });
  quality.watch(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 2, 0.1, 60);
  const mat = new THREE.ShaderMaterial({
    vertexShader: `precision highp float; attribute vec2 aY; varying float vG; varying float vL; varying float vSide;
      void main(){
        mat4 M = modelMatrix * instanceMatrix;
        vec3 n = normalize((M * vec4(normal, 0.0)).xyz);
        vG = mix(aY.y, aY.x, position.y + 0.5);
        vL = 0.62 + 0.38 * max(dot(n, normalize(vec3(-0.35, 0.55, 0.75))), 0.0);
        vSide = step(0.5, abs(n.x)) + step(0.5, abs(n.y)) * 0.6;
        gl_Position = projectionMatrix * viewMatrix * M * vec4(position, 1.0);
      }`,
    fragmentShader: `precision highp float; varying float vG; varying float vL; varying float vSide;
      void main(){
        vec3 base = mix(vec3(0.98, 0.985, 1.0), vec3(0.70, 0.72, 0.77), smoothstep(0.05, 1.0, vG));
        base = mix(base, vec3(0.62, 0.72, 1.0), clamp(vSide, 0.0, 1.0) * 0.26);
        gl_FragColor = vec4(base * vL, 1.0);
      }`,
  });

  let mesh = null, mw = 1, mh = 1;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  // how far through its pinned runway the chapter is, and the viewpoint that belongs to that moment
  const prog = () => { const r = run.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1); };
  const thetaOf = (p) => 0.68 * (1 - ease(clamp((p - 0.06) / 0.62, 0, 1)));
  let lastP = -1;
  let theta = reduced ? 0 : thetaOf(prog()), dirty = true, running = false, touched = false;
  function fit() {
    const W = stage.clientWidth, H = stage.clientHeight;
    if (!W || !H) return;
    renderer.setPixelRatio(quality.pixelRatio(1.5)); renderer.setSize(W, H, false);
    const aspect = W / H, pw = (mw / mh) * H0;
    const visH = Math.max(H0 / 0.8, pw / 0.94 / aspect);
    camera.aspect = aspect; camera.fov = (2 * Math.atan(visH / (2 * D)) * 180) / Math.PI; camera.updateProjectionMatrix();
    dirty = true;
  }
  const build = async (text) => {
    const m = await mask(text);
    const list = slats(m), unit = H0 / m.h;
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const aY = new Float32Array(list.length * 2);
    const next = new THREE.InstancedMesh(geo, mat, list.length);
    const m4 = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
    list.forEach(({ xc, cw, a, b, t, th }, i) => {
      p.set((xc - m.w / 2) * unit * t, -((a + b) / 2 - m.h / 2) * unit * t, D * (1 - t));
      s.set(cw * 0.9 * unit * t, (b - a) * unit * t, th * t);
      m4.compose(p, q, s); next.setMatrixAt(i, m4);
      aY[i * 2] = a / m.h; aY[i * 2 + 1] = b / m.h;
    });
    geo.setAttribute('aY', new THREE.InstancedBufferAttribute(aY, 2));
    next.frustumCulled = false; next.instanceMatrix.needsUpdate = true;
    if (mesh) { scene.remove(mesh); mesh.geometry.dispose(); mesh.dispose?.(); }
    mesh = next; scene.add(mesh); mw = m.w; mh = m.h; dirty = true; fit();
  };

  const apply = (v, fromSlider = false) => {
    theta = clamp(v, -MAX, MAX); dirty = true;
    if (!fromSlider) range.value = String(theta);
    angleEl.textContent = `${Math.round((theta * 180) / Math.PI)}°`;
    onState(Math.abs(theta) < 0.045);
  };
  await build(word);
  apply(theta);
  if (reduced) onProgress?.(1);
  addEventListener('resize', fit);
  quality.onChange(fit);

  gsap.ticker.add(() => {
    if (!running || !mesh) return;
    if (!reduced) { const p = prog(); if (Math.abs(p - lastP) > 0.0003) { lastP = p; tw?.kill(); apply(thetaOf(p)); onProgress?.(p); } }
    if (!dirty) return;
    dirty = false;
    camera.position.set(D * Math.sin(theta), 0, D * Math.cos(theta));
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  });

  const to = { v: theta };
  let tw = null;
  const glide = (target, dur = 1, auto = false) => { tw?.kill(); if (!auto) touched = true; to.v = theta; tw = gsap.to(to, { v: target, duration: dur, ease: 'power3.inOut', onUpdate: () => apply(to.v) }); };

  range.min = String(-MAX); range.max = String(MAX); range.step = '0.01'; range.value = String(theta);
  range.addEventListener('input', () => { tw?.kill(); touched = true; apply(parseFloat(range.value), true); });
  btnResolve.addEventListener('click', () => glide(0, 0.9));
  btnChange.addEventListener('click', () => glide(Math.abs(theta) < 0.3 ? (Math.random() < 0.5 ? -0.58 : 0.58) : -Math.sign(theta) * 0.58, 1.1));

  // dragging the sculpture sideways moves the viewpoint too
  let drag = null;
  stage.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, t: theta }; stage.setPointerCapture(e.pointerId); stage.classList.add('drag'); tw?.kill(); touched = true; hint?.classList.add('gone'); });
  stage.addEventListener('pointermove', (e) => { if (drag) apply(drag.t + (e.clientX - drag.x) * 0.004); });
  const up = () => { drag = null; stage.classList.remove('drag'); };
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);

  // render only while the chapter is on screen
  new IntersectionObserver(([e]) => { running = e.isIntersecting; dirty = true; }, { threshold: 0 }).observe(run);
  return { fit, setWord: (t) => build(t) };
}
