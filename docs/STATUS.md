# Status: functional, simulated, missing, tested

As of 17 October 2026. "Tested" means I ran it.

**Update, 11 Nov 2026 (MVP freeze): where things stand.** Live at https://smart-schools.163-245-192-206.sslip.io on a small VPS (systemd + nginx + HTTPS). New since the Mini App work below: the website with a **teacher portal** (quizzes, seven live games, results), a **student area** (`/student`: AI tutor with voice and whiteboard, visual explainer, homework helper, join a game, on-device progress), a server voice for the lessons (edge-tts, cached), **Ask AI for teachers** (class insights, AI-written quizzes, play-as-a-game; student names replaced by codes before any model call), reading supports on the student game page, the AI running on Google Gemini with fallback models (the bot's free-text tutor now uses it too), and nightly backups. **Tested:** 237 tests in this repository and 5 in the website, typecheck clean; the live site, the portal's AI and the bot's setup (menu button, commands, long polling) were checked against the running server. **Not tested:** a real phone inside Telegram (voice playback, microphone), anything with real students. The Uzbek and Russian text is still an unreviewed draft. Full list of what is built, simulated and planned: [SUBMISSION.md](SUBMISSION.md).

**Update, 5 Nov 2026: AI answers to free-form questions in the bot chat. Built and tested against a stub; never yet run with a real key or a real model.** With `ANTHROPIC_API_KEY` set, a real question typed to the bot gets a short AI answer labelled "🤖 AI reply", using the student's grade and the closest lesson's text. It covers school subjects only, gives hints instead of homework results, and is limited to `AI_QUESTIONS_PER_DAY` per student (default 20). With no key, or when a call fails, times out or its reply is rejected, the student gets the same reply as before. Long polling now handles chats side by side, so one slow answer does not hold up other students. Tested: 26 new tests running the real SDK over a fake network (114 in all pass): reply shown, 11 kinds of failure, limit, no key, routing, escaping, polling order. Each guard was also broken on purpose in a throwaway copy, to confirm the tests catch it. The real SDK was also run over local HTTP against a stub. **Not tested:** how the real model behaves (staying on topic, resisting instructions in a question, writing Uzbek, not calculating), how often the number guard rejects a good answer, real latency, and any of it in real Telegram. `ANTHROPIC_API_KEY` is still empty in `.env`, and the running server needs a restart to pick up the code and the key. The Uzbek and Russian label and limit message are my drafts, and the AI's own Uzbek has not been reviewed by anyone. See "Free-form questions" in the README.

