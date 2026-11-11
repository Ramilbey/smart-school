// The bot's own cards: the home card, the end-of-round result, the evening reminder and the homework chalkboard.
// Drawn on the same plate as the lesson pictures (see plate.ts). Text is kept to a number, a word or two.

import type { Lang } from '../types.ts';
import { C, FONT, PLATE_H, PLATE_H_SHORT, esc, fit, flame, frame, khatam, plain, ribbon, star, svgDoc } from './plate.ts';

export type CardVisual =
  | { t: 'home'; level: string; xp: number; goal: number | null; into: number; streak: number; tiles: ('done' | 'now' | 'todo')[] }
  | { t: 'result'; title: string; stars: 1 | 2 | 3; right: number; total: number; xp: number; streak: number }
  | { t: 'reminder'; streak: number }
  | { t: 'board'; rows: { text: string; n: number | null }[]; at: number; total: number; answer?: string };

export const isCard = (v: { t: string }): v is CardVisual => v.t === 'home' || v.t === 'result' || v.t === 'reminder' || v.t === 'board';

const DAYS = { uz: 'kun', ru: 'дн.', en: 'days' } as const;
const IN_A_ROW = { uz: 'kun ketma-ket', ru: 'дней подряд', en: 'days in a row' } as const;
const RESULT_LABELS = {
  uz: ['birinchi urinishda', 'ball', 'kun ketma-ket'],
  ru: ['с первой попытки', 'баллы', 'дней подряд'],
  en: ['first try', 'points', 'days in a row'],
} as const;

/* ---------- home ---------- */

function home(v: Extract<CardVisual, { t: 'home' }>, lang: Lang): string {
  const H = PLATE_H_SHORT;
  const level = plain(v.level);
  const beads = Array.from({ length: 10 }, (_, i) => {
    const on = i < Math.round(v.into * 10);
    return `<circle cx="${358 + i * 50}" cy="256" r="19" fill="${on ? C.teal : C.sand}" stroke="${on ? C.navy : C.sandLine}" stroke-width="3"/>`;
  }).join('');
  const n = Math.max(1, v.tiles.length);
  const size = Math.min(46, Math.floor((370 - (n - 1) * 8) / n));
  const startX = 960 - (n * size + (n - 1) * 8);
  const tiles = v.tiles
    .map((s, i) => {
      const x = startX + i * (size + 8);
      const fill = s === 'done' ? C.teal : s === 'now' ? C.amber : C.sand;
      const stroke = s === 'todo' ? C.sandLine : C.navy;
      const mark = s === 'done' ? khatam(x + size / 2, 397, size * 0.3, C.paper) : '';
      return `<rect x="${x}" y="374" width="${size}" height="${size}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="4"/>${mark}`;
    })
    .join('');
  const xpText = v.goal ? `${v.xp} / ${v.goal} XP` : `${v.xp} XP`;
  return svgDoc(
    H,
    frame(H) +
      `<circle cx="200" cy="264" r="100" fill="${C.amber}" stroke="${C.navy}" stroke-width="6"/>` +
      `<circle cx="200" cy="264" r="86" fill="${C.lapis}"/>` +
      khatam(200, 264, 80, C.paper) +
      `<circle cx="200" cy="264" r="15" fill="${C.amber}" stroke="${C.navy}" stroke-width="4"/>` +
      `<text x="340" y="206" font-family="${FONT}" font-weight="800" font-size="${fit(level, 620, 46).toFixed(1)}" fill="${C.navy}">${esc(level)}</text>` +
      beads +
      `<text x="340" y="320" font-family="${FONT}" font-weight="700" font-size="30" fill="${C.mute}">${esc(xpText)}</text>` +
      flame(366, 398, 0.8) +
      `<text x="412" y="414" font-family="${FONT}" font-weight="800" font-size="40" fill="${C.navy}">${v.streak} ${DAYS[lang]}</text>` +
      tiles,
  );
}

/* ---------- result ---------- */

