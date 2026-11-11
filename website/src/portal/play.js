// The student page: type the game code and a first name, then answer on your own phone. No account, no password.
import '@fontsource-variable/onest';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import './portal.css';
import { api, ApiError, API, setToken } from './api.js';
import { tr } from './i18n.js';
import { $, LETTERS, animateLanes, esc, raceHtml, rich, secondsLeft, session, svgImg } from './ui.js';

setToken('');
const app = $('#app');
const COLORS = ['var(--c0)', 'var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)'];
const teamName = (t) => tr('team', { n: t + 1 });
const teamDot = (t) => (t === null || t === undefined ? '' : `<span style="color:${COLORS[t % 6]}">●</span> `);

const S = {
  view: 'boot', // boot | join | game
  code: '', pid: '', name: '', peek: null, peekError: '', team: null, nameInput: '', codeInput: '',
  st: null, menu: false, offset: 0, down: false, error: '', busy: false, mine: null, num: '', text: '', qid: '', sending: false,
};

const stored = () => { try { return JSON.parse(session.get('ss-play', 'null')); } catch { return null; } };
const save = () => session.set('ss-play', JSON.stringify({ code: S.code, pid: S.pid, name: S.name }));
const forget = () => session.del('ss-play');
const gameLabel = (x) => tr(x.variant === 'survivor' ? 'survivor' : x.variant === 'race' ? 'race' : x.mode === 'speed' ? 'speed' : 'battle');
const errText = (e) => (e instanceof ApiError ? (e.status === 0 ? tr('serverDownP') : e.status === 404 ? tr('noGame') : e.message) : String(e?.message ?? e));

/* ---------- reading supports: read aloud, bigger text, easy-read letters (kept on this phone only) ---------- */

const PREFS_KEY = 'ss-play-prefs';
const prefs = (() => { try { return { size: 0, easy: false, auto: false, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') }; } catch { return { size: 0, easy: false, auto: false }; } })();
function applyPrefs() {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* private mode */ }
  document.documentElement.dataset.size = String(prefs.size);
  document.documentElement.dataset.easy = prefs.easy ? '1' : '0';
}
applyPrefs();

let heard = 0, audioEl = null;
function stopSpeech() {
  heard++;
  try { audioEl?.pause(); } catch { /* nothing playing */ }
  audioEl = null;
  try { speechSynthesis.cancel(); } catch { /* no speech on this device */ }
  document.body.classList.remove('is-reading');
}
const plainWords = (t) => String(t ?? '').replace(/<\/?(b|i|sup|sub)>/g, '').replace(/\^/g, ' to the power of ').replace(/[ \t]+/g, ' ').trim();
/** The question and its answers, in short pieces (the server voice takes up to 320 characters at a time). */
function questionParts(q) {
  const parts = [plainWords(q.prompt)];
  if (q.kind === 'choice' && q.choices) q.choices.forEach((c, j) => parts.push(`${LETTERS[j]}. ${plainWords(c)}`));
  return parts.flatMap((p) => p.match(/[^.?!]+[.?!]*\s*/g) ?? [p]).map((p) => p.trim().slice(0, 300)).filter(Boolean);
}
let serverVoiceAfter = 0; // when the server voice said no (off, busy), the browser's own voice is used for a minute instead of asking again
async function playServer(text, token) {
  if (Date.now() < serverVoiceAfter) return false;
  try {
    const r = await fetch(`${API}/api/tts`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, lang: 'en' }) });
    if (!r.ok) { serverVoiceAfter = Date.now() + 60_000; return false; }
    if (token !== heard) return false;
    const url = URL.createObjectURL(await r.blob());
    await new Promise((done, fail) => {
      const a = new Audio(url);
      audioEl = a;
      a.onended = () => done();
      a.onerror = () => fail(new Error('audio'));
      a.play().catch(fail);
    });
    URL.revokeObjectURL(url);
    return true;
  } catch { return false; }
}
function playLocal(text, token) {
  return new Promise((done) => {
    try {
      if (!('speechSynthesis' in window) || token !== heard) return done();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.onend = u.onerror = () => done();
      speechSynthesis.speak(u);
    } catch { done(); }
  });
}
async function readAloud(q) {
  stopSpeech();
  const token = heard;
  document.body.classList.add('is-reading');
  for (const part of questionParts(q)) {
    if (token !== heard) return;
    if (!(await playServer(part, token))) await playLocal(part, token);
  }
  if (token === heard) document.body.classList.remove('is-reading');
}
let lastRead = '';
const speakIcon = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5v5h4l5 4v-13l-5 4z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.500a8 8 0 0 1 0 11"/></svg>';

