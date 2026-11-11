# Smart Schools — Project Audit (Phase 1)

Audit date: 17 October 2026. Scope: everything under `~/Desktop/smart schools/`.
No files in the existing package were modified, moved or deleted.

## A. Current project architecture

The folder holds **one item**: `Smart_Schools_Documentation_Package/` (~878 MB, 141 files, not a git repository).

| Area | What exists | How it runs |
|---|---|---|
| Docs (`01`–`06_*.md`) | Concept, technical architecture proposal, MVP/Telegram spec, pitch brief, pitch script and Q&A, roadmap | Read-only Markdown |
| Pitch deck (`Pitch_Kit/Deck/index.html`) | 15 slides plus 2 appendix slides, 1920×1080 stage scaled to the screen, GSAP + SplitText + DrawSVG animations, film on slide 2, QR codes on slides 11 and 15 | Static file opened in Chrome. No build step, no server. Fonts, GSAP and the QR library are vendored locally in `Deck/assets/` |
| Film | `Smart_Schools_Film.mp4` (1:48, about 96 MB, copied into `Deck/assets/` too), `.srt` and `.vtt` captions | Played by the deck |
| Backups | `Smart_Schools_Pitch.pptx` (about 122 MB), `Smart_Schools_Pitch.pdf` | Office / PDF viewer |
| Render pipeline (`Pitch_Kit/_source/`) | Node scripts (puppeteer-core, ffmpeg-static, msedge-tts, pptxgenjs) that render the film, synthesise the voice-over and export the deck | `node render.mjs` etc. `node_modules` is installed |

**Frontend framework:** none. The deck is hand-written HTML/CSS/JS.
**Build system:** none for the deck. `_source/package.json` exists only for the rendering scripts.
**Backend:** none.
**Telegram bot or Mini App:** none. No Bot API calls, no `telegram-web-app.js`, no bot token variable.
**Tests, CI, Docker, deployment config:** none.

## B. Existing functional features

- Animated pitch deck with keyboard navigation, presenter window (P), notes (N), captions (C), refresh-safe position and reduced-motion handling.
- Embedded film with captions.
- QR code generation in the deck from the `DEMO_URL` constant. It is still the placeholder `https://t.me/your_bot_name/app`, and the deck shows an amber warning on slide 11 until it is changed.
- PowerPoint and PDF backups, plus the scripts that rebuild them.

## C. Missing features (described in the docs or deck, but not implemented)

The deck's live-demo slide tells judges they can "answer wrong on purpose" in Grade 4 and "drag the slope" in Grade 7. **None of that exists yet.** Missing:

- Telegram bot (`/start`, `/help`, Mini App launch button, menu button).
- Telegram Mini App: welcome screen, Uzbek/Russian switch, grade selection, lessons.
- Grade 4 gamified fractions lesson, hint ladder, quiz, XP and achievements, progress.
- Grade 7 interactive linear-graph lesson, step-by-step reasoning, quiz, topic progress.
- AI tutor (live or curated fallback).
- Backend for `initData` validation, tutor proxying and progress.
- Simulated teacher dashboard (it exists only as a static picture on deck slide 10).
- Environment configuration, deployment and bot registration.

## D. Recommended implementation approach

1. **Leave the documentation package untouched.** The only future edit there is the user's own one-line `DEMO_URL` change once the bot exists.
2. **Build the Mini App as a separate application** in a sibling folder, `smart-schools-app/`. The deck is a fixed-size static slide stage with no component system, so extending it would put both at risk. The Mini App reuses the deck's **brand assets**: the four-arc logo, the colour tokens (ink, teal, blue, amber, coral, paper) and the self-hosted Onest, Unbounded, Spectral and JetBrains Mono fonts, which already include Cyrillic and Latin-Extended glyphs for Russian and Uzbek (o‘, g‘).
3. **Stack:** Vite + React + TypeScript for the Mini App, and one small dependency-free Node server for:
   - serving the built Mini App over HTTP(S),
   - `POST /api/session`: secure Telegram `initData` HMAC validation,
   - `POST /api/tutor`: an AI tutor proxy that keeps the key on the server, with guardrails, falling back to curated content,
   - `GET/PUT /api/progress`: progress keyed only by a **validated** Telegram user id,
   - the Telegram bot, using the official Bot API through `fetch` with long polling (no inbound HTTPS needed) or an optional webhook.
4. **Deterministic first, AI second.** Answer checking, hint order, scoring and progress run in the client from curated lesson data, so the demo works with no network. The AI only rephrases feedback when it is configured and passes the guardrails.
5. **Two lessons done well** (Grade 4 fractions, Grade 7 linear function), plus a clearly labelled simulated teacher dashboard.

## E. Proposed file and folder structure

```
smart schools/
├── Smart_Schools_Documentation_Package/   ← unchanged
└── smart-schools-app/
    ├── index.html, vite.config.ts, tsconfig.json, package.json
    ├── .env.example                        ← variable names and placeholders only
    ├── public/fonts/                       ← copied from the deck
    ├── shared/                             ← lesson content and answer checking (client and server)
    ├── src/                                ← Mini App (React)
    │   ├── lib/        telegram, i18n, store, api
    │   ├── components/ logo, owl companion, fraction visuals, graph, quiz, hint ladder
    │   └── screens/    shell, kids (Grades 1–4), academic (Grades 5–11), teacher
    ├── server/                             ← Node: static hosting, API, bot, initData validation, tutor
    ├── tests/                              ← node:test unit tests
    └── docs/                               ← audit, bot setup, deployment, troubleshooting, status
```

## F. Setup that needs you

| Item | Why it needs you |
|---|---|
| Create the bot with **@BotFather** (`/newbot`) and copy the token | Requires your Telegram account |
| Put the token in `.env` as `TELEGRAM_BOT_TOKEN` | Secret. Never committed and never shown in chat |
| Choose an HTTPS host for the Mini App (Render, Railway, Fly.io or a VPS for the full server; any static host if you only need the curated tutor) | Requires your hosting account |
| Register the Mini App with BotFather `/newapp` (short name `app`) so `https://t.me/<bot>/app` works | Manual BotFather step |
| Set `DEMO_URL` in `Pitch_Kit/Deck/index.html` to the real link | Your file, your decision |
| Optional: `ANTHROPIC_API_KEY` on the server for live tutor phrasing | Paid key. Without it, the curated fallback is used |
| Teacher review of the Uzbek and Russian lesson text | The text is drafted, not teacher-approved. The app says so |

### Configuration status found during the audit
- No `.env`, no token and no API key in the project. No `TELEGRAM_*` variables in the shell.
- Tooling present: Node 24, npm 11, Python 3.12, ffmpeg and ngrok. npm registry, `telegram.org` and `api.telegram.org` are reachable.
