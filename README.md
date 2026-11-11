# Smart Schools · Telegram bot + Mini App

> **AI supports the teacher. Understanding leads the way.**

Smart Schools is a learning platform for Uzbek schools with four parts that share one server:

| Part | For | Where |
|---|---|---|
| **Telegram bot + Mini App** | Students (Grades 1–11) | `@yordamchi_ustoz_ai_bot`, `/app/` |
| **Student area** (web) | Students: AI tutor with voice and whiteboard, "watch it explained", homework helper, join a game, their own progress | `/student` |
| **Teacher portal** (web) | Teachers: quizzes, seven ready-made live games, results, **Ask AI** (who is struggling, make questions and a game) | `/teacher` |
| **Student game page** | Students joining a teacher's live game on a phone, with reading supports | `/play` |

**Judges: start with [docs/SUBMISSION.md](docs/SUBMISSION.md)** (live links, demo logins, what to try, what is built and what is not).

The pitch deck, film and documents in `../Smart_Schools_Documentation_Package/` are separate from this repository.

---

## Quick start (local, no Telegram needed)

Requires Node.js 20.19+ (tested on Node 24).

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173. This is **browser development mode**: Telegram features are off, the API accepts requests without Telegram `initData`, and a "Browser mode" chip shows on the welcome screen.

Production-style run (one server for the built Mini App, the API and the bot):

```bash
npm run build
```

```bash
npm start
```

Open http://localhost:8787.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server (5173) plus API/bot server (8787) with hot reload, browser dev auth on |
| `npm run build` | Builds the Mini App to `dist/` and the server to `dist-server/` |
| `npm run build:all` | Builds the Mini App, the server and the website in `website/` (into `dist-site/`): everything one server hands out |
| `npm run sync:website` | Refreshes `website/` from a sibling checkout of the website repository (`../website`); only needed when working on the website |
| `npm start` | Runs the production server: Mini App, API and bot (if a token is set) |
| `npm run bot` | Runs **only** the bot (long polling), e.g. on a laptop while the Mini App is hosted elsewhere |
| `npm test` | Unit tests: initData validation, answer checking, hint ladder, AI guardrails, practice generator, content integrity, bot handlers, streak reminders, Grade 6–7 course, homework solver, bot conversations, AI questions in the chat (real SDK over a fake network, no API calls) |
| `npm run typecheck` | TypeScript check |
| `npm run check` | Typecheck, tests and build |

## Configuration

Copy `.env.example` to `.env` and fill in values. **Never commit `.env`.** The server prints which settings are present without printing their values.

| Variable | Needed for | Notes |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Bot | From @BotFather. Also used to validate Mini App `initData` |
| `MINI_APP_URL` | Bot | Public **HTTPS** address of the Mini App |
| `MINI_APP_DIRECT_LINK` | Optional | `https://t.me/<bot>/<shortname>` after BotFather `/newapp` |
| `BOT_MODE` | Bot | `polling` (default, no public URL needed) or `webhook` |
| `TELEGRAM_WEBHOOK_SECRET` | Webhook mode | Random string, verified on every webhook call |
| `BOT_SET_MENU_BUTTON` | Bot | `true` sets commands, the menu button and descriptions at startup |
| `TEACHER_OPEN` | Optional | `true` lets every Telegram user open the teacher report in the Mini App (for a demo or MVP); other students' names are hidden unless the viewer is in `TEACHER_IDS`. Default `false` |
| `ANTHROPIC_API_KEY` | Optional | Turns on live AI phrasing of tutor feedback in the Mini App and AI answers to free-form questions in the bot chat. Without it, curated hints and fixed rules are used. Restart the server after changing it |
| `ANTHROPIC_MODEL` | Optional | Defaults to `claude-opus-5-5` |

