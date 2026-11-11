// "Under the hood": how Smart Schools works inside, drawn like a product dashboard (black UI, colour-outlined tools,
// mono tags, wires with moving lights). Three buttons switch between three views that share one left side
// (the inputs, Zukko as the AI core, and the two panels "What the AI does" / "What people and rules do"):
//   Systems   : one card for each of 15 tools, grouped in six systems, with what it does, what it works with, what it connects to
//   Live flow : the tools as pills, and the steps of each system as tags, with lights running along the wires
//   Results   : everything flows into one teacher dashboard and the result is shown
// Six systems, six colours: AI classroom (teal), Classroom games (purple), Homework helper (orange),
// Personal AI tutor (blue), Smart attendance (red), Teacher dashboard (green).
// Main labels are plain English; the small mono text under each is the technical name. All numbers and events are demo data.
// Status dots follow smart-schools-app/docs/STATUS.md.
import gsap from 'gsap';

const G = { bg: '#050506', line: '#1E1E24', mute: '#8A8A92', dim: '#5B5B63', cream: '#EADBC8', pale: '#C7D2E0', neutral: '#C9CDD6' };
const MONO = "'JetBrains Mono Variable','JetBrains Mono',ui-monospace,Menlo,monospace";
const SANS = "'Geologica Variable',Geologica,system-ui,sans-serif";
const SYS = {
  cls: { color: '#2EC4B6', name: 'AI classroom', log: 'AI classroom', status: 'working' },
  game: { color: '#8B6CF0', name: 'Classroom games', log: 'Games', status: 'working' },
  hw: { color: '#F59E2B', name: 'Homework helper', log: 'Homework', status: 'working' },
  tutor: { color: '#4F8BFF', name: 'Personal AI tutor', log: 'AI tutor', status: 'working' },
  att: { color: '#F0453A', name: 'Smart attendance', log: 'Attendance', status: 'simulated' },
  dash: { color: '#5BE3A0', name: 'Teacher dashboard', log: 'Dashboard', status: 'working' },
};
const STATUS = { working: '#5BE3A0', simulated: '#F59E2B', planned: '#8A8A92' };
const f1 = (n) => Math.round(n * 10) / 10;
const rand = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const bez = (p, t) => { const u = 1 - t; return [u * u * u * p[0] + 3 * u * u * t * p[2] + 3 * u * t * t * p[4] + t * t * t * p[6], u * u * u * p[1] + 3 * u * u * t * p[3] + 3 * u * t * t * p[5] + t * t * t * p[7]]; };
const curve = (x1, y1, x2, y2, k = 0.5) => { const dx = (x2 - x1) * k; return [x1, y1, x1 + dx, y1, x2 - dx, y2, x2, y2]; };
const dstr = (p) => `M${f1(p[0])} ${f1(p[1])} C${f1(p[2])} ${f1(p[3])} ${f1(p[4])} ${f1(p[5])} ${f1(p[6])} ${f1(p[7])}`;
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

/* little characters with eyes, like the tool icons in the dashboard we copy the style of */
const star = (() => { const p = []; for (let i = 0; i < 16; i++) { const r = i % 2 ? 8.4 : 10.8, a = (Math.PI * 2 * i) / 16 - Math.PI / 2; p.push(`${f1(12 + r * Math.cos(a))},${f1(12 + r * Math.sin(a))}`); } return p.join(' '); })();
const SHAPES = {
  star: `<polygon points="${star}" stroke-linejoin="round"/>`,
  round: '<circle cx="12" cy="12" r="10"/>',
  tri: '<path d="M12 4 L21 19.5 H3 Z" stroke-linejoin="round" stroke-width="2.4"/>',
  heart: '<path d="M12 20.5 C4 14.5 2.5 10.5 2.5 8 C2.5 5 4.8 3.5 7.2 3.5 C9.3 3.5 11 4.8 12 6.6 C13 4.8 14.7 3.5 16.8 3.5 C19.2 3.5 21.5 5 21.5 8 C21.5 10.5 20 14.5 12 20.5Z"/>',
  ghost: '<path d="M3 14 C3 8 6.5 4 12 4 C17.5 4 21 8 21 14 C21 18 20 20 18 20 C16.5 20 16 18.5 14.5 18.5 H9.5 C8 18.5 7.5 20 6 20 C4 20 3 18 3 14Z"/>',
  hexa: '<path d="M12 2.5 L20.5 7.2 V16.8 L12 21.5 L3.5 16.8 V7.2Z" stroke-linejoin="round" stroke-width="2"/>',
  pill: '<rect x="2.5" y="5" width="19" height="14" rx="7"/>',
  cloud: '<path d="M6.5 19 C3.5 19 2 17 2 14.6 C2 12.4 3.6 10.9 5.7 10.7 C6.2 7.4 8.8 5.4 12 5.4 C15 5.4 17.4 7.2 18 10 C20.5 10.2 22 11.9 22 14.4 C22 17.2 20.2 19 17.5 19Z"/>',
};
const icon = (shape, color, size = 24) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" style="flex:none"><g fill="${color}" stroke="${color}" stroke-width="1.2">${SHAPES[shape]}</g><g class="ey"><ellipse cx="8.8" cy="12.3" rx="1.5" ry="2.2" fill="#0A0A0D"/><ellipse cx="15.2" cy="12.3" rx="1.5" ry="2.2" fill="#0A0A0D"/></g><g class="eh" opacity="0"><path d="M7 13.4 q1.8 -3 3.6 0 M13.4 13.4 q1.8 -3 3.6 0" stroke="#0A0A0D" stroke-width="1.6" fill="none" stroke-linecap="round"/></g><g class="ed" opacity="0"><circle cx="7.2" cy="12.8" r="1.7" fill="#0A0A0D" style="transform-box:fill-box;transform-origin:center"/><circle cx="12" cy="12.8" r="1.7" fill="#0A0A0D" style="transform-box:fill-box;transform-origin:center"/><circle cx="16.8" cy="12.8" r="1.7" fill="#0A0A0D" style="transform-box:fill-box;transform-origin:center"/></g></svg>`;
const botFace = (cx, cy, r) => `<circle class="hb-halo" cx="${cx}" cy="${cy}" r="${r + 22}" fill="#fff" fill-opacity=".05" style="transform-box:fill-box;transform-origin:center"/><g class="hb-face"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#0A0A0D" stroke="#EDEDED" stroke-opacity=".85" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${r * 0.62}" fill="#fff"/><g class="hb-eyes"><g class="ey"><ellipse cx="${cx - r * 0.2 - 3}" cy="${cy - r * 0.04}" rx="${r * 0.09}" ry="${r * 0.15}" fill="#0A0A0D"/><ellipse cx="${cx + r * 0.2 - 3}" cy="${cy - r * 0.04}" rx="${r * 0.09}" ry="${r * 0.15}" fill="#0A0A0D"/></g><g class="eh" opacity="0"><path d="M${(cx - r * 0.2 - 3) - r * 0.1} ${cy + r * 0.05} L${(cx - r * 0.2 - 3) - r * 0.1} ${cy + r * 0.015} A${r * 0.1} ${r * 0.1} 0 0 1 ${(cx - r * 0.2 - 3) + r * 0.1} ${cy + r * 0.015} L${(cx - r * 0.2 - 3) + r * 0.1} ${cy + r * 0.05} M${(cx + r * 0.2 - 3) - r * 0.1} ${cy + r * 0.05} L${(cx + r * 0.2 - 3) - r * 0.1} ${cy + r * 0.015} A${r * 0.1} ${r * 0.1} 0 0 1 ${(cx + r * 0.2 - 3) + r * 0.1} ${cy + r * 0.015} L${(cx + r * 0.2 - 3) + r * 0.1} ${cy + r * 0.05}" stroke="#0A0A0D" stroke-width="${r * 0.09}" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g><g class="ed" opacity="0"><circle cx="${cx - 3 + r * -0.27}" cy="${cy + r * 0.06}" r="${r * 0.1}" fill="#0A0A0D" style="transform-box:fill-box;transform-origin:center"/><circle cx="${cx - 3 + r * 0}" cy="${cy + r * 0.06}" r="${r * 0.1}" fill="#0A0A0D" style="transform-box:fill-box;transform-origin:center"/><circle cx="${cx - 3 + r * 0.27}" cy="${cy + r * 0.06}" r="${r * 0.1}" fill="#0A0A0D" style="transform-box:fill-box;transform-origin:center"/></g></g></g></g>`;
const ring = () => ''; /* no circles at the ends of the strings */
const labelChip = (x, y, t) => `<span class="lchip" style="position:absolute;left:${f1(x)}px;top:${f1(y)}px;transform:translate(-50%,-50%);padding:1px 7px;border-radius:3px;background:${G.pale};color:#0B0B0E;font:600 10px ${MONO};white-space:nowrap">${t}</span>`;

