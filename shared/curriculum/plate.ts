// The Smart Schools "plate": lapis-blue ground, a turquoise tile border of eight-point stars, a cream panel inside.
// Every picture the bot sends sits on one of these, so the chat looks hand-made and Uzbek, not like a template.
// Pure strings, so the same code feeds the Telegram PNGs (resvg) and the Mini App.

export const PLATE_W = 1056;
/** Tall plates (questions, lessons, results, the board) and short ones (home, reminder). Both are multiples of the 44 px tile. */
export const PLATE_H = 748;
export const PLATE_H_SHORT = 528;

export const C = {
  navy: '#0c1f57',
  lapis: '#1d44a3',
  teal: '#139a8c',
  cream: '#f7f0df',
  paper: '#fff4d9',
  amber: '#ffb547',
  coral: '#ff6b5b',
  sand: '#e8dcb9',
  sandLine: '#cdbd92',
  mute: '#46507a',
  chalk: '#f4f1e8',
  chalkAmber: '#ffcf70',
};

export const FONT = 'Onest, DejaVu Sans, sans-serif';

export const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Characters resvg has no glyph for (emoji): cards must never show a hollow box. */
export const plain = (v: string) => v.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '').replace(/\s{2,}/g, ' ').trim();

const DEFS =
  '<defs>' +
  `<linearGradient id="lap" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.lapis}"/><stop offset="1" stop-color="${C.navy}"/></linearGradient>` +
  '<pattern id="bd" width="44" height="44" patternUnits="userSpaceOnUse">' +
  `<rect width="44" height="44" fill="${C.teal}"/>` +
  `<rect x="11" y="11" width="22" height="22" fill="${C.paper}"/>` +
  `<rect x="11" y="11" width="22" height="22" fill="${C.paper}" transform="rotate(45 22 22)"/>` +
  `<circle cx="22" cy="22" r="5" fill="${C.coral}"/>` +
  `<circle cx="0" cy="0" r="4" fill="${C.navy}"/><circle cx="44" cy="0" r="4" fill="${C.navy}"/><circle cx="0" cy="44" r="4" fill="${C.navy}"/><circle cx="44" cy="44" r="4" fill="${C.navy}"/>` +
  '</pattern></defs>';

export const svgDoc = (h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PLATE_W} ${h}" width="${PLATE_W}" height="${h}">${DEFS}${body}</svg>`;

/** The frame: tile band, gold line, cream panel (x 76..980, y 76..h-76). */
export function frame(h: number): string {
  return (
    `<rect width="${PLATE_W}" height="${h}" fill="url(#bd)"/>` +
    `<rect x="44" y="44" width="968" height="${h - 88}" fill="url(#lap)"/>` +
    `<rect x="44" y="44" width="968" height="${h - 88}" fill="none" stroke="${C.amber}" stroke-width="5"/>` +
    `<rect x="76" y="76" width="904" height="${h - 152}" rx="24" fill="${C.cream}"/>`
  );
}

/** The amber ribbon over the top-left corner: topic and place in the round. */
export function ribbon(text: string): string {
  const t = plain(text);
  if (!t) return '';
  const size = Math.min(30, 700 / Math.max(t.length * 0.62, 1));
  const w = Math.min(780, Math.ceil(t.length * size * 0.62) + 52);
  return (
    `<path d="M96 24 H${96 + w} L${122 + w} 52 L${96 + w} 80 H96 Z" fill="${C.amber}" stroke="${C.navy}" stroke-width="5" stroke-linejoin="round"/>` +
    `<text x="122" y="${52 + size * 0.36}" font-family="${FONT}" font-weight="800" font-size="${size.toFixed(1)}" fill="${C.navy}">${esc(t)}</text>`
  );
}

export const STAR_PTS = '0,-60 15.28,-21.04 57.06,-18.54 24.73,8.03 35.27,48.54 0,26 -35.27,48.54 -24.73,8.03 -57.06,-18.54 -15.28,-21.04';

export const star = (x: number, y: number, s: number, fill: string, stroke = C.navy, sw = 3) =>
  `<polygon transform="translate(${x} ${y}) scale(${s})" points="${STAR_PTS}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;

/** The flame of the streak, centred at (x, y); s = 1 is 88 px tall. */
export const flame = (x: number, y: number, s: number) =>
  `<g transform="translate(${x} ${y}) scale(${s})">` +
  `<path d="M0 -44 C18 -22 30 -8 30 12 C30 32 16 44 0 44 C-16 44 -30 32 -30 12 C-30 -2 -22 -12 -14 -22 C-12 -8 -6 -4 0 -4 C4 -16 2 -30 0 -44Z" fill="${C.coral}" stroke="${C.navy}" stroke-width="${(5 / Math.max(s, 0.4)).toFixed(1)}" stroke-linejoin="round"/>` +
  `<path d="M0 -2 C10 8 16 16 16 26 C16 36 8 42 0 42 C-8 42 -16 36 -16 26 C-16 16 -6 10 0 -2Z" fill="${C.amber}"/></g>`;

/** An eight-point star made of two squares. */
export const khatam = (x: number, y: number, side: number, fill: string, stroke = 'none', sw = 0) =>
  `<rect x="${x - side / 2}" y="${y - side / 2}" width="${side}" height="${side}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>` +
  `<rect x="${x - side / 2}" y="${y - side / 2}" width="${side}" height="${side}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" transform="rotate(45 ${x} ${y})"/>`;

/** Size that keeps `text` inside `width` px. 0.62 em per character is a safe average for Onest Bold, Cyrillic included. */
export const fit = (text: string, width: number, max: number, min = 14) => Math.max(min, Math.min(max, width / Math.max(text.length * 0.62, 1)));
