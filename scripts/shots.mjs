// Captures real Mini App screens for the site. Needs the app running: cd ../smart-schools-app && npm run dev:web
import puppeteer from 'puppeteer-core';
const BASE = process.env.APP || 'http://localhost:5173';
const LANG = process.env.LANG_CODE || 'en';
const W = { en: { stall: 'Pomegranate\\.', math: 'Mathematics', eq: 'Solving equations', next: 'step|next', alg: 'Algebra', lin: 'Linear functions' }, uz: { stall: 'Anor\\.', math: 'Matematika', eq: 'Tenglamalarni', next: 'qadam', alg: 'Algebra', lin: 'Chiziqli funksiya' } }[LANG];
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const p = await b.newPage();
await p.evaluateOnNewDocument((l) => { Object.defineProperty(navigator, 'language', { get: () => l }); Object.defineProperty(navigator, 'languages', { get: () => [l] }); }, LANG);
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
p.on('pageerror', (e) => console.error('[page error]', e.message));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = (name) => p.screenshot({ path: `public/shots/${LANG}-${name}.jpg`, type: 'jpeg', quality: 90 });
const clickText = (sel, re) => p.evaluate((sel, re) => { const el = [...document.querySelectorAll(sel)].find((e) => new RegExp(re, 'i').test(e.textContent + ' ' + (e.getAttribute('aria-label') || ''))); el?.click(); return !!el; }, sel, re);

await p.goto(`${BASE}/?go=g4`); await wait(1800); await shot('bazaar');
console.log('stall', await clickText('button', W.stall)); await wait(1200);
for (let i = 0; i < 2; i++) { await p.evaluate(() => [...document.querySelectorAll('.step-btn')].pop()?.click()); await wait(150); }
await p.evaluate(() => [...document.querySelectorAll('path.slice')].slice(0, 3).forEach((el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }))));
await wait(400); await shot('anor');

await p.goto(`${BASE}/?go=course`); await wait(1500);
console.log('spine', await clickText('.spine', W.math)); await wait(500);
console.log('row', await clickText('.toc-row', W.eq)); await wait(900);
console.log('next', await clickText('.dock .btn', W.next)); await wait(700);
const s5 = (await p.$('.xp-slider input')); if (s5) { await p.evaluate(() => { const el = document.querySelector('.xp-slider input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '9'); el.dispatchEvent(new Event('input', { bubbles: true })); }); await wait(400); }
await shot('balance');

await p.goto(`${BASE}/?go=course`); await wait(1500);
await clickText('.spine', W.alg); await wait(400);
await clickText('.toc-row', W.lin); await wait(900);
await p.evaluate(() => { const el = document.querySelector('.xp-slider input'); if (el) { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '3'); el.dispatchEvent(new Event('input', { bubbles: true })); } });
await wait(500); await shot('line');
await b.close(); console.log('ok');