function result(v: Extract<CardVisual, { t: 'result' }>, lang: Lang): string {
  const H = PLATE_H;
  const labels = RESULT_LABELS[lang];
  const stars = [0, 1, 2]
    .map((i) => {
      const on = i < v.stars;
      return star(328 + i * 200, 270, 1.55, on ? C.amber : '#efe3c3', on ? C.navy : C.sandLine);
    })
    .join('');
  const tile = (x: number, big: string, label: string, extra = '') =>
    `<rect x="${x}" y="440" width="272" height="196" rx="22" fill="${C.lapis}" stroke="${C.navy}" stroke-width="5"/>` +
    `<text x="${x + 136}" y="534" text-anchor="middle" font-family="${FONT}" font-weight="800" font-size="${fit(big, 220, 66).toFixed(1)}" fill="#ffffff">${esc(big)}</text>` +
    `<text x="${x + 136}" y="590" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="${fit(label, 240, 30).toFixed(1)}" fill="#dbe7ff">${esc(label)}</text>` +
    extra;
  return svgDoc(
    H,
    frame(H) +
      ribbon(v.title) +
      stars +
      tile(96, `${v.right}/${v.total}`, labels[0]) +
      tile(392, `+${v.xp}`, labels[1]) +
      tile(688, String(v.streak), labels[2], flame(920, 492, 0.5)),
  );
}

/* ---------- evening reminder ---------- */

function reminder(v: Extract<CardVisual, { t: 'reminder' }>, lang: Lang): string {
  const H = PLATE_H_SHORT;
  const done = Math.min(6, Math.max(0, v.streak));
  const dots = Array.from({ length: 7 }, (_, i) => {
    const cx = 158 + i * 124;
    if (i < 7 - 1 && i >= 6 - done) {
      return `<circle cx="${cx}" cy="396" r="24" fill="${C.teal}" stroke="${C.navy}" stroke-width="4"/>` + khatam(cx, 396, 16, C.paper);
    }
    if (i === 6) return `<circle cx="${cx}" cy="396" r="24" fill="${C.paper}" stroke="${C.coral}" stroke-width="7" stroke-dasharray="10 8"/>`;
    return `<circle cx="${cx}" cy="396" r="24" fill="${C.sand}" stroke="${C.sandLine}" stroke-width="4"/>`;
  }).join('');
  const num = String(v.streak);
  return svgDoc(
    H,
    frame(H) +
      `<g fill="none" stroke="#efe3c3" stroke-width="12"><rect x="715" y="140" width="170" height="170"/><rect x="715" y="140" width="170" height="170" transform="rotate(45 800 225)"/></g>` +
      flame(212, 238, 1.9) +
      `<text x="330" y="288" font-family="${FONT}" font-weight="800" font-size="${num.length > 2 ? 110 : 150}" fill="${C.navy}">${esc(num)}</text>` +
      `<text x="334" y="338" font-family="${FONT}" font-weight="800" font-size="${fit(IN_A_ROW[lang], 360, 44).toFixed(1)}" fill="${C.mute}">${IN_A_ROW[lang]}</text>` +
      dots,
  );
}

/* ---------- homework chalkboard ---------- */