function supportsMenu() {
  const tg = (on) => `aria-pressed="${on}"`;
  return `<div id="sup" class="sup-menu" role="dialog" aria-label="${esc(tr('supports'))}">
    <b>${tr('supports')}</b>
    <button class="sup-row" data-act="sup-auto" ${tg(prefs.auto)}><span>${tr('autoRead')}</span><i class="sw"></i></button>
    <button class="sup-row" data-act="sup-easy" ${tg(prefs.easy)}><span>${tr('easyFont')}</span><i class="sw"></i></button>
    <div class="sup-row" role="group" aria-label="${esc(tr('textSize'))}"><span>${tr('textSize')}</span><span class="seg">${['sizeN', 'sizeL', 'sizeXL'].map((k, i) => `<button data-act="sup-size" data-v="${i}" aria-pressed="${prefs.size === i}">${tr(k)}</button>`).join('')}</span></div>
  </div>`;
}
function renderMenu() {
  document.getElementById('sup')?.remove();
  if (S.menu) document.body.insertAdjacentHTML('beforeend', supportsMenu());
}

/* ---------- screens ---------- */

function joinView() {
  const teams = S.peek && S.peek.teams
    ? `<div class="field"><span>${tr('pickTeam')}</span><div class="teams">${Array.from({ length: S.peek.teams }, (_, i) => `<button type="button" class="t" data-act="team" data-i="${i}" aria-pressed="${S.team === i}" style="color:${COLORS[i % 6]}">${teamName(i)}</button>`).join('')}</div></div>`
    : '';
  return `<div class="play">
    <h1 style="font-size:clamp(28px,8vw,40px)">${tr('joinTitle')}</h1>
    <form class="card pad-lg stack" data-form="join" style="gap:16px">
      <label class="field"><span>${tr('gameCode')}</span><input type="text" id="code" inputmode="numeric" autocomplete="off" maxlength="6" pattern="[0-9]*" value="${esc(S.codeInput)}" style="font:600 30px var(--u);letter-spacing:0.18em;text-align:center" /></label>
      ${S.peek ? `<p class="mute center"><b style="color:#fff">${esc(S.peek.title)}</b> · ${gameLabel(S.peek)}</p>` : ''}
      ${S.peekError ? `<p class="err center">${esc(S.peekError)}</p>` : ''}
      <label class="field"><span>${tr('yourFirstName')}</span><input type="text" id="name" maxlength="20" autocomplete="given-name" value="${esc(S.nameInput)}" style="font-size:20px" /></label>
      ${teams}
      ${S.error ? `<p class="err" role="alert">${esc(S.error)}</p>` : ''}
      <button class="btn primary lg" type="submit" ${S.busy || !S.peek || S.peek.full ? 'disabled' : ''}>${tr('joinBtn')}</button>
    </form>
    </div>`;
}

const topLine = (st, extra = '') => `<div class="top"><span class="me"><span>${teamDot(st.you.team)}${esc(st.you.name)}</span><span class="pts">${tr('points', { n: st.you.score })}</span></span><span class="row" style="gap:10px"><span>${extra}</span><button class="aa" data-act="sup" aria-label="${esc(tr('supports'))}" aria-expanded="${S.menu}">Aa</button></span></div>`;
const downBanner = () => (S.down ? `<p class="note center" role="status">${tr('serverDownP')}</p>` : '');

