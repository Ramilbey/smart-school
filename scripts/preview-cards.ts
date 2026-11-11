// Draws one sample of every card kind to docs/card-samples/*.png, so the look can be checked without Telegram.
// Run: npx tsx scripts/preview-cards.ts
import { writeFileSync } from 'node:fs';
import { visualSvg, type Visual } from '../shared/curriculum/index.ts';
import { svgToPng } from '../server/render.ts';

const samples: Record<string, [Visual, string?]> = {
  question_balance: [{ t: 'balance', left: '3x + 4', right: '19' }, 'Tenglama · 2/5'],
  question_bar: [{ t: 'bar', parts: [{ w: 1, label: '20', tone: 'amber' }, { w: 1, label: '20', tone: 'blue' }, { w: 1, label: '20', tone: 'blue' }, { w: 1, label: '20', tone: 'blue' }], total: '80 = 100%' }, 'Foiz · 1/3'],
  question_plane: [{ t: 'plane', lines: [{ k: 1.5, b: -1 }], points: [{ x: 0, y: -1, label: 'b' }] }, 'Chiziqli funksiya · 3/5'],
  question_triangle: [{ t: 'triangle', deg: [50, 60, 70], a: '50°', b: '60°', c: '?' }, 'Uchburchak · 4/5'],
  question_tiles: [{ t: 'tiles', groups: [{ n: 3, kind: 'x' }, { n: 4, kind: '1' }] }, 'Ifodalar · 1/5'],
  question_road: [{ t: 'road', s: '120 km', v: '60 km/h', time: '? h' }, 'Tezlik · 2/5'],
  home: [{ t: 'home', level: 'Ulug‘bek shogirdi', xp: 420, goal: 500, into: 0.6, streak: 6, tiles: ['done', 'done', 'done', 'done', 'now', 'todo', 'todo'] }],
  result: [{ t: 'result', title: 'Foiz', stars: 2, right: 4, total: 5, xp: 40, streak: 6 }],
  reminder: [{ t: 'reminder', streak: 6 }],
  board: [{ t: 'board', rows: [{ text: '2x + 3 = 11', n: null }, { text: '2x + 3 − 3 = 11 − 3', n: 1 }, { text: '2x = 8', n: 2 }], at: 2, total: 3 }],
  board_done: [{ t: 'board', rows: [{ text: '2x + 3 = 11', n: null }, { text: '2x = 8', n: 1 }, { text: 'x = 8 ÷ 2', n: 2 }], at: 3, total: 3, answer: 'x = 4' }],
};
for (const [name, [v, ribbon]] of Object.entries(samples)) {
  const png = await svgToPng(visualSvg(v, 'uz', ribbon));
  if (!png) throw new Error('no renderer');
  writeFileSync(`docs/card-samples/${name}.png`, png);
  console.log(name, png.length);
}

// The picture shown above "What can this bot do?" before Start. Telegram only lets the bot owner set it, in @BotFather → Edit Bot → Edit Description Picture.
import { C, FONT, svgDoc } from '../shared/curriculum/plate.ts';
const H = 616;
const arcs = (s: number) =>
  `<g transform="translate(300 308) scale(${s})"><path d="M12.5 -89.1 A90 90 0 0 1 89.1 -12.5" stroke="#2DE2C4" stroke-width="24" fill="none" stroke-linecap="round"/><path d="M89.1 12.5 A90 90 0 0 1 12.5 89.1" stroke="#5B8CFF" stroke-width="24" fill="none" stroke-linecap="round"/><path d="M-12.5 89.1 A90 90 0 0 1 -89.1 12.5" stroke="#FF6B5B" stroke-width="24" fill="none" stroke-linecap="round"/><path d="M-89.1 -12.5 A90 90 0 0 1 -12.5 -89.1" stroke="#FFB547" stroke-width="24" fill="none" stroke-linecap="round"/><circle r="20" fill="#EEF2FF"/></g>`;
const cover = svgDoc(
  H,
  `<rect width="1056" height="${H}" fill="url(#bd)"/><rect x="44" y="44" width="968" height="${H - 88}" fill="url(#lap)"/><rect x="44" y="44" width="968" height="${H - 88}" fill="none" stroke="${C.amber}" stroke-width="5"/>` +
    `<g fill="none" stroke="#2f62c9" stroke-width="7" opacity=".55"><rect x="650" y="110" width="300" height="300"/><rect x="650" y="110" width="300" height="300" transform="rotate(45 800 260)"/></g>` +
    `<circle cx="300" cy="308" r="168" fill="#050914" stroke="${C.amber}" stroke-width="6"/>${arcs(1.28)}` +
    `<text x="540" y="298" font-family="${FONT}" font-weight="800" font-size="84" fill="#ffffff">Smart</text><text x="540" y="392" font-family="${FONT}" font-weight="800" font-size="84" fill="#ffffff">Schools</text>` +
    `<text x="542" y="462" font-family="${FONT}" font-weight="700" font-size="36" fill="${C.amber}">6–7-sinflar uchun yordamchi</text>`,
);
writeFileSync('docs/bot-cover.png', (await svgToPng(cover))!);
console.log('bot-cover');
