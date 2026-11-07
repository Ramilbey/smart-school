// The opening of the site: the Earth at night. As you scroll it rises from the bottom edge, turns until Uzbekistan
// faces you, the country lights up with its border, and the camera dives in. The skyline picture then takes over
// (see main.js). Style: a grey night globe: faint graticule, land a little lighter than the sea, city lights,
// specks scattered over the sphere, a pale crescent on the sunny edge.
// Land and the country come from real Natural Earth outlines (scripts/map-data.mjs). City lights are an
// approximation from a list of large cities, not satellite data.
import * as THREE from 'three';
import { UZ, UZ_EDGE, GLOBE } from './mapdata.js';

const i16 = (b64) => { const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Int16Array(u.buffer); };
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const D2R = Math.PI / 180;
const LON0 = 64.5, LAT0 = 41.3; // the middle of Uzbekistan
const R = 2;
const sph = (lon, lat, r = R) => { const la = lat * D2R, lo = lon * D2R; return [r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo)]; };
const rand = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// big cities: lon, lat, size (0 to 1). Only used to place the city lights.
const CITIES = [
  [-0.1, 51.5, 1], [2.35, 48.85, 1], [-3.7, 40.4, 0.8], [2.17, 41.4, 0.6], [12.5, 41.9, 0.8], [9.2, 45.5, 0.8], [13.4, 52.5, 0.8], [7, 51.4, 1], [4.9, 52.4, 0.9], [16.4, 48.2, 0.6], [21, 52.2, 0.6], [19, 47.5, 0.5], [14.4, 50.1, 0.5], [23.7, 38, 0.6], [29, 41, 1], [37.6, 55.75, 1], [30.3, 59.9, 0.7], [30.5, 50.4, 0.6], [18, 59.3, 0.4], [12.6, 55.7, 0.5], [-9.1, 38.7, 0.5], [-6.3, 53.3, 0.4], [-2.2, 53.5, 0.7], [26.1, 44.4, 0.5],
  [31.2, 30, 1], [29.9, 31.2, 0.6], [3.4, 6.5, 0.9], [15.3, -4.3, 0.6], [28, -26.2, 0.9], [18.4, -33.9, 0.5], [36.8, -1.3, 0.5], [38.7, 9, 0.4], [-7.6, 33.6, 0.5], [3.1, 36.7, 0.5], [10.2, 36.8, 0.4], [32.5, 15.6, 0.4], [-0.2, 5.6, 0.4], [-17.4, 14.7, 0.3], [13.2, -8.8, 0.4], [39.3, -6.8, 0.4],
  [51.4, 35.7, 1], [44.4, 33.3, 0.7], [46.7, 24.7, 0.7], [39.2, 21.5, 0.5], [55.3, 25.2, 0.7], [34.8, 32.1, 0.7], [48, 29.4, 0.5], [69.24, 41.31, 0.8], [76.9, 43.2, 0.6], [49.9, 40.4, 0.5], [66.96, 39.65, 0.4], [69.2, 34.5, 0.4],
  [77.2, 28.6, 1], [72.9, 19.1, 1], [88.4, 22.6, 1], [80.3, 13.1, 0.8], [77.6, 12.97, 0.8], [78.5, 17.4, 0.7], [67, 24.9, 0.9], [74.3, 31.5, 0.9], [90.4, 23.8, 1], [79.9, 6.9, 0.4],
  [116.4, 39.9, 1], [121.5, 31.2, 1], [113.3, 23.1, 1], [114.2, 22.3, 1], [106.5, 29.6, 0.6], [104.1, 30.7, 0.6], [114.3, 30.6, 0.7], [108.9, 34.3, 0.5], [139.7, 35.7, 1], [135.5, 34.7, 0.9], [127, 37.6, 1], [121.5, 25, 0.8], [121, 14.6, 0.8], [100.5, 13.75, 0.9], [105.8, 21, 0.6], [106.7, 10.8, 0.7], [106.8, -6.2, 1], [112.7, -7.3, 0.5], [101.7, 3.1, 0.7], [103.8, 1.35, 0.7], [96.2, 16.8, 0.4],
  [151.2, -33.9, 0.7], [145, -37.8, 0.6], [153, -27.5, 0.4], [115.9, -32, 0.3], [174.8, -36.8, 0.4],
  [-74, 40.7, 1], [-71, 42.4, 0.6], [-77, 38.9, 0.7], [-87.6, 41.9, 0.9], [-79.4, 43.7, 0.7], [-73.6, 45.5, 0.5], [-83, 42.3, 0.5], [-84.4, 33.7, 0.6], [-80.2, 25.8, 0.7], [-95.4, 29.8, 0.7], [-96.8, 32.8, 0.7], [-105, 39.7, 0.5], [-118.2, 34, 1], [-122.4, 37.8, 0.7], [-122.3, 47.6, 0.5], [-112, 33.4, 0.4], [-123.1, 49.3, 0.4], [-99.1, 19.4, 1], [-103.3, 20.7, 0.4], [-100.3, 25.7, 0.4], [-82.4, 23.1, 0.4], [-74.1, 4.7, 0.7], [-77, -12, 0.7], [-70.7, -33.4, 0.6], [-58.4, -34.6, 1], [-46.6, -23.5, 1], [-43.2, -22.9, 0.9], [-47.9, -15.8, 0.4], [-66.9, 10.5, 0.5], [-78.5, -0.2, 0.3], [-43.9, -19.9, 0.5], [-51.2, -30, 0.4], [-34.9, -8, 0.4],
];

