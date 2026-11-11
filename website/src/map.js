// The school chapter: a dotted globe turns until Uzbekistan faces you, the camera dives in, the dots settle into a
// crisp flat map (same hex dots as the globe's detail layer), cities ping, and a lens opens on one school.
// Dots come from real Natural Earth outlines (scripts/map-data.mjs). Nothing here is real school data.
import * as THREE from 'three';
import { UZ, UZ_EDGE, NEIGH, GLOBE, GLOBE_UZ } from './mapdata.js';

const i16 = (b64) => { const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Int16Array(u.buffer); };
const u8 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const D2R = Math.PI / 180;
const LON0 = 64.5, LAT0 = 41.3, COS = Math.cos(LAT0 * D2R);
const R = 2;

const CITIES = [
  ['Tashkent', 69.24, 41.31], ['Samarkand', 66.96, 39.65], ['Bukhara', 64.42, 39.77], ['Nukus', 59.61, 42.46],
  ['Namangan', 71.67, 40.99], ['Termez', 67.28, 37.22], ['Urgench', 60.63, 41.55], ['Karshi', 65.79, 38.86],
];
const rand = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

const sph = (lon, lat, r = R) => { const la = lat * D2R, lo = lon * D2R; return [r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo)]; };

export function createMap(stage, { reduced, onCaption }) {
  const stick = stage.querySelector('.stick');
  const cvG = stick.querySelector('#globe'), cvF = stick.querySelector('#flat');
  const cityBox = stick.querySelector('#cities'), leader = stick.querySelector('#leaderPath'), leaderDot = stick.querySelector('#leaderDot'), leaderSvg = stick.querySelector('#leader');
  const lens = stick.querySelector('#lens'), lensDisc = lens.querySelector('.lens-disc');
  const draw = [...lens.querySelectorAll('.dr')], pops = [...lens.querySelectorAll('.pop')], wifi = lens.querySelector('.wifi');
  draw.forEach((e) => { e.setAttribute('pathLength', '1'); e.style.strokeDasharray = '1'; e.style.strokeDashoffset = '1'; });

  /* ---------- data ---------- */
  const uz = i16(UZ), edge = i16(UZ_EDGE), ne = i16(NEIGH), gl = i16(GLOBE), glUz = u8(GLOBE_UZ);
  const lonOf = (a, i) => a[i * 2] / 400 + 50, latOf = (a, i) => a[i * 2 + 1] / 400 + 30;

  /* ---------- the globe (three.js) ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas: cvG, alpha: true, antialias: true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  const group = new THREE.Group();
  scene.add(group);

  const nG = gl.length / 2;
  const gp = new Float32Array(nG * 3), gu = new Float32Array(nG);
  for (let i = 0; i < nG; i++) { const [x, y, z] = sph(gl[i * 2] / 100, gl[i * 2 + 1] / 100); gp.set([x, y, z], i * 3); gu[i] = glUz[i]; }
  const gGeo = new THREE.BufferGeometry();
  gGeo.setAttribute('position', new THREE.BufferAttribute(gp, 3));
  gGeo.setAttribute('aUz', new THREE.BufferAttribute(gu, 1));
  const light = new THREE.Vector3(-0.55, 0.32, 0.78).normalize();
  const dotVS = `
    precision highp float;
    attribute float aUz; uniform float uSize; uniform float uPx; uniform float uDetail; uniform float uIsDetail; uniform vec3 uLight;
    varying float vL; varying float vUz; varying float vK;
    void main(){
      vec3 wn = normalize(mat3(modelMatrix) * normalize(position));
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vL = clamp(dot(wn, uLight) * 0.5 + 0.5, 0.0, 1.0);
      vUz = aUz; vK = mix(1.0 - uDetail * aUz, uDetail, uIsDetail);
      gl_PointSize = max(1.0, uSize * (1.0 + aUz * 0.5 * (1.0 - uIsDetail)) * uPx / -mv.z);
      gl_Position = projectionMatrix * mv;
    }`;
  const dotFS = `
    precision highp float; uniform float uAlpha; uniform float uIsDetail; varying float vL; varying float vUz; varying float vK;
    void main(){
      float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
      float a = smoothstep(0.5, 0.18, d);
      float lit = mix(0.2, 1.0, smoothstep(0.1, 0.85, vL));
      vec3 ice = vec3(0.62, 0.70, 1.0), mint = vec3(0.18, 0.89, 0.77);
      vec3 col = mix(ice, mint, max(vUz * 0.9, uIsDetail * 0.28));
      gl_FragColor = vec4(col * (0.5 + 0.7 * lit), a * lit * vK * uAlpha);
    }`;
  const mkDots = (geo, size, detail) => new THREE.Points(geo, new THREE.ShaderMaterial({
    vertexShader: dotVS, fragmentShader: dotFS, transparent: true, depthWrite: false,
    uniforms: { uSize: { value: size }, uPx: { value: 1000 }, uDetail: { value: 0 }, uIsDetail: { value: detail ? 1 : 0 }, uLight: { value: light }, uAlpha: { value: 1 } },
  }));
  const globeDots = mkDots(gGeo, 0.0078, false);
  group.add(globeDots);

  // the country again, as a dense hex layer that fades in during the dive
  const nU = uz.length / 2 + edge.length / 2;
  const up = new Float32Array(nU * 3), ua = new Float32Array(nU).fill(1);
  let k = 0;
  for (const arr of [uz, edge]) for (let i = 0; i < arr.length / 2; i++) { const [x, y, z] = sph(lonOf(arr, i), latOf(arr, i), R * 1.0005); up.set([x, y, z], k * 3); k++; }
  const uGeo = new THREE.BufferGeometry();
  uGeo.setAttribute('position', new THREE.BufferAttribute(up, 3));
  uGeo.setAttribute('aUz', new THREE.BufferAttribute(ua, 1));
  const detailDots = mkDots(uGeo, 0.0019, true);
  group.add(detailDots);

  // a dark ball hides the far side; a soft glow rims it
  group.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.993, 64, 48), new THREE.MeshBasicMaterial({ color: 0x04060f })));
  const rim = new THREE.Mesh(new THREE.SphereGeometry(R * 1.12, 64, 48), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'precision highp float; varying vec3 vN; varying vec3 vV; uniform float uA; void main(){ float f = pow(clamp(0.72 - dot(vN, vV), 0.0, 1.5), 3.0); gl_FragColor = vec4(0.28, 0.4, 1.0, f * 0.26 * uA); }',
    uniforms: { uA: { value: 1 } },
  }));
  group.add(rim);

  /* ---------- the flat map (canvas 2d) ---------- */
  const ctx = cvF.getContext('2d');
  const toUV = (arr) => { const n = arr.length / 2, o = new Float32Array(n * 2); for (let i = 0; i < n; i++) { o[i * 2] = (lonOf(arr, i) - LON0) * COS; o[i * 2 + 1] = latOf(arr, i) - LAT0; } return o; };
  const fUz = toUV(uz), fEdge = toUV(edge), fNe = toUV(ne);
  const rr = rand(7);
  const mk = (n) => ({ a: new Float32Array(n), b: new Float32Array(n), d: new Float32Array(n) });
  const jit = (n) => { const j = mk(n); for (let i = 0; i < n; i++) { const th = rr() * 6.283, m = 0.3 + rr(); j.a[i] = Math.cos(th) * m; j.b[i] = Math.sin(th) * m; j.d[i] = rr(); } return j; };
  const jUz = jit(fUz.length / 2), jEdge = jit(fEdge.length / 2), jNe = jit(fNe.length / 2);
  const kind = new Uint8Array(fUz.length / 2); for (let i = 0; i < kind.length; i++) { const q = rr(); kind[i] = q < 0.045 ? 1 : q < 0.07 ? 2 : 0; }

  /* ---------- cities, leader, lens ---------- */
  const cityEls = CITIES.map(([name]) => { const el = document.createElement('div'); el.className = 'city'; el.innerHTML = `<i></i><span>${name}</span>`; cityBox.appendChild(el); return el; });

  let W = 0, H = 0, dpr = 1, S = 1, lensC = { x: 0, y: 0, r: 150 };
  const resize = () => {
    W = stick.clientWidth; H = stick.clientHeight; dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); renderer.setSize(W, H, false);
    cvF.width = Math.round(W * dpr); cvF.height = Math.round(H * dpr);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    const px = (renderer.getPixelRatio() * H) / (2 * Math.tan((camera.fov * D2R) / 2));
    globeDots.material.uniforms.uPx.value = px; detailDots.material.uniforms.uPx.value = px;
    leaderSvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  };
  resize();

  const state = { p: -1 };
  const frame = (p, time) => {
    if (stick.clientWidth !== W || stick.clientHeight !== H) resize();
    if (reduced) p = 1;
    const wide = W / H > 1.25;
    stick.classList.toggle('portrait', !wide);
    const spinT = smooth(0, 0.34, p);
    group.rotation.set(LAT0 * D2R, -LON0 * D2R + (1 - spinT) * 2.9 + (reduced ? 0 : time * 0.02 * (1 - spinT)), 0);
    const rise = smooth(0, 0.3, p), dive = smooth(0.3, 0.55, p);
    const camZ = lerp(9.2, 2.82, dive);
    camera.position.set(0, 0, camZ);
    const ox = wide ? 1.9 : 0, oy0 = wide ? -3.1 : -3.6, oy1 = wide ? -0.15 : -1.2;
    group.position.set(lerp(ox, 0, dive), lerp(oy0, oy1, rise) * (1 - dive) + 0 * dive, 0);
    const sc = lerp(1, 1, 0);
    group.scale.setScalar(sc);
    const size = lerp(0.0078, 0.0021, smooth(0.28, 0.55, p));
    globeDots.material.uniforms.uSize.value = size; detailDots.material.uniforms.uSize.value = lerp(0.0019, 0.0019, 0);
    const det = smooth(0.34, 0.52, p);
    globeDots.material.uniforms.uDetail.value = det; detailDots.material.uniforms.uDetail.value = det;
    const gA = 1 - smooth(0.5, 0.62, p);
    globeDots.material.uniforms.uAlpha.value = gA; detailDots.material.uniforms.uAlpha.value = gA; rim.material.uniforms.uA.value = (1 - dive * 0.9) * gA;
    cvG.style.opacity = p < 0.66 ? '1' : '0';
    if (p < 0.66) renderer.render(scene, camera);

    // flat map
    const fadeIn = smooth(0.46, 0.58, p), assemble = smooth(0.46, 0.64, p), slide = smooth(0.7, 0.9, p);
    cvF.style.opacity = String(fadeIn);
    if (fadeIn > 0.001) {
      const availW = wide ? W - 360 - W * 0.1 : W * 0.92;
      const s = wide ? Math.min(availW / 13.2, (H * 0.68) / 8.7) : Math.min(availW / 13.2, (H * 0.4) / 8.7);
      S = s;
      const cx = wide ? lerp(W * 0.5, W * 0.04 + (13.2 * s) / 2, slide) : W * 0.5, cy = H * (wide ? 0.54 : lerp(0.5, 0.28, slide));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const px = (u) => cx + u * s, py = (v) => cy - v * s;
      const sp = 0.0532 * s, ds = Math.max(1.5, sp * 0.56);
      const group2 = (arr, jt, color, alpha, size, glow) => {
        ctx.fillStyle = color; ctx.globalAlpha = alpha;
        if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 9; }
        const n = arr.length / 2, mag = 26;
        for (let i = 0; i < n; i++) {
          let x = px(arr[i * 2]), y = py(arr[i * 2 + 1]);
          if (assemble < 1) { const t = clamp((assemble * 1.5 - jt.d[i] * 0.5) / 0.5), e = (1 - t) * (1 - t); if (t <= 0) continue; x += jt.a[i] * mag * e; y += jt.b[i] * mag * e; }
          ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }
        ctx.shadowBlur = 0;
      };
      group2(fNe, jNe, '#7C8CFF', 0.34, Math.max(1.4, ds * 0.7));
      // body dots, sparks in mint and lilac
      ctx.fillStyle = '#9FB2FF'; ctx.globalAlpha = 0.8;
      const n = fUz.length / 2, mag = 26;
      for (let i = 0; i < n; i++) {
        let x = px(fUz[i * 2]), y = py(fUz[i * 2 + 1]);
        if (assemble < 1) { const t = clamp((assemble * 1.5 - jUz.d[i] * 0.5) / 0.5), e = (1 - t) * (1 - t); if (t <= 0) continue; x += jUz.a[i] * mag * e; y += jUz.b[i] * mag * e; }
        const kd = kind[i];
        if (kd === 0) { ctx.fillRect(x - ds / 2, y - ds / 2, ds, ds); }
      }
      for (const [kk, col] of [[1, '#2DE2C4'], [2, '#B79CFF']]) {
        ctx.fillStyle = col;
        for (let i = 0; i < n; i++) {
          if (kind[i] !== kk) continue;
          let x = px(fUz[i * 2]), y = py(fUz[i * 2 + 1]);
          if (assemble < 1) { const t = clamp((assemble * 1.5 - jUz.d[i] * 0.5) / 0.5), e = (1 - t) * (1 - t); if (t <= 0) continue; x += jUz.a[i] * mag * e; y += jUz.b[i] * mag * e; }
          ctx.globalAlpha = reduced ? 1 : 0.55 + 0.45 * Math.sin(time * 1.6 + i * 0.37);
          ctx.fillRect(x - ds * 0.7, y - ds * 0.7, ds * 1.4, ds * 1.4);
        }
      }
      group2(fEdge, jEdge, '#E9EEFF', 1, ds * 1.25, '#7C8CFF');
      ctx.globalAlpha = 1;

      // cities
      const cityA = smooth(0.66, 0.8, p);
      CITIES.forEach(([, lon, lat], i) => {
        const x = px((lon - LON0) * COS), y = py(lat - LAT0), el = cityEls[i];
        const a = clamp(cityA * 1.6 - i * 0.1);
        el.style.opacity = String(a); el.style.transform = `translate(${x.toFixed(1)}px, ${(y - 5).toFixed(1)}px)`;
        if (i === 0) { tash.x = x; tash.y = y; }
      });
    }

    // leader + lens: opens on Tashkent
    const lensA = smooth(0.84, 0.97, p);
    const r = lensDisc.getBoundingClientRect(), sr = stick.getBoundingClientRect();
    lensC = { x: r.left - sr.left + r.width / 2, y: r.top - sr.top + r.height / 2, r: r.width / 2 };
    lens.style.opacity = String(smooth(0.82, 0.9, p));
    lens.style.transform = (wide ? 'translateY(-56%)' : '') + ` scale(${lerp(0.7, 1, lensA)})`;
    lens.style.transformOrigin = '0% 50%';
    if (lensA > 0 && fadeIn > 0.5) {
      const x0 = tash.x + 14, y0 = tash.y - 2, x1 = lensC.x - lensC.r - 8, y1 = lensC.y;
      leader.setAttribute('d', `M${x0} ${y0} L${x0 + 56} ${y0 - 46} L${Math.max(x0 + 60, x1)} ${y1 < y0 - 46 ? y1 : y1}`);
      const len = leader.getTotalLength ? leader.getTotalLength() : 400;
      leader.style.strokeDasharray = String(len); leader.style.strokeDashoffset = String(len * (1 - lensA));
      leaderDot.setAttribute('cx', tash.x); leaderDot.setAttribute('cy', tash.y); leaderDot.style.opacity = String(lensA);
      leader.style.opacity = '1';
    } else { leader.style.opacity = '0'; leaderDot.style.opacity = '0'; }
    draw.forEach((e, i) => { e.style.strokeDashoffset = String(1 - clamp((lensA * 1.5 - i * 0.12))); });
    pops.forEach((e, i) => { e.style.opacity = String(clamp((lensA - 0.45) * 2.2 - i * 0.1)); });
    if (wifi) wifi.style.opacity = String(clamp((lensA - 0.6) * 3));

    const stageNo = p < 0.3 ? 0 : p < 0.62 ? 1 : 2;
    if (stageNo !== state.stage) { state.stage = stageNo; onCaption && onCaption(stageNo); }
    state.p = p;
  };
  const tash = { x: 0, y: 0 };
  return { frame, resize, get S() { return S; } };
}
