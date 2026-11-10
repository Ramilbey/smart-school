// One quality setting for all of the page's 3D scenes (the opening globe, the sculpture, the map).
// Weak graphics chips (old laptops, cheap phones) cannot draw a full-screen 3D scene at full resolution with smoothing,
// and they were the ones that lagged. So:
//   1. it starts at a lower resolution, and without smoothing, when the device looks weak;
//   2. while a 3D scene is on screen it watches the real frame times, and steps the resolution down if frames take too long;
//   3. if even the lowest resolution cannot keep up, `lite` turns on: the 3D opening is replaced by its picture.
// It never steps back up, so the picture does not flicker between sharp and soft.

const cores = navigator.hardwareConcurrency || 4;
const memory = navigator.deviceMemory || 4; // GB; Chrome only, 4 when unknown
const saveData = Boolean(navigator.connection?.saveData);

function gpuName() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '') : '';
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return name;
  } catch { return ''; }
}
// software drawing, and graphics chips from before about 2013 (the names browsers report)
const SLOW_GPU = /swiftshader|llvmpipe|softpipe|software|basic render|mali-4|mali-t[0-8]\d\d|adreno[^0-9]*[2-4]\d\d\b|powervr|sgx|videocore|radeon(\(tm\))? hd [2-6]\d{3}|intel.*(gma|hd graphics (2000|3000|2500|4000)\b)|geforce [2-6]\d\d\b/i;

const gpu = gpuName();
const weak = SLOW_GPU.test(gpu) || cores <= 2 || memory <= 2 || saveData;
const MIN = 0.5;
const listeners = new Set();
const liteListeners = new Set();
const seen = new Set();

export const quality = {
  gpu,
  weak,
  /** multiplies the pixel ratio of every 3D scene */
  scale: weak ? 0.7 : 1,
  /** smoothing (MSAA) costs about four times the pixels: only on devices that are not weak */
  antialias: !weak,
  /** true once even the lowest resolution could not keep up */
  lite: false,
  /** the pixel ratio a scene should use, given the most it would ever use */
  pixelRatio(cap) { return Math.max(MIN, Math.min(window.devicePixelRatio || 1, cap) * this.scale); },
  /** call back when the scale changes (scenes resize themselves) */
  onChange(fn) { listeners.add(fn); },
  /** call back once, when lite turns on */
  onLite(fn) { liteListeners.add(fn); },
  /** count frames only while this element (a 3D canvas) is on screen */
  watch(el) {
    new IntersectionObserver(([e]) => { e.isIntersecting ? seen.add(el) : seen.delete(el); }, { threshold: 0 }).observe(el);
  },
};

if (weak) document.documentElement.classList.add('low');
// handy for checking a device: type  __ssQuality  in the browser console
window.__ssQuality = quality;

let last = 0, ema = 16.7, n = 0, bad = 0;
/** Call once per animation frame with the frame's timestamp (main.js does this). */
export function frame(now) {
  const dt = now - last; last = now;
  if (!seen.size || quality.lite || dt > 250 || dt <= 0) { bad = 0; return; } // nothing 3D on screen, or a pause (hidden tab, long task): not a measurement
  n += 1;
  ema += (dt - ema) * 0.12;
  if (n < 90 || n % 45 !== 0) return; // let the first frames (shader compile, first draw) pass
  if (ema > 26) {
    bad += 1;
    if (bad >= 2) { bad = 0; stepDown(); }
  } else bad = 0;
}

function stepDown() {
  document.documentElement.classList.add('low');
  if (quality.scale > MIN + 0.01) {
    quality.scale = Math.max(MIN, quality.scale * 0.8);
    ema = 16.7; n = 0;
    listeners.forEach((fn) => fn());
  } else if (!quality.lite) {
    quality.lite = true;
    document.documentElement.classList.add('lite');
    liteListeners.forEach((fn) => fn());
  }
}