**Setting the key on the VPS:** `bash scripts/set-ai-key.sh` asks for the key without showing it, puts it (and `ANTHROPIC_MODEL`, default `claude-sonnet-5-5`) in the server's `.env`, restarts the service and prints the startup lines. Create the key at console.anthropic.com and set a monthly spend limit there first.
| `AI_QUESTIONS_PER_DAY` | Optional | AI answers one student can ask for in the bot chat per day, default `20`. `0` turns them off |
| `REMINDERS` | Optional | `true` (default) sends the evening streak reminder (see below). `false` turns it off for everyone |
| `REMINDER_HOUR` | Optional | Hour the reminders start, default `19`. Never sent from 22:00 |
| `REMINDER_TZ` | Optional | Time zone for that hour and for "today", default `Asia/Tashkent` |
| `ALLOW_DEV_AUTH` | Dev only | `true` lets the API work without Telegram. **Keep `false` in production** |
| `PORTAL_SECRET` | Website portal | Signs teacher login tokens. Blank: a random one is created once and kept in `data/portal-secret.txt` |
| `PORTAL_SIGNUP` | Website portal | `true` (default) lets teachers create accounts on the website |
| `PORTAL_DEMO` / `PORTAL_DEMO_PASSWORD` | Website portal | A ready-made teacher `ustoz` for trying it out. On in development, **off in production** unless `PORTAL_DEMO=true`. The default password is public: change it or leave it off |
| `CORS_ALLOW_LAN` | Website portal | Lets pages from this computer or the school network call the API (phones joining a game). On in development, off in production unless `true` |
| `CORS_ORIGINS` | Website portal | The exact address of the website when it is hosted elsewhere, for example `https://smartschools.example` |
| `TRUST_PROXY` | Behind a proxy | `true` only behind a reverse proxy you control, so rate limits use the real client address |
| `VITE_API_BASE` | Build time | Only if the Mini App is hosted on a different origin than the API |

## The tutor in the chat (Grades 6–7)

The bot works on its own, with no Mini App and no AI service, so the whole demo can be shown in Telegram:

- **23 textbook topics** following the school books: Matematika 6 (7 topics), Algebra 7 (9), Geometriya 7 (3), Fizika 7 (4). Short lessons with pictures drawn to match the numbers. Code in `shared/curriculum/`.
- **Endless practice**: four-button questions with fresh numbers, computed by code. A wrong answer opens a hint, not the answer; the answer comes after three real tries.
- **Homework helper**: type `2x + 3 = 11`, `3/4 + 1/2`, `80 ning 25%` or `(x + 3)²` and it works through the steps one at a time (`shared/solver.ts`, exact fractions, no AI). Dictating with the keyboard microphone arrives as text, so it works too.
- **Motivation**: a daily problem, XP, streaks, levels named after our scholars, and a leaderboard with names hidden.
- **Commands**: `/daily`, `/lessons`, `/practice`, `/solve`, `/progress`, `/settings`, `/about`, plus an always-visible button menu.
- **Free-form questions, only when `ANTHROPIC_API_KEY` is set**: see below.

### Free-form questions (optional, needs an AI key)

With a key, the bot routes typed text like this:

1. Menu buttons, commands and problems the homework helper can solve work as always, with no AI call.
2. A bare topic word (`foiz`, `percent`) opens the lesson as always, with no AI call. So does anything without a real word in it (`12`, `5 km/h`).
3. A real question (it has a `?` or at least three words) goes to the AI, with the student's grade and the text of the closest lesson as context. The reply is at most a few sentences, in the student's chosen language, and marked **🤖 AI reply**. If a lesson matched, its buttons come with it.
4. If the call fails, times out or its reply is rejected, the student gets the same reply as without a key: the lesson button, or "I did not get that yet".

The AI step comes before the lesson reply on purpose. The topic search matches most real school questions (13 of 14 in a sample across three languages), so behind it the AI would almost never see a question that a lesson could help with.

**Limit:** `AI_QUESTIONS_PER_DAY` per student per Tashkent day (default 20). Questions are counted before the call, and failed calls count, because they may still be billed. The count lives in `data/ai-usage.json` (one day and a number per Telegram id, never the question), apart from progress, because the Mini App can overwrite progress. It survives a restart. At the limit the student is told so and can still use everything else. There is no limit across all students, so set a spend limit on the API key's workspace as well.