/* ---------------- the 15 tools (one card each, one pill each) ---------------- */
// [key, name, technical name, icon, who does it, capabilities, highlight, works with, connects to]
const TOOLS = {
  cls: [
    ['quiz', 'Quiz maker', 'quiz.engine', 'star', 'ai', ['Reads the lesson', 'Writes questions'], 'Teacher approves', ['Multiple choice', 'True / false'], ['Quiz session', 'Teacher report']],
    ['session', 'Quiz session', 'session.qr', 'round', 'system', ['QR code', 'Students join'], 'Live in class', ['Student phones'], ['Answer marker', 'Results board']],
    ['marker', 'Answer marker', 'assessment.engine', 'hexa', 'system', ['Collects answers', 'Works out scores'], 'Fixed rules, not AI', ['Quizzes', 'Games'], ['Results board', 'Quiz maker']],
  ],
  game: [
    ['library', 'Game library', 'game.library', 'ghost', 'people', ['Ready-made games', 'Teacher picks one'], 'No new game each lesson', ['Quiz Battle', 'Speed Round'], ['Game engine', 'Quiz maker']],
    ['engine', 'Game engine', 'game.engine', 'cloud', 'system', ['Teams', 'Leaderboard'], 'Runs on the board', ['Smart board', 'Student phones'], ['Results board', 'Game library']],
  ],
  hw: [
    ['helper', 'Homework helper', 'homework.assistant', 'heart', 'ai', ['Sets assignments', 'Looks at attempts'], 'Never reveals the answer', ['Homework', 'Progress'], ['Hint ladder', 'Results board']],
    ['hints', 'Hint ladder', 'hint.escalate', 'pill', 'ai', ['Hint 1: small', 'Hint 2: more', 'Hint 3: example'], 'Step by step', ['Homework', 'Tutor'], ['Homework helper', 'Learning gaps']],
  ],
  tutor: [
    ['tutor', 'Personal tutor', 'tutor.session', 'tri', 'ai', ['Fits the grade', 'Any subject'], 'Not a chatbot', ['Student phone'], ['Visual explainer', 'Learning gaps']],
    ['visual', 'Visual explainer', 'visual.render', 'round', 'ai', ['Pictures', 'Worked examples'], 'Practice questions', ['Tutor', 'Homework'], ['Personal tutor', 'Teacher report']],
    ['language', 'Language helper', 'language.detect', 'ghost', 'ai', ['Uzbek', 'Russian'], 'Speaks the student’s language', ['Tutor', 'Hints'], ['Personal tutor', 'Homework helper']],
  ],
  att: [
    ['counter', 'Photo counter', 'student.count', 'hexa', 'ai', ['Counts people', 'Estimates the class'], 'Never identifies faces', ['Classroom camera'], ['Attendance check', 'Results board']],
    ['check', 'Attendance check', 'teacher.confirm', 'heart', 'people', ['Shows the class list', 'Spots differences'], 'Teacher confirms', ['Roll call'], ['Photo counter', 'Results board']],
  ],
  dash: [
    ['results', 'Results board', 'results.hub', 'star', 'system', ['Quiz results', 'Game results', 'Homework'], 'All in one place', ['Teacher dashboard'], ['Learning gaps', 'Teacher report']],
    ['gaps', 'Learning gaps', 'learning.gaps', 'tri', 'system', ['Who is struggling', 'Topics to repeat'], 'Feeds extra practice', ['Tutor', 'Homework'], ['Teacher report', 'Hint ladder']],
    ['report', 'Teacher report', 'teacher.dashboard', 'pill', 'system', ['Who understood', 'Who needs help', 'Who was absent'], 'Teacher decides', ['Teacher dashboard'], ['Results board', 'Learning gaps']],
  ],
};
// the steps of each system, six per system (left column, then right column), and what it sends to the dashboard
const STEPS = {
  cls: [['read', 'AI reads the lesson', 'topic.analyze'], ['chk', 'Questions are checked', 'question.validate'], ['appr', 'Teacher approves quiz', 'teacher.approve'], ['qr', 'QR code starts quiz', 'qr.generate'], ['join', 'Students join by QR', 'student.join'], ['score', 'Scores are worked out', 'score.calculate']],
  game: [['pick', 'Teacher picks a game', 'game.select'], ['load', 'Lesson questions load', 'question.load'], ['conf', 'Game is set up', 'game.configure'], ['team', 'Teams are created', 'team.create'], ['play', 'Students play', 'answer.receive'], ['lead', 'Leaderboard updates', 'leaderboard.update']],
  hw: [['set', 'Teacher sets homework', 'assignment.create'], ['try', 'Student tries it', 'student.attempt'], ['find', 'Hard parts are found', 'difficulty.detect'], ['ex', 'Similar example shown', 'example.provide'], ['retry', 'Student tries again', 'student.retry'], ['prog', 'Progress is tracked', 'progress.track']],
  tutor: [['ask', 'Student asks', 'question.receive'], ['grade', 'Grade and subject', 'grade.identify'], ['topic', 'Topic is matched', 'topic.match'], ['prac', 'Practice question', 'practice.generate'], ['check', 'Understanding check', 'understanding.check'], ['adapt', 'Explanation adapts', 'learning.adapt']],
  att: [['cam', 'Camera takes a photo', 'camera.capture'], ['read', 'Photo is read', 'image.process'], ['cmp', 'Compared with roster', 'expected.compare'], ['diff', 'Differences spotted', 'discrepancy.detect'], ['nof', 'Counts, never faces', 'no face recognition'], ['save', 'Attendance is saved', 'attendance.save']],
};
const INC = { cls: ['Quiz results', 'quiz.results'], game: ['Game results', 'game.results'], hw: ['Homework progress', 'homework.progress'], tutor: ['Tutor insights', 'tutor.insights'], att: ['Attendance record', 'attendance.record'] };
const SYSLIST = ['cls', 'game', 'hw', 'tutor', 'att'];
const INPUTS = [
  ['cls', 'Teacher’s lesson', 'teacher.input', 'fractions · grade 6', 178],
  ['cls', 'Quiz answers', 'quiz.response', '24 answers', 252],
  ['game', 'Lesson content', 'lesson.content', 'lesson text', 358],
  ['hw', 'Homework task', 'homework.task', '5 questions', 504],
  ['tutor', 'Student’s question', 'student.input', 'why 3/4 &gt; 2/3?', 650],
  ['att', 'Classroom camera', 'camera.feed', '1 photo', 796],
];
const ROWS = [['Spot who is struggling', 'difficulty.analyze'], ['Who understood today?', 'student.performance'], ['Who did well?', 'class.analytics'], ['Who struggled?', 'report.generate'], ['Topics to explain again', 'learning.gaps'], ['Who needs more help?', 'intervention.recommend'], ['Who finished homework?', 'completion.update'], ['Who was absent?', 'attendance.records']];
const DASHMAP = { cls: [1, 2, 3, 0], game: [2], hw: [6, 3, 0], tutor: [4, 5], att: [7] };
const lenTab = new WeakMap();
const table = (p) => { let t = lenTab.get(p); if (!t) { const N = 48, acc = [0]; let [px, py] = bez(p, 0); for (let k = 1; k <= N; k++) { const [x, y] = bez(p, k / N); acc.push(acc[k - 1] + Math.hypot(x - px, y - py)); px = x; py = y; } t = { acc, L: acc[N] }; lenTab.set(p, t); } return t; };
const plen = (p) => table(p).L;
/* a point u (0 to 1) of the way along the string by DISTANCE, so a dot moves at one steady speed along the whole curve */
const along = (p, u) => { const { acc, L } = table(p), d = Math.min(1, Math.max(0, u)) * L; let lo = 0, hi = acc.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (acc[m] < d) lo = m; else hi = m; } const seg = acc[hi] - acc[lo] || 1; return bez(p, (lo + (d - acc[lo]) / seg) / (acc.length - 1)); };
const SPEED = 330; /* pixels a request travels every second, on every string */
const AMB = SPEED; /* the background dots on the strings move at exactly the same speed as the requests */
const travel = (p) => Math.max(0.05, plen(p) / SPEED);
const INPUT_TO = [['quiz'], ['session', 'marker'], ['library', 'engine'], ['helper', 'hints'], ['tutor', 'visual', 'language'], ['counter', 'check']];
const WHO = { ai: 'a', people: 'b', system: 'b' };
// the short request that travels to each tool (shown on the little chips that ride the wires)
const REQ = { quiz: 'make 12 questions', session: 'start the quiz', marker: 'mark 24 answers', library: 'pick a game', engine: 'run the game', helper: 'check homework', hints: 'give hint 1', tutor: 'explain grade 6', visual: 'draw a picture', language: 'Uzbek or Russian', counter: 'count the photo', check: 'confirm the list', results: 'collect results', gaps: 'find the gaps', report: 'build the report' };

