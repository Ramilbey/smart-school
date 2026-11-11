// Small helpers shared by the teacher portal and the student page. Everything that comes from a server or a person is
// escaped before it is put into the page.

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Question text: everything is plain text, except that <b>, <i>, <sup> and <sub> (used by the textbook questions) work. */
export const rich = (s) => esc(s).replace(/&lt;(\/?)(b|i|sup|sub)&gt;/g, '<$1$2>');

/** A picture the server made from a textbook drawing, shown as an image (an image can never run scripts). */
export const svgImg = (svg, alt = '') => (svg ? `<img class="qpic" alt="${esc(alt)}" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}" />` : '');

export const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const fmt = (s, vars = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));

/** seconds left until an end time given by the server clock */
export const secondsLeft = (endsAt, offset) => Math.max(0, Math.ceil((endsAt - (Date.now() + offset)) / 1000));

export const store = {
  get(k, fallback = '') { try { return localStorage.getItem(k) ?? fallback; } catch { return fallback; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* private mode */ } },
};
export const session = {
  get(k, fallback = '') { try { return sessionStorage.getItem(k) ?? fallback; } catch { return fallback; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* private mode */ } },
  del(k) { try { sessionStorage.removeItem(k); } catch { /* private mode */ } },
};

/** Where each lane had got to last time it was drawn, so a redraw can slide from there instead of jumping. */
const lanePrev = {};
/** The track for Team Race: one lane per team, the bar grows with the team's right answers. */
export function raceHtml(rows, teamLabel, colors, mine = null) {
  return `<div class="race">${[...rows].sort((a, b) => a.team - b.team).map((t) => `<div class="lane ${mine === t.team ? 'mine' : ''}"><span class="lane-name" style="color:${colors[t.team % colors.length]}">${esc(teamLabel(t.team))}</span><span class="track"><i data-team="${t.team}" data-to="${t.progress}" style="width:${lanePrev[t.team] ?? 0}%;background:${colors[t.team % colors.length]}"></i></span><b class="pct">${t.progress}%</b></div>`).join('')}</div>`;
}
/** Call after the page was redrawn: the bars slide to their new length. */
export function animateLanes() {
  const bars = $$('.track i[data-to]');
  if (!bars.length) return;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    for (const bar of bars) {
      bar.style.width = `${bar.dataset.to}%`;
      lanePrev[bar.dataset.team] = Number(bar.dataset.to);
    }
  }));
}
