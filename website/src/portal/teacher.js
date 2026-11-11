// The teacher portal: log in, make quizzes (by hand, from a textbook topic, or an AI draft), start a live game and read the results.
import '@fontsource-variable/onest';
import './portal.css';
import QRCode from 'qrcode';
import { api, ApiError, API, setToken } from './api.js';
import { tr } from './i18n.js';
import { $, $$, LETTERS, animateLanes, esc, raceHtml, rich, secondsLeft, store, svgImg } from './ui.js';
import { GAMES, PLAYABLE, gameById, parseTrueFalse, parseWords } from './games.js';

const app = $('#app');
const modalEl = $('#modal');
const COLORS = ['var(--c0)', 'var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)'];

const S = {
  info: null, teacher: null, view: 'boot', mode: 'login', error: '', busy: false,
  quizzes: [], history: [], active: [],
  quiz: null, dirty: false, notice: '',
  topics: null, modal: null,
  host: null, code: '', offset: 0, qr: '', joinBase: store.get('ss-join-base') || location.origin,
  results: null, plan: null,
  insights: null, chat: [], asking: false,
};

/* ---------- small pieces ---------- */

const logo = `<svg viewBox="-130 -130 260 260" aria-hidden="true"><path d="M12.5 -89.1 A90 90 0 0 1 89.1 -12.5" stroke="#2DE2C4" stroke-width="24" fill="none" stroke-linecap="round"/><path d="M89.1 12.5 A90 90 0 0 1 12.5 89.1" stroke="#5B8CFF" stroke-width="24" fill="none" stroke-linecap="round"/><path d="M-12.5 89.1 A90 90 0 0 1 -89.1 12.5" stroke="#FF6B5B" stroke-width="24" fill="none" stroke-linecap="round"/><path d="M-89.1 -12.5 A90 90 0 0 1 -12.5 -89.1" stroke="#FFB547" stroke-width="24" fill="none" stroke-linecap="round"/><circle r="20" fill="#e9eeff"/></svg>`;

const ICONS = {
  home: '<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>',
  quiz: '<rect x="4.5" y="3" width="15" height="18" rx="2.6"/><path d="M8.5 8h7M8.5 11.5h3.5"/>',
  games: '<rect x="2.8" y="7" width="18.4" height="11" rx="4.6"/><path d="M8 10.2v4.6M5.7 12.5h4.6"/>',
  results: '<path d="M6 20V10M12 20V4M18 20v-7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  student: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-4 3.6-6 7-6s6.2 2 7 6"/>',
  site: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.8 5.2 3.8 8.5s-1.2 6.1-3.8 8.5c-2.6-2.4-3.8-5.2-3.8-8.5S9.4 5.9 12 3.5z"/>',
  ask: '<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-8l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><path d="M12 7.6l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/>',
  spark: '<path d="M12 2.5l2.2 6 6 2.2-6 2.2L12 19l-2.2-6.1-6-2.2 6-2.2z"/><path d="M19 3v4M17 5h4"/>',
};
const ico = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>`;
const VIEW_TITLES = { home: 'overview', assistant: 'askAi', editor: 'viewEditor', host: 'viewHost', results: 'viewResults' };
let lastView = '';

/** Before logging in: the aurora and one card. */
const bare = (inner) => `<div class="bare"><a class="brand" href="./index.html">${logo}<span>${tr('brand')}</span></a><main>${inner}</main>
  <div class="row"><a class="btn sm ghost" href="./student">${tr('studentArea')}</a><a class="btn sm ghost" href="./index.html">${tr('backToSite')}</a></div></div>`;

/** The page of a logged-in teacher: a sidebar to move around, a header with who is logged in, and the view itself. */
const page = (inner) => {
  const enter = S.view !== lastView;
  lastView = S.view;
  if (!S.teacher) return bare(inner);
  return `<div class="frame">
    <aside class="sb">
      <a class="brand" href="./index.html" aria-label="${tr('brand')}">${logo}<span>${tr('brand')}</span></a>
      <nav class="nav" aria-label="${tr('portal')}">
        <button class="ni ${S.view === 'home' ? 'on' : ''}" data-act="home">${ico('home')}${tr('overview')}</button>
        ${S.info?.ai ? `<button class="ni ${S.view === 'assistant' ? 'on' : ''}" data-act="assistant">${ico('ask')}${tr('askAi')}</button>` : ''}
        <button class="ni" data-act="goto" data-id="quizzes">${ico('quiz')}${tr('myQuizzes')}</button>
        <button class="ni" data-act="goto" data-id="games">${ico('games')}${tr('gamesTitle')}</button>
        <button class="ni" data-act="goto" data-id="results">${ico('results')}${tr('recent')}</button>
        <button class="ni cta" data-act="new">${ico('plus')}${tr('newQuiz')}</button>
      </nav>
      <div class="foot"><a href="./student">${ico('student')}${tr('studentArea')}</a><a href="./index.html">${ico('site')}${tr('backToSite')}</a></div>
    </aside>
    <div class="mc">
      <header class="hd"><h1>${ico('spark')}${tr(VIEW_TITLES[S.view] || 'portal')}</h1>
        <div class="right"><div class="usr"><span class="av" aria-hidden="true">${esc(String(S.teacher.name || '?').trim().charAt(0).toUpperCase())}</span><div><b>${esc(S.teacher.name)}</b><i>${tr('teacherLabel')}</i></div></div>
          <button class="btn sm ghost" data-act="logout">${tr('logout')}</button></div></header>
      <main class="${enter ? 'enter' : ''}">${inner}</main>
    </div>
  </div>`;
};
const err = (m) => (m ? `<p class="err" role="alert">${esc(m)}</p>` : '');
const srcTag = (s) => (s === 'ai' ? `<span class="tag lilac">${tr('sourceAi')}</span>` : s === 'textbook' ? `<span class="tag mint">${tr('sourceTextbook')}</span>` : s === 'template' ? `<span class="tag warm">${tr('sourceTemplate')}</span>` : `<span class="tag">${tr('sourceHand')}</span>`);
const teamLabel = (n) => tr('team', { n: n + 1 });
const gameName = (h) => tr(h.variant === 'survivor' ? 'survivor' : h.variant === 'race' ? 'race' : h.mode === 'speed' ? 'speed' : 'battle');
/** Question text without the few formatting tags, for one-line lists. */
const plainText = (s) => String(s ?? '').replace(/<\/?(b|i|sup|sub)>/g, '');
const msg = (e) => (e instanceof ApiError ? (e.status === 0 ? tr('serverDown') : e.message) : String(e?.message ?? e));

/* ---------- views ---------- */

function downView() {
  return page(`<div class="login stack"><h1>${tr('serverDown')}</h1><div class="card stack"><p class="mute">${esc(tr('serverDownHelp', { api: API || location.origin }))}</p><div><button class="btn primary" data-act="retry">${tr('retry')}</button></div></div></div>`);
}

function loginView() {
  const reg = S.mode === 'register';
  const field = (name, key, type, hint, auto) => `<label class="field"><span>${tr(key)}</span><input type="${type}" name="${name}" required autocomplete="${auto}" ${name === 'name' ? 'maxlength="60"' : ''} />${hint ? `<small class="dim">${esc(hint)}</small>` : ''}</label>`;
  return page(`<div class="login stack">
    <h1>${tr(reg ? 'registerTitle' : 'loginTitle')}</h1>
    <form class="card pad-lg stack" data-form="auth">
      ${reg ? field('name', 'yourName', 'text', '', 'name') : ''}
      ${field('username', 'username', 'text', reg ? tr('usernameHint') : '', 'username')}
      ${field('password', 'password', 'password', reg ? tr('passwordHint') : '', reg ? 'new-password' : 'current-password')}
      ${err(S.error)}
      <button class="btn primary lg" type="submit" ${S.busy ? 'disabled' : ''}>${tr(reg ? 'registerBtn' : 'loginBtn')}</button>
      ${S.info.signup || reg ? `<button class="btn ghost" type="button" data-act="toggle-mode">${tr(reg ? 'haveAccount' : 'needAccount')}</button>` : `<p class="dim small">${tr('signupOff')}</p>`}
    </form>
    ${S.info.demo ? `<div class="card stack"><p class="mute">${tr('demoHint')}</p><div><button class="btn" data-act="demo">${tr('demoBtn')}</button></div></div>` : ''}
  </div>`);
}

const gameCard = (g) => `<article class="card game-card" style="--tint:${COLORS[g.tint]}">
  <div class="glyph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${g.icon}</svg></div>
  <h3>${tr(g.id)}</h3><p class="mute small">${tr(g.id + 'Desc')}</p>
  <div class="row">${g.tags.map((t) => `<span class="tag">${tr('tag' + t[0].toUpperCase() + t.slice(1))}</span>`).join('')}</div>
  <div class="actions"><button class="btn sm ${g.template ? '' : 'primary'}" data-act="game" data-id="${g.id}">${tr(g.template ? 'makeGame' : 'useGame')}</button></div>