**Update, 19 Oct 2026 evening: real homework report for teachers.** The teacher dashboard now has a **Uy vazifasi** (homework) section with real data: a grid of students × questions with ✓/✗, each student's score, a "wrong" count per question with the most-missed question highlighted, and a tap on a student shows their wrong answers (what they chose, the right answer, the misconception) plus wrong tries and hints on the guided problem. Grades 7 and 4. Every mark is re-checked on the server against the answer key; the client's own score is ignored. The API is `GET /api/teacher/report`: valid Telegram `initData` **and** a Telegram user id listed in `TEACHER_IDS` (otherwise 401 or 403). Students are shown by their Telegram first name only (cleaned, at most 24 characters), saved next to their progress when they sync; no surnames or usernames. Teachers not on the list, and empty classes, see the labelled sample data. The new Uzbek and Russian labels in this section are my drafts and have not been reviewed by a native speaker. Tested: 11 new unit tests (aggregation, re-checking, junk input, names, `TEACHER_IDS` parsing, 401/403/200), and end to end on the production build with a test bot token and two signed student logins (two students' real marks, 401 without login and with a forged id, 403 for a student, the grid and the detail in the browser at phone size). **Not yet seen with real Telegram accounts:** the running server must be restarted with the teacher's Telegram id in `TEACHER_IDS` in `.env` (see `.env.example`).

**Update, 17 Oct 2026 afternoon:** the real bot **@yordamchi_ustoz_ai_bot** is connected. The server ran on the laptop, exposed over HTTPS through an ngrok tunnel. Telegram's API confirmed the token, the commands (en/ru/uz), the **Smart Schools** menu button pointing at the Mini App, the descriptions, and long polling (no webhook). Still to check by hand on a phone: `/start` in a real chat, the Web App button, and the Mini App inside Telegram (see the checklist in TELEGRAM_SETUP.md, step 7). Fixed during deployment: Node gave up on Telegram's servers after 250 ms per address on this network, so the server now allows 2.5 s (`NET_CONNECT_ATTEMPT_MS`).

**Update, 5 Nov 2026:** the bot is now a tutor that works on its own in the chat: 23 Grade 6–7 topics following the school textbooks, generated practice with hints, a daily problem, a step-by-step homework helper, XP, streaks and levels. The same course is in the Mini App. 82 automated tests cover it against a mocked Telegram; every generated question is re-checked (equations by the independent solver, sums by a separate re-calculation), and pictures are checked for real geometry. **Not yet seen by a person in real Telegram**, and the lesson text, above all the Uzbek and Russian, has not been reviewed by a teacher. No AI service is connected (`ANTHROPIC_API_KEY` is empty): the course and helper run on fixed rules.

**Update, 5 Nov 2026 evening: chat practice in the teacher report.** The report screen now has a **Darslik mashqlari** (textbook practice) section, under the same teacher-only `GET /api/teacher/report` (new field `practice`). Per student: topics practised, questions answered, percent right on the first try, and the weakest topic. Per topic: how many students practised it and the average first-try percent (the mean of each student's percent, so one very busy student cannot outweigh the others), weakest first and highlighted. Students who answered nothing are left out, and a topic is called weak only if something in it was actually missed. The section has its own live or sample label, because a class can have real practice and no quiz yet; the dashboard banner was reworded to match. The new Uzbek and Russian labels are my drafts and have not been reviewed by a native speaker.

Limits of these numbers:
- Practice is saved only as totals per topic (`progress.bot.topics`), so unlike quiz marks it **cannot be re-checked question by question**. Impossible values are cleaned up (more right than answered, negatives, non-numbers, unknown topics), but a student who tampers with their own upload could still inflate their own numbers.
- It counts chat and Mini App practice together: both save to the same place and cannot be told apart.
- A student using an out-of-date app tab and the chat at the same time can be slightly undercounted, because the merge keeps the larger total rather than adding them.
- "Class" means everyone who practised, as there are no classes yet. A teacher who practises is counted too, marked "(siz)".

Tested: 6 new unit tests, one of which drives the real bot code against a mocked Telegram and reads the result back through the report (4 answers, 2 right first time, 50%, the right weakest topic, and 403 for that same student). End to end on the production build, on a separate port with a test token and scratch data: 200 for the teacher, 403 for the student, 401 with no login or a forged id, and the numbers matched a hand calculation. In the browser at phone size: real practice with no quiz yet, in uz, ru and en, and a student's login (sample only), in uz. Nobody has practised, nothing missed, and a server still on the old code (sample, no crash) were each checked once in ru, through a small local proxy that changed only the `practice` field. Only Onest appears in the section, with no capitals or italics in its text. **Not yet seen with real Telegram accounts.** To go live: the running server must be restarted, and `TEACHER_IDS` must be set in `.env` (it has no value yet, so until then everyone gets 403 and sees the sample).

**Loading animation (5 Nov 2026):** the approved Smart Schools loading animation plays on the deck's title slide, as a short video for a brand-new student's first message in the bot (and at the top of `/about`), and on the Mini App's welcome screen. Not yet seen inside real Telegram: if the video upload is rejected the bot logs `loading animation skipped` and carries on with the language question.

## Functional (implemented and working)

**Mini App, shared**
- Welcome screen with brand, core message, the four systems, and Uzbek/Russian selection (English as an extra).
- Grade selection for 1–4 and 5–11. Grades 4 and 7 have lessons. The other grade numbers are shown greyed out with an honest note.
- Navigation stack, a main-menu button on every screen, and Telegram BackButton support.
- Settings sheet: live language switch, prototype status, demo reset.
- Progress saved in `localStorage`. When opened in Telegram it also syncs to the server, keyed by the **validated** Telegram user id.
- Deep links: `?go=g4|g7|teacher`, `/start g4` in the bot, `startapp=g7` in `t.me` links.
- Responsive mobile-first layouts, reduced-motion support, keyboard focus styles, ARIA labels, on-screen keypads (so the phone keyboard doesn't cover lessons in Telegram).
- Boot-failure message if the bundle can't load, and an error boundary per screen.

**Grades 1–4 · Grade 4 fractions (gamified)**
- Mission map with 5 stations. Owl companion Zukko.
- Equal parts: pick the fairly cut shapes, with feedback for wrong or missed picks.
- Build a fraction: interactive pie, live numerator/denominator, two challenges with guidance.
- Compare: interactive fraction wall plus two comparison questions.
- Homework helper: 2 problems (number and choice) with the 4-rung hint ladder, misconception-specific feedback and a visual hint.
- 5-question quiz with immediate feedback. Stars, XP (once per activity, never lost for hints), 6 badges, mission-complete screen with a summary and a "take a break" note.

**Grades 5–11 · Grade 7 linear function (academic)**
- Topic home: sections, progress, skill-level mastery indicators, best score, and greyed-out future topics and subjects.
- Overview with objective and prerequisites.
- **Interactive graph**: drag the y-intercept and slope handles (touch, mouse, or keyboard arrows), sliders, live coloured equation, slope triangle, value table, and 3 auto-detected challenges.
- Step-by-step reasoning: predict each step, then a reveal with "why it works", synced to graph highlights.
- Guided problem: k and b inputs, misconception detection (sign, Δx/Δy flip, (−)·(−), y-as-b), the student's wrong line drawn on the graph, the hint ladder with a Δx/Δy visual, and a free-question box.
- 6-question check, then results: score, per-skill results, misconceptions spotted from the chosen distractors, recommendations (review a section or do targeted practice).
- Targeted practice: seeded generator for 6 skills, with hint, solution after 2 misses, and first-try scoring.

**Tutor**
- Deterministic answer checking in the client **and again on the server**.
- Curated hint flows for every problem in uz/ru/en. These always work, even offline.
- Optional live AI phrasing (Claude via the official SDK, server-side key, low effort for speed, server-side refusal fallback), with guardrails: answer-leak detection, language and length checks, no links or markup, rung-4 cap, rate limit, no personal data sent. Every reply is labelled with its source.

**Bot**
- `/start` (welcome, demo explanation, Grade 4 and 7 tips, reopen instructions, **Open Smart Schools** Web App button), `/help`, `/app`, a fallback for unknown commands, a plain-text nudge, and group handling.
- Replies in the user's Telegram language (uz/ru, English by default).
- Sets commands, the menu button and descriptions at startup.
- Checks that the Mini App URL is reachable, and explains a missing or unreachable URL clearly.
- Long polling (default) or webhook with secret-header verification.
- **Evening streak reminders (19 Oct 2026):** one message per day, 19:00 to 22:00 Tashkent time, only to students whose Grade 7 streak is alive but not done today, in their app language, with a button that opens Grade 7. `/reminders on|off|test`. Blocked chats are remembered and skipped. Tested with unit tests (5 new: time zone and day change, who is due, the 19:00/22:00 window, once per day, blocked chats, the bot commands). **Not yet seen arriving in a real chat.** The first `/reminders test` attempts were lost to a lossy campus network: Node gave up on Telegram after one lost packet (IPv4 slot, then unreachable IPv6). Fixed by connecting over IPv4 directly, 20 s request timeouts, one retry for failed replies, 20 s polls, and a log line with a timestamp for every incoming update.

**Backend**
- `initData` HMAC validation (timing-safe, expiry, tamper rejection). Body size limits, path-traversal-safe static serving, SPA fallback, CORS allow-list, tutor rate limit.

## Simulated, and labelled as such in the app

- Camera headcount (26 of 28) on the teacher dashboard.
- Class 4-B roster (fictional names), the class quiz accuracy (72%) and per-question percentages.
- The homework report's sample (5 fictional students), shown only to non-teachers or when no student has taken a quiz yet. It is labelled "Namunaviy ma’lumotlar". The textbook practice section has its own sample with the same label, shown to non-teachers or when nobody has practised yet.
- Teacher content approval: it changes a label on this device only, and the student app keeps showing "Draft".
- Attendance confirmation is saved on the device only.
- The dashboard's "This device" quiz marks are **real**, taken from the Grade 4 quiz on the same device.
- The **homework report** and its **textbook practice** section are **real** for teachers listed in `TEACHER_IDS`: they read every student's saved progress on the server.

## Missing / not built

- Real camera integration, roster and eMaktab sync, teacher and admin accounts, multi-class data.
- Lessons beyond Grade 4 fractions and Grade 7 linear functions. Physics and chemistry visual models.
- **Teacher review of the Uzbek and Russian lesson text.** I drafted it, and it is marked as a draft everywhere.
- Content management (editing lessons without code), analytics storage, an admin view beyond the homework report.
- Classes: the homework report and its practice section show every student who used the app or the chat, not one class. Teacher accounts are a fixed `TEACHER_IDS` list.
- Production database. Progress is stored in a JSON file on one server instance (`data/progress.json`).
- Telegram CloudStorage, payments, notifications.

## What was tested

| Area | How | Result |
|---|---|---|
| Typecheck and production build | `npm run check` | Pass |
| Unit tests (51) | `npm test`: initData validation (valid, tampered, wrong token, expired, `signature` field), answer checking, hint-ladder rules, server rung cap, curated replies, AI-output guard, language checks, practice-generator maths (6 skills × 59 seeds), content completeness in 3 languages, quiz key integrity, bot handlers against a mocked Bot API, streak reminders, the teacher homework report and its 401/403 rules | 51/51 pass (19 Oct).  They also caught a real bug: graph practice produced 1 item instead of 3 (fixed) |
| API end to end | Production-mode server with a locally signed `initData` (test token): session auth, forged-hash rejection, 401 without auth, server re-check ignoring a client "solved" claim, rung cap, progress PUT/GET, 413 for big bodies, path traversal, SPA fallback, rate limit (429 after 15 calls/min) | All as designed |
| UI flows | Built-in Chromium at 375×812 phone size, in Russian and Uzbek: welcome → language → grades; **all 5 Grade 4 stations to mission complete** (XP 130 checked by hand), wrong answers and the full hint ladder, both homework problems, quiz scoring; Grade 7 explore (real mouse drags of both handles, keyboard arrows), challenge detection, step predictions, guided problem with misconception, hints and free-question fallback, check → results → practice; teacher dashboard attendance and review; language switch; reset; deep links | Working, no console errors. Layout bugs found and fixed: builder overflow, picture choices overflow, docks covering the tutor's reply, overlapping graph handles, Δx label collision, coordinates wrapping, Russian plural |
| Dev mode | `npm run dev`: Vite with the API proxy | Working |

## What was NOT tested (needs you or a real environment)

- **Anything inside real Telegram**: the bot connecting with a real token, `/start` in a real chat, the Web App button, the menu button, real `initData` from a Telegram client, BackButton, haptics, header colours, viewport behaviour, swipe-to-close being disabled during graph drags.
- The long-polling loop and webhook mode against Telegram's servers (only the handlers were tested, with a mock).
- **The live AI tutor call, in the Mini App and in the bot chat.** No `ANTHROPIC_API_KEY` was available, so only the guardrails and the fallbacks were exercised, against a stub.
- Real phones (iOS, Android), real touch dragging, Telegram Desktop and Telegram Web.
- The `Dockerfile`: written but not built, because the Docker daemon was not running on this machine.
- Hosting on any provider, HTTPS, cold starts.
- Screen readers. ARIA labels were added but not verified with VoiceOver or TalkBack.
- Uzbek and Russian wording quality with a native-speaking teacher.