function answerArea(q, locked) {
  if (q.kind === 'choice') {
    return `<div class="answers">${q.choices.map((c, j) => `<button class="answer ${S.mine === j ? 'mine' : ''}" data-act="pick" data-j="${j}" style="background:${COLORS[j % 6]}" ${locked ? 'disabled' : ''}><span class="letter">${LETTERS[j]}</span><span>${rich(c)}</span></button>`).join('')}</div>`;
  }
  if (q.kind === 'text') {
    return `<form class="typed" data-form="word"><input id="word" type="text" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="60" placeholder="${esc(tr('typeWord'))}" value="${esc(S.text)}" ${locked ? 'disabled' : ''} /><button class="btn primary lg" type="submit" ${locked || !S.text.trim() ? 'disabled' : ''}>${tr('send')}</button></form>`;
  }
  const ok = Number.isFinite(Number(S.num.replace(',', '.'))) && /\d/.test(S.num);
  const key = (k, label = k) => `<button type="button" data-act="key" data-k="${k}" ${locked ? 'disabled' : ''} aria-label="${k === 'back' ? '⌫' : k}">${label}</button>`;
  return `<div class="stack" style="gap:14px"><div class="numshow" aria-live="polite">${esc(S.num) || `<span class="dim" style="font:500 18px var(--g)">${tr('typeNumber')}</span>`}</div>
    <div class="keypad">${['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => key(k)).join('')}${key('-', '−')}${key('0')}${key(',')}${key('back', '⌫')}<button type="button" class="btn primary" style="grid-column: span 2;font-size:18px" data-act="send" ${locked || !ok ? 'disabled' : ''}>${tr('send')}</button></div></div>`;
}

function lobbyView(st) {
  return `<div class="play">${topLine(st)}${downBanner()}<div class="waiting"><span class="pulse"></span><h1 style="font-size:clamp(26px,8vw,36px)">${tr('youAreIn')}</h1>
    <p class="big" style="font-size:clamp(24px,8vw,34px)">${teamDot(st.you.team)}${esc(st.you.name)}</p>${st.you.team !== null ? `<p class="mute">${tr('yourTeam', { n: st.you.team + 1 })}</p>` : ''}
    <p class="mute">${tr('waitTeacher')}</p></div>
    ${st.players?.length > 1 ? `<div class="stack" style="gap:10px"><p class="dim small center">${tr('alsoHere')}</p><div class="players" style="justify-content:center">${st.players.filter((n) => n !== st.you.name).slice(0, 40).map((n) => `<span class="player" style="padding:6px 14px">${esc(n)}</span>`).join('')}</div></div>` : ''}
    <button class="btn ghost sm" style="align-self:center" data-act="leave">${tr('leave')}</button></div>`;
}

/** Team Race: the teams' lanes, with the student's own team underlined. */
const raceLanes = (st) => (st.variant === 'race' && st.teamBoard?.length ? raceHtml(st.teamBoard, teamName, COLORS, st.you.team) : '');

/** Last One Standing: a student who is out only watches. */
function outView(st) {
  return `<div class="play">${topLine(st)}${downBanner()}<div class="out"><h1 style="font-size:clamp(28px,9vw,40px)">${tr('youAreOut')}</h1>
    <p class="mute">${tr('outAtQ', { n: (st.you.outAt ?? 0) + 1 })}</p><p class="big" style="font-size:clamp(26px,8vw,40px)">${tr('stillIn', { n: st.alive ?? 0 })}</p><p class="mute">${tr('watchWinner')}</p></div></div>`;
}

/** After each answer in a Speed Round: was it right, and what was the answer. */
const lastBanner = (st) => (st.last && st.index > 0
  ? `<div class="feedback ${st.last.right ? 'right' : 'wrong'}" style="padding:12px 16px" role="status"><b style="font-size:20px">${tr(st.last.right ? 'right' : 'wrong')}</b>${st.last.right ? '' : `<span class="mute">${tr('rightWas', { a: esc(st.last.answer) })}</span>`}</div>`
  : '');

function questionView(st) {
  const q = st.question;
  const speed = st.mode === 'speed';
  const locked = speed ? S.sending : st.answered || S.sending;
  const index = speed ? st.index : q.index;
  const last = speed ? lastBanner(st) : '';
  const still = st.alive !== undefined ? `${tr('stillIn', { n: st.alive })} · ` : '';
  return `<div class="play">${topLine(st, `${still}${tr('questionOf', { i: index + 1, n: st.total })} · <b id="tleft" style="color:#fff">…</b>`)}
    <div class="timer"><i id="tbar" style="width:100%"></i></div>${downBanner()}${raceLanes(st)}${last}
    <div class="prompt-row"><p class="prompt">${rich(q.prompt)}</p><button class="speak" data-act="read" aria-label="${esc(tr('readAloud'))}">${speakIcon}</button></div>${svgImg(q.svg)}
    ${locked && !speed ? `<p class="mute center" role="status">${tr('locked')}</p>` : ''}
    ${answerArea(q, locked)}</div>`;
}