**Slow answers:** long polling now handles chats side by side, and each chat's own messages in order, so one student waiting on the AI (up to 15 s, with "typing…" showing) does not hold up anyone else.

Code: `chatTutor` in `server/tutor.ts`, `aiAnswer` in `server/study.ts`, `server/aiUsage.ts`. The server passes the asker to the bot only when a key is set, so a bot built without one has no way to reach the API.

Buttons carry their own state and questions rebuild from a seed, so a restart in the middle of a round breaks nothing. Pictures are drawn with `@resvg/resvg-js`; if it is missing the bot sends text. Progress is shared with the Mini App (**Grade 6–7 textbooks** on its main screen), and the server merges saves, so a stale app tab cannot erase what was earned in the chat.

The lessons are written in our own words from the books' topics. They are drafts awaiting review by a teacher, including all Uzbek and Russian text.

## One address for everything

One Node server hands out all of it, so there is one link to share:

| Address | What |
|---|---|
| `/` | The website (the scroll story) |
| `/teacher.html` (or `/teacher`) | The teacher portal |
| `/play.html?code=123456` (or `/play`) | Where students join a game |
| `/student` (a page of the Mini App build, `/app/student/`) | **The student area**: the AI tutor, the visual explainer, the homework helper, and join-a-game, in an aurora-glass look (dark, frosted cards, animated charts) with a sidebar on laptops and bottom tabs on phones; the home page shows the student's own activity, kept on the device only (`src/student/activity.ts`) (`student/index.html`, `src/student/`). Pages are the hash of the address: `#/tutor`, `#/explain`, `#/homework`, `#/game`; `#/tutor?q=…` starts a lesson. |
| `/app/` | The Telegram Mini App |
| `/api/...` | The API (portal, Mini App, bot) |

The website needs no settings: on the same address it finds the API by itself, so there is no `VITE_API_BASE` and no `CORS_ORIGINS` to set.

```bash
npm run build:all        # the Mini App, the server and the website (it builds ../website into ./dist-site)
npm start                # http://localhost:8787
```