// plain sentences for the log, in the order things happen (demo events)
const LOGS = {
  'cls.quiz': 'AI created 12 quiz questions.', 'cls.appr': 'Teacher approved the quiz.', 'cls.qr': 'Quiz started. Students scan the QR code.', 'cls.join': '24 students joined the quiz.', 'cls.score': 'Answers marked: 72% correct.', 'cls.inc': 'Quiz results sent to the teacher.',
  'A.cls.quiz': 'AI created 12 questions. The teacher approved the quiz.', 'A.cls.session': '24 students joined the quiz with the QR code.', 'A.cls.marker': 'Answers marked: 72% correct.', 'A.dash.results': 'Results reached the teacher.',
  'game.pick': 'Teacher picked Quiz Battle.', 'game.load': 'AI added 10 questions from today’s lesson.', 'game.conf': 'The game is ready on the classroom board.', 'game.play': '28 students are playing.', 'game.lead': 'Class leaderboard updated.', 'game.inc': 'Game results sent to the teacher.',
  'A.game.library': 'Teacher picked Quiz Battle and added today’s questions.', 'A.game.engine': '28 students are playing. Leaderboard updated.',
  'hw.set': 'Teacher set homework for class 6-B.', 'hw.try': 'Bobur tried question 3.', 'hw.find': 'Bobur finds fractions hard.', 'hw.hints': 'Hint 1 sent. The answer was not shown.', 'hw.retry': 'Bobur tried again.', 'hw.prog': 'Homework progress updated: 21 of 28 done.', 'hw.inc': 'Homework progress sent to the teacher.',
  'A.hw.helper': 'Homework sent. Bobur needs help with question 3.', 'A.hw.hints': 'Hint 1 sent. The answer was not shown.',
  'tutor.ask': 'Aziza asked a question in Uzbek.', 'tutor.grade': 'Grade 6 maths found.', 'tutor.tutor': 'AI explained it for Grade 6.', 'tutor.visual': 'A picture example was shown.', 'tutor.check': 'Aziza answered the check question.', 'tutor.adapt': 'The next explanation will be simpler.', 'tutor.prac': 'Extra practice sent to the class.', 'tutor.inc': 'What Aziza found hard was sent to the teacher.',
  'A.tutor.language': 'Aziza’s question understood in Uzbek.', 'A.tutor.tutor': 'AI explained it for Grade 6.', 'A.tutor.visual': 'A picture example and a practice question were sent.',
  'att.cam': 'Classroom camera took a photo.', 'att.counter': 'AI counted 27 students.', 'att.cmp': 'The class has 28. One may be missing.', 'att.check': 'Teacher confirmed the list.', 'att.save': 'Attendance saved: 27 present, 1 absent.', 'att.inc': 'Attendance record sent to the teacher.',
  'A.att.counter': 'AI counted 27 students in the photo.', 'A.att.check': 'Teacher confirmed: 27 present, 1 absent.',
  'dash.results': 'Results from 5 systems arrived.', 'dash.gaps': '3 topics to explain again.', 'dash.report': 'Teacher report is ready.', 'dash.r3': '7 students need additional support.', 'dash.r4': '3 topics to explain again.', 'dash.r5': 'Teacher sees who needs more help.',
  'dash.r1': 'Teacher sees who understood today’s lesson.', 'dash.r2': 'Teacher sees who did well.', 'dash.r6': 'Teacher sees who finished homework.', 'dash.r7': 'Teacher sees who was absent.',
  'A.dash.gaps': '7 students need additional support. 3 topics to explain again.', 'A.dash.report': 'Teacher report is ready.',
};
/* ---------------- the desktop stage ---------------- */
function desktop() {
  const rng = rand(33);
  const nodes = {};
  const wires = [];
  const groups = { L: {}, A: {}, B: {}, C: {} };
  const add = (view, grp, p, color, op, w, o = {}) => { const wi = { p, color, op, w, grp, view, ...o }; wires.push(wi); (groups[view][grp] ||= []).push(wi); return wi; };
  const node = (id, kind, sys, x, y, w, h, label, sub, extra = {}) => { nodes[id] = { id, kind, sys, x, y, w, h, label, sub, ...extra }; return nodes[id]; };
  const stat = (s) => STATUS[SYS[s].status];

  const L0 = 138, LH = 146;
  const PX = 490, PW = 196;
  const C = [736, 890, 1048], TW = 132, TH = 34, IW = 124;
  const bot = { x: 222, y: 450, r: 34 };
  const CA = { x: 276, y: 138, w: 180, h: 304 }, CB = { x: 276, y: 456, w: 180, h: 396 };
  const DP = { x: 1196, y: L0, w: 192, h: LH * 5 };
  const R = (n) => [n.x + n.w, n.y + n.h / 2], Lp = (n) => [n.x, n.y + n.h / 2]; /* lines end exactly on the edge of a box (there used to be a small circle 8px before it) */
  const link = (a, b) => {
    const ar = R(a), bl = Lp(b);
    if (bl[0] >= ar[0] + 6) return curve(ar[0], ar[1], bl[0], bl[1], 0.5);
    const al = Lp(a), br = R(b);
    if (br[0] <= al[0] - 6) return curve(al[0], al[1], br[0], br[1], 0.5);
    const ax = a.x + a.w / 2, bx = b.x + b.w / 2, down = b.y > a.y;
    const y1 = down ? a.y + a.h : a.y, y2 = down ? b.y : b.y + b.h, dy = (y2 - y1) * 0.5;
    return [ax, y1, ax, y1 + dy, bx, y2 - dy, bx, y2];
  };

  /* ---- the left side, shared by all three views ---- */
  INPUTS.forEach(([sys, label, sub, , cy], i) => node(`in.${i}`, 'in', sys, 14, cy - 18, 136, 36, label, sub));
  node('bot', 'bot', 'dash', bot.x - bot.r, bot.y - bot.r, bot.r * 2, bot.r * 2, 'Zukko', '');
  const labels = [], ref = { inb: [] };
  INPUTS.forEach(([sys, , , chip], i) => {
    const n = nodes[`in.${i}`], a = [-0.95, -0.55, -0.2, 0.2, 0.55, 0.95][i];
    const p = curve(n.x + n.w, n.y + n.h / 2, bot.x - bot.r * Math.cos(a), bot.y + bot.r * Math.sin(a), 0.55);
    ref.inb[i] = add('L', sys, p, '#FFFFFF', 0.6, 1.2);
    const [mx, my] = bez(p, 0.3);
    void mx; void my; void chip; void labels;
  });
  ref.botA = add('L', 'core', curve(bot.x + bot.r, bot.y - 8, CA.x, CA.y + CA.h / 2, 0.5), '#EDEDED', 0.5, 1.2);
  ref.botB = add('L', 'core', curve(bot.x + bot.r, bot.y + 8, CB.x, CB.y + CB.h / 2, 0.5), '#EDEDED', 0.5, 1.2);
  const panelOut = (who) => { const p = who === 'a' ? CA : CB; return [p.x + p.w, p.y + p.h / 2]; };
  const panelPath = (who, n) => curve(...panelOut(who), ...Lp(n), 0.8);
  const panelThrough = (who) => { const p = who === 'a' ? CA : CB, y = p.y + p.h / 2; return [p.x, y, p.x + p.w / 3, y, p.x + (2 * p.w) / 3, y, p.x + p.w, y]; };
  const adj = { A: {}, B: {} }, entries = { A: [], B: [] }, cWires = [];

  /* ---- view A: one card for each tool ---- */
  const CW = 276, CHt = 140, colX = [490, 794, 1098], colDY = [0, 10, 0];
  const order = [['cls', 0], ['cls', 1], ['cls', 2], ['game', 0], ['game', 1], ['hw', 0], ['hw', 1], ['tutor', 0], ['tutor', 1], ['tutor', 2], ['att', 0], ['att', 1], ['dash', 0], ['dash', 1], ['dash', 2]];
  const nameToId = {};
  order.forEach(([s, i], k) => {
    const t = TOOLS[s][i], col = Math.floor(k / 5), row = k % 5;
    nameToId[t[1]] = `A.${s}.${t[0]}`;
    node(`A.${s}.${t[0]}`, 'card', s, colX[col], L0 + colDY[col] + row * 146, CW, CHt, t[1], t[2], { t, view: 'A', slot: k + 1 });
  });
  const flat = order.map(([s, i]) => nodes[`A.${s}.${TOOLS[s][i][0]}`]);
  order.forEach(([s, i]) => { const t = TOOLS[s][i]; adj.A[`A.${s}.${t[0]}`] = t[8].map((cn) => nameToId[cn]).filter(Boolean); });
  entries.A = flat.slice(0, 5).map((n) => n.id);
  order.forEach(([s, i]) => {
    const t = TOOLS[s][i], n = nodes[`A.${s}.${t[0]}`], c = SYS[s].color;
    add('A', s, curve(...panelOut(WHO[t[4]]), ...Lp(n), 0.8), c, 0.4, 1, { n: 0 });
    t[8].forEach((cn, q) => { const m = nodes[nameToId[cn]]; if (m) add('A', s, link(n, m), c, q ? 0.3 : 0.5, 1, { n: rng() < 0.45 ? 1 : 0 }); });
  });
  for (let k = 0; k < 36; k++) { // the dense tangle between the cards
    const a = flat[Math.floor(rng() * 15)], b = flat[Math.floor(rng() * 15)];
    if (a !== b) add('A', rng() < 0.5 ? a.sys : b.sys, link(a, b), SYS[a.sys].color, 0.22, 0.8, { n: rng() < 0.25 ? 1 : 0 });
  }

  /* ---- view B: the tools as pills, the steps as tags, one band for each system, and the dashboard on the right ---- */
  SYSLIST.forEach((s, i) => {
    const top = L0 + i * LH, tools = TOOLS[s];
    tools.forEach((t, j) => {
      const three = tools.length === 3, h = three ? 36 : 40, y = three ? top + 22 + j * 40 : top + 34 + j * 54;
      node(`${s}.${t[0]}`, 'pill', s, PX, y, PW, h, t[1], t[2], { t, view: 'B' });
    });
    STEPS[s].forEach(([k, label, sub], q) => { const c = Math.floor(q / 3), r = q % 3; node(`${s}.${k}`, 'tag', s, C[c], top + 46 + 40 * r - TH / 2, TW, TH, label, sub, { view: 'B' }); });
    node(`${s}.inc`, 'inc', s, C[2], top + 72 - 18, IW, 36, INC[s][0], INC[s][1], { view: 'B' });
  });
  const rowY = (k) => DP.y + 182 + 62 * k;
  TOOLS.dash.forEach((t, j) => node(`dash.${t[0]}`, 'pill', 'dash', DP.x + 14, DP.y + 58 + j * 40, DP.w - 28, 34, t[1], t[2], { t, view: 'B' }));
  ROWS.forEach(([label, sub], k) => node(`dash.r${k}`, 'row', 'dash', DP.x + 14, rowY(k), DP.w - 28, 46, label, sub, { view: 'B' }));

  SYSLIST.forEach((s) => {
    const c = SYS[s].color, P = TOOLS[s].map((t) => nodes[`${s}.${t[0]}`]), T = STEPS[s].map(([k]) => nodes[`${s}.${k}`]), inc = nodes[`${s}.inc`];
    P.forEach((p, j) => add('B', s, curve(...panelOut(WHO[TOOLS[s][j][4]]), ...Lp(p), 0.8), c, 0.42, 1));
    P.forEach((p) => [0, 1, 2].forEach((t) => add('B', s, curve(...R(p), ...Lp(T[t]), 0.5), c, 0.55, 1.1, { n: rng() < 0.4 ? 1 : 0 })));
    [0, 1, 2].forEach((t) => [t, (t + 1) % 3].forEach((u, q) => add('B', s, curve(...R(T[t]), ...Lp(T[3 + u]), 0.5), c, q ? 0.3 : 0.55, 1, { n: rng() < 0.3 ? 1 : 0 })));
    [3, 4, 5].forEach((t) => add('B', s, curve(...R(T[t]), ...Lp(inc), 0.5), c, 0.6, 1.1, { n: t === 5 ? 1 : 0 }));
    DASHMAP[s].forEach((r, q) => add('B', s, curve(...R(inc), ...Lp(nodes[`dash.r${r}`]), 0.55), c, q ? 0.4 : 0.65, 1.1, { n: q ? 0 : 1 }));
  });
  SYSLIST.forEach((s) => {
    const P = TOOLS[s].map((t) => `${s}.${t[0]}`), T = STEPS[s].map(([k]) => `${s}.${k}`);
    P.forEach((p) => { adj.B[p] = T.slice(0, 3); });
    [0, 1, 2].forEach((q) => { adj.B[T[q]] = [T[3 + q], T[3 + ((q + 1) % 3)]]; });
    [3, 4, 5].forEach((q) => { adj.B[T[q]] = [`${s}.inc`]; });
    adj.B[`${s}.inc`] = DASHMAP[s].map((r) => `dash.r${r}`);
    entries.B.push(...P);
  });
  TOOLS.dash.forEach((t) => entries.B.push(`dash.${t[0]}`));
  [['dash.r4', 'tutor.adapt'], ['tutor.adapt', 'tutor.prac'], ['tutor.prac', 'hw.retry']].forEach(([a, b]) => add('B', 'loop', link(nodes[a], nodes[b]), '#EDEDED', 0.35, 1, { dash: '3 5' }));

  /* ---- view C: the result ---- */
  const chk = { x: 900, y: 238, r: 40 };
  const pillsC = [];
  SYSLIST.forEach((s) => TOOLS[s].forEach((t) => pillsC.push(nodes[`${s}.${t[0]}`])));
  pillsC.forEach((p) => { const w = add('C', p.sys, curve(...R(p), chk.x - chk.r, chk.y + (p.y - 450) * 0.04, 0.55), SYS[p.sys].color, 0.5, 1.1, { n: 1 }); cWires.push({ w, id: p.id }); });

  const grp = (view) => Object.entries(groups[view]).map(([g, ws]) => `<g class="wg wg-${g}">${ws.map((w) => `<path d="${dstr(w.p)}" fill="none" stroke="${w.color}" stroke-opacity="${w.op}" stroke-width="${w.w}" stroke-linecap="round"${w.dash ? ` stroke-dasharray="${w.dash}"` : ''}/>`).join('')}</g>`).join('');

  /* ---- html for nodes ---- */
  const toggle = (c) => `<span class="hb-tg" style="display:inline-block;width:26px;height:13px;border-radius:99px;background:${c};position:relative;vertical-align:middle;flex:none"><i style="position:absolute;right:2px;top:2px;width:9px;height:9px;border-radius:50%;background:#0A0A0D"></i></span>`;
  const chip = (t, hi) => `<span style="display:inline-block;padding:0 5px;border-radius:3px;font:600 9px/15px ${MONO};background:${hi ? rgba('#F59E2B', 0.18) : '#16161B'};color:${hi ? '#F59E2B' : '#C9C9D1'};border:1px solid ${hi ? '#F59E2B' : G.line};margin:0 4px 3px 0;white-space:nowrap">${t}</span>`;
  const lab = (t) => `<div style="font:500 8.5px ${MONO};color:${G.dim};margin:4px 0 2px">${t}</div>`;
  const two = (a, b, fa, fb) => `<span style="display:flex;flex-direction:column;line-height:1.18;min-width:0"><b style="font:${fa}">${a}</b><i style="font:${fb};font-style:normal">${b}</i></span>`;
  const nodeHtml = (n) => {
    const c = SYS[n.sys].color, pos = `position:absolute;left:${f1(n.x)}px;top:${f1(n.y)}px;width:${n.w}px;height:${n.h}px`;
    const data = `class="hb-node hb-${n.kind}" data-node="${n.id}" data-sys="${n.sys}"`;
    if (n.kind === 'in') return `<div ${data} style="${pos};padding:0 9px;border-radius:4px;background:${G.cream};color:#2A2118;display:flex;align-items:center">${two(n.label, n.sub, `700 11px ${SANS}`, `500 8.5px ${MONO};color:#7A6650`)}</div>` + ring(n.x + n.w + 8, n.y + n.h / 2, '#EDEDED');
    if (n.kind === 'card') {
      const t = n.t, st = SYS[n.sys].status;
      return `<div ${data} style="${pos};border-radius:10px;background:rgba(12,12,14,.84);border:1px solid ${c};overflow:hidden"><div class="hb-cc" style="position:absolute;inset:0;padding:9px 12px 0">
<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><div><b style="font:700 13.5px ${SANS};color:#fff">${n.label}</b><div style="font:500 8.5px ${MONO};color:${G.dim};margin-top:1px">${n.sub}</div></div>${icon(t[3], c, 30)}</div>
<div style="display:flex;align-items:center;gap:7px;margin-top:3px;font:600 10px ${SANS};color:#EDEDED">${toggle(STATUS[st])}<span style="color:${STATUS[st]}">${st}</span></div>
<div style="display:flex;gap:10px;margin-top:2px"><div style="flex:1;min-width:0">${lab('capabilities')}<div>${t[5].map((x) => chip(x)).join('')}${chip(t[6], true)}</div></div>
<div style="width:92px;flex:none">${lab('works with')}<div>${t[7].slice(0, 2).map((x) => chip(x)).join('')}</div>${lab('connects to')}<div style="font:500 9.5px/1.45 ${SANS};color:#C9C9D1">${t[8].map((x) => `• ${x}`).join('<br>')}</div></div></div>
<span style="position:absolute;right:11px;bottom:7px;font:600 9px ${MONO};color:${G.mute}">+ connect</span></div><div class="hb-pend" style="position:absolute;inset:0;padding:13px 14px;opacity:0;pointer-events:none"><div style="display:flex;align-items:center;gap:7px;font:500 10px ${MONO};color:#6B6B73"><i style="width:7px;height:7px;border-radius:50%;background:${c};display:inline-block"></i>slot ${String(n.slot).padStart(2, '0')} · pending</div>${[62, 88, 48, 76, 40].map((w) => `<i style="display:block;height:7px;width:${w}%;border-radius:4px;background:#1B1B20;margin-top:11px"></i>`).join('')}</div></div>` + ring(n.x - 8, n.y + n.h / 2, c);
    }
    if (n.kind === 'pill') return `<div ${data} style="${pos};padding:0 8px 0 7px;border-radius:99px;background:rgba(10,10,13,.84);border:1.5px solid ${c};display:flex;align-items:center;gap:8px;white-space:nowrap">${icon(n.t[3], c, n.h > 36 ? 24 : 22)}${two(n.label, n.sub, `600 ${n.h > 36 ? 12 : 11.5}px ${SANS};color:#F2F2F2`, `500 8.5px ${MONO};color:${G.dim}`)}</div>` + ring(n.x - 8, n.y + n.h / 2, c);
    if (n.kind === 'tag' || n.kind === 'inc') return `<div ${data} data-base="#F2F2F2" style="${pos};padding:0 6px 0 7px;border-radius:4px;background:rgba(242,242,242,.86);border-left:3px solid ${c};display:flex;align-items:center;overflow:hidden;white-space:nowrap">${two(n.label, n.sub, `700 10px ${SANS};color:#0B0B0E`, `500 8.5px ${MONO};color:#6B7280`)}</div>` + ring(n.x - 8, n.y + n.h / 2, c);
    if (n.kind === 'row') return `<div ${data} style="${pos};padding:0 11px;border-radius:7px;background:rgba(91,227,160,.06);border:1px solid rgba(91,227,160,.3);display:flex;align-items:center">${two(n.label, n.sub, `600 11.5px ${SANS};color:#EAF7F0`, `500 8.5px ${MONO};color:#6F8C7E`)}</div>` + ring(n.x - 8, n.y + n.h / 2, c);
    return '';
  };
  const htmlOf = (view) => Object.values(nodes).filter((n) => n.view === view && n.kind !== 'bot').map(nodeHtml).join('');
  const viewWrap = (name, inner, svg, live) => `<div class="hb-view" data-view="${name}" style="position:absolute;inset:0;pointer-events:none;${name === 'A' ? '' : 'display:none;'}"><svg viewBox="0 0 1400 980" width="1400" height="980" style="position:absolute;left:0;top:0" aria-hidden="true">${svg}<g id="${live}"></g></svg>${inner}</div>`;

  // the header of each row in view B (the big band behind each row was removed on request)
  const lanes = SYSLIST.map((s, i) => {
    const top = L0 + i * LH, S = SYS[s];
    return `<div data-sys="${s}" style="position:absolute;left:490px;top:${top + 6}px;display:flex;align-items:center;gap:8px;font:700 11px ${SANS};color:${S.color};white-space:nowrap"><span style="font:600 9.5px ${MONO};color:${G.dim}">0${i + 1}</span>${S.name}<i style="display:inline-flex;align-items:center;gap:5px;font:500 9.5px ${MONO};color:${G.mute};font-style:normal"><b style="width:6px;height:6px;border-radius:50%;background:${STATUS[S.status]};display:inline-block"></b>${S.status}</i></div>`;
  }).join('');
  const caps = [['What the tools are', PX], ['What happens', C[0]], ['Sent to the teacher', C[2]]].map(([t, x]) => `<div style="position:absolute;left:${x}px;top:114px;font:500 10.5px ${SANS};color:${G.mute}">${t}</div>`).join('');
  const dc = SYS.dash.color;
  const dashPanel = `<div data-sys="dash" style="position:absolute;left:${DP.x}px;top:${DP.y}px;width:${DP.w}px;height:${DP.h}px;border-radius:10px;background:#0A0F0C;border:1px solid ${dc};box-shadow:0 0 34px ${rgba(dc, 0.2)}, inset 0 0 28px ${rgba(dc, 0.07)}"><div style="padding:14px 15px 0"><b style="font:700 14.5px ${SANS};color:#fff">Teacher dashboard</b><div style="font:500 9.5px ${MONO};color:${G.mute};margin-top:2px">everything in one place</div></div><div style="position:absolute;left:15px;bottom:11px;right:15px;font:500 10px ${MONO};color:#6F8C7E">the teacher decides what to do next</div></div>`;
  const viewB = viewWrap('B', caps + lanes + dashPanel + htmlOf('B'), grp('B'), 'hbLiveB');

  // view C
  const gc = SYS.dash.color;
  const pillsHtml = pillsC.map((p) => `<div style="position:absolute;left:${p.x}px;top:${p.y}px;width:${p.w}px;height:${p.h}px;padding:0 8px 0 7px;border-radius:99px;background:rgba(10,10,13,.84);border:1.5px solid ${SYS[p.sys].color};box-shadow:0 0 14px ${SYS[p.sys].color}33;display:flex;align-items:center;gap:8px;white-space:nowrap;opacity:.85">${icon(p.t[3], SYS[p.sys].color, 22)}<b style="font:600 11.5px ${SANS};color:#F2F2F2">${p.label}</b></div>${ring(p.x - 8, p.y + p.h / 2, SYS[p.sys].color)}`).join('');
  const diff = (x, y, name, color, rm, adds) => `<div class="hb-diff" style="position:absolute;left:${x}px;top:${y}px;width:302px;height:112px;padding:10px 12px;border-radius:8px;background:#0B0F1C;border:1px solid #1F2A44;font:500 11.5px/1.5 ${SANS}"><div style="display:flex;justify-content:space-between;color:#CBD5E1;font-weight:700"><span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${color};margin-right:8px"></i>${name}</span><span style="color:${gc}">✓</span></div><div style="margin-top:4px;color:#FF7A70;text-decoration:line-through;background:rgba(240,69,58,.12);padding:0 6px">− ${rm}</div>${adds.map((a) => `<div style="color:#7BE0B0;padding:0 6px">+ ${a}</div>`).join('')}</div>`;
  const sstat = (n, label, c) => `<span style="font:500 16px ${SANS};color:#B9C0D0"><b style="color:${c};font-weight:700">${n}</b> ${label}</span>`;
  const checkHtml = `<svg viewBox="0 0 1400 980" width="1400" height="980" style="position:absolute;left:0;top:0;pointer-events:none" aria-hidden="true"><circle cx="${chk.x}" cy="${chk.y}" r="62" fill="${gc}" fill-opacity=".08"/><circle cx="${chk.x}" cy="${chk.y}" r="${chk.r}" fill="#07130E" stroke="${gc}" stroke-width="2.5"/><path id="hbCheck" d="M${chk.x - 15} ${chk.y + 1} L${chk.x - 4} ${chk.y + 12} L${chk.x + 16} ${chk.y - 12}" stroke="${gc}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="60" stroke-dashoffset="0"/></svg>`;
  const viewC = viewWrap('C', pillsHtml + checkHtml
    + `<div style="position:absolute;left:${chk.x - 90}px;top:${chk.y + 58}px;width:180px;text-align:center"><b style="font:700 11px ${MONO};color:${gc}">all in one place</b><div style="font:500 10px ${SANS};color:${G.mute};margin-top:2px">5 systems, 1 dashboard</div></div>`
    + `<div style="position:absolute;left:770px;top:322px;width:618px;height:142px;padding:16px 22px;border-radius:10px;background:#0E1424;border:1px solid #223055;display:flex;flex-direction:column;justify-content:center;gap:8px"><div style="font:600 10.5px ${MONO};color:#8FA0C8"><span style="color:${gc}">●</span> what the teacher sees after the lesson · demo data</div><div style="font:700 48px/1 ${SANS};letter-spacing:-0.03em;color:#fff"><span id="hbBig">72</span><span style="font-size:30px">%</span> <span style="font-size:24px;color:#8FA0C8;font-weight:500">of answers correct</span></div><div style="display:flex;gap:24px;flex-wrap:wrap">${sstat(7, 'students need extra support', '#F59E2B')}${sstat(3, 'topics to explain again', '#4F8BFF')}${sstat(1, 'student absent', '#F0453A')}</div></div>`
    + diff(770, 484, 'AI classroom', SYS.cls.color, 'write every question by hand', ['AI drafts the questions', 'teacher edits, approves, launches by QR'])
    + diff(1086, 484, 'Classroom games', SYS.game.color, 'build a new game every lesson', ['pick a ready-made game', 'add the lesson’s questions'])
    + diff(770, 608, 'Homework helper', SYS.hw.color, 'stuck at home, nobody knows', ['a hint, never the answer', 'the teacher sees who is stuck'])
    + diff(1086, 608, 'Personal AI tutor', SYS.tutor.color, 'one explanation for all 28 students', ['a private explanation for each', 'the teacher still teaches the class'])
    + diff(770, 732, 'Smart attendance', SYS.att.color, 'count heads by hand', ['the camera counts, never faces', 'the teacher confirms the list'])
    + diff(1086, 732, 'Teacher dashboard', SYS.dash.color, 'check five tools one by one', ['one place shows who needs help', 'topics to explain again'])
    , grp('C'), 'hbLiveC');
  const viewA = viewWrap('A', htmlOf('A'), grp('A'), 'hbLiveA');

  /* ---- the left side: top bar, inputs, panels, log ---- */
  const li = (sys, t) => `<div style="display:flex;gap:8px;align-items:flex-start;font:500 11px/1.3 ${SANS};color:#D7DAE0;margin-top:6px"><i style="flex:none;width:6px;height:6px;margin-top:5px;border-radius:50%;background:${SYS[sys].color};display:inline-block"></i><span>${t}</span></div>`;
  const panel = (id, c, title, sub, tog, accent, body) => `<div class="hb-card" data-card="${id}" style="position:absolute;left:${c.x}px;top:${c.y}px;width:${c.w}px;height:${c.h}px;padding:14px 15px;border-radius:10px;background:rgba(12,12,14,.84);border:1px solid ${accent};box-shadow:0 0 30px ${rgba(accent, 0.18)}, inset 0 0 26px ${rgba(accent, 0.07)}">
<div style="display:flex;justify-content:space-between;align-items:flex-start"><div><b style="font:700 14.5px ${SANS};color:#fff">${title}</b><div style="font:500 9.5px ${MONO};color:${G.mute};margin-top:2px">${sub}</div></div><span style="width:20px;height:20px;border-radius:50%;background:${accent};display:flex;align-items:center;justify-content:center"><i style="width:2px;height:8px;background:#0A0A0D;margin-right:2px;display:block"></i><i style="width:2px;height:8px;background:#0A0A0D;display:block"></i></span></div>
<div style="margin-top:8px;display:flex;align-items:center;gap:8px;font:600 11px ${SANS};color:#EDEDED">${toggle(accent)}${tog}</div>${body}</div>`;
  const panels = panel('a', CA, 'What the AI does', 'prepares and explains', 'AI helper', '#F59E2B',
      li('cls', 'Creates quiz questions') + li('game', 'Adds questions to games') + li('hw', 'Finds where students struggle') + li('hw', 'Gives hints, not answers') + li('tutor', 'Explains by grade, in Uzbek or Russian') + li('att', 'Counts students in a photo'))
    + panel('b', CB, 'What people and rules do', 'the teacher stays in charge', 'Teacher in charge', '#F0453A',
      li('cls', 'Teacher approves every quiz') + li('cls', 'A QR code lets students join') + li('cls', 'Fixed rules mark answers') + li('game', 'The game engine runs the play') + li('att', 'Teacher confirms attendance') + li('att', 'The camera counts, never identifies') + li('dash', 'The dashboard collects it all'))
    + ring(CA.x, CA.y + CA.h / 2, '#EDEDED') + ring(CB.x, CB.y + CB.h / 2, '#EDEDED') + ring(CA.x + CA.w, CA.y + CA.h / 2, '#F59E2B') + ring(CB.x + CB.w, CB.y + CB.h / 2, '#F0453A');
  const statN = (n, label, color) => `<div style="display:flex;flex-direction:column;align-items:flex-end;line-height:1"><b data-count="${parseInt(n, 10)}" data-suffix="${String(n).endsWith('%') ? '%' : ''}" style="font:700 20px ${SANS};color:${color};font-variant-numeric:tabular-nums">${n}</b><span style="margin-top:4px;font:500 10px ${SANS};color:${G.dim}">${label}</span></div>`;
  const legend = [['working', STATUS.working], ['simulated', STATUS.simulated], ['planned', STATUS.planned]].map(([t, c]) => `<span style="display:flex;align-items:center;gap:5px;font:500 10.5px ${MONO};color:${G.mute}"><i style="width:7px;height:7px;border-radius:50%;background:${c};display:inline-block"></i>${t}</span>`).join('');
  const tabs = [['A', 'Systems'], ['B', 'Live flow'], ['C', 'Results']].map(([k, t]) => `<button type="button" class="hb-tab${k === 'A' ? ' on' : ''}" data-tab="${k}" role="tab" aria-selected="${k === 'A'}">${t}</button>`).join('');
  const top = `<div style="position:absolute;left:0;top:0;width:1400px;height:44px;padding:0 20px;border-bottom:1px solid ${G.line};display:flex;align-items:center;justify-content:space-between;z-index:5">
<div style="display:flex;align-items:center;gap:22px"><div style="display:flex;align-items:center;gap:9px"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#fff"/><ellipse cx="8.8" cy="11.5" rx="1.6" ry="2.6" fill="#0A0A0D"/><ellipse cx="15.2" cy="11.5" rx="1.6" ry="2.6" fill="#0A0A0D"/></svg><b style="font:700 12.5px ${SANS};color:#fff">Zukko</b></div><div role="tablist" aria-label="Views" style="display:flex;gap:22px">${tabs}</div></div>
<div style="display:flex;align-items:center;gap:18px">${legend}<span style="display:flex;align-items:center;gap:6px;font:700 10.5px ${MONO};color:#F0453A"><i class="hb-live" style="width:6px;height:6px;border-radius:50%;background:#F0453A;display:inline-block"></i>demo data</span></div></div>
<div style="position:absolute;left:0;top:44px;width:1400px;height:60px;padding:0 20px;display:flex;align-items:center;justify-content:space-between"><div style="display:flex;align-items:center;gap:10px;font:500 24px ${SANS};color:${G.mute}">class 6-B /<b style="font-weight:700;color:#fff">today’s lesson</b><i style="width:10px;height:10px;border-radius:50%;border:2px solid #F59E2B;display:inline-block"></i></div><div style="display:flex;gap:44px">${statN('28', 'active students', '#fff')}${statN('3', 'live activities', '#F59E2B')}${statN('24', 'quizzes completed', '#fff')}${statN('72%', 'answers correct', dc)}</div></div>`;
  const logRow = (time, sys, msg, id, dim) => `<div class="hb-log" style="display:flex;align-items:center;gap:16px;font:500 11.5px ${MONO};opacity:${dim};white-space:nowrap"><span style="color:${G.dim}">${time}</span><span style="min-width:96px;color:${SYS[sys].color};font-weight:700">${SYS[sys].log}</span><span style="flex:1;color:#B9B9C2;font-family:${SANS};font-size:12px">${msg}</span><span style="color:${G.dim};font-size:10px">${id}</span></div>`;
  const log = `<div id="hbLog" style="position:absolute;left:20px;right:20px;top:884px;display:flex;flex-direction:column;gap:8px">${logRow('12:08:17.04', 'cls', 'AI created 12 quiz questions.', 'quiz.generate', 0.5)}${logRow('12:08:17.21', 'cls', 'Teacher approved the quiz.', 'teacher.approve', 0.75)}${logRow('12:08:18.03', 'cls', 'Quiz started. Students scan the QR code.', 'qr.generate', 1)}</div>`;

  const main = `<div class="hb-main" style="position:relative;width:1400px;height:980px;border-radius:14px;overflow:hidden;background:${G.bg};border:1px solid ${G.line}">
<div style="position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:48px 48px"></div>
<svg viewBox="0 0 1400 980" width="1400" height="980" style="position:absolute;left:0;top:0;pointer-events:none" aria-hidden="true">${grp('L')}${botFace(bot.x, bot.y, bot.r)}<g id="hbLiveL"></g></svg>
${top}${INPUTS.map((_, i) => nodeHtml(nodes[`in.${i}`])).join('')}${labels.join('')}<div style="position:absolute;left:${bot.x - 70}px;top:${bot.y + 56}px;width:140px;text-align:center"><b style="font:700 13px ${SANS};color:#EDEDED">Zukko</b><div style="font:500 10px ${SANS};color:${G.mute}">the AI at the centre</div></div>${panels}${viewA}${viewB}${viewC}${log}</div>`;
  return { html: main, W: 1400, H: 980, wires, nodes, link, ref, bot, chk, panelPath, panelThrough, adj, entries, cWires };
}