</article>`;

/* ---------- class insights and the AI assistant ---------- */

const accClass = (p) => (p < 50 ? 'bad' : p < 70 ? 'mid' : 'good');
const bar = (p) => `<span class="mini-bar ${accClass(p)}"><i style="width:${Math.max(0, Math.min(100, p))}%"></i></span>`;
const trendTag = (t) => (t === 'down' ? `<span class="trend down">↓ ${tr('trendDown')}</span>` : t === 'up' ? `<span class="trend up">↑ ${tr('trendUp')}</span>` : '');
const cut = (t, n) => { const x = plainText(t); return x.length > n ? `${x.slice(0, n - 1)}…` : x; };

const sampleTag = (r) => (r.sample ? `<span class="tag warm" title="${esc(tr('sampleNote'))}">${tr('sampleTag')}</span>` : '');
const studentRow = (s) => `<div class="srow"><span class="av" aria-hidden="true">${esc(String(s.name).charAt(0).toUpperCase())}</span><div class="grow stack" style="gap:6px">
  <div class="row between"><b>${esc(s.name)} ${sampleTag(s)}</b><span class="pcs ${accClass(s.accuracy)}">${s.accuracy}%</span></div>${bar(s.accuracy)}
  <div class="small dim">${tr('answeredN', { a: s.answered, g: s.games ?? s.sessions })} ${trendTag(s.trend)}</div>
  ${s.missed?.length ? `<div class="miss"><span class="small dim">${tr('missedLabel')}:</span> ${s.missed.map((m) => `<span class="tag">${esc(cut(m, 46))}</span>`).join('')}</div>` : ''}</div></div>`;
const questionRow = (q) => `<div class="qrow"><span class="grow">${esc(cut(q.prompt, 90))} ${sampleTag(q)}</span>${bar(q.correctPercent)}<b class="pcs ${accClass(q.correctPercent)}">${q.correctPercent}%</b></div>`;
const gameRow = (g) => `<div class="item"><span><b>${esc(g.title)}</b> ${sampleTag(g)} <span class="mute">· ${new Date(g.finishedAt).toLocaleDateString('en-GB', { dateStyle: 'medium' })} · ${tr('playersCount', { n: g.players })}${g.accuracy === null ? '' : ` · ${tr('correctPct', { p: g.accuracy })}`}</span></span><button class="btn sm" data-act="results" data-code="${g.code}">${tr('resultsBtn')}</button></div>`;

const KIND_WORD = { choice: 'kindChoice2', number: 'kindNumber2', text: 'kindText2' };
function quizDraft(q, i) {
  const shown = q.questions.slice(0, 4);
  return `<div class="draft"><div class="row between"><b>${esc(q.title)}</b><span class="row" style="gap:6px"><span class="tag ${q.style === 'gamified' ? 'lilac' : ''}">${tr(q.style === 'gamified' ? 'styleGamified' : 'styleStandard')}</span><span class="tag">${tr('questionsN', { n: q.questions.length })}</span></span></div>
    <ol class="draft-list">${shown.map((x) => `<li><span>${esc(cut(x.prompt, 110))}</span><span class="tag">${tr(KIND_WORD[x.kind] || 'kindChoice2')}</span></li>`).join('')}</ol>
    ${q.questions.length > shown.length ? `<p class="small dim">${tr('moreQuestions', { n: q.questions.length - shown.length })}</p>` : ''}
    <div class="row"><button class="btn primary sm" data-act="ai-open" data-i="${i}">${tr('openInEditor')}</button><span class="small dim">${tr('playAsLabel')}:</span>
      ${PLAYABLE.map((g) => `<button class="btn sm ${g.id === q.game ? 'mint' : ''}" data-act="ai-play" data-i="${i}" data-game="${g.id}">${tr(g.id)}</button>`).join('')}</div></div>`;
}

function replyBlocks(r, i) {
  if (!r) return '';
  return `${r.sample ? `<p class="small sample"><span class="tag warm">${tr('sampleData')}</span> ${tr('sampleNote')}</p>` : ''}
    ${r.students?.length ? `<div class="srows">${r.students.map(studentRow).join('')}</div>` : ''}
    ${r.questions?.length ? `<div class="qrows">${r.questions.map(questionRow).join('')}</div>` : ''}
    ${r.games?.length ? `<div class="list">${r.games.map(gameRow).join('')}</div>` : ''}
    ${r.quiz ? quizDraft(r.quiz, i) : ''}`;
}

const chatMsg = (m, i) => (m.role === 'teacher'
  ? `<div class="msg me">${esc(m.text)}</div>`
  : `<div class="msg ai ${m.error ? 'bad' : ''}"><p>${esc(m.text)}</p>${m.error ? '' : replyBlocks(m.reply, i)}</div>`);

const suggestions = () => `<div class="chips-row">${['sugg1', 'sugg2', 'sugg3', 'sugg4', 'sugg5', 'sugg6'].map((k) => `<button class="chip" data-act="ask" data-key="${k}" ${S.asking ? 'disabled' : ''}>${tr(k)}</button>`).join('')}</div>`;

function assistantView() {
  const intro = `<div class="intro"><span class="ask-ic big">${ico('ask')}</span><h2>${tr('askIntroTitle')}</h2><p class="mute">${tr('askIntroText')}</p>${suggestions()}</div>`;
  return page(`<div class="chat-wrap">
    <div class="chat" id="chat">${S.chat.length ? S.chat.map(chatMsg).join('') : intro}${S.asking ? `<div class="msg ai typing" aria-label="${tr('askThinking')}"><i></i><i></i><i></i></div>` : ''}<div id="chat-end"></div></div>
    ${S.chat.length ? suggestions() : ''}
    <form class="composer" data-form="ask"><input type="text" id="ask-input" maxlength="600" placeholder="${esc(tr('askPlaceholder'))}" aria-label="${esc(tr('askAi'))}" autocomplete="off" ${S.asking ? 'disabled' : ''} /><button class="btn primary" type="submit" ${S.asking ? 'disabled' : ''}>${tr('askSend')}</button></form>
    <p class="small dim center">${tr('askPrivacy')}</p></div>`);
}

async function askAssistant(text) {
  const q = String(text ?? '').trim();
  if (!q || S.asking) return;
  const history = S.chat.slice(-6).map((m) => ({ role: m.role, text: m.text }));
  S.chat.push({ role: 'teacher', text: q });
  S.asking = true; S.view = 'assistant'; S.modal = null; render(); toChatEnd();
  try {
    const r = await api.assistant(q, history);
    S.chat.push({ role: 'assistant', text: r.say, reply: r });
  } catch (e) { S.chat.push({ role: 'assistant', text: msg(e), error: true }); }
  S.asking = false; render(); toChatEnd();
}
const toChatEnd = () => requestAnimationFrame(() => $('#chat-end')?.scrollIntoView({ block: 'end', behavior: 'smooth' }));

/** The insights shown on the home page, from the saved results (no AI involved). */
function insightCards() {
  const ins = S.insights;
  if (!ins) return '';
  const sample = ins.sample ? `<span class="tag warm" title="${esc(tr('sampleNote'))}">${tr('sampleData')}</span>` : '';
  if (!ins.totals.games) return `<div class="card insight-empty"><p class="mute">${tr('insightsEmpty')}</p></div>`;
  const weak = ins.students.filter((s) => s.answered >= 4 && s.accuracy < 65).sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);
  const hard = ins.questions.filter((q) => q.answered >= 3).sort((a, b) => a.correctPercent - b.correctPercent).slice(0, 3);
  return `<div class="insight-grid">
    <section class="card stack" style="gap:14px"><div class="row between"><h3>${tr('needsAttention')}</h3>${sample}</div>${weak.length ? `<div class="srows">${weak.map(studentRow).join('')}</div>` : `<p class="mute">${tr('noOneStands')}</p>`}</section>
    <section class="card stack" style="gap:14px"><div class="row between"><h3>${tr('hardestTitle')}</h3>${sample}</div>${hard.length ? `<div class="qrows">${hard.map(questionRow).join('')}</div>` : `<p class="mute">${tr('noOneStands')}</p>`}</section>
  </div>`;
}

const askCard = () => (S.info?.ai ? `<section class="ask-card"><div class="ask-head"><span class="ask-ic">${ico('ask')}</span><div><h2>${tr('askAi')}</h2><p class="mute small">${tr('askAiLead')}</p></div></div>
  <form class="composer" data-form="ask-home"><input type="text" id="ask-home-input" maxlength="600" placeholder="${esc(tr('askPlaceholder'))}" aria-label="${esc(tr('askAi'))}" autocomplete="off" /><button class="btn primary" type="submit">${tr('askSend')}</button></form>
  ${suggestions()}</section>` : '');

function homeView() {
  const quizCard = (q) => `<article class="card quiz-card">
    <h3>${esc(q.title)}</h3>
    <div class="row"><span class="tag">${tr('questionsN', { n: q.questions })}</span>${srcTag(q.source)}</div>
    <div class="actions"><button class="btn primary sm" data-act="play" data-id="${q.id}">▶ ${tr('play')}</button><button class="btn sm" data-act="edit" data-id="${q.id}">${tr('edit')}</button><button class="btn sm ghost danger" data-act="del" data-id="${q.id}" data-title="${esc(q.title)}">${tr('del')}</button></div>
  </article>`;
  const active = S.active.length
    ? `<h2>${tr('activeGames')}</h2><div class="list">${S.active.map((g) => `<div class="item"><span><b>${esc(g.title)}</b> <span class="mute">· ${g.code} · ${tr('playersN', { n: g.players })}</span></span><button class="btn sm primary" data-act="host" data-code="${g.code}">${tr('resume')}</button></div>`).join('')}</div>`
    : '';
  const hist = S.history.length
    ? `<div class="list">${S.history.slice(0, 12).map((g) => `<div class="item"><span><b>${esc(g.title)}</b> <span class="mute">· ${new Date(g.finishedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })} · ${tr('playersN', { n: g.players })}</span></span><button class="btn sm" data-act="results" data-code="${g.code}">${tr('open')}</button></div>`).join('')}</div>`
    : `<div class="empty">${tr('noResults')}</div>`;
  return page(`<div class="stack">
    <div class="row between"><h2>${esc(tr('hello', { name: S.teacher.name }))}</h2>
      <div class="row"><button class="btn primary" data-act="new">+ ${tr('newQuiz')}</button><button class="btn" data-act="topic-new">${tr('fromTopic')}</button>${S.info.ai ? `<button class="btn" data-act="ai-new">${tr('fromAi')}</button>` : ''}</div></div>
    ${askCard()}
    ${insightCards()}
    ${active}
    <div class="stack sec-title" id="sec-games" style="gap:6px"><h2>${tr('gamesTitle')}</h2><p class="mute">${tr('gamesHelp')}</p></div>
    <div class="grid games">${GAMES.map(gameCard).join('')}</div>
    <h2 class="sec-title" id="sec-quizzes">${tr('myQuizzes')}</h2>
    ${S.quizzes.length ? `<div class="grid">${S.quizzes.map(quizCard).join('')}</div>` : `<div class="empty">${tr('noQuizzes')}</div>`}
    <h2 class="sec-title" id="sec-results">${tr('recent')}</h2>${hist}
  </div>`);
}

function questionCard(q, i) {
  const choices = (q.choices || [])
    .map((c, j) => `<div class="choice-row"><input type="radio" name="c${i}" data-f="correct" data-i="${i}" data-j="${j}" ${q.correct === j ? 'checked' : ''} aria-label="${tr('rightAnswer')}" />
      <span class="letter" style="background:${COLORS[j]}">${LETTERS[j]}</span>
      <input type="text" class="grow" data-f="choice" data-i="${i}" data-j="${j}" value="${esc(c)}" maxlength="120" />
      ${q.choices.length > 2 ? `<button class="btn sm ghost" data-act="rm-choice" data-i="${i}" data-j="${j}" aria-label="${tr('removeChoice')}">✕</button>` : ''}</div>`)
    .join('');
  const accept = Array.isArray(q.accept) ? q.accept.join(', ') : (q.accept ?? '');
  const body = q.kind === 'number'
    ? `<label class="field"><span>${tr('numberAnswer')}</span><input type="text" inputmode="decimal" data-f="answer" data-i="${i}" value="${esc(q.answer ?? '')}" /></label>`
    : q.kind === 'text'
    ? `<label class="field"><span>${tr('textAnswer')}</span><input type="text" data-f="text" data-i="${i}" maxlength="60" value="${esc(q.text ?? '')}" /></label>
      <label class="field"><span>${tr('alsoAccept')}</span><input type="text" data-f="accept" data-i="${i}" value="${esc(accept)}" /></label>`
    : `<div class="field"><span>${tr('answerChoices')}</span><div class="stack" style="gap:8px">${choices}</div>${(q.choices || []).length < 6 ? `<div><button class="btn sm" data-act="add-choice" data-i="${i}">+ ${tr('addChoice')}</button></div>` : ''}</div>`;
  return `<section class="card q-card">
    <div class="q-head"><b>${tr('questionN', { n: i + 1 })}</b>
      <div class="row"><div class="kind">${[['choice', 'kindChoice'], ['number', 'kindNumber'], ['text', 'kindText']].map(([v, k]) => `<button data-act="kind" data-i="${i}" data-v="${v}" aria-pressed="${(q.kind || 'choice') === v}">${tr(k)}</button>`).join('')}</div>
        <button class="btn sm ghost" data-act="q-up" data-i="${i}" ${i === 0 ? 'disabled' : ''} aria-label="${tr('moveUp')}">↑</button><button class="btn sm ghost" data-act="q-down" data-i="${i}" ${i === S.quiz.questions.length - 1 ? 'disabled' : ''} aria-label="${tr('moveDown')}">↓</button>
        <button class="btn sm ghost danger" data-act="q-del" data-i="${i}">${tr('deleteQuestion')}</button></div></div>
    <label class="field"><span>${tr('questionText')}</span><textarea data-f="prompt" data-i="${i}" maxlength="400" rows="2">${esc(q.prompt)}</textarea></label>
    ${q.svg ? `<div class="field"><span>${tr('textbookPicture')}</span>${svgImg(q.svg)}<div><button class="btn sm ghost" data-act="rm-pic" data-i="${i}">${tr('removePicture')}</button></div></div>` : ''}
    ${body}
    <label class="field"><span>${tr('explanation')}</span><input type="text" data-f="explain" data-i="${i}" maxlength="300" value="${esc(q.explain || '')}" /></label>
  </section>`;
}

function editorView() {
  const q = S.quiz;
  return page(`<div class="stack">
    <div class="row between"><button class="btn ghost sm" data-act="home">← ${tr('back')}</button><span class="small ${S.dirty || !q.id ? 'dim' : 'ok'}" id="saveState">${S.dirty || !q.id ? tr('unsaved') : tr('saved')}</span></div>
    <div class="card"><div class="row" style="align-items:flex-end">
      <label class="field grow" style="min-width:220px"><span>${tr('quizTitle')}</span><input type="text" id="qz-title" value="${esc(q.title)}" maxlength="80" /></label>
      <label class="field grow" style="min-width:160px"><span>${tr('subject')}</span><input type="text" id="qz-subject" value="${esc(q.subject || '')}" maxlength="40" /></label></div></div>
    ${S.notice ? `<div class="note">${esc(S.notice)}</div>` : ''}
    ${q.questions.map(questionCard).join('')}
    <div class="row"><button class="btn" data-act="add-q">+ ${tr('addQuestion')}</button><button class="btn" data-act="topic-add">${tr('fromTopic')}</button>${S.info.ai ? `<button class="btn" data-act="ai-add">${tr('fromAi')}</button>` : ''}</div>
    ${err(S.error)}
    <div class="sticky-save"><button class="btn primary" data-act="save" ${S.busy ? 'disabled' : ''}>${tr('save')}</button><button class="btn mint" data-act="launch" ${S.busy ? 'disabled' : ''}>▶ ${tr('play')}</button></div>
  </div>`);
}

/* ---------- the live host screen ---------- */

const joinUrl = (code) => `${S.joinBase.replace(/\/+$/, '')}/play.html?code=${code}`;
const optionHtml = (q, j, mode, h) => {
  const count = h.stats?.counts?.[j];
  const right = mode === 'reveal' && q.correct === j;
  const fill = mode === 'reveal' && h.stats?.answered ? Math.round(((count ?? 0) / h.stats.answered) * 100) : 0;
  return `<div class="opt ${right ? 'right' : mode === 'reveal' ? 'dim' : ''}"><span class="letter" style="background:${COLORS[j]}">${LETTERS[j]}</span><span>${rich(q.choices[j])}</span>${mode === 'reveal' && count !== undefined ? `<span class="count">${count}</span>` : ''}${mode === 'reveal' ? `<i class="fill" style="width:${fill}%"></i>` : ''}</div>`;
};
const boardHtml = (rows, limit = 10) => `<div class="board">${rows.slice(0, limit).map((p, i) => `<div class="line"><span class="n">${i + 1}</span><span>${esc(p.name)}${p.team !== null && p.team !== undefined ? ` <span class="tag" style="color:${COLORS[p.team % 6]}">${tr('team', { n: p.team + 1 })}</span>` : ''}${p.out ? ` <span class="tag">${tr('outLabel')}</span>` : ''}</span><span class="s">${tr('points', { n: p.score })}</span></div>`).join('')}</div>`;
const teamsHtml = (tb) => (tb && tb.length ? `<div class="stack"><h3>${tr('teamsBoard')}</h3><div class="board">${tb.map((t, i) => `<div class="line"><span class="n">${i + 1}</span><span style="color:${COLORS[t.team % 6]};font-weight:800">${tr('team', { n: t.team + 1 })} <span class="mute" style="font-weight:500">· ${tr('playersN', { n: t.members })}</span></span><span class="s">${tr('points', { n: t.average })}</span></div>`).join('')}</div></div>` : '');
const accuracyHtml = (qs) => (qs && qs.length ? `<div class="stack"><h3>${tr('accuracy')}</h3><div class="acc">${qs.map((q, i) => `<div class="a"><span class="small q" title="${esc(plainText(q.prompt))}">${i + 1}. ${esc(plainText(q.prompt))}</span><span class="bar"><i style="width:${q.correctPercent}%"></i></span><b>${q.answered ? `${q.correctPercent}%` : '–'}</b></div>`).join('')}</div></div>` : '');

function doneBlock(rows, teamBoard, questions, title) {
  return `<div class="stack"><div class="podium"><p class="mute">${tr('finalTitle')} · ${esc(title)}</p><p class="mute">${tr('winner')}</p><p class="name">${esc(rows[0]?.name ?? '')}</p></div>
    <div class="card stack"><h3>${tr('leaderboard')}</h3>${boardHtml(rows, 20)}</div>${teamsHtml(teamBoard) ? `<div class="card">${teamsHtml(teamBoard)}</div>` : ''}
    ${accuracyHtml(questions) ? `<div class="card">${accuracyHtml(questions)}</div>` : ''}</div>`;
}

function hostView() {
  const h = S.host;
  let body = '';
  if (h.status === 'lobby') {
    body = `<div class="card pad-lg stack">
      <div class="host-top"><div class="stack" style="gap:10px"><p class="mute">${tr('joinAt')} <b style="color:#fff">${esc(joinUrl('').replace(/\?code=$/, '').replace(/^https?:\/\//, ''))}</b> ${tr('joinCode')}</p><div class="code" aria-label="code">${esc(h.code)}</div></div>${S.qr ? `<div class="qr"><img alt="QR" src="${S.qr}"/></div>` : ''}</div>
      <label class="field"><span>${tr('joinBase')}</span><input type="text" id="join-base" value="${esc(S.joinBase)}" /><small class="dim">${tr('joinBaseHelp')}</small></label></div>
      <div class="card stack"><div class="row between"><h3>${h.players.length ? tr('studentsN', { n: h.players.length }) : tr('waiting')}</h3><span class="dim small">${tr('waitStart')}</span></div>
      <div class="players">${h.players.map((p) => `<span class="player ${p.online ? '' : 'away'}"><i></i>${esc(p.name)}${p.team !== null ? ` <span style="color:${COLORS[p.team % 6]}">●</span>` : ''}<button data-act="kick" data-pid="${p.id}" aria-label="${tr('kick')}">✕</button></span>`).join('')}</div></div>
      <div class="row"><button class="btn primary lg" data-act="start" ${h.players.length ? '' : 'disabled'}>▶ ${tr('start')}</button><button class="btn ghost" data-act="end">${tr('endGame')}</button></div>`;
  } else if (h.status === 'question' || h.status === 'reveal') {
    const q = h.question;
    const mode = h.status;
    const survivor = h.variant === 'survivor';
    const outNow = survivor ? h.players.filter((p) => p.out && p.outAt === h.qIndex) : [];
    const survivors = survivor
      ? `<div class="card stack">${mode === 'reveal' && h.mercy ? `<p class="note">${tr('mercyNote')}</p>` : ''}${mode === 'reveal' && outNow.length ? `<p><b>${tr('outThisRound', { names: outNow.map((p) => esc(p.name)).join(', ') })}</b></p>` : ''}
        <div class="players">${h.players.map((p) => `<span class="player ${p.out ? 'away' : ''}" style="padding-right:14px"><i></i>${esc(p.name)}${mode === 'question' && !p.out && p.answered ? ' ✓' : ''}</span>`).join('')}</div></div>`
      : '';
    body = `<div class="card pad-lg stack"><div class="row between"><span class="row"><span class="tag">${tr('question', { i: h.qIndex + 1, n: h.total })}</span>${survivor ? `<span class="tag mint">${tr('aliveN', { n: h.alive })}</span>` : ''}</span><span class="mute">${tr('answeredN', { a: h.stats?.answered ?? 0, n: survivor ? h.alive + outNow.length : h.players.length })}</span></div>
      ${mode === 'question' ? `<div class="timer"><i id="tbar" style="width:100%"></i></div>` : ''}
      <p class="big-q">${rich(q.prompt)}</p>${svgImg(q.svg)}
      ${q.kind === 'choice' ? `<div class="opts">${q.choices.map((_, j) => optionHtml(q, j, mode, h)).join('')}</div>` : mode === 'reveal' ? `<div class="opt right"><span>${tr('rightAnswer')}: <b>${esc(q.answer)}</b></span><span class="count">${tr('rightN', { n: h.stats?.right ?? 0 })}</span></div>` : ''}
      ${mode === 'reveal' && q.explain ? `<p class="mute">${esc(q.explain)}</p>` : ''}</div>
      ${survivors}
      ${mode === 'reveal' ? `<div class="card stack"><h3>${tr('leaderboard')}</h3>${boardHtml(h.leaderboard, 5)}</div>${teamsHtml(h.teamBoard) ? `<div class="card">${teamsHtml(h.teamBoard)}</div>` : ''}` : ''}
      <div class="row">${mode === 'question' ? `<button class="btn primary" data-act="reveal">${tr('reveal')}</button>` : `<button class="btn primary lg" data-act="next">${h.qIndex + 1 >= h.total || h.lastOneStanding ? tr('finish') : tr('next')} →</button>`}<button class="btn ghost" data-act="end">${tr('endGame')}</button></div>`;
  } else if (h.status === 'running') {
    body = `<div class="card pad-lg stack"><div class="row between"><h2>${tr('speedRunning')}</h2><span class="tag mint" id="tleft">…</span></div><div class="timer"><i id="tbar" style="width:100%"></i></div></div>
      ${h.variant === 'race' ? `<div class="card stack"><h3>${tr('raceTitle')}</h3>${raceHtml(h.teamBoard, teamLabel, COLORS)}</div>` : ''}
      <div class="card stack"><h3>${tr('leaderboard')}</h3>${boardHtml(h.leaderboard, 10)}</div>${h.variant !== 'race' && teamsHtml(h.teamBoard) ? `<div class="card">${teamsHtml(h.teamBoard)}</div>` : ''}
      <div class="row"><button class="btn ghost" data-act="end">${tr('endGame')}</button></div>`;
  } else {
    body = `${doneBlock(h.leaderboard, h.teamBoard, h.questions, h.title)}<div class="row"><button class="btn primary" data-act="home">← ${tr('backHome')}</button></div>`;
  }
  return page(`<div class="stack"><div class="row between"><h1>${esc(h.title)}</h1><span class="tag ${h.mode === 'speed' ? 'warm' : 'mint'}">${gameName(h)}</span></div>${body}</div>`);
}

function resultsView() {
  const r = S.results;
  return page(`<div class="stack"><div class="row between"><button class="btn ghost sm" data-act="home">← ${tr('back')}</button></div><h1>${tr('resultsTitle')}</h1>
    ${doneBlock(r.players, r.teamBoard, r.questions, r.title)}</div>`);
}

/* ---------- modals ---------- */

function topicOptions() {
  const groups = new Map();
  for (const t of S.topics) {
    const k = `${t.subjectTitle} · ${tr('gradeN', { n: t.grade })}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(t);
  }
  return [...groups].map(([g, list]) => `<optgroup label="${esc(g)}">${list.map((t) => `<option value="${esc(t.id)}">${esc(t.emoji)} ${esc(t.title)}</option>`).join('')}</optgroup>`).join('');
}

function modalView() {
  const m = S.modal;
  if (!m) return '';
  let inner = '';
  if (m.type === 'topic') {
    inner = `<h2>${tr('topicTitle')}</h2>${S.topics ? `<label class="field"><span>${tr('topicPick')}</span><select id="m-topic">${topicOptions()}</select><small class="dim">${tr('topicBook')}</small></label>
      <label class="field"><span>${tr('topicCount')}</span><input type="number" id="m-count" min="3" max="20" value="5" /></label>` : `<p class="mute">${tr('loading')}</p>`}
      ${err(m.error)}<div class="row"><button class="btn primary" data-act="m-topic-go" ${S.topics && !m.busy ? '' : 'disabled'}>${tr('makeQuestions')}</button><button class="btn ghost" data-act="m-close">${tr('cancel')}</button></div>`;
  } else if (m.type === 'ai') {
    inner = `<h2>${tr('aiTitle')}</h2><div class="note">${tr('aiNote')}</div>
      <label class="field"><span>${tr('aiTopicLong')}</span><textarea id="m-ai-topic" rows="5" maxlength="4000" placeholder="${esc(tr('aiTopicLongHint'))}"></textarea></label>
      <div class="row"><label class="field grow"><span>${tr('topicCount')}</span><input type="number" id="m-count" min="1" max="12" value="6" /></label><label class="field grow"><span>${tr('aiGrade')}</span><input type="number" id="m-grade" min="1" max="11" value="6" /></label>
        <label class="field grow"><span>${tr('styleLabel')}</span><select id="m-style"><option value="standard">${tr('styleStandard')}</option><option value="gamified">${tr('styleGamified')}</option></select></label></div>
      <div class="field"><span>${tr('typesLabel')}</span><div class="checks">${[['choice', 'typeChoice', true], ['truefalse', 'typeTf', false], ['number', 'typeNumber', false], ['text', 'typeText', false]].map(([v, k, on]) => `<label class="check"><input type="checkbox" data-ty="${v}" ${on ? 'checked' : ''} /> ${tr(k)}</label>`).join('')}</div></div>
      ${err(m.error)}<div class="row"><button class="btn primary" data-act="m-ai-go" ${m.busy ? 'disabled' : ''}>${m.busy ? tr('aiMaking') : tr('makeQuestions')}</button><button class="btn ghost" data-act="m-close">${tr('cancel')}</button></div>`;
  } else if (m.type === 'launch') {
    const g = gameById(m.game);
    const isSpeed = g.mode === 'speed';
    const teamChoices = g.variant === 'race' ? [2, 3, 4, 5, 6] : g.variant === 'survivor' ? [] : [0, 2, 3, 4];
    if (m.choose && !S.quizzes.length) {
      inner = `<h2>${tr(g.id)}</h2><p class="mute">${tr('noQuizForGame')}</p><div class="row"><button class="btn primary" data-act="new">+ ${tr('newQuiz')}</button><button class="btn ghost" data-act="m-close">${tr('cancel')}</button></div>`;
    } else {
      inner = `<h2>${tr('startGame')}</h2>
        ${m.choose ? `<label class="field"><span>${tr('pickQuiz')}</span><select id="m-quiz">${S.quizzes.map((q) => `<option value="${q.id}" ${m.quizId === q.id ? 'selected' : ''}>${esc(q.title)} (${tr('questionsN', { n: q.questions })})</option>`).join('')}</select></label>` : ''}
        <div class="stack" style="gap:10px">${PLAYABLE.map((x) => `<button class="choice-card" data-act="m-game" data-v="${x.id}" aria-pressed="${m.game === x.id}"><b>${tr(x.id)}</b><span class="mute small">${tr(x.id + 'Desc')}</span></button>`).join('')}</div>
        <div class="row"><label class="field grow"><span>${tr(isSpeed ? 'roundSeconds' : 'secondsPer')}</span><input type="number" id="m-seconds" min="${isSpeed ? 30 : 5}" max="${isSpeed ? 900 : 120}" value="${m.seconds ?? g.seconds}" /></label>
        ${teamChoices.length ? `<label class="field grow"><span>${tr(g.variant === 'race' ? 'teamsRace' : 'teamsLabel')}</span><select id="m-teams">${teamChoices.map((n) => `<option value="${n}" ${n === (g.teams ?? 0) ? 'selected' : ''}>${n ? tr('teamsN', { n }) : tr('noTeams')}</option>`).join('')}</select></label>` : ''}</div>
        ${err(m.error)}<div class="row"><button class="btn primary lg" data-act="m-launch-go" ${m.busy ? 'disabled' : ''}>${m.busy ? tr('saveFirst') : tr('create')}</button><button class="btn ghost" data-act="m-close">${tr('cancel')}</button></div>`;
    }
  } else if (m.type === 'tpl') {
    const v = m.vals ?? {};
    const title = `<label class="field"><span>${tr('gameName')}</span><input type="text" id="m-title" maxlength="80" value="${esc(v.title ?? tr(m.tpl))}" /></label>`;
    if (m.tpl === 'math') {
      const checked = (op) => ((v.ops ?? ['add', 'sub']).includes(op) ? 'checked' : '');
      inner = `<h2>${tr('math')}</h2><p class="mute">${tr('mathHelp')}</p>${title}
        <div class="checks">${[['add', 'opAdd'], ['sub', 'opSub'], ['mul', 'opMul'], ['div', 'opDiv'], ['sq', 'opSq'], ['missing', 'opMissing']].map(([op, k]) => `<label class="check"><input type="checkbox" data-op="${op}" ${checked(op)} /> ${tr(k)}</label>`).join('')}</div>
        <div class="row"><label class="field grow"><span>${tr('smallest')}</span><input type="number" id="m-min" min="0" max="999" value="${v.min ?? 1}" /></label><label class="field grow"><span>${tr('largest')}</span><input type="number" id="m-max" min="1" max="1000" value="${v.max ?? 20}" /></label><label class="field grow"><span>${tr('topicCount')}</span><input type="number" id="m-count" min="3" max="40" value="${v.count ?? 15}" /></label></div>`;
    } else {
      inner = `<h2>${tr(m.tpl)}</h2>${title}<label class="field"><span>${tr(m.tpl === 'tf' ? 'tfHelp' : 'wordsHelp')}</span><textarea id="m-lines" rows="9" placeholder="${esc(tr(m.tpl === 'tf' ? 'tfExample' : 'wordsExample'))}">${esc(v.lines ?? '')}</textarea></label>
        ${m.errors?.length ? `<ul class="errs">${m.errors.slice(0, 6).map((e) => `<li>${esc(tr('lineError', { n: e.line, why: tr(e.key) }))}</li>`).join('')}</ul>` : ''}`;
    }
    inner += `${err(m.error)}<div class="row"><button class="btn primary" data-act="m-tpl-go" ${m.busy ? 'disabled' : ''}>${tr('makeQuestions')}</button><button class="btn ghost" data-act="m-close">${tr('cancel')}</button></div>`;
  }
  return `<div class="modal-bg" data-act="m-bg"><div class="modal" role="dialog" aria-modal="true">${inner}</div></div>`;
}

/* ---------- render ---------- */

function render() {
  const views = { boot: () => page(`<p class="mute">${tr('loading')}</p>`), down: downView, login: loginView, home: homeView, assistant: assistantView, editor: editorView, host: hostView, results: resultsView };
  app.innerHTML = (views[S.view] || views.home)();
  modalEl.innerHTML = modalView();
  document.title = `${tr('brand')}: ${tr('portal')}`;
  tickTimers();
  animateLanes();
}

/* ---------- data ---------- */

async function loadHome() {
  const [me, quizzes, hist, ins] = await Promise.all([api.me(), api.quizzes(), api.history(), api.insights().catch(() => null)]);
  S.teacher = me.teacher; S.active = me.active; S.quizzes = quizzes.quizzes; S.history = hist.sessions; S.insights = ins?.insights ?? null;
  S.view = 'home';
}

async function boot() {
  stopPolling();
  S.view = 'boot'; render();
  try {
    S.info = await api.info();
    const t = store.get('ss-portal-token');
    if (t) {
      setToken(t);
      try { await loadHome(); } catch (e) { if (e instanceof ApiError && e.status === 401) { store.del('ss-portal-token'); setToken(''); S.view = 'login'; } else throw e; }
    } else S.view = 'login';
  } catch (e) {
    S.view = e instanceof ApiError && e.status === 0 ? 'down' : 'login';
    S.error = msg(e);
  }
  render();
}

async function doAuth(form) {
  const f = new FormData(form);
  S.busy = true; S.error = ''; render();
  try {
    const r = S.mode === 'register' ? await api.register(f.get('username'), f.get('password'), f.get('name')) : await api.login(f.get('username'), f.get('password'));
    store.set('ss-portal-token', r.token); setToken(r.token); S.teacher = r.teacher;
    await loadHome();
  } catch (e) { S.error = msg(e); S.view = e instanceof ApiError && e.status === 0 ? 'down' : 'login'; }
  S.busy = false; render();
}

const blankQuestion = () => ({ kind: 'choice', prompt: '', choices: ['', '', '', ''], correct: 0, explain: '' });
const newQuiz = (over = {}) => ({ title: '', subject: '', lang: 'en', source: 'hand', questions: [blankQuestion()], ...over });

function payload() {
  const q = S.quiz;
  const own = ({ svg, ...rest }) => {
    if (rest.kind === 'number') return { ...rest, choices: undefined, correct: undefined, text: undefined, accept: undefined };
    if (rest.kind === 'text') return { ...rest, choices: undefined, correct: undefined, answer: undefined };
    return { ...rest, answer: undefined, text: undefined, accept: undefined };
  };
  return { title: q.title, subject: q.subject, lang: q.lang, source: q.source, questions: q.questions.map(own) };
}

async function saveQuiz() {
  S.busy = true; S.error = ''; render();
  try {
    const body = payload();
    const r = S.quiz.id ? await api.saveQuiz(S.quiz.id, body) : await api.createQuiz(body);
    S.quiz = r.quiz; S.dirty = false; S.notice = '';
    return true;
  } catch (e) { S.error = msg(e); return false; } finally { S.busy = false; render(); }
}

/* ---------- live host ---------- */

let poller = 0, timerTick = 0, lastKey = '';
function stopPolling() { clearInterval(poller); clearInterval(timerTick); poller = 0; timerTick = 0; }
async function openHost(code, view) {
  stopPolling();
  S.code = code; S.view = 'host';
  S.host = view || (await api.session(code)).view;
  S.offset = S.host.serverNow - Date.now(); lastKey = '';
  await buildQr(); render();
  poller = setInterval(poll, 1000);
  timerTick = setInterval(tickTimers, 250);
}
async function buildQr() {
  try { S.qr = await QRCode.toDataURL(joinUrl(S.code), { margin: 1, width: 352, color: { dark: '#0a0e12', light: '#ffffff' } }); } catch { S.qr = ''; }
}
async function poll() {
  if (S.view !== 'host') return stopPolling();
  try {
    const { view } = await api.session(S.code);
    S.offset = view.serverNow - Date.now();
    const key = JSON.stringify({ ...view, serverNow: 0 });
    if (key !== lastKey) {
      lastKey = key; S.host = view;
      const keep = document.activeElement?.id === 'join-base';
      if (!keep) render();
    }
  } catch (e) { if (e instanceof ApiError && e.status === 404) { stopPolling(); await goHome(); } }
}
function tickTimers() {
  const h = S.host;
  if (S.view !== 'host' || !h) return;
  const bar = $('#tbar'), left = $('#tleft');
  const end = h.status === 'question' ? h.qEndsAt : h.status === 'running' ? h.endsAt : 0;
  if (!end || !bar) return;
  const total = (h.status === 'question' ? h.qSeconds : h.speedSeconds) * 1000;
  const remaining = Math.max(0, end - (Date.now() + S.offset));
  bar.style.width = `${Math.min(100, (remaining / total) * 100)}%`;
  if (left) left.textContent = tr('timeLeftShort', { s: secondsLeft(end, S.offset) });
}
async function hostAction(action, pid) {
  try { S.host = (await api.action(S.code, action, pid)).view; S.offset = S.host.serverNow - Date.now(); lastKey = JSON.stringify({ ...S.host, serverNow: 0 }); render(); } catch (e) { alert(msg(e)); }
}
async function goHome() {
  stopPolling(); S.modal = null; S.error = '';
  try { await loadHome(); } catch (e) { S.error = msg(e); }
  render();
}

/* ---------- ready-made game templates ---------- */

/** Reads the form of a template, makes the questions, and opens them in the editor so the teacher can still change anything. */
async function makeFromTemplate() {
  const m = S.modal, lang = 'en';
  const title = ($('#m-title')?.value ?? '').trim();
  const fail = (key, extra = {}) => { S.modal = { ...m, ...extra, error: key ? tr(key) : '', busy: false }; render(); };
  let made;
  if (m.tpl === 'math') {
    const ops = $$('[data-op]').filter((c) => c.checked).map((c) => c.dataset.op);
    const vals = { title, ops, min: Number($('#m-min').value), max: Number($('#m-max').value), count: Number($('#m-count').value) };
    if (!ops.length) return fail('needOp', { vals });
    S.modal = { ...m, vals, busy: true, error: '', errors: [] }; render();
    try { made = await api.genMath({ ops, min: vals.min, max: vals.max, count: vals.count, lang }); } catch (er) { S.modal = { ...S.modal, busy: false, error: msg(er) }; return render(); }
  } else {
    const lines = $('#m-lines').value;
    const parsed = (m.tpl === 'tf' ? parseTrueFalse : parseWords)(lines);
    const vals = { title, lines };
    if (parsed.errors.length) return fail('', { vals, errors: parsed.errors });
    if (!parsed.questions.length) return fail('needLinesTpl', { vals, errors: [] });
    made = { title: tr(m.tpl), subject: '', questions: parsed.questions.slice(0, 40) };
  }
  const g = gameById(m.tpl);
  S.quiz = newQuiz({ title: title || made.title, subject: made.subject ?? '', lang, source: 'template', questions: made.questions });
  S.plan = { game: g.play ?? 'speed', seconds: g.seconds };
  S.notice = tr('tplMade', { n: made.questions.length });
  S.dirty = true; S.modal = null; S.view = 'editor'; S.error = '';
  render();
  window.scrollTo(0, 0);
}

/* ---------- events ---------- */

document.addEventListener('submit', (e) => {
  const form = e.target.closest('[data-form]');
  if (form?.dataset.form === 'auth') { e.preventDefault(); doAuth(form); }
  if (form?.dataset.form === 'ask' || form?.dataset.form === 'ask-home') { e.preventDefault(); askAssistant(form.querySelector('input[type=text]').value); }
});

document.addEventListener('input', (e) => {
  const t = e.target;
  if (S.view === 'editor' && S.quiz) {
    const mark = () => { S.dirty = true; const s = $('#saveState'); if (s) { s.textContent = tr('unsaved'); s.className = 'small dim'; } };
    if (t.id === 'qz-title') { S.quiz.title = t.value; return mark(); }
    if (t.id === 'qz-subject') { S.quiz.subject = t.value; return mark(); }
    const f = t.dataset?.f, i = Number(t.dataset?.i), j = Number(t.dataset?.j);
    const q = S.quiz.questions[i];
    if (!f || !q) return;
    if (f === 'prompt') q.prompt = t.value;
    else if (f === 'explain') q.explain = t.value;
    else if (f === 'answer') q.answer = t.value;
    else if (f === 'text') q.text = t.value;
    else if (f === 'accept') q.accept = t.value;
    else if (f === 'choice') q.choices[j] = t.value;
    else if (f === 'correct') q.correct = j;
    mark();
  }
  if (t.id === 'join-base') {
    S.joinBase = t.value.trim() || location.origin; store.set('ss-join-base', S.joinBase);
    clearTimeout(window.__qrT); window.__qrT = setTimeout(async () => { await buildQr(); const img = $('.qr img'); if (img && S.qr) img.src = S.qr; const u = $('.host-top b'); if (u) u.textContent = joinUrl('').replace(/\?code=$/, '').replace(/^https?:\/\//, ''); }, 350);
  }
});

document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset?.f === 'correct' && S.quiz) { S.quiz.questions[Number(t.dataset.i)].correct = Number(t.dataset.j); S.dirty = true; }
});

async function ensureTopics(lang) {
  if (S.topics && S.topicsLang === lang) return;
  try { S.topics = (await api.topics(lang)).topics; S.topicsLang = lang; } catch (e) { S.modal.error = msg(e); }
  render();
}

document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act, i = Number(el.dataset.i), j = Number(el.dataset.j);
  const qs = S.quiz?.questions;
  switch (act) {
    case 'retry': return boot();
    case 'logout': store.del('ss-portal-token'); setToken(''); S.teacher = null; stopPolling(); S.view = 'login'; S.mode = 'login'; S.error = ''; return render();
    case 'toggle-mode': S.mode = S.mode === 'register' ? 'login' : 'register'; S.error = ''; return render();
    case 'demo': { const d = S.info.demo; S.busy = true; render(); try { const r = await api.login(d.username, d.password); store.set('ss-portal-token', r.token); setToken(r.token); S.teacher = r.teacher; await loadHome(); } catch (er) { S.error = msg(er); } S.busy = false; return render(); }
    case 'home': S.plan = null; return goHome();
    case 'assistant': S.plan = null; stopPolling(); S.modal = null; S.view = 'assistant'; render(); toChatEnd(); return;
    case 'ask': return askAssistant(tr(el.dataset.key));
    case 'ai-open': case 'ai-play': {
      const d = S.chat[Number(el.dataset.i)]?.reply?.quiz; if (!d) return;
      S.quiz = newQuiz({ title: d.title, subject: d.subject || '', lang: 'en', source: 'ai', questions: JSON.parse(JSON.stringify(d.questions)) });
      S.plan = null; S.dirty = true; S.error = ''; S.notice = tr('aiNote'); S.view = 'editor';
      S.modal = act === 'ai-play' ? { type: 'launch', game: el.dataset.game } : null;
      render(); window.scrollTo(0, 0); return;
    }
    case 'goto': { S.plan = null; if (S.view !== 'home') await goHome(); document.getElementById(`sec-${el.dataset.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    case 'new': S.quiz = newQuiz(); S.plan = null; S.modal = null; S.dirty = false; S.error = ''; S.notice = ''; S.view = 'editor'; return render();
    case 'edit': try { S.quiz = (await api.quiz(el.dataset.id)).quiz; S.plan = null; S.dirty = false; S.error = ''; S.notice = ''; S.view = 'editor'; } catch (er) { alert(msg(er)); } return render();
    case 'del': if (confirm(tr('confirmDel', { title: el.dataset.title }))) { try { await api.deleteQuiz(el.dataset.id); await loadHome(); } catch (er) { alert(msg(er)); } render(); } return;
    case 'play': try { S.quiz = (await api.quiz(el.dataset.id)).quiz; S.dirty = false; S.plan = null; } catch (er) { return alert(msg(er)); } S.modal = { type: 'launch', game: 'battle' }; return render();
    case 'game': {
      const g = gameById(el.dataset.id);
      S.modal = g.template ? { type: 'tpl', tpl: g.template } : { type: 'launch', game: g.id, choose: true, quizId: S.quizzes[0]?.id };
      return render();
    }
    case 'host': try { await openHost(el.dataset.code); } catch (er) { alert(msg(er)); } return;
    case 'results': try { S.results = (await api.historyOne(el.dataset.code)).summary; S.view = 'results'; } catch (er) { alert(msg(er)); } return render();

    // editor
    case 'add-q': qs.push(blankQuestion()); S.dirty = true; return render();
    case 'q-del': qs.splice(i, 1); if (!qs.length) qs.push(blankQuestion()); S.dirty = true; return render();
    case 'q-up': if (i > 0) { [qs[i - 1], qs[i]] = [qs[i], qs[i - 1]]; S.dirty = true; } return render();
    case 'q-down': if (i < qs.length - 1) { [qs[i + 1], qs[i]] = [qs[i], qs[i + 1]]; S.dirty = true; } return render();
    case 'kind': { const q = qs[i]; if (el.dataset.v === 'number') { q.kind = 'number'; q.answer = q.answer ?? ''; } else if (el.dataset.v === 'text') { q.kind = 'text'; q.text = q.text ?? ''; } else { q.kind = 'choice'; q.choices = q.choices?.length >= 2 ? q.choices : ['', '', '', '']; q.correct = Number.isInteger(q.correct) ? q.correct : 0; } S.dirty = true; return render(); }
    case 'rm-pic': qs[i].svg = ''; qs[i].dropPicture = true; S.dirty = true; return render();
    case 'add-choice': if (qs[i].choices.length < 6) { qs[i].choices.push(''); S.dirty = true; } return render();
    case 'rm-choice': { const q = qs[i]; if (q.choices.length > 2) { q.choices.splice(j, 1); if (q.correct === j) q.correct = 0; else if (q.correct > j) q.correct -= 1; S.dirty = true; } return render(); }
    case 'save': await saveQuiz(); return;
    case 'launch': if (!qs.length || !qs.some((q) => q.prompt.trim())) { S.error = tr('needQuestion'); return render(); } S.modal = { type: 'launch', game: S.plan?.game ?? 'battle', seconds: S.plan?.seconds }; return render();

    // modals
    case 'topic-new': case 'topic-add': S.modal = { type: 'topic', target: act === 'topic-new' ? 'new' : 'add' }; render(); return ensureTopics('en');
    case 'ai-new': case 'ai-add': S.modal = { type: 'ai', target: act === 'ai-new' ? 'new' : 'add' }; return render();
    case 'm-bg': if (e.target === el) { S.modal = null; render(); } return;
    case 'm-close': S.modal = null; return render();
    case 'm-game': S.modal.quizId = $('#m-quiz')?.value ?? S.modal.quizId; S.modal.game = el.dataset.v; delete S.modal.seconds; S.modal.error = ''; return render();
    case 'm-tpl-go': return makeFromTemplate();
    case 'm-topic-go': {
      const lang = 'en'; S.modal.busy = true; render();
      try {
        const r = await api.genTopic($('#m-topic').value, Number($('#m-count').value), lang);
        const asked = Number($('#m-count').value);
        if (S.modal.target === 'new' || !S.quiz) { S.quiz = newQuiz({ title: r.title, subject: r.subject, lang, source: 'textbook', questions: r.questions }); S.view = 'editor'; } else { if (S.quiz.questions.length === 1 && !S.quiz.questions[0].prompt.trim()) S.quiz.questions = []; S.quiz.questions.push(...r.questions); if (!S.quiz.title) S.quiz.title = r.title; }
        S.notice = r.questions.length < asked ? tr('topicFewer', { n: r.questions.length }) : tr('someAdded', { n: r.questions.length });
        S.dirty = true; S.modal = null;
      } catch (er) { S.modal.error = msg(er); S.modal.busy = false; }
      return render();
    }
    case 'm-ai-go': {
      const topic = $('#m-ai-topic').value.trim(); if (topic.length < 3) { S.modal.error = tr('aiTopicHint'); return render(); }
      const lang = 'en'; S.modal.busy = true; S.modal.error = ''; render();
      try {
        const types = $$('[data-ty]').filter((x) => x.checked).map((x) => x.dataset.ty);
        const r = await api.genAi(topic, Number($('#m-count').value), lang, Number($('#m-grade').value), { style: $('#m-style').value, types: types.length ? types : ['choice'] });
        if (S.modal.target === 'new' || !S.quiz) { S.quiz = newQuiz({ title: r.title || topic.slice(0, 60), subject: r.subject || '', lang, source: 'ai', questions: r.questions }); S.view = 'editor'; } else { if (S.quiz.questions.length === 1 && !S.quiz.questions[0].prompt.trim()) S.quiz.questions = []; S.quiz.questions.push(...r.questions); if (S.quiz.source === 'hand') S.quiz.source = 'ai'; }
        S.notice = `${tr('someAdded', { n: r.questions.length })} ${tr('aiNote')}`; S.dirty = true; S.modal = null;
      } catch (er) { S.modal.error = msg(er); S.modal.busy = false; }
      return render();
    }
    case 'm-launch-go': {
      const g = gameById(S.modal.game), choose = Boolean(S.modal.choose);
      const seconds = Number($('#m-seconds').value), teams = Number($('#m-teams')?.value ?? 0), quizId = $('#m-quiz')?.value;
      const keep = { type: 'launch', game: g.id, choose, quizId, seconds };
      S.modal.busy = true; S.modal.error = ''; render();
      try {
        if (!choose && S.view === 'editor' && (S.dirty || !S.quiz.id)) { S.modal.busy = false; if (!(await saveQuiz())) { S.modal = null; return render(); } S.modal = { ...keep, busy: true }; render(); }
        const r = await api.createSession({ quizId: choose ? quizId : S.quiz.id, mode: g.mode, variant: g.variant, teams, seconds });
        S.modal = null; await openHost(r.code, r.view);
      } catch (er) { S.modal = { ...keep, error: msg(er) }; render(); }
      return;
    }

    // host
    case 'start': case 'reveal': case 'next': return hostAction(act);
    case 'end': if (confirm(tr('endConfirm'))) return hostAction('end'); return;
    case 'kick': return hostAction('kick', el.dataset.pid);
  }
});

document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.modal) { S.modal = null; render(); } });
window.addEventListener('beforeunload', (e) => { if (S.view === 'editor' && S.dirty) { e.preventDefault(); e.returnValue = ''; } });

boot();