/** Chalk lettering: Onest with every glyph turned a hair, so it reads as written, not typeset. */
function chalk(text: string, x: number, y: number, size: number, fill: string, extra = '') {
  const rot = Array.from(text)
    .map((_, i) => (((i * 37) % 7) - 3) * 0.9)
    .join(' ');
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-weight="700" font-size="${size.toFixed(1)}" fill="${fill}" rotate="${rot}" ${extra}>${esc(text)}</text>`;
}

function board(v: Extract<CardVisual, { t: 'board' }>): string {
  const H = PLATE_H;
  // Keep the problem and the latest steps; the board has room for four lines.
  const rows = v.rows.length > 4 ? [v.rows[0], ...v.rows.slice(-3)] : v.rows;
  const ys = [180, 320, 460, 590];
  let body = '';
  rows.forEach((r, i) => {
    const y = ys[i];
    const last = i === rows.length - 1 && !v.answer;
    const text = plain(r.text);
    const size = fit(text, 800, last && i > 0 ? 96 : 86, 40);
    const fill = last ? '#ffffff' : C.chalk;
    body += chalk(text, 180, y, size, fill, last ? '' : 'opacity=".78"');
    if (r.n !== null) {
      body += `<circle cx="104" cy="${y - 26}" r="30" fill="none" stroke="${C.chalk}" stroke-width="5" opacity=".85"/>`;
      body += `<text x="104" y="${y - 12}" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="40" fill="${C.chalk}">${r.n}</text>`;
    }
    if (last && i > 0) {
      body += `<path d="M180 ${y + 26} q20 -14 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" fill="none" stroke="${C.chalkAmber}" stroke-width="6" stroke-linecap="round"/>`;
    }
  });
  if (v.answer) {
    const y = ys[Math.min(rows.length, 3)];
    const size = fit(plain(v.answer), 760, 96, 40);
    body += chalk(plain(v.answer), 180, y, size, C.chalkAmber);
    body += `<path d="M170 ${y + 30} q20 -12 40 0 t40 0 t40 0 t40 0 t40 0 t40 0" fill="none" stroke="${C.chalkAmber}" stroke-width="6" stroke-linecap="round"/>`;
    body += `<path d="M96 ${y - 24} l16 20 l34 -44" fill="none" stroke="${C.chalkAmber}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  const dots = Array.from({ length: Math.min(6, v.total) }, (_, i) => {
    const on = i < v.at;
    return `<circle cx="${840 + i * 36}" cy="612" r="11" fill="${on ? C.chalk : 'none'}" stroke="${C.chalk}" stroke-width="4" opacity="${on ? 1 : 0.5}"/>`;
  }).join('');
  const wood = '#8a5a2b';
  return svgDoc(
    H,
    `<defs><radialGradient id="slate" cx=".45" cy=".4" r=".8"><stop offset="0" stop-color="#2a5149"/><stop offset="1" stop-color="#16302a"/></radialGradient></defs>` +
      `<rect width="1056" height="${H}" fill="${wood}"/>` +
      `<g stroke="#774c22" stroke-width="3"><line x1="0" y1="120" x2="1056" y2="120"/><line x1="0" y1="290" x2="1056" y2="290"/><line x1="0" y1="470" x2="1056" y2="470"/><line x1="0" y1="610" x2="1056" y2="610"/></g>` +
      `<rect x="36" y="36" width="984" height="604" rx="8" fill="url(#slate)" stroke="#4a2f14" stroke-width="8"/>` +
      `<g fill="#ffffff" opacity=".045"><ellipse cx="300" cy="200" rx="260" ry="60"/><ellipse cx="700" cy="420" rx="320" ry="80"/><ellipse cx="400" cy="560" rx="240" ry="50"/></g>` +
      body +
      dots +
      `<rect x="0" y="650" width="1056" height="98" fill="#6b4220"/><rect x="0" y="650" width="1056" height="10" fill="#9a6633"/>` +
      `<text x="60" y="716" font-family="${FONT}" font-weight="700" font-size="30" fill="#e9d8b4" opacity=".85">Smart Schools</text>` +
      `<rect x="650" y="668" width="96" height="26" rx="9" fill="${C.chalk}" transform="rotate(-6 698 681)"/>` +
      `<rect x="830" y="684" width="160" height="26" rx="4" fill="#26231f"/><rect x="830" y="660" width="160" height="30" rx="8" fill="#c9965a"/>`,
  );
}

export function drawCard(v: CardVisual, lang: Lang): string {
  switch (v.t) {
    case 'home':
      return home(v, lang);
    case 'result':
      return result(v, lang);
    case 'reminder':
      return reminder(v, lang);
    case 'board':
      return board(v);
  }
}