/* ---------------- the phone stage ---------------- */
function phone() {
  const W = 350, H = 860;
  const bot = { x: 175, y: 188, r: 34 };
  const ins = [['cls', 'Teacher’s lesson', 55], ['tutor', 'Student’s question', 175], ['att', 'Classroom camera', 295]];
  const PN = [['cls', 'AI classroom', 'star'], ['game', 'Classroom games', 'ghost'], ['hw', 'Homework helper', 'heart'], ['tutor', 'Personal AI tutor', 'tri'], ['att', 'Smart attendance', 'hexa'], ['dash', 'Teacher dashboard', 'pill']];
  const PXs = [0, 182], PWm = 168, PYs = (r) => 292 + r * 50;
  const TAGS = [['cls', 'AI creates questions', 'quiz.generate'], ['cls', 'Teacher approves quiz', 'teacher.approve'], ['game', 'Teacher picks a game', 'game.select'], ['hw', 'AI hints, not answers', 'hint.generate'], ['tutor', 'AI explains by grade', 'explanation.generate'], ['att', 'Counts, never faces', 'no face recognition'], ['att', 'Teacher confirms list', 'teacher.confirm'], ['dash', 'Who needs help', 'intervention.recommend']];
  const TXs = [14, 186], TWm = 150, TYs = (r) => 484 + r * 40;
  const wires = [];
  const add = (p, color, op, w, o = {}) => wires.push({ p, color, op, w, ...o });
  ins.forEach(([s, , x]) => add([x, 30, x, 100, bot.x, 110, bot.x, bot.y - bot.r - 6], SYS[s].color, 0.7, 1.2, { n: 1 }));
  PN.forEach(([s], i) => { const px = PXs[i % 2] + PWm / 2, py = PYs(Math.floor(i / 2)); add([bot.x, bot.y + bot.r + 6, bot.x, 252, px, 262, px, py - 18], SYS[s].color, 0.6, 1.2, { n: 1 }); });
  TAGS.forEach(([s], k) => { const c = k % 2, r = Math.floor(k / 2), pi = PN.findIndex((p) => p[0] === s), px = PXs[pi % 2] + PWm / 2, py = PYs(Math.floor(pi / 2)); add([px, py + 18, px, py + 40, TXs[c] + 6, 470, TXs[c] + 6, TYs(r)], SYS[s].color, 0.45, 1); });
  const ws = wires.map((w) => `<path d="${dstr(w.p)}" fill="none" stroke="${w.color}" stroke-opacity="${w.op}" stroke-width="${w.w}" stroke-linecap="round"/>`).join('');
  const inHtml = ins.map(([, t, x]) => `<span style="position:absolute;left:${x - 52}px;top:4px;width:104px;height:26px;display:flex;align-items:center;justify-content:center;border-radius:3px;background:${G.cream};color:#2A2118;font:700 10.5px ${SANS}">${t}</span>`).join('');
  const pills = PN.map(([s, t, g], i) => `<div class="hb-pill" data-pill="${i}" data-sys="${s}" style="position:absolute;left:${PXs[i % 2]}px;top:${PYs(Math.floor(i / 2)) - 18}px;width:${PWm}px;height:36px;padding:0 8px 0 6px;border-radius:99px;background:rgba(10,10,13,.84);border:1.5px solid ${SYS[s].color};box-shadow:0 0 14px ${SYS[s].color}33;display:flex;align-items:center;gap:7px;font:600 11.5px ${SANS};color:#F2F2F2;white-space:nowrap">${icon(g, SYS[s].color, 22)}${t}</div>`).join('');
  const tags = TAGS.map(([s, t, id], k) => `<div style="position:absolute;left:${TXs[k % 2]}px;top:${TYs(Math.floor(k / 2)) - 17}px;width:${TWm}px;height:34px;padding:0 8px;border-radius:4px;background:rgba(242,242,242,.86);border-left:3px solid ${SYS[s].color};display:flex;flex-direction:column;justify-content:center;line-height:1.15;overflow:hidden;white-space:nowrap"><b style="font:700 10.5px ${SANS};color:#0B0B0E">${t}</b><i style="font:500 8.5px ${MONO};color:#6B7280;font-style:normal">${id}</i></div>${ring(TXs[k % 2] - 8, TYs(Math.floor(k / 2)), SYS[s].color)}`).join('');
  const logRow = (sys, msg) => `<div style="display:flex;gap:8px;font:500 11px ${SANS};white-space:nowrap"><span style="color:${SYS[sys].color};font-weight:700;min-width:72px;font-family:${MONO};font-size:10px">${SYS[sys].log}</span><span style="flex:1;color:#B9B9C2;overflow:hidden;text-overflow:ellipsis">${msg}</span></div>`;
  const html = `<div style="position:relative;width:${W}px;height:${H}px">
<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="position:absolute;left:0;top:0" aria-hidden="true">${ws}${botFace(bot.x, bot.y, bot.r)}<g id="hbLive2"></g></svg>
${inHtml}
<div style="position:absolute;left:${bot.x - 70}px;top:${bot.y + 46}px;width:140px;text-align:center"><b style="font:700 13px ${SANS};color:#EDEDED">Zukko</b><div style="font:500 10px ${SANS};color:${G.mute}">the AI at the centre</div></div>
${pills}${tags}
<div style="position:absolute;left:0;top:668px;width:350px;display:flex;flex-direction:column;gap:7px">${logRow('cls', 'AI created 12 quiz questions.')}${logRow('cls', '24 students joined the quiz.')}${logRow('dash', '7 students need additional support.')}</div>
<div style="position:absolute;left:0;top:742px;width:350px;padding:16px 18px;border-radius:10px;background:#0E1424;border:1px solid #223055;display:flex;align-items:center;gap:16px"><svg viewBox="0 0 60 60" width="56" height="56" style="flex:none" aria-hidden="true"><circle cx="30" cy="30" r="27" fill="#07130E" stroke="${SYS.dash.color}" stroke-width="2.5"/><path d="M17 31 L26 40 L43 20" stroke="${SYS.dash.color}" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg><div><div style="font:600 10px ${MONO};color:#8FA0C8">what the teacher sees · demo data</div><div style="font:700 30px/1.1 ${SANS};color:#fff;margin-top:2px">72% <span style="font-size:15px;color:#8FA0C8;font-weight:500">of answers correct</span></div><div style="font:500 13px ${SANS};color:#B9C0D0"><b style="color:#F59E0B">7</b> students need extra support</div></div></div>
</div>`;
  return { html, W, H, wires, PC: PN.map((p) => SYS[p[0]].color) };
}