function revealView(st) {
  const r = st.reveal;
  const state = !r.answered ? 'timeUp' : r.right ? 'right' : 'wrong';
  return `<div class="play">${topLine(st)}${downBanner()}
    <div class="feedback ${r.right ? 'right' : 'wrong'}" role="status"><b>${tr(state)}</b>${r.right ? `<span class="ok">${tr('plusPts', { n: r.points })}</span>` : `<span class="mute">${tr('rightWas', { a: esc(r.answer) })}</span>`}${r.explain ? `<span class="mute small">${esc(r.explain)}</span>` : ''}${r.justOut ? `<b style="font-size:20px">${tr('youAreOut')}</b><span class="mute">${tr('outAtQ', { n: (st.you.outAt ?? 0) + 1 })}</span>` : ''}${r.mercy && !r.right ? `<span class="mute">${tr('mercyStudent')}</span>` : ''}</div>
    ${st.alive !== undefined ? `<p class="center mute">${tr('stillIn', { n: st.alive })}</p>` : `<p class="center mute">${tr('yourRank', { r: st.you.rank, n: st.you.of })}</p>`}
    ${st.leaderboard?.length ? `<div class="board">${st.leaderboard.slice(0, 5).map((p, i) => `<div class="line"><span class="n">${i + 1}</span><span>${teamDot(p.team)}${esc(p.name)}${p.out ? ' ✕' : ''}</span><span class="s">${p.score}</span></div>`).join('')}</div>` : ''}
    <p class="dim small center">${tr('waitNext')}</p></div>`;
}

function speedWaitView(st) {
  return `<div class="play">${topLine(st, `<b id="tleft" style="color:#fff">…</b>`)}<div class="timer"><i id="tbar" style="width:100%"></i></div>${downBanner()}${raceLanes(st)}${lastBanner(st)}
    <div class="waiting"><span class="pulse"></span><h2>${tr('speedDone')}</h2><p class="mute">${tr('yourRank', { r: st.you.rank, n: st.you.of })}</p></div></div>`;
}

function doneView(st) {
  const you = st.you;
  return `<div class="play">${topLine(st)}${downBanner()}
    <div class="podium"><p class="mute">${tr('gameOver')}</p><p class="name">${st.variant === 'survivor' ? (you.out ? tr('outAtQ', { n: (you.outAt ?? 0) + 1 }) : tr('lastOneYou')) : tr('yourRank', { r: you.rank, n: you.of })}</p></div>
    <div class="card center" style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div><p class="mute small">${tr('finalScore')}</p><p class="big" style="font-size:34px">${you.score}</p></div><div><p class="mute small">${tr('rightAnswers')}</p><p class="big" style="font-size:34px">${you.right}</p></div></div>
    ${st.leaderboard?.length ? `<div class="board">${st.leaderboard.slice(0, 8).map((p, i) => `<div class="line"><span class="n">${i + 1}</span><span>${teamDot(p.team)}${esc(p.name)}${p.out ? ' ✕' : ''}</span><span class="s">${p.score}</span></div>`).join('')}</div>` : ''}
    ${st.teamBoard?.length ? `<div class="board">${st.teamBoard.map((t, i) => `<div class="line"><span class="n">${i + 1}</span><span style="color:${COLORS[t.team % 6]};font-weight:800">${teamName(t.team)}</span><span class="s">${t.average}</span></div>`).join('')}</div>` : ''}
    <button class="btn lg" style="align-self:center" data-act="leave">${tr('leave')}</button></div>`;
}

function gameView() {
  const st = S.st;
  if (!st) return `<div class="play">${downBanner()}<div class="waiting"><span class="pulse"></span><p class="mute">${tr('loading')}</p></div></div>`;
  if (st.status === 'lobby') return lobbyView(st);
  const watching = st.variant === 'survivor' && st.you.out && st.status !== 'done' && !(st.status === 'reveal' && st.reveal?.justOut);
  if (watching) return outView(st);
  if (st.mode === 'battle' && st.status === 'question') return questionView(st);
  if (st.mode === 'battle' && st.status === 'reveal') return revealView(st);
  if (st.mode === 'speed' && st.status === 'running') return st.finished ? speedWaitView(st) : questionView(st);
  if (st.status === 'done') return doneView(st);
  return lobbyView(st);
}