export function createHeroGlobe(canvas, { reduced = false } = {}) {
  const parent = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.02, 80);
  const group = new THREE.Group();
  scene.add(group);
  const rnd = rand(11);

  /* ---------- data ---------- */
  const uz = i16(UZ), edge = i16(UZ_EDGE), gl = i16(GLOBE);
  const lonOf = (a, i) => a[i * 2] / 400 + 50, latOf = (a, i) => a[i * 2 + 1] / 400 + 30; // country data
  const nG = gl.length / 2;
  const gLon = new Float32Array(nG), gLat = new Float32Array(nG);
  for (let i = 0; i < nG; i++) { gLon[i] = gl[i * 2] / 100; gLat[i] = gl[i * 2 + 1] / 100; } // globe data (the whole world)

  /* ---------- a map of where the land is (and where Uzbekistan is), drawn once into a small texture ---------- */
  const TW = 2048, TH = 1024;
  const mc = document.createElement('canvas'); mc.width = TW; mc.height = TH;
  const mx = mc.getContext('2d');
  mx.fillStyle = '#000'; mx.fillRect(0, 0, TW, TH);
  mx.fillStyle = '#f00';
  for (let i = 0; i < nG; i++) {
    const x = ((gLon[i] + 180) / 360) * TW, y = ((90 - gLat[i]) / 180) * TH, c = Math.max(0.12, Math.cos(gLat[i] * D2R));
    const w = 2.9 / c + 1.2;
    mx.fillRect(x - w / 2, y - 2, w, 4);
  }
  { const t = document.createElement('canvas'); t.width = TW / 2; t.height = TH / 2; const tx = t.getContext('2d'); tx.imageSmoothingQuality = 'high'; tx.drawImage(mc, 0, 0, TW / 2, TH / 2); mx.clearRect(0, 0, TW, TH); mx.imageSmoothingQuality = 'high'; mx.drawImage(t, 0, 0, TW, TH); const t2 = document.createElement('canvas'); t2.width = TW / 4; t2.height = TH / 4; const t2x = t2.getContext('2d'); t2x.drawImage(mc, 0, 0, TW / 4, TH / 4); mx.clearRect(0, 0, TW, TH); mx.drawImage(t2, 0, 0, TW, TH); }
  mx.globalCompositeOperation = 'lighter'; mx.fillStyle = '#0f0';
  for (const arr of [uz, edge]) for (let i = 0; i < arr.length / 2; i++) { const x = ((lonOf(arr, i) + 180) / 360) * TW, y = ((90 - latOf(arr, i)) / 180) * TH; mx.fillRect(x - 1, y - 1, 2, 2); }
  const maskTex = new THREE.CanvasTexture(mc);
  maskTex.generateMipmaps = false; maskTex.minFilter = THREE.LinearFilter; maskTex.magFilter = THREE.LinearFilter;
  maskTex.wrapS = THREE.RepeatWrapping; maskTex.colorSpace = THREE.NoColorSpace;

  /* ---------- the sphere: grey ocean, lighter land, graticule, a pale crescent on the sunny side ---------- */
  const light = new THREE.Vector3(-0.78, 0.28, 0.56).normalize();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(R * 0.994, 96, 64), new THREE.ShaderMaterial({
    vertexShader: 'varying vec3 vObj; varying vec3 vNw; varying vec3 vWp; void main(){ vObj = position; vNw = normalize(mat3(modelMatrix) * normal); vec4 wp = modelMatrix * vec4(position, 1.0); vWp = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }',
    fragmentShader: `
      precision highp float;
      uniform sampler2D uMask; uniform vec3 uLight; uniform float uHl; uniform float uLandA;
      varying vec3 vObj; varying vec3 vNw; varying vec3 vWp;
      const float PI = 3.14159265;
      void main(){
        vec3 o = normalize(vObj);
        float lon = atan(o.x, o.z), lat = asin(clamp(o.y, -1.0, 1.0));
        vec4 m = texture2D(uMask, vec2(lon / (2.0 * PI) + 0.5, lat / PI + 0.5));
        vec3 N = normalize(vNw), V = normalize(cameraPosition - vWp);
        float sun = dot(N, uLight);
        float shade = mix(0.30, 1.0, smoothstep(-0.25, 0.95, sun));
        vec3 col = mix(vec3(0.066), vec3(0.118), smoothstep(0.28, 0.62, m.r) * uLandA);
        vec2 g = vec2(lon, lat) * (180.0 / PI) / 10.0;
        vec2 fw = max(fwidth(g), vec2(1e-4));
        vec2 gl2 = abs(fract(g - 0.5) - 0.5) / fw;
        float line = 1.0 - min(min(gl2.x, gl2.y), 1.0);
        col += vec3(0.085) * line * (1.0 - 0.8 * smoothstep(0.75, 1.0, abs(lat) / (PI * 0.5)));
        col *= shade;
        float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
        col += vec3(0.34) * rim * smoothstep(-0.15, 0.75, sun);
        col += vec3(0.20) * smoothstep(0.3, 0.7, m.g) * uHl;
        gl_FragColor = vec4(col, 1.0);
      }`,
    uniforms: { uMask: { value: maskTex }, uLight: { value: light }, uHl: { value: 0 }, uLandA: { value: 1 } },
  }));
  group.add(ball);

  /* ---------- city lights: land points near big cities, brighter the closer they are ---------- */
  const lp = [], li = [];
  for (let i = 0; i < nG; i++) {
    const lon = gLon[i], lat = gLat[i], cl = Math.max(0.2, Math.cos(lat * D2R));
    let I = 0;
    for (let c = 0; c < CITIES.length; c++) {
      const dx = (lon - CITIES[c][0]) * cl, dy = lat - CITIES[c][1];
      const d2 = dx * dx + dy * dy, s = 0.5 + 1.25 * CITIES[c][2];
      if (d2 < 25) I += CITIES[c][2] * Math.exp(-d2 / (s * s));
    }
    I = Math.min(1, I);
    const keep = I > 0.05 ? Math.min(0.95, 0.18 + I * 1.1) : 0.03;
    for (let k = 0; k < 3; k++) {
      if (rnd() > keep * (k === 0 ? 1 : 0.55)) continue;
      const [x, y, z] = sph(lon + ((rnd() - 0.5) * 0.5) / cl, lat + (rnd() - 0.5) * 0.5, R * 1.0012);
      lp.push(x, y, z); li.push(I > 0.04 ? 0.25 + 0.75 * I * (0.5 + 0.5 * rnd()) : 0.12 + 0.12 * rnd());
    }
  }
  const lGeo = new THREE.BufferGeometry();
  lGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lp), 3));
  lGeo.setAttribute('aI', new THREE.BufferAttribute(new Float32Array(li), 1));
  const lightsMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'precision highp float; attribute float aI; uniform float uPr; varying float vI; void main(){ vI = aI; gl_PointSize = (0.95 + 1.25 * aI) * uPr; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'precision highp float; uniform float uA; varying float vI; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(vec3(0.95, 0.94, 0.9), smoothstep(0.5, 0.1, d) * (0.18 + 0.62 * vI) * uA); }',
    uniforms: { uPr: { value: 1 }, uA: { value: 1 } },
  });
  group.add(new THREE.Points(lGeo, lightsMat));

  /* ---------- specks scattered over (and just above) the sphere, so its edge is soft ---------- */
  const nD = 7000, dp = new Float32Array(nD * 3), da = new Float32Array(nD);
  for (let i = 0; i < nD; i++) {
    const u = rnd() * 2 - 1, t = rnd() * Math.PI * 2, s = Math.sqrt(1 - u * u), r = R * (1.001 + Math.pow(rnd(), 3) * 0.03);
    dp.set([r * s * Math.cos(t), r * u, r * s * Math.sin(t)], i * 3); da[i] = 0.2 + 0.8 * rnd();
  }
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  dGeo.setAttribute('aA', new THREE.BufferAttribute(da, 1));
  const dustMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    vertexShader: 'precision highp float; attribute float aA; uniform float uPr; varying float vA; void main(){ vA = aA; gl_PointSize = (0.9 + 1.3 * aA) * uPr; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'precision highp float; uniform float uA; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(vec3(0.92, 0.93, 0.95), smoothstep(0.5, 0.15, d) * vA * 0.4 * uA); }',
    uniforms: { uPr: { value: 1 }, uA: { value: 1 } },
  });
  group.add(new THREE.Points(dGeo, dustMat));

  /* ---------- up close: the land as dots, the country as a dense layer of dots, and its border ---------- */
  const gp = new Float32Array(nG * 3);
  for (let i = 0; i < nG; i++) { const [x, y, z] = sph(gLon[i], gLat[i], R * 1.0006); gp.set([x, y, z], i * 3); }
  const gGeo = new THREE.BufferGeometry();
  gGeo.setAttribute('position', new THREE.BufferAttribute(gp, 3));
  const nU = uz.length / 2 + edge.length / 2;
  const up = new Float32Array(nU * 3);
  let k = 0;
  for (const arr of [uz, edge]) for (let i = 0; i < arr.length / 2; i++) { const [x, y, z] = sph(lonOf(arr, i), latOf(arr, i), R * 1.0008); up.set([x, y, z], k * 3); k++; }
  const uGeo = new THREE.BufferGeometry();
  uGeo.setAttribute('position', new THREE.BufferAttribute(up, 3));
  const dotVS = 'precision highp float; uniform float uSize; uniform float uPx; uniform float uMax; varying float vL; uniform vec3 uLight; void main(){ vec3 wn = normalize(mat3(modelMatrix) * normalize(position)); vec4 mv = modelViewMatrix * vec4(position, 1.0); vL = clamp(dot(wn, uLight) * 0.5 + 0.5, 0.0, 1.0); gl_PointSize = clamp(uSize * uPx / -mv.z, 1.0, uMax); gl_Position = projectionMatrix * mv; }';
  const dotFS = 'precision highp float; uniform float uA; uniform vec3 uC; varying float vL; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; float lit = mix(0.35, 1.0, smoothstep(0.1, 0.85, vL)); gl_FragColor = vec4(uC * (0.55 + 0.6 * lit), smoothstep(0.5, 0.18, d) * lit * uA); }';
  const mkDots = (geo, size, color) => new THREE.Points(geo, new THREE.ShaderMaterial({
    vertexShader: dotVS, fragmentShader: dotFS, transparent: true, depthWrite: false,
    uniforms: { uSize: { value: size }, uPx: { value: 1000 }, uMax: { value: 8 }, uA: { value: 0 }, uC: { value: new THREE.Color(color) }, uLight: { value: light } },
  }));
  const landDots = mkDots(gGeo, 0.0021, 0x9aa0ad);
  const detailDots = mkDots(uGeo, 0.0019, 0xe6e8ee);
  group.add(landDots, detailDots);
  const nE = edge.length / 2, ep = new Float32Array(nE * 3);
  for (let i = 0; i < nE; i++) { const [x, y, z] = sph(lonOf(edge, i), latOf(edge, i), R * 1.002); ep.set([x, y, z], i * 3); }
  const eGeo = new THREE.BufferGeometry();
  eGeo.setAttribute('position', new THREE.BufferAttribute(ep, 3));
  const edgeMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    vertexShader: 'precision highp float; uniform float uSize; uniform float uPx; uniform float uMax; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = clamp(uSize * uPx / -mv.z, 1.6, uMax); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'precision highp float; uniform float uA; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(0.97, 0.97, 0.99, smoothstep(0.5, 0.4, d) * uA); }',
    uniforms: { uSize: { value: 0.014 }, uPx: { value: 1000 }, uMax: { value: 8 }, uA: { value: 0 } },
  });
  group.add(new THREE.Points(eGeo, edgeMat));

  /* ---------- size ---------- */
  let W = 0, H = 0, PR = 1;
  const resize = () => {
    W = parent.clientWidth; H = parent.clientHeight;
    if (!W || !H) return;
    const pr = Math.min(window.devicePixelRatio || 1, 1.75); PR = pr;
    renderer.setPixelRatio(pr); renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    const px = (pr * H) / (2 * Math.tan((camera.fov * D2R) / 2));
    for (const m of [landDots.material, detailDots.material, edgeMat]) m.uniforms.uPx.value = px;
    lightsMat.uniforms.uPr.value = pr; dustMat.uniforms.uPr.value = pr;
    landDots.material.uniforms.uMax.value = 4 * pr; detailDots.material.uniforms.uMax.value = 7 * pr; edgeMat.uniforms.uMax.value = 5.5 * pr;
  };
  resize();

  /* ---------- one frame, from the (already smoothed) scroll progress p, 0 to 1 ---------- */
  const tanH = Math.tan((camera.fov * D2R) / 2);
  const smoother = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * t * (t * (t * 6 - 15) + 10); };
  const distFor = (rs) => { const kk = rs / (H / 2), a = R / (tanH * kk); return Math.sqrt(a * a + R * R); }; // camera distance that gives the globe a radius of rs pixels
  const frame = (p, time) => {
    if (parent.clientWidth !== W || parent.clientHeight !== H) resize();
    if (!W || !H) return;
    if (reduced) p = 0.9;
    const aspect = W / H;
    // the phases overlap, so the motion never stops and starts again
    const rise = smoother(0, 0.3, p);       // the globe comes up from the bottom edge to the centre
    const spin = smoother(0, 0.58, p);      // it turns until Uzbekistan faces you
    const hl = smoother(0.44, 0.62, p);     // the country lights up, with its border
    const dive = smoother(0.54, 0.93, p);   // the camera dives in, until the country fills the whole window
    // where the globe is: half of it showing at the bottom, then whole and centred, then close up
    const d0 = distFor(Math.min(0.8 * H, 0.62 * W)), far = distFor(Math.min(0.37 * H, 0.44 * W));
    const wideT = clamp((aspect - 0.46) / (1.78 - 0.46)); // 0 on a tall phone, 1 on a wide screen
    const near = R + lerp(0.15, 0.1, wideT);                  // so close that the window sits wholly inside the country
    const lonT = lerp(LON0, lerp(63.9, 62.5, wideT), dive), latT = lerp(LAT0, lerp(41.7, 42.4, wideT), dive); // the camera slides from the middle of the country to a spot well inside it
    const camZ = lerp(d0, far, rise) * Math.pow(near / far, dive);
    camera.position.set(0, 0, camZ);
    group.position.set(0, lerp(-1, 0, rise) * camZ * tanH, 0); // -1 puts the middle of the globe on the bottom edge of the screen
    group.rotation.set(lerp(0.5, latT * D2R, spin), -lonT * D2R + (1 - spin) * 1.05 + (reduced ? 0 : Math.sin(time * 0.35) * 0.035 * (1 - spin)), 0);
    // far: the texture shows the land; close up it is too coarse, so the land turns into dots
    const dots = smoother(0.52, 0.86, p);
    ball.material.uniforms.uHl.value = hl * (1 - dots); ball.material.uniforms.uLandA.value = 1 - dots * 0.85;
    landDots.material.uniforms.uA.value = dots * 0.9 * (1 - smoother(0.7, 0.9, p));
    detailDots.material.uniforms.uA.value = smoother(0.56, 0.84, p) * 0.8;
    detailDots.material.uniforms.uMax.value = lerp(7, 12, smoother(0.7, 0.95, p)) * PR; // up close the dots may grow a little, so the country stays solid
    landDots.material.uniforms.uSize.value = lerp(0.0045, 0.0021, dots);
    edgeMat.uniforms.uSize.value = lerp(0.013, 0.0026, smoother(0.5, 0.88, p));
    edgeMat.uniforms.uA.value = hl * (reduced ? 1 : 0.9 + 0.1 * Math.sin(time * 2));
    lightsMat.uniforms.uA.value = 1 - dots * 0.6;
    dustMat.uniforms.uA.value = 1 - dive * 0.5;
    renderer.render(scene, camera);
  };
  return { frame, resize };
}