/* ---------------- the engine ---------------- */
export function createHub(root, rootM, { reduced }) {
  const D = desktop(), M = phone();
  const make = (el, S) => { el.innerHTML = `<div class="scaler" style="width:${S.W}px;height:${S.H}px">${S.html}</div>`; return el.firstElementChild; };
  const sD = make(root, D), sM = make(rootM, M);
  const NS = 'http://www.w3.org/2000/svg';
  const $ = (s, r = root) => r.querySelector(s);
  const $$ = (s, r = root) => [...r.querySelectorAll(s)];
  const lives = { L: $('#hbLiveL'), A: $('#hbLiveA'), B: $('#hbLiveB'), C: $('#hbLiveC') }, live2 = rootM.querySelector('#hbLive2');
  const views = Object.fromEntries($$('.hb-view').map((e) => [e.dataset.view, e]));

  const fit = () => {
    const wD = root.parentElement.clientWidth - 40;
    const kD = Math.min(1, wD / D.W); sD.style.transform = `scale(${kD})`; root.style.height = `${D.H * kD}px`;
    const kM = Math.min(1.25, wD / M.W); sM.style.transform = `scale(${kM})`; rootM.style.height = `${M.H * kM}px`; rootM.style.width = `${M.W * kM}px`; rootM.style.margin = '0 auto';
  };
  fit();

  /* light that keeps moving along every wire that has one */
  const mkDot = (g, color) => { const e = document.createElementNS(NS, 'g'); e.innerHTML = `<circle r="2.8" fill="${color}"/><circle r="1.1" fill="#fff"/>`; g.appendChild(e); return e; };
  const ambient = [];
  const seed = rand(5);
  /* the three desktop views have no background dots: every dot you see is a real request, all at the same speed */
  M.wires.forEach((w) => { for (let k = 0; k < (w.n || 0); k++) ambient.push({ w, view: 'M', e: mkDot(live2, w.color), t: seed(), len: plen(w.p) || 1 }); });
  const place = (a) => { const [x, y] = along(a.w.p, a.t); a.e.setAttribute('transform', `translate(${f1(x)} ${f1(y)})`); };
  ambient.forEach(place);
  let view = 'A';
  let running = false, last = 0;
  const loop = (now) => {
    if (!running) return;
    const dt = Math.min(0.25, (now - last) / 1000); last = now;
    for (const a of ambient) { if (a.view !== 'L' && a.view !== 'M' && a.view !== view) continue; a.t += (AMB / a.len) * dt; if (a.t > 1) a.t -= 1; place(a); }
    eyeTick(now / 1000);
    requestAnimationFrame(loop);
  };
  const fire = (g, p, color) => {
    const dur = travel(p);
    const e = mkDot(g, color);
    e.firstElementChild.setAttribute('r', '12'); e.children[1].setAttribute('r', '4'); e.children[2].setAttribute('r', '1.6');
    const o = { t: 0 };
    gsap.to(o, { t: 1, duration: dur, ease: 'none', onUpdate: () => { const [x, y] = along(p, o.t); e.setAttribute('transform', `translate(${f1(x)} ${f1(y)})`); }, onComplete: () => e.remove() });
  };

  const eyes = $('.hb-eyes'), halo = $('.hb-halo');
  const logEl = $('#hbLog');
  const N = D.nodes, el = {};
  $$('[data-node]').forEach((e) => { el[e.dataset.node] = e; });
  let clock = 19.2, alive = false, si = 0;
  const calls = [];
  const later = (t, fn) => { const c = gsap.delayedCall(t, () => { const i = calls.indexOf(c); if (i >= 0) calls.splice(i, 1); fn(); }); calls.push(c); return c; };

  const pushLog = (sys, text, id) => {
    clock += 0.35 + Math.random() * 0.9; if (clock > 59) clock = 5;
    const t = `12:08:${clock.toFixed(2).padStart(5, '0')}`;
    const row = document.createElement('div');
    row.className = 'hb-log';
    row.style.cssText = `display:flex;align-items:center;gap:16px;font:500 11.5px ${MONO};white-space:nowrap;opacity:0`;
    row.innerHTML = `<span style="color:${G.dim}">${t}</span><span style="min-width:96px;color:${SYS[sys].color};font-weight:700">${SYS[sys].log}</span><span style="flex:1;color:#B9B9C2;font-family:${SANS};font-size:12px">${text}</span><span style="color:${G.dim};font-size:10px">${id}</span>`;
    logEl.appendChild(row);
    if (logEl.children.length > 3) logEl.firstElementChild.remove();
    gsap.to(row, { opacity: 1, duration: 0.4 });
    [...logEl.children].forEach((r, k, a) => { if (r !== row) gsap.to(r, { opacity: [0.5, 0.75, 1][k + (3 - a.length)], duration: 0.3 }); });
  };
  const unfocus = () => $$('[data-sys], .wg').forEach((e) => gsap.to(e, { opacity: 1, duration: 0.5, overwrite: 'auto' }));

  /* requests leave Zukko as a string of dots along the wire, not as text */
  const sendDots = (g, p, color, _d, done) => {
    const dur = travel(p);
    for (let k = 0; k < 4; k++) {
      const e = document.createElementNS(NS, 'g');
      e.innerHTML = `<circle r="${k ? 2.1 : 3.2}" fill="${color}"/>${k ? '' : '<circle r="1.3" fill="#fff"/>'}`;
      e.setAttribute('transform', `translate(${f1(p[0])} ${f1(p[1])})`);
      g.appendChild(e); gsap.set(e, { opacity: 0 });
      gsap.to(e, { opacity: 1 - k * 0.15, duration: 0.1, delay: k * 0.075 });
      const o = { t: 0 };
      gsap.to(o, { t: 1, duration: dur, delay: k * 0.075, ease: 'none', onUpdate: () => { const [x, y] = along(p, o.t); e.setAttribute('transform', `translate(${f1(x)} ${f1(y)})`); }, onComplete: () => { e.remove(); if (k === 0 && done) done(); } });
    }
  };

  /* the eyes: every little character keeps looking around, blinking, smiling and thinking */
  const eyeList = [];
  [...root.querySelectorAll('.ey'), ...rootM.querySelectorAll('.ey')].forEach((ey) => eyeList.push({ ey, sh: ey.closest('.hb-eyes') ? ey.closest('.hb-face') : ey.closest('svg'), big: !!ey.closest('.hb-eyes'), eh: ey.parentNode.querySelector(':scope > .eh'), ed: ey.parentNode.querySelector(':scope > .ed'), amp: ey.closest('.hb-eyes') ? 4 : 1.7, next: Math.random() * 2 }));
  /* every character (Zukko too) changes mood on its own timing: look left, look right, stare, smile, think, blink */
  const MODES = [['left', 2], ['right', 2], ['stare', 2], ['smile', 1.5], ['think', 1.5], ['blink', 0.7]];
  const pickMode = (last) => {
    const pool = MODES.filter(([m]) => m !== last);
    let r = Math.random() * pool.reduce((t, [, w]) => t + w, 0);
    for (const [m, w] of pool) { r -= w; if (r <= 0) return m; }
    return pool[0][0];
  };
  const setMode = (o, mode) => {
    gsap.killTweensOf([o.ey, o.eh, o.ed].filter(Boolean));
    if (o.ed) gsap.killTweensOf(o.ed.children);
    gsap.set(o.ey, { opacity: 1, scale: 1 });
    if (o.eh) gsap.set(o.eh, { opacity: 0 });
    if (o.ed) gsap.set(o.ed, { opacity: 0 });
    const center = (d = 0.2) => gsap.to(o.ey, { x: 0, y: 0, duration: d, ease: 'power2.out' });
    if (mode === 'left' || mode === 'right') {
      const x = mode === 'left' ? -1 : 1, y = [-1, 0, 0, 1][(Math.random() * 4) | 0];
      gsap.to(o.ey, { x: x * o.amp, y: y * o.amp * 0.8, duration: 0.25, ease: 'power2.out' });
      return 1.3 + Math.random() * 1.2;
    }
    if (mode === 'stare') {
      center(0.2);
      gsap.to(o.ey, { scale: 1.22, transformOrigin: '50% 50%', duration: 0.25, ease: 'power2.out' });
      return 1.8 + Math.random() * 1.2;
    }
    if (mode === 'smile' && o.eh) {
      center(0.1);
      if (o.sh) {
        const k = o.big ? 0.6 : 1, c = o.big ? o.sh.querySelector('circle') : null;
        gsap.fromTo(o.sh, { rotation: 0 }, { keyframes: [{ rotation: -13 * k, duration: 0.07 }, { rotation: 13 * k, duration: 0.08 }, { rotation: -9 * k, duration: 0.07 }, { rotation: 9 * k, duration: 0.07 }, { rotation: 0, duration: 0.07 }], ...(c ? { svgOrigin: c.getAttribute('cx') + ' ' + c.getAttribute('cy') } : { transformOrigin: '50% 50%' }), overwrite: false });
      }
      gsap.to(o.ey, { opacity: 0, duration: 0.08 }); gsap.to(o.eh, { opacity: 1, duration: 0.08 });
      gsap.to(o.ey, { opacity: 1, duration: 0.1, delay: 1.3 }); gsap.to(o.eh, { opacity: 0, duration: 0.1, delay: 1.3 });
      return 1.4;
    }
    if (mode === 'think' && o.ed) {
      center(0.1);
      gsap.to(o.ey, { opacity: 0, duration: 0.08 }); gsap.to(o.ed, { opacity: 1, duration: 0.08 });
      gsap.fromTo(o.ed.children, { y: 0, opacity: 0.3 }, { y: -o.amp * 1.1, opacity: 1, duration: 0.32, stagger: 0.17, yoyo: true, repeat: 5, ease: 'sine.inOut' });
      gsap.to(o.ed, { opacity: 0, duration: 0.1, delay: 2.6 }); gsap.to(o.ey, { opacity: 1, duration: 0.1, delay: 2.6 });
      return 2.8;
    }
    center(0.1);
    gsap.to(o.ey, { scaleY: 0.1, transformOrigin: '50% 50%', duration: 0.07, yoyo: true, repeat: 1 });
    return 0.35;
  };
  const eyeTick = (sec) => {
    for (const o of eyeList) {
      if (sec < o.next) continue;
      if (!o.ey.getClientRects().length) { o.next = sec + 1; continue; } /* hidden (the phone layout on a wide screen): leave it alone */
      const mode = pickMode(o.mode); o.mode = mode;
      o.next = sec + setMode(o, mode) + 0.1 + Math.random() * 0.5;
    }
  };

  /* the numbers count up the first time the hub is seen; the result view draws itself when it is opened */
  let counted = false;
  const countUp = () => {
    if (counted) return; counted = true;
    $$('[data-count]').forEach((b) => { const n = parseInt(b.dataset.count, 10), suf = b.dataset.suffix, o = { v: 0 }; gsap.to(o, { v: n, duration: 1.4, ease: 'power2.out', onUpdate: () => { b.textContent = Math.round(o.v) + suf; } }); });
  };
  const showDone = () => {
    const chk = $('#hbCheck'), big = $('#hbBig'), diffs = $$('.hb-diff');
    gsap.fromTo(chk, { strokeDashoffset: 60 }, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.out', delay: 0.3 });
    const o = { v: 0 }; gsap.to(o, { v: 72, duration: 1.4, ease: 'power2.out', onUpdate: () => { big.textContent = Math.round(o.v); } });
    gsap.from(diffs, { opacity: 0, y: 18, duration: 0.6, stagger: 0.1, ease: 'power3.out', delay: 0.4 });
  };

  /* requests you can see: a small chip rides along a wire */
  const sendChip = (g, p, text, color, _d, done) => {
    const dur = travel(p);
    const e = document.createElementNS(NS, 'g');
    const w = Math.round(text.length * 5.7 + 14);
    e.innerHTML = `<g transform="translate(-9 0)"><rect x="${-w}" y="-8" width="${w}" height="16" rx="3" fill="#C7D2E0" stroke="${color}" stroke-width="1"/><text x="${-w / 2}" y="3.5" text-anchor="middle" font-family="JetBrains Mono Variable, monospace" font-size="9.5" font-weight="600" fill="#0B0B0E">${text}</text></g><circle r="3.4" fill="#FFFFFF"/>`;
    g.appendChild(e); gsap.set(e, { opacity: 0 });
    const o = { t: 0 };
    gsap.to(o, { t: 1, duration: dur, ease: 'none', onUpdate: () => { const [x, y] = along(p, o.t); e.setAttribute('transform', `translate(${f1(x)} ${f1(y)})`); gsap.set(e, { opacity: Math.max(0, Math.min(1, o.t / 0.25, (0.82 - o.t) / 0.42)) }); }, onComplete: () => { e.remove(); if (done) done(); } });
  };
  const reqText = (id) => { const n = N[id]; return n.t ? REQ[id.split('.').pop()] || n.label : n.label; };
  const cardParts = (e) => ({ cc: e.querySelector('.hb-cc'), pend: e.querySelector('.hb-pend'), tg: e.querySelector('.hb-tg'), knob: e.querySelector('.hb-tg i'), icon: e.querySelector('svg') });
  const awake = new Set();
  const setPending = (id) => {
    awake.delete(id);
    const n = N[id], e = el[id]; if (!e) return;
    if (n.kind === 'card') { const p = cardParts(e); gsap.set(p.cc, { opacity: 0 }); gsap.set(p.pend, { opacity: 1 }); gsap.set(e, { borderColor: '#24242a', boxShadow: '0 0 0 rgba(0,0,0,0)' }); }
    else gsap.set(e, { opacity: 0.22, filter: 'grayscale(1)' });
  };
  const activate = (id) => {
    awake.add(id);
    const n = N[id], e = el[id]; if (!e) return;
    const c = SYS[n.sys].color;
    if (n.kind === 'card') {
      const p = cardParts(e);
      gsap.to(p.pend, { opacity: 0, duration: 0.35 }); gsap.to(p.cc, { opacity: 1, duration: 0.5, delay: 0.1 });
      gsap.to(e, { borderColor: c, duration: 0.5 });
      gsap.fromTo(p.icon, { scale: 0, rotation: -40, transformOrigin: '50% 50%' }, { scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(2.2)', delay: 0.15 });
      gsap.fromTo(p.knob, { x: -13 }, { x: 0, duration: 0.35, delay: 0.3 });
      gsap.fromTo(p.tg, { backgroundColor: '#2A2A30' }, { backgroundColor: STATUS[SYS[n.sys].status], duration: 0.35, delay: 0.3 });
    } else { gsap.to(e, { opacity: 1, filter: 'grayscale(0)', duration: 0.4 }); }
  };
  const ping = () => {}; /* a request arriving changes nothing on the box */
  const panelEls = $$('[data-card]'), inputEls = $$('.hb-in'), svgL = root.querySelector('svg');
  const leftWires = $$('.wg', svgL);
  const restoreLeft = () => { gsap.to(panelEls, { opacity: 1, duration: 0.4, overwrite: 'auto' }); gsap.to(inputEls, { opacity: 1, boxShadow: '0 0 0 rgba(0,0,0,0)', duration: 0.4, overwrite: 'auto' }); gsap.to(leftWires, { opacity: 1, duration: 0.4, overwrite: 'auto' }); };
  const botPulse = () => { gsap.to(eyes, { x: -3, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.inOut' }); };
  const introDone = { A: false, B: false };

  /* the opening: boxes start as pending slots; requests leave the inputs one by one, pass through Zukko and the two panels,
     hit the boxes one by one, and run on along the lines to the boxes they connect to */
  const intro = (v, done) => {
    const ids = Object.values(N).filter((n) => n.view === v).map((n) => n.id);
    ids.forEach(setPending);
    const total = {}, level = {};
    ids.forEach((id) => { total[N[id].sys] = (total[N[id].sys] || 0) + 1; });
    gsap.set($$('.wg', views[v]), { opacity: 0.12 });
    gsap.set(panelEls, { opacity: 0.2 }); gsap.set(inputEls, { opacity: 0.4 }); gsap.set(leftWires, { opacity: 0.18 });
    const wireUp = (sys) => { level[sys] = (level[sys] || 0) + 1; const g = views[v].querySelector(`.wg-${sys}`); if (g) gsap.to(g, { opacity: 0.12 + (0.88 * level[sys]) / total[sys], duration: 0.5 }); };
    const reserved = new Set(); INPUT_TO.forEach((_, i) => targetsOf(v, i).forEach((id) => reserved.add(id)));
    const seen = new Set(); let end = 0;
    const wakeAt = (id, from, dep) => {
      const n = N[id], p = from ? D.link(N[from], n) : D.panelPath(n.t ? WHO[n.t[4]] : 'b', n);
      seen.add(id); const arr = dep + travel(p); end = Math.max(end, arr);
      later(dep, () => sendDots(lives[v], p, SYS[n.sys].color, 0, () => { activate(id); wireUp(n.sys); }));
      return arr;
    };
    const spread = (root, t0) => { /* a woken box passes the request on along its lines, two steps, never into a box that another input feeds */
      let layer = [[root, t0]];
      for (let d = 0; d < 2; d++) {
        const next = [];
        layer.forEach(([id, arr]) => (D.adj[v][id] || []).forEach((to, q) => { if (seen.has(to) || !N[to] || reserved.has(to)) return; next.push([to, wakeAt(to, id, arr + 0.12 + q * 0.08)]); }));
        layer = next;
      }
    };
    INPUTS.forEach(([sys, , , text], i) => {
      const t0 = 0.3 + i * 0.55;
      later(t0, () => {
        gsap.to(inputEls[i], { opacity: 1, duration: 0.25 });
        const g = svgL.querySelector(`.wg-${sys}`); if (g) gsap.to(g, { opacity: 1, duration: 0.4 });
        sendChip(lives.L, D.ref.inb[i].p, text, SYS[sys].color, 0.85, botPulse);
      });
      targetsOf(v, i).forEach((id, k) => {
        const n = N[id], who = WHO[n.t[4]], bp = who === 'a' ? D.ref.botA.p : D.ref.botB.p, tp = t0 + travel(D.ref.inb[i].p) + k * 0.15, pt = D.panelThrough(who), tq = tp + travel(bp);
        later(tp, () => sendDots(lives.L, bp, '#EDEDED', 0, () => {
          gsap.to(panelEls[who === 'a' ? 0 : 1], { opacity: 1, duration: 0.5 });
          const w = svgL.querySelector('.wg-core'); if (w) gsap.to(w, { opacity: 1, duration: 0.4 });
        }));
        later(tq, () => sendDots(lives.L, pt, '#EDEDED', 0));
        spread(id, wakeAt(id, null, tq + travel(pt)));
      });
    });
    let tail = end + 0.2; /* boxes no input feeds directly (the dashboard) wake last, when the others report to them */
    ids.forEach((id) => { if (!seen.has(id)) { wakeAt(id, null, tail); tail += 0.15; } });
    later(0.3 + (INPUTS.length - 1) * 0.55 + 0.6, done); /* the steady stream starts now, and only goes to boxes that are already awake */
    later(end + 0.9, () => { restoreLeft(); introDone[v] = true; });
  };

  /* afterwards every box keeps receiving requests: a text chip comes in from an input, then dots leave Zukko, pass a panel,
     hit a box, and run on along its lines to the boxes it connects to */
  const toolIds = (v) => Object.values(N).filter((n) => n.view === v && n.t).map((n) => n.id);
  const targetsOf = (v, i) => toolIds(v).filter((id) => INPUT_TO[i].includes(id.split('.').pop()));
  let bag = []; const rot = {};
  const nextInput = () => { if (!bag.length) bag = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5); return bag.pop(); };
  const lastLog = { t: 0 };
  const logHit = (id, text) => {
    const now = performance.now(); if (now - lastLog.t < 1400) return; lastLog.t = now;
    const n = N[id]; pushLog(n.sys, LOGS[id] || `${n.label} got: ${text}.`, n.sub || '');
  };
  const cascade = (id, depth, vv) => {
    if (depth > 2) return;
    const kids = [...(D.adj[vv][id] || [])].sort(() => Math.random() - 0.5).slice(0, depth === 0 ? 2 : 1);
    kids.forEach((to) => later(0, () => {
      if (view !== vv || !alive) return;
      const a = N[id], b = N[to]; if (!b) return;
      sendDots(lives[vv], D.link(a, b), SYS[a.sys].color, 0.5, () => { if (view === vv) { ping(to); cascade(to, depth + 1, vv); } });
    }));
  };
  let loopTok = 0;
  const GAP = 0.32; /* one new request every 0.32 s, all the time */
  const wave = (tok) => {
    if (!alive || tok !== loopTok) return;
    const vv = view;
    if (vv === 'C') {
      const cw = D.cWires[Math.floor(Math.random() * D.cWires.length)];
      sendDots(lives.C, cw.w.p, SYS[N[cw.id].sys].color, 0.7);
      later(GAP, () => wave(tok)); return;
    }
    let i = -1, list = [];
    for (let tries = 0; tries < 6 && !list.length; tries++) { i = nextInput(); list = targetsOf(vv, i).filter((x) => awake.has(x)); }
    if (!list.length) { later(GAP, () => wave(tok)); return; }
    rot[i] = ((rot[i] || 0) + 1) % list.length;
    const id = list[rot[i]], n = N[id], c = SYS[n.sys].color, who = WHO[n.t[4]];
    sendChip(lives.L, D.ref.inb[i].p, INPUTS[i][3], SYS[INPUTS[i][0]].color, 0, () => {
      sendDots(lives.L, who === 'a' ? D.ref.botA.p : D.ref.botB.p, c, 0, () => sendDots(lives.L, D.panelThrough(who), c, 0, () => sendDots(lives[vv], D.panelPath(who, n), c, 0, () => {
        if (view !== vv) return;
        ping(id); logHit(id, reqText(id)); cascade(id, 0, vv);
      })));
    });
    later(GAP, () => wave(tok));
  };
  const startView = () => {
    if (reduced || !alive) return;
    const tok = ++loopTok;
    if (view === 'C') { wave(tok); return; }
    const begin = () => wave(tok);
    if (!introDone[view]) intro(view, begin); else begin();
  };

  /* the three buttons */
  const tabs = $$('.hb-tab');
  /* getting a view ready: every box is put back to its pending slot, the lines go faint, the left side dims */
  const killNode = (e) => gsap.killTweensOf([e, ...e.querySelectorAll('*')]);
  const prepareBoxes = (v) => {
    Object.values(N).filter((n) => n.view === v).forEach((n) => { const e = el[n.id]; if (e) killNode(e); setPending(n.id); });
    const wg = $$('.wg', views[v]); gsap.killTweensOf(wg); gsap.set(wg, { opacity: 0.12 });
  };
  const prepare = (v) => {
    if (v === 'C') { restoreLeft(); return; }
    prepareBoxes(v);
    gsap.to(panelEls, { opacity: 0.2, duration: 0.4, overwrite: 'auto' }); gsap.to(inputEls, { opacity: 0.4, boxShadow: '0 0 0 rgba(0,0,0,0)', duration: 0.4, overwrite: 'auto' }); gsap.to(leftWires, { opacity: 0.18, duration: 0.4, overwrite: 'auto' });
  };
  /* the way the boxes leave and arrive. Every box moves on its own: a box recedes (fades, shrinks, drifts up) and a new one
     comes out of the same distance (fades in, grows from smaller, settles down), one after another across the stage. */
  const AWAY = { y: -42, scale: 0.84 };
  const itemsOf = (v) => [...v.children].slice(1); // everything except the first child, which is the layer of lines
  const order = (items) => { // each box's place in the queue: left and top first
    const key = (e) => { const n = N[e.dataset && e.dataset.node]; return n ? n.x + n.y * 0.55 : (parseFloat(e.style.left) || 0) + (parseFloat(e.style.top) || 0) * 0.55; };
    const ks = items.map(key), rank = [];
    items.map((_, i) => i).sort((p, q) => ks[p] - ks[q]).forEach((i, k) => { rank[i] = k; });
    return rank;
  };
  const stepOf = (n) => Math.min(0.1, Math.max(0.03, 1.8 / n)); // seconds between one box and the next
  const hide = (v) => { v.style.display = 'none'; gsap.set([v.children[0], ...itemsOf(v)], { clearProps: 'opacity,transform' }); };
  const leave = (v, done) => {
    const items = itemsOf(v), r = order(items);
    gsap.to(v.children[0], { opacity: 0, duration: 0.35, ease: 'power1.in' });
    gsap.to(items, { opacity: 0, ...AWAY, duration: 0.42, ease: 'power2.in', stagger: (i) => r[i] * stepOf(items.length) * 0.45, onComplete: done });
  };
  const arrive = (v) => {
    const items = itemsOf(v), r = order(items);
    const rest = items.map((e) => { const n = N[e.dataset && e.dataset.node]; return n && n.view !== 'C' && n.kind !== 'card' ? 0.22 : 1; }); // a waiting box is faint until it wakes
    gsap.fromTo(v.children[0], { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 0.25, ease: 'power1.out' });
    gsap.fromTo(items, { opacity: 0, ...AWAY }, { opacity: (i) => rest[i], y: 0, scale: 1, duration: 0.62, ease: 'power3.out', stagger: (i) => r[i] * stepOf(items.length), clearProps: 'transform' });
  };
  const setView = (next) => {
    calls.splice(0).forEach((c) => c.kill());
    Object.values(views).forEach((v) => gsap.killTweensOf([v.children[0], ...itemsOf(v)]));
    const old = views[view], same = next === view;
    Object.values(views).forEach((v) => { if (v !== old && v !== views[next]) hide(v); });
    view = next; loopTok++; introDone[next] = false;
    tabs.forEach((t) => { const on = t.dataset.tab === next; t.classList.toggle('on', on); t.setAttribute('aria-selected', String(on)); });
    if (reduced) { if (!same) hide(old); views[next].style.display = 'block'; if (next === 'C') showDone(); return; }
    const reveal = () => {
      if (view !== next) return;
      views[next].style.display = 'block';
      prepare(next);
      arrive(views[next]);
      if (next === 'C') showDone();
      if (alive) later(0.8, startView);
    };
    leave(old, () => { if (same) reveal(); else if (views[view] !== old) hide(old); });
    if (!same) gsap.delayedCall(0.35, reveal);
  };
  tabs.forEach((t) => t.addEventListener('click', () => setView(t.dataset.tab)));

  /* every time the section is scrolled into view (after being away for a moment), everything arrives the same way: every box fades in and grows,
     one after another (the input chips, the two panels, Zukko and the lines too), then the opening plays */
  let entered = false, leftAt = 0;
  const firstEntry = () => {
    entered = true; introDone[view] = false; loopTok++; /* every time the section is entered it plays from the beginning */
    const v = views[view], C = view === 'C';
    gsap.killTweensOf([v.children[0], ...itemsOf(v)]); gsap.set([v.children[0], ...itemsOf(v)], { opacity: 0 }); // the boxes of the last visit go at once
    if (!C) prepareBoxes(view);
    const left = [...inputEls, ...panelEls];
    gsap.set(leftWires, { opacity: C ? 1 : 0.18 });
    gsap.fromTo(svgL, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: 'power1.out' });
    gsap.fromTo(left, { opacity: 0, ...AWAY }, { opacity: (i) => (C ? 1 : i < inputEls.length ? 0.4 : 0.2), y: 0, scale: 1, duration: 0.62, ease: 'power3.out', stagger: 0.08, clearProps: 'transform' });
    later(0.5, () => arrive(v));
    if (C) showDone();
    later(1.5, startView);
  };
  if (!reduced) { const v0 = views[view]; gsap.set([svgL, ...inputEls, ...panelEls, v0.children[0], ...itemsOf(v0)], { opacity: 0 }); } // nothing shows before the section is reached
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (e.target === root.parentElement) {
        if (e.isIntersecting) { if (!running) { running = true; last = performance.now(); requestAnimationFrame(loop); } countUp(); if (!reduced && !alive && getComputedStyle(root).display !== 'none') { alive = true; if (!entered || performance.now() - leftAt > 900) firstEntry(); else later(0.6, startView); } }
        else { running = false; alive = false; leftAt = performance.now(); calls.splice(0).forEach((c) => c.kill()); if (entered) { unfocus(); restoreLeft(); } /* before the first entry nothing may be shown yet */ }
      }
    });
  }, { threshold: 0.05 });
  if (reduced) countUp(); else io.observe(root.parentElement);

  /* phone stage: the six systems light up in turn */
  if (!reduced) {
    const pm = $$('.hb-pill', rootM);
    let k = 0;
    gsap.delayedCall(1, function cycle() {
      if (running) { const p = pm[k++ % pm.length], c = M.PC[(k - 1) % pm.length]; gsap.fromTo(p, { backgroundColor: '#0A0A0D' }, { backgroundColor: rgba(c, 0.28), duration: 0.2, yoyo: true, repeat: 1, repeatDelay: 0.5 }); }
      gsap.delayedCall(0.8, cycle);
    });
  }
  return { fit };
}