function render() {
  if (S.view === 'boot') app.innerHTML = `<div class="play"><div class="waiting"><span class="pulse"></span></div></div>`;
  else if (S.view === 'join') app.innerHTML = joinView();
  else app.innerHTML = gameView();
  document.title = `${tr('brand')}: ${tr('joinTitle')}`;
  tick();
  animateLanes();
  renderMenu();
  const q = S.view === 'game' ? S.st?.question : null;
  const qid = q ? `${S.st.index ?? ''}:${q.id}` : '';
  if (qid && qid !== lastRead) { lastRead = qid; stopSpeech(); if (prefs.auto) readAloud(q); }
  if (!q && lastRead) { lastRead = ''; stopSpeech(); }
  const word = $('#word');
  if (word && !word.disabled && S.view === 'game') { word.focus(); word.setSelectionRange(word.value.length, word.value.length); }
}

/* ---------- the game loop ---------- */

let poller = 0, ticker = 0, lastKey = '';

function take(st) {
  S.offset = st.serverNow - Date.now();
  const qid = st.question?.id ?? '';
  if (qid !== S.qid) { S.qid = qid; S.mine = null; S.num = ''; S.text = ''; S.sending = false; }
  S.st = st;
}

function begin() {
  stopLoop();
  S.view = 'game'; render();
  poller = setInterval(poll, 1000);
  ticker = setInterval(tick, 250);
  poll();
}
function stopLoop() { clearInterval(poller); clearInterval(ticker); poller = ticker = 0; }

async function poll() {
  if (S.view !== 'game') return;
  try {
    const { state } = await api.state(S.code, S.pid);
    const wasDown = S.down; S.down = false;
    const key = JSON.stringify({ ...state, serverNow: 0 });
    // Someone is typing an answer to this very question: a redraw would close the keyboard, so only remember the news.
    const typing = document.activeElement?.id === 'word' && S.st && state.status === S.st.status && (state.question?.id ?? '') === S.qid && !wasDown;
    take(state);
    if (typing) {
      lastKey = key;
      const lanes = $('.race');
      if (lanes && state.teamBoard) { lanes.outerHTML = raceLanes(state); animateLanes(); } // the race keeps moving, the typing box stays put
      return;
    }
    if (key !== lastKey || wasDown) { lastKey = key; render(); }
  } catch (e) {
    if (e instanceof ApiError && (e.status === 403 || e.status === 404)) { leave(tr('noGame')); return; }
    if (!S.down) { S.down = true; render(); }
  }
}

function tick() {
  const st = S.st;
  if (S.view !== 'game' || !st) return;
  const end = st.mode === 'battle' && st.status === 'question' ? st.endsAt : st.mode === 'speed' && st.status === 'running' ? st.endsAt : 0;
  const bar = $('#tbar'), left = $('#tleft');
  if (!end) return;
  const remaining = Math.max(0, end - (Date.now() + S.offset));
  if (left) left.textContent = tr('timeLeftShort', { s: secondsLeft(end, S.offset) });
  if (bar) bar.style.width = `${Math.min(100, (remaining / ((st.seconds || 20) * 1000)) * 100)}%`;
}

function leave(message = '') {
  stopLoop(); forget();
  S.view = 'join'; S.st = null; S.pid = ''; S.error = message; S.team = null; S.qid = ''; S.mine = null; S.num = ''; S.text = ''; S.down = false;
  S.codeInput = ''; S.peek = null; S.peekError = '';
  history.replaceState(null, '', location.pathname);
  render();
}

async function send(a) {
  if (S.sending) return;
  S.sending = true;
  if (a.text === undefined) render();
  try {
    const { state } = await api.answer(S.code, S.pid, a);
    S.sending = false;
    const speed = state.mode === 'speed';
    take(state);
    if (speed) { S.mine = null; S.num = ''; S.text = ''; }
    lastKey = JSON.stringify({ ...state, serverNow: 0 });
  } catch (e) {
    S.sending = false;
    if (e instanceof ApiError && e.status === 0) S.down = true;
    if (!(e instanceof ApiError && e.status === 409)) S.mine = null; // the server decides; the next poll shows what happened
  }
  render();
}

/* ---------- joining ---------- */

