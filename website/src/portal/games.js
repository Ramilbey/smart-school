// The ready-made games a teacher can start from, and the small parsers behind the "write your own" templates.
// Four of them are ways to play any quiz (they only differ in the rules). Three are templates: the teacher changes the
// values (the statements, the words, the numbers) and gets a quiz made for that game.

/** `rules` says how the game is played on the server; `template` says the teacher fills in values first. */
export const GAMES = [
  { id: 'battle', mode: 'battle', variant: 'classic', tint: 0, tags: ['any'], seconds: 20, icon: '<path d="M4 20v-8h5v8M10 20V5h4v15M15 20v-6h5v6"/>' },
  { id: 'speed', mode: 'speed', variant: 'classic', tint: 2, tags: ['any'], seconds: 120, icon: '<circle cx="12" cy="13.5" r="7"/><path d="M12 13.5V9.5M9.5 3h5"/>' },
  { id: 'survivor', mode: 'battle', variant: 'survivor', tint: 1, tags: ['any'], seconds: 15, icon: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.600-7 10-7 10z"/>' },
  { id: 'race', mode: 'speed', variant: 'race', tint: 3, tags: ['any', 'teams'], seconds: 120, teams: 3, icon: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>' },
  { id: 'tf', template: 'tf', play: 'speed', tint: 4, tags: ['any'], seconds: 60, icon: '<path d="M3 12.5l3.500 3.500L11 9M14.500 7.500l5.500 9M20 7.500l-5.500 9"/>' },
  { id: 'math', template: 'math', play: 'speed', tint: 5, tags: ['math'], seconds: 90, icon: '<path d="M7 4v9M2.500 8.500h9M3 19h8M15 8l5 9M20 8l-5 9"/>' },
  { id: 'words', template: 'words', play: 'speed', tint: 0, tags: ['lang', 'typing'], seconds: 90, icon: '<path d="M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4"/>' },
];
export const gameById = (id) => GAMES.find((g) => g.id === id) ?? GAMES[0];
/** The four games that run a quiz as it is. */
export const PLAYABLE = GAMES.filter((g) => !g.template);

export const TF_LABELS = ['True', 'False'];

const squash = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
const YES = ['true', 't', '+', 'yes', 'y'];
const NO = ['false', 'f', '-', '−', 'no', 'n'];

/** "The sun is a star = true" -> a two-answer question. Returns the questions and what is wrong with which line. */
export function parseTrueFalse(text) {
  const questions = [], errors = [];
  String(text).split('\n').forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const cut = line.lastIndexOf('=');
    const statement = cut > 0 ? line.slice(0, cut).trim() : '';
    const verdict = cut > 0 ? squash(line.slice(cut + 1)) : '';
    if (!statement || !(YES.includes(verdict) || NO.includes(verdict))) return errors.push({ line: i + 1, key: 'lineNeedTF' });
    if (statement.length > 400) return errors.push({ line: i + 1, key: 'lineTooLong' });
    questions.push({ kind: 'choice', prompt: statement, choices: [...TF_LABELS], correct: YES.includes(verdict) ? 0 : 1, explain: '' });
  });
  return { questions, errors };
}

/** "apple = olma | olma!" -> a question whose answer is typed. Everything after the first | is also accepted. */
export function parseWords(text) {
  const questions = [], errors = [];
  String(text).split('\n').forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const cut = line.indexOf('=');
    const prompt = cut > 0 ? line.slice(0, cut).trim() : '';
    const [word, ...rest] = (cut > 0 ? line.slice(cut + 1) : '').split('|').map((x) => x.trim());
    if (!prompt || !word) return errors.push({ line: i + 1, key: 'lineNeedEq' });
    if (prompt.length > 400 || word.length > 60) return errors.push({ line: i + 1, key: 'lineTooLong' });
    questions.push({ kind: 'text', prompt, text: word, accept: rest.filter(Boolean), explain: '' });
  });
  return { questions, errors };
}
