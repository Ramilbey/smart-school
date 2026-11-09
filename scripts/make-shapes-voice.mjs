// Makes the voice for the "Shapes you can hold" chapter: one short MP3 per line, and a list (voice.json) with the text and length of each.
// The lines follow the shapes of the original hand-figure app: 0 fingers a cylinder, 1 a line, 2 a flat sheet, 3 a triangular prism,
// 4 a cube, 5 a pentagonal prism; the other hand makes the shape bigger or smaller and spins it.
// Needs edge-tts (pip install edge-tts) and ffmpeg. The lines are sent to Microsoft's text-to-speech service, so only public text goes in here.
//   node scripts/make-shapes-voice.mjs
// Set EDGE_TTS to the edge-tts program if it is not on the PATH.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public', 'media', 'shapes');
const VOICE = 'en-US-AvaMultilingualNeural';
const EDGE = process.env.EDGE_TTS || 'edge-tts';

const solids = [
  [3, 'triangular', 5, 9, 6],
  [5, 'pentagonal', 7, 15, 10],
];
const words = { 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten', 12: 'twelve', 15: 'fifteen', 18: 'eighteen', 20: 'twenty', 21: 'twenty-one', 24: 'twenty-four', 27: 'twenty-seven', 30: 'thirty', 11: 'eleven', 14: 'fourteen', 16: 'sixteen' };
const w = (n) => words[n] ?? String(n);
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const a = (s) => (/^[aeiou]/i.test(s) ? 'an' : 'a');

// A prism with an n-sided base has n + 2 faces, 3n edges and 2n vertices. Written out so the voice and the screen always agree.
const clips = {
  intro: 'This is how a geometry lesson could feel in Smart Schools. Everything stays in your browser, and nothing is recorded. Raise one hand in front of the camera, and hold up three fingers.',
  wait: 'I can’t see a hand yet. Raise it a little higher, with the palm toward the camera.',
  nocam: 'No camera? No problem. Press the demo button, and the shapes change by themselves.',
  n0: 'A closed fist: a cylinder. It has two flat faces, one curved face, and no corners at all. A circle is like a shape with endless sides.',
  n1: 'One finger: a single line. A line has length, but no width and no height.',
  n2: 'Two fingers: the base shrinks to a line segment, so the solid becomes a flat sheet, with length and height, and no depth.',
  n4: 'Four fingers: a square base, and the height matches the side, so this prism is a cube. Six faces, twelve edges, eight vertices.',
  second: 'Now use your other hand. Pinch your fingers to make the shape smaller, open them to make it bigger, and flick a finger to spin it.',
  euler: 'Look at the numbers. Vertices minus edges plus faces is always two, for every prism you make. In class, Zukko would ask you to check it yourself, and give hints, not answers.',
};
for (const [n, name, f, e, v] of solids) {
  clips[`n${n}`] = `${cap(w(n))} fingers: the base has ${w(n)} sides, so this is ${a(name)} ${name} prism. ${cap(w(f))} faces, ${w(e)} edges, ${w(v)} vertices.`;
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(`${cmd} failed:`, r.stderr || r.error);
    process.exit(1);
  }
  return r.stdout;
}

mkdirSync(out, { recursive: true });
const tmp = mkdtempSync(path.join(os.tmpdir(), 'shapes-voice-'));
const list = {};
for (const [id, text] of Object.entries(clips)) {
  const raw = path.join(tmp, `${id}.mp3`);
  const file = path.join(out, `${id}.mp3`);
  run(EDGE, ['--voice', VOICE, '--rate=-4%', '--text', text, '--write-media', raw]);
  run('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-ac', '1', '-ar', '24000', '-b:a', '56k', file]);
  const seconds = Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).trim());
  list[id] = { file: `media/shapes/${id}.mp3`, text, seconds: Math.round(seconds * 100) / 100 };
  console.log(id.padEnd(6), seconds.toFixed(1).padStart(5), 's  ', text.slice(0, 70));
}
rmSync(tmp, { recursive: true, force: true });
writeFileSync(path.join(out, 'voice.json'), JSON.stringify({ voice: VOICE, clips: list }, null, 2) + '\n');
console.log(`Wrote ${Object.keys(list).length} clips to ${out}`);
