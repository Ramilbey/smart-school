// The film chapter. It follows the "How do we build tomorrow?" chapter, so it arrives through the same material:
// a wall of silver slats rises into place, the slats open like blinds from the middle outwards and reveal the film,
// then the frame grows until it fills the whole screen. main.js feeds it a scroll progress that is already eased.
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoother = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * t * (t * (t * 6 - 15) + 10); };
const rand = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

export function createFilm({ pin, stage, wall, title, note, shade, video, next }, { reduced = false } = {}) {
  let slats = [], count = 0;

  const build = () => {
    const n = innerWidth < 900 ? 14 : 30;
    if (n === count) return;
    count = n; wall.innerHTML = ''; slats = [];
    const r = rand(7), mid = (n - 1) / 2;
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div');
      el.className = 'slat';
      el.style.left = `${(i * 100) / n}%`;
      el.style.width = `${100 / n + 0.3}%`;
      wall.appendChild(el);
      slats.push({ el, z: (r() - 0.5) * 70, tone: 0.62 + r() * 0.3, d: Math.abs(i - mid) / mid, vis: true });
    }
  };
  build();

  /* p: scroll progress of the pinned part (0 to 1); enter: how far the pinned screen has risen into view (0 to 1) */
  const frame = (p, enter) => {
    if (reduced) { p = 0.62; enter = 1; }
    const vw = pin.clientWidth, vh = pin.clientHeight;
    if (!vw || !vh) return;
    if ((innerWidth < 900 ? 14 : 30) !== count) build();

    const appear = smoother(0, 1, enter);                    // the wall rises into place
    const open = clamp((p - 0.1) / 0.5);                     // the slats open, centre first
    const grow = smoother(0.6, 0.86, p);                     // the frame grows to fill the screen
    const near = smoother(0.1, 0.62, p);                     // the film pushes in a little as it is revealed

    // size of the frame: wide and centred, then edge to edge (on a tall phone it only goes full width)
    let w0 = Math.min(1180, vw * 0.88), h0 = (w0 * 9) / 16;
    if (h0 > vh * 0.62) { h0 = vh * 0.62; w0 = (h0 * 16) / 9; }
    const tall = vw / vh < 1.2;
    const w1 = vw, h1 = tall ? (vw * 9) / 16 : vh;
    stage.style.width = `${lerp(w0, w1, grow).toFixed(1)}px`;
    stage.style.height = `${lerp(h0, h1, grow).toFixed(1)}px`;
    stage.style.transform = `translate(-50%, -50%) translateY(${lerp(vh * 0.06, 0, grow).toFixed(1)}px)`;
    stage.style.setProperty('--r', `${lerp(26, 0, grow).toFixed(1)}px`);

    // the wall of slats
    wall.style.opacity = String(appear);
    wall.style.transform = `translateY(${((1 - appear) * 60).toFixed(1)}px) scale(${lerp(0.94, 1, appear).toFixed(4)})`;
    for (const s of slats) {
      const t = smoother(s.d * 0.5, s.d * 0.5 + 0.5, open);
      const a = t * 92;
      if (t >= 0.999) { if (s.vis) { s.el.style.visibility = 'hidden'; s.vis = false; } continue; }
      if (!s.vis) { s.el.style.visibility = 'visible'; s.vis = true; }
      const f = s.tone * (0.42 + 0.58 * Math.cos((a * Math.PI) / 180));
      s.el.style.backgroundColor = `rgb(${Math.round(214 * f)}, ${Math.round(219 * f)}, ${Math.round(228 * f)})`;
      s.el.style.transform = `translateZ(${(s.z * (1 - t * 0.6)).toFixed(1)}px) rotateY(${a.toFixed(2)}deg)`;
    }

    // the film behind: a little closer and darker at first
    video.style.transform = `scale(${lerp(1.16, 1, near).toFixed(4)})`;
    shade.style.opacity = String((1 - smoother(0.12, 0.62, p)) * 0.75);

    // the heading and the caption leave before the frame fills the screen
    const text = appear * (1 - smoother(0.5, 0.68, p));
    title.style.opacity = String(text); title.style.transform = `translateY(${((1 - appear) * 34 - grow * 24).toFixed(1)}px)`;
    note.style.opacity = String(text);

    // once the film fills the screen, a bar says what comes after it, so the page does not seem to end here
    if (next) { const n = reduced ? 1 : smoother(0.72, 0.88, p); next.style.opacity = n.toFixed(3); next.style.transform = `translate(-50%, ${((1 - n) * 18).toFixed(1)}px)`; next.style.pointerEvents = n > 0.5 ? 'auto' : 'none'; }
  };
  return { frame };
}
