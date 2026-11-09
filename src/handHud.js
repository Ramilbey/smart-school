// Helpers for the "Shapes you can hold" chapter. The hand-figure app itself is used exactly as published and is not changed;
// the chapter only watches what that app writes on its own screen (the finger count in its small status line, and its messages)
// and shows the same things in English, with the voice and the numbers of the shape.

/**
 * What the app's status line says. It is written in Uzbek by its author:
 *   "Birinchi qo‘l: 3 barmoq · Ikkinchi qo‘l: masshtab ×1.20 · 60 FPS"   (a hand is seen; barmoq = finger)
 *   "60 FPS"                                                            (no hand)
 */
export function parseHud(text) {
  const t = String(text ?? '');
  const m = /(\d+)\s*barmoq/.exec(t);
  return { hand: m !== null, fingers: m ? Number(m[1]) : null, second: /masshtab/.test(t) };
}

// The four messages the app shows in the middle of its screen, and what they mean.
const MESSAGES = [
  [/^Model va kamera yuklanmoqda/, 'loading'],
  [/^Qo‘lingizni kamera ko‘radigan joyga tuting/, 'look'],
  [/^Kameraga ruxsat berilmadi/, 'denied'],
  [/^Ishga tushirib bo‘lmadi/, 'failed'],
];
export function parseMessage(text) {
  const t = String(text ?? '').trim();
  for (const [re, kind] of MESSAGES) if (re.test(t)) return kind;
  return t ? 'other' : null;
}

/** The shapes the app makes: the number of raised fingers of the first hand picks one. */
export function shapeFacts(fingers) {
  switch (fingers) {
    case 0: return { name: 'Cylinder', base: 'round', faces: 3, edges: 2, vertices: 0, euler: false };
    case 1: return { name: 'A line', base: null, faces: null, edges: null, vertices: null, euler: false };
    case 2: return { name: 'A flat sheet', base: null, faces: null, edges: null, vertices: null, euler: false };
    case 3: return { name: 'Triangular prism', base: 3, faces: 5, edges: 9, vertices: 6, euler: true };
    case 4: return { name: 'Cube', base: 4, faces: 6, edges: 12, vertices: 8, euler: true };
    case 5: return { name: 'Pentagonal prism', base: 5, faces: 7, edges: 15, vertices: 10, euler: true };
    default: return null;
  }
}