let peekTimer = 0;
async function lookup() {
  const code = S.codeInput.replace(/\D/g, '');
  S.peek = null; S.peekError = '';
  if (code.length !== 6) return;
  try { S.peek = await api.peek(code); if (S.peek.status === 'done') { S.peek = null; S.peekError = tr('noGame'); } } catch (e) { S.peekError = errText(e); }
  if (S.view !== 'join') return;
  // keep the cursor where the student is typing; once the code is complete move on to the name
  const a = document.activeElement, id = a?.id, pos = a?.selectionStart;
  render();
  const target = S.peek && id === 'code' ? document.getElementById('name') : id ? document.getElementById(id) : null;
  if (target) { target.focus(); if (target.id === id) { try { target.setSelectionRange(pos, pos); } catch { /* not a text field */ } } }
}

async function join() {
  if (!S.peek || S.busy) return;
  S.busy = true; S.error = ''; render();
  try {
    const r = await api.join(S.codeInput.replace(/\D/g, ''), S.nameInput.trim(), S.team);
    S.code = S.peek.code; S.pid = r.pid; S.name = r.name; save();
    take(r.state); lastKey = '';
    S.busy = false;
    begin();
  } catch (e) { S.busy = false; S.error = errText(e); render(); }
}

/* ---------- events ---------- */

document.addEventListener('input', (e) => {
  if (e.target.id === 'code') {
    S.codeInput = e.target.value.replace(/\D/g, '').slice(0, 6);
    e.target.value = S.codeInput;
    clearTimeout(peekTimer); S.peek = null; S.peekError = '';
    peekTimer = setTimeout(lookup, 250);
  }
  if (e.target.id === 'name') S.nameInput = e.target.value;
  if (e.target.id === 'word') {
    S.text = e.target.value;
    const button = $('.typed button');
    if (button) button.disabled = !S.text.trim();
  }
});

document.addEventListener('submit', (e) => {
  const kind = e.target.closest('[data-form]')?.dataset.form;
  if (kind === 'join') { e.preventDefault(); join(); }
  if (kind === 'word') { e.preventDefault(); if (S.text.trim()) send({ text: S.text.trim() }); }
});

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const act = el.dataset.act;
  if (act === 'sup') { S.menu = !S.menu; return render(); }
  if (act === 'read') { const q = S.st?.question; if (q) { if (document.body.classList.contains('is-reading')) stopSpeech(); else readAloud(q); } return; }
  if (act === 'sup-auto') { prefs.auto = !prefs.auto; applyPrefs(); if (!prefs.auto) stopSpeech(); lastRead = ''; return render(); }
  if (act === 'sup-easy') { prefs.easy = !prefs.easy; applyPrefs(); return render(); }
  if (act === 'sup-size') { prefs.size = Number(el.dataset.v) || 0; applyPrefs(); return render(); }
  if (act === 'team') { S.team = S.team === Number(el.dataset.i) ? null : Number(el.dataset.i); return render(); }
  if (act === 'leave') return leave();
  if (act === 'pick') { const j = Number(el.dataset.j); S.mine = j; return send({ choice: j }); }
  if (act === 'key') {
    const k = el.dataset.k;
    if (k === 'back') S.num = S.num.slice(0, -1);
    else if (S.num.length < 12) {
      if (k === '-' && S.num.length === 0) S.num = '-';
      else if (k === ',' && !/[,.]/.test(S.num)) S.num += ',';
      else if (/\d/.test(k)) S.num += k;
    }
    return render();
  }
  if (act === 'send') return send({ value: S.num });
});

/* ---------- start ---------- */

(async function boot() {
  const fromUrl = new URLSearchParams(location.search).get('code')?.replace(/\D/g, '').slice(0, 6) ?? '';
  const prev = stored();
  if (prev?.pid && prev.code && (!fromUrl || fromUrl === prev.code)) {
    S.code = prev.code; S.pid = prev.pid; S.name = prev.name;
    try { const { state } = await api.state(S.code, S.pid); take(state); return begin(); } catch (e) {
      if (e instanceof ApiError && e.status !== 0) forget(); // the game is gone
      else { S.down = true; return begin(); } // the server is only unreachable for now: keep the player id and keep trying
    }
  }
  S.view = 'join'; S.codeInput = fromUrl; render();
  if (fromUrl.length === 6) lookup();
})();