- **With `dist-site/` present** the website is at `/` and the Mini App moves to `/app/`. Set `MINI_APP_URL` to `https://your-host/app/`.
- **Without it** nothing changes: the Mini App stays at `/`.
- The Mini App and the website are built with relative links, so the same files work in both places.
- The server answers byte-range requests (the film can be skipped through in Safari) and sends text files gzipped.
- `npm run build:site` builds the website and copies it. The website folder is expected next to this one (`../website`); set `WEBSITE_DIR` if it is elsewhere.
- **Docker:** run `npm run build:site` first, then `docker build .`. The image copies `dist-site/` in. (This folder is not under git; the website folder is. To deploy from a git host, put both folders in one repository, or deploy from this folder with the host's command line tool.)

## Teacher portal (the website)

The website in `website/` (a copy of the website repository, refreshed with `npm run sync:website`) has a **teacher portal** (`teacher.html`) and a **student page** (`play.html`). This server is their back end (`server/portal.ts` and the files it uses). It is separate from the Telegram bot and Mini App: it has its own accounts, and students never need one.

**What a teacher can do:** log in (or create an account), make quizzes by hand, from one of the 23 textbook topics (with the textbook pictures), or as an AI draft (Gemini or Claude; topic or pasted text, grade, standard or gamified style, question types), then start a live game and read the results afterwards.

**Seven ready-made games** (shown as cards on the teacher's home page). Two engines run them all: a teacher-paced one (*battle*) and a student-paced one (*speed*); `server/live.ts` has the rules.

| Game | How it plays | The teacher changes |
|---|---|---|
| Quiz Battle | The teacher moves through the questions. A right answer scores 500 plus up to 500 for speed. Optional teams (2 to 6); a team's score is the average of its students | Any quiz, seconds per question |
| Speed Round | Every student goes through the questions at their own pace, in their own random order, for a set time. 100 points per right answer. Ends early when everyone is done | Any quiz, round length |
| Last One Standing | A Quiz Battle where a wrong or missing answer puts a student out. If everybody would be out on the same question, nobody is. Ends when one is left | Any quiz, seconds per question |
| Team Race | A Speed Round with teams (3 by default). The teams' right answers move them along a race track on the big screen and on the phones | Any quiz, round length, number of teams |
| True or False Blitz | Template: one statement per line, `= true` or `= false` at the end. Played as a Speed Round | The statements |
| Math Sprint | Template: tick the kinds of sums (add, subtract, multiply, divide, squares, missing number), the smallest and largest number and how many. The server computes every answer. Played as a Speed Round | The kinds of sums and the numbers |
| Word Typer | Template: `question = answer \| other spelling`, one per line. Students type the answer; capitals, spaces, end punctuation and the different Uzbek apostrophes do not matter. Played as a Speed Round | The words |

The three templates only make a quiz (source "Ready-made game"), which opens in the normal editor so every question can still be changed. A question can be a choice, a number or a typed word.

**Ask AI and class insights** (`server/teacherAi.ts`, `server/classInsights.ts`). The teacher can ask in plain words: "who is struggling?", "which questions were hardest?", "who is getting worse?", or "make 6 gamified questions about matrices and play them as a team race". Facts about the class come from the saved results (every game stores, per student, which questions were right or wrong), never from the model's words: the lists under an answer are computed by code, and the counts the model may quote are computed too. Student names are replaced by codes (S01, S02…) before anything is sent to the model and turned back into names afterwards. Questions the AI writes go through the same checks as hand-written ones, the right answer is shuffled, and the teacher reads them before playing. The demo teacher starts with **sample** class results, labelled "Sample data". Limits: 8 requests a minute and 80 a day per teacher.

**Reading supports** on the student game page: read the question aloud (server voice, with the browser's own voice as a fallback), larger text, easy-read letters. Kept on the student's phone only.

**Students** open `play.html`, type the 6-digit code (or scan the QR code on the teacher's screen) and a first name. Up to 80 students per game, at most 5 running games per teacher.

**Run it on your computer:**

```bash
cd smart-schools-app && npm run dev        # the API on http://localhost:8787
cd website && npm run dev                   # the website on http://localhost:5190
```

(Or build everything and use one address: `npm run build:all && npm start`, then open http://localhost:8787/teacher.html. See "One address for everything" above.)

Open http://localhost:5190/teacher.html and press "Use the demo teacher" (development only). To let phones join, find your computer's network address (for example `192.168.1.20`), open `http://192.168.1.20:5190/teacher.html` on the teacher's computer, and put that address into the "Address students use" box on the game screen: the QR code follows it. Phones and computer must be on the same Wi-Fi.

**How it stays safe** (all of it is checked by `tests/portal.test.ts`):

- Passwords are stored as salted scrypt hashes, never as text. Login tokens are signed and expire after 7 days. Login and sign-up are rate limited.
- A teacher only ever sees and runs their own quizzes and games.
- The clock, the scoring and the answers live on the server. A student's phone is never sent the right answer before the teacher reveals it, and never another student's private id.
- Quiz text is escaped by the website. Pictures can only be ones the server drew from the textbook, and are shown as images, so they cannot run code.
- Every input has a length limit; quizzes are limited to 40 questions and 100 per teacher.

**Not done yet:** games and live sessions live in memory (a restart ends running games; quizzes and results are kept in `data/quizzes.json`, `data/history.json`, accounts in `data/teachers.json`); no password reset (a teacher who forgets it needs a new account); the website portal, the student page and the quizzes it makes are English only (the Telegram bot and Mini App keep their own Uzbek, Russian and English); it was tested in a desktop browser pane and on a 375 px phone size, not on real phones or a school network with 30 phones.

## Evening streak reminders

Grade 7 keeps a daily streak (🔥 in the top bar). To protect it, the bot sends **one** short message in the evening to students whose streak is still alive (they practised yesterday) but who have not practised today. The message is in the student's app language and has a **🔥 Keep my streak** button that starts today's problem in the chat.

- From `REMINDER_HOUR` (19:00) until 22:00 Tashkent time, checked every 10 minutes. At most one message per student per day.
- Nobody without a streak, nobody who already practised today, nobody whose streak is already broken.
- Students control it in the bot: `/reminders off`, `/reminders on`, `/reminders` (status) and `/reminders test` (sends a preview right away).
- If a student blocks the bot, they are not messaged again until they send `/reminders on`.
- The state lives in `data/reminders.json` (user id, last reminder day, off/blocked flags only).

## Going live in Telegram

Follow **[docs/TELEGRAM_SETUP.md](docs/TELEGRAM_SETUP.md)**: create the bot, deploy over HTTPS, register the Mini App, set the QR code in the pitch deck, and test on a phone. Problems: **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)**.

## Look and feel (redesign, Nov 2026)

- **Bot pictures** are drawn as SVG on one "plate" (lapis ground, turquoise tile-star border, cream panel): `shared/curriculum/plate.ts` is the frame, `visuals.ts` the lesson pictures, `cards.ts` the bot's own cards (home, result, evening reminder, homework chalkboard). `server/render.ts` turns them into PNGs.
- **See every card without Telegram:** `npx tsx scripts/preview-cards.ts` writes samples to `docs/card-samples/` and the BotFather cover to `docs/bot-cover.png` (upload it in @BotFather → Edit Bot → Edit Description Picture; only the bot owner can).
- **Mini App:** Grades 1–4 are a Registan bazaar (`screens/kids/KidsHome.tsx`) with a Rishtan plate that fills as stations are finished; Grades 5–11 are a school notebook (squared paper, spiral, index tabs). Both skins live in `src/styles/redesign.css`, loaded last.
- Cards use Onest only. The chalkboard turns each glyph a little to look written; a real handwriting font (TTF) would improve it.

## What is real, simulated or missing

See **[docs/STATUS.md](docs/STATUS.md)** for the full list, including what was tested and what was not. In short:

- **Working:** both lessons end to end, deterministic answer checking, the four-rung hint ladder, quizzes, XP and badges, progress (on the device, plus server sync when opened in Telegram), language switching, deep links, the bot's commands and launch buttons, evening streak reminders, server-side `initData` validation.
- **Simulated and labelled:** camera headcount, class dashboard numbers, teacher approval (local label only).
- **Not yet done:** real camera or roster integration, teacher accounts, more lessons, teacher-reviewed Uzbek/Russian wording.

## Project layout

```
smart-schools-app/
├── index.html              Mini App entry, Telegram SDK, boot-failure message
├── student/                The student area's page (src/student/ holds its code)
├── website/                The landing page, teacher portal and student game page (a copy of the website repository)
├── shared/                 Used by both the client and the server
│   ├── lessons/            Grade 4 and Grade 7 content (uz/ru/en), quizzes, hint ladders
│   ├── check.ts            Deterministic answer checking + hint-ladder rules
│   ├── tutor.ts            Curated replies + AI output guardrails
│   ├── practice.ts         Seeded Grade 7 practice generator
│   └── format.ts           School-style numbers "−2", "0,5", "(2; 5)"
├── src/                    React Mini App
│   ├── lib/                Telegram SDK wrapper, store/progress, i18n, API client, tutor hook
│   ├── components/         Brand, owl companion, fraction visuals, interactive graph, tutor, quiz
│   ├── screens/            shell/ (welcome, grades), kids/, academic/, teacher/
│   └── styles/             base, shell (deck look), kids (warm/playful), academic (clean)
├── server/                 Node server: static hosting, API, bot, initData validation, AI tutor,
│                           and the website's teacher portal (portal.ts, accounts.ts, quizzes.ts, quizMaker.ts, live.ts)
├── tests/                  node:test unit tests
├── docs/                   Audit, Telegram setup, troubleshooting, status
├── Dockerfile              One container for everything
└── .env.example            Variable names and placeholders only
```

## The whiteboard: Personal AI Tutor and Visual Explainer

Two screens in the Mini App (`/app/?go=tutor`, `/app/?go=explainer`, or `/start tutor` and `/start explainer` in the bot; also from the main menu) that **speak and draw at the same time** on one shared whiteboard. They work in a plain browser too, so a laptop can open `https://<server>/app/?go=explainer`.

- **The AI never makes a picture or a video.** It writes a "board script": one JSON line per beat, each a sentence to say plus shapes to draw (text, formulas in LaTeX, lines, polygons, grids, graphs of a formula, a vocabulary strip in three languages). `shared/board/script.ts` defines the format and checks every line (clamps, drops unknown ops, strips markup) on the server and again in the browser; `shared/board/expr.ts` reads graph formulas without running code. The browser draws it (`src/board/Board.ts`: strokes drawn along their length, formulas written in from the left, a glowing pen) and says it with the browser's speech synthesis (`Narrator.ts`); `Player.ts` keeps drawing and speaking in step.
- **Visual Explainer:** type any topic; the AI streams a whole lesson (`POST /api/board`, mode `lesson`), and the first sentence is spoken a few seconds after the question, while the rest is still being written. Chapters, a scrubber, speed, and "Try one" (a question the browser checks). Asking while it plays pauses it, answers on a clean board, and then the lesson comes back to the sentence that was interrupted.
- **Personal Tutor:** a conversation (mode `turn`); each answer builds on what is already on the board (the browser sends a short list of ids) and may clear it.
- **Language helper:** the app language (EN / RU / UZ) sets the language the AI writes and speaks, and vocabulary strips show key terms in English, Russian and Uzbek (tap to hear). The Russian and Uzbek wording is a draft for a teacher to review.
- **Works with no key:** two prepared lessons (`shared/board/samples.ts`: the Pythagorean theorem and quadratic equations, with prepared answers to three questions each) play with no AI at all, in English. They are labelled "Prepared lesson". With a key, anything can be asked and the lesson is labelled "Made by AI just now: it can make mistakes".
- **Server voice (`server/tts.ts`, `POST /api/tts`):** the browser's own voices are missing in many places (Telegram's phone webviews often have none, almost no browser has Uzbek), so the server turns each sentence into an MP3 with the free `edge-tts` program (Microsoft's neural voices: Jenny for English, Svetlana for Russian, Madina for Uzbek; the "Multilingual" English voices sounded richer but took 3 to 7 seconds to start from the server, Jenny about half a second). The browser asks for the next two sentences while it plays the current one, finished sentences are kept on disk by a hash (`data/tts`, 200 MB limit, so repeated lessons are instant), at most 3 run at once, one retry on a dropped connection, and the page falls back to the browser's voice and then to reading speed if the server voice fails. The program is run with an argument list, never a shell. `/api/session` says `tts: true` when it is installed. Install: `python3 -m venv tts-venv && tts-venv/bin/pip install edge-tts` in the app folder (or set `TTS_BIN`); `TTS_DISABLED=true` turns it off; the sentences of the two prepared lessons are made in the background at start-up (`TTS_WARM=false` skips that); `BOARD_GLOBAL_TTS` (6000) caps sentences a day. Only lesson sentences go to Microsoft, never names or accounts. On phones the first tap anywhere unlocks sound (`armAudioUnlock`, plus an unlock inside every start/talk tap).
- **Voice, honestly:** with no server voice, speaking uses the browser's built-in voices (free, nothing leaves the device through our server); with no voice for a language the words are shown at reading speed. Listening uses the browser's speech recognition: Chrome, Edge and Safari have it, **Firefox does not**, and Telegram's phone webviews often do not; there the student types or uses the keyboard's microphone key. It is tap-to-talk (or Space), not always-on, because an open microphone would hear the tutor's own voice.
- **Which AI:** Claude when `ANTHROPIC_API_KEY` is set, otherwise Google Gemini when `GEMINI_API_KEYS` is set (`AI_PROVIDER=anthropic` or `gemini` forces one; `server/boardProvider.ts`). Gemini is called through its plain HTTP API (`server/gemini.ts`, no dependency): `GEMINI_API_KEYS` takes several keys separated by commas and moves on to the next when one is out of free quota; `GEMINI_MODEL` (default `gemini-3-flash-preview`) and `GEMINI_THINKING` (default `minimal`, the fastest). The key goes only in a request header, never in an address, a log or an error. The bot's chat tutor and the portal's AI quiz draft still use Claude only. **Privacy:** on Gemini's free tier Google may use what is sent to improve its products, so for the hackathon demo ask students to type no personal details, and use a paid key (or Claude) for a real pilot. Measured on 2026-11-10 with the real model: the lesson title after about 3 s, the first sentence after about 3.3 s, a whole 8-beat lesson in about 7.5 s; a conversation reply starts in about 1.4 s.
- **LaTeX in JSON:** a model often writes `\times` with one backslash inside JSON, which JSON reads as a tab; `fixTex` in `shared/board/script.ts` puts the backslash back, so formulas never show "imes".
- **Cost control:** `ANTHROPIC_MODEL` (the script `scripts/set-ai-key.sh` sets `claude-sonnet-5-5`), per-day allowances `BOARD_USER_LESSONS` (8) and `BOARD_USER_TURNS` (60) per Telegram user, `BOARD_ANON_LESSONS` (3) and `BOARD_ANON_TURNS` (12) per visitor address, and global caps `BOARD_GLOBAL_LESSONS` (300) and `BOARD_GLOBAL_TURNS` (1500) a day; `BOARD_ANONYMOUS=false` requires a Telegram login. Counted before the call and not given back. Set a monthly spend limit on the API key as well. Roughly 1 to 2 cents per tutor reply on Sonnet 5.5.
- **Not yet verified:** the live AI path was tested against a pretend model that streams in the real wire format (server route, SDK stream, browser live feed), not against the real API; and the microphone and voices were not heard on a real device.

## How the tutor stays honest

- **The AI never decides correctness.** Answers are checked by fixed rules (`shared/check.ts`), in the app and again on the server.
- **Hints come in order:** 1 concept nudge → 2 visual example → 3 next step → 4 worked guidance. The student must try first, and rung 4 unlocks only after at least two wrong attempts. Hints never cost XP.
- **Live AI is optional and fenced in.** When `ANTHROPIC_API_KEY` is set, the server asks the model to phrase feedback using only the curated hint. The reply is discarded in favour of the curated text if it reveals the answer, is in the wrong language, is too long, contains links or markup, or the model declines. Every reply is labelled "AI reply" or "Lesson hint".
- **Free-form chat questions have weaker guards, because there is no answer key.** The model is told to answer school subjects only, to treat the student's text only as a question, and to give hints instead of homework results. The code then rejects replies in the wrong script, too long, with links or markup, and, when the student's question has numbers in it, any reply with a number that is not the student's, the lesson's or a unit fact (`givesHomeworkAnswer` in `shared/tutor.ts`). That check is a heuristic: a result spelled out in words gets past it, and staying on topic rests on the prompt alone. Nobody reviews these answers before a child reads them.
- **No invented authority.** The tutor is told never to cite textbooks or claim teacher approval, and the app marks all lesson content as "Draft · not yet reviewed by a teacher".
- **Privacy:** no names or Telegram ids are sent to the AI provider. The server stores only learning progress, keyed by a validated Telegram user id. **With a key set, whatever a student types as a question does go to the AI provider, in the student's own words**, and it could contain personal details. That is for this prototype only: the planned product runs the AI on each school's own server.
