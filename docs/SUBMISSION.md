# Smart Schools: MVP submission

**AI supports the teacher. Understanding leads the way.**

A learning platform for Uzbek schools. Students learn with a tutor that talks and draws on a whiteboard, solves homework step by step and plays live class games. Teachers make quizzes in seconds, run games, and ask an AI assistant which students are struggling. Everything runs from one small server and is open from a phone.

This document is the one a reviewer needs: where to try it, what to try, what is real and what is not, and how to run it.

## Try it (live)

Base address: **https://smart-schools.163-245-192-206.sslip.io**

| What | Where | Notes |
|---|---|---|
| Landing page | `/` | The scroll story and the AI hub |
| **Student area** | `/student` | No login. AI tutor, "watch it explained", homework helper, join a game |
| **Games for Grades 1–4** | `/student#/arcade` | Six short games, no login. The level follows the child, a wrong answer gets an explanation, a skills map shows the gaps |
| **Teacher portal** | `/teacher` | Press **Use the demo teacher** (account `ustoz`, password `ustoz2026`), or create an account |
| Student game page | `/play` | Opened by a student with a teacher's 6-digit code |
| Telegram bot | **@yordamchi_ustoz_ai_bot** | Textbook lessons for Grades 6–7, practice with hints, step-by-step homework help, daily problem, progress. The menu button opens the Mini App |
| Telegram Mini App | `/app/` (or the bot's menu button) | Opens the student area inside Telegram (one product, one design). `/app/?go=teacher` opens the teacher's class view with the Smart Attendance demo |

### A five-minute route

1. **Student area** → `/student`. Press the *Pythagorean theorem* card or ask your own question (for example "photosynthesis"). The tutor starts explaining at once, draws as it speaks, and you can interrupt it by typing or by voice. Open **Homework helper**, type `3x − 5 = 2x + 4`, and reveal the steps one at a time. Switch the language (EN / RU / UZ) at the top.
2. **Teacher portal** → `/teacher` → *Use the demo teacher*. The home page shows **class insights** (sample data, labelled): who needs attention and the hardest questions.
3. **Ask AI** (sidebar). Try *"Who is struggling?"*, then *"Make a gamified quiz about matrices and play it as a race"*. Open the questions in the editor, or start a **Team Race** straight from the chat.
4. Start a game. A 6-digit code and a QR code appear. On a phone open `/play`, type the code and a first name. Answer; watch the live board on the teacher's screen. On the phone, the **Aa** button gives read-aloud, larger text and easy-read letters.
5. **Telegram** → open the bot, press *Start*, pick a language and grade 6 or 7, try *Lessons* or send *solve 2x + 3 = 11*. Ask a free question in the chat ("why does ice float?"): the AI replies, with a daily limit.

## What is built and working

**Students**
- **AI tutor and visual explainer.** Streams a lesson as "beats": a short sentence, spoken, plus drawings (formulas, shapes, graphs) that appear as it speaks. Any school topic; two prepared lessons work even with the AI off. Interrupt with text or voice. Spoken in English, Russian and Uzbek by a server voice (neural text-to-speech, cached), with the browser's voice and then reading speed as fallbacks.
- **Games for Grades 1–4** (Play → Games). Six gamified lessons, each aimed at one thing young pupils get stuck on: number line (how big a number is), make ten (adding without counting on fingers), build the number (place value), rows and columns (multiplication as equal rows), which is bigger (the "bigger denominator, bigger fraction" mistake) and story pictures (choosing a bar model before calculating a word problem). Three right answers in a row raise the level, two wrong lower it. A wrong answer is matched to the mistake behind it and gets a sentence and a picture about that mistake, then a second try. Every first try feeds a skills map (strong, practising, needs help), kept on the device.
- **Equation gap finder** (Play → Equation gap finder, `/student#/linear`). A pupil solves one Grade 7 equation. A wrong answer is matched to the mistake behind it (for example, multiplying only the first term in brackets), then a short adaptive check walks down a map of eight earlier skills (negative numbers, opening brackets, like terms, inverse operations…) until the lowest missing one is found, usually in 6–10 questions. The pupil gets a two-minute visual lesson and three practice questions for that skill, then the same equation again. A one-line summary is ready to copy for the teacher. Every question is generated and checked by code (an independent solver in the tests re-checks 2,400 of them); no AI is involved, so it works with no key. The skill map and the mistake list follow published error studies; the app has not been trialled with pupils.
- **Homework helper.** A deterministic solver (equations, fractions, brackets, percentages, powers). Every step is computed by code, not guessed by an AI, and shown one at a time, answer last.
- **Own progress**, kept on the student's device only: lessons, questions, solved problems, games, time, topic progress, a topic map.
- **Join a game** from the student area or `/play`.
- **Telegram bot** with 23 Grade 6–7 textbook topics, generated practice with a four-rung hint ladder, step-by-step homework solver, daily problem, streak reminders, and an AI chat tutor for free-form questions (Uzbek, Russian, English) with a guard that refuses to hand out homework answers.
- **Mini App**: inside Telegram it opens the same student area as the website, and the bot's deep links land on the matching page (Grades 1–4 games, a lesson, the tutor). Grades 1–4 practise in the six games, including one on comparing fractions.

**Teachers**
- Accounts, quizzes by hand, from 23 textbook topics (with the textbook pictures), or **drafted by AI** from a topic or a pasted text (grade, standard or gamified style, question types: multiple choice, true or false, number, short word).
- **Seven ready-made live games**: Quiz Battle, Speed Round, Last One Standing, Team Race, True or False Blitz, Math Sprint, Word Typer. Scoring and clocks live on the server; a student's phone never receives the right answer before the reveal.
- **Ask AI**: answers about the class from the saved results (who is struggling, who is getting worse, hardest questions, recent games) and writes quizzes, then plays them as a game. See "How the AI is kept honest" below.
- Results, per-question accuracy, a Grade 6–7 practice report in the Telegram teacher view.

**Platform**
- One Node server hands out the website, the student area, the Mini App, the teacher portal and the API, and runs the bot. A systemd service behind nginx with HTTPS, on a 1 vCPU / 2 GB VPS.
- UI in Uzbek (Latin), Russian and English.
- 245 server and shared-code tests plus 5 for the website (`npm test`), clean typecheck, a build from a fresh clone, and a Dockerfile.
- Nightly backup of accounts, quizzes and results; AI usage caps per person and for everyone; rate limits on login and joining.

## How the AI is kept honest and private

- **Facts about students come from data, not from the model.** The lists under an "Ask AI" answer (students, questions, games) are computed by code from the saved results. The counts the model may quote ("4 students are below 65%") are computed too, so a sentence never contradicts the list under it.
- **Student names never leave the server.** Before anything is sent to the model, names become codes (S01, S02…); in the reply the codes become names again.
- **Questions the AI writes are checked like hand-written ones** (a right answer exists, no empty or duplicate choices, length limits). The right answer is shuffled so it is not always A. The teacher reads the draft before using it, and the page says so.
- **The tutor does not give answers.** The homework chat tutor refuses to state results; the solver reveals steps one at a time.
- Per-person and global daily limits protect the free AI quota; every call is counted before it is made.
- AI providers: Google Gemini (several models tried in turn if one is overloaded) or Anthropic Claude, chosen by the keys the server has. Keys live only in the server's `.env`.

## What is simulated, planned or not done

Stated plainly, so nothing here is oversold:

- **The school-server design is planned, not built.** The product idea is a server in every school with its own Wi-Fi and AI running inside it, so lessons work without the internet and student data stays in the school. Today everything runs on one cloud server, and Telegram is used only as the prototype's channel.
- **Uzbek and Russian text is a draft.** It has not been reviewed by a native-speaking teacher. Lesson content is written in our own words from the textbooks' topics and is marked as awaiting teacher review.
- **Demo numbers are labelled.** The Mini App's teacher class view and the demo teacher's class results are sample data, marked as such in the screens.
- **Camera headcount, real roster integration and teacher approval** are simulated in the Mini App's teacher view (`/app/?go=teacher`).
- **The AI can make mistakes.** The free Gemini tier is used for the demo; its terms allow Google to use prompts, which is why names are replaced by codes. A school deployment would use an agreement or a local model.
- **The Grades 1–4 games keep their results on the child's device.** The skills map is not sent to the teacher yet; joining it to the teacher's class insights is the next step. The number-line game follows published research on linear number board games; the other five use common classroom methods (ten-frames, base-ten blocks, arrays, fraction bars, bar models) and have not been trialled with pupils.
- **Students join games with a first name only**, so two students with the same name count as one in the class insights.
- **Not verified on every device.** The live voice and microphone were checked in desktop browsers; the microphone needs a browser with speech recognition (not Firefox, and not every Telegram web view). Real-phone checks inside Telegram are still to do.
- Games in progress are kept in memory: a server restart ends running games (quizzes, results and accounts are saved).
- Not built from the wider vision: assignments, a standards-aligned library, more than the current question types (choice, number, typed word, true or false), teacher-set accessibility options (extra time, hidden leaderboard), a large lesson library beyond the tested topics.

## Architecture

```
 Telegram app ──────► bot (long polling) ─┐
 Mini App  /app/ ───────────────────────┐ │
 Student area /student ──────────────┐  │ │      ┌───────────────┐
 Teacher portal /teacher ─────────┐  │  │ │      │ Gemini / Claude│
 Game page /play ──────────────┐  │  │  │ │      └──────▲────────┘
                               ▼  ▼  ▼  ▼ ▼             │ (names → codes)
                        nginx (HTTPS) ─► one Node server ─┴─► edge-tts (voice, cached)
                                           │  API · bot · live games · AI · portal
                                           └─► data/ (JSON files, nightly backup)
```

- `server/` Node server: static hosting, API, Telegram bot, portal, live games (`live.ts`), AI (`boardAi.ts`, `gemini.ts`, `teacherAi.ts`, `tutor.ts`), voice (`tts.ts`).
- `shared/` code used by both server and browser: lesson content, answer checking, the solver, the whiteboard script format.
- `src/` the React Mini App; `student/` and `src/student/` the student area; `website/` the landing page, teacher portal and game page.
- Data is plain JSON in `data/` (accounts hold salted scrypt hashes; tokens are signed and expire).

## Run it yourself

Requires Node.js 20.19+ (tested on Node 24).

```bash
git clone <this repository> smart-schools && cd smart-schools
npm ci
cp .env.example .env          # then fill in what you have; every key is optional
npm run build:all             # the Mini App, the server, and the website in ./website
npm start                     # http://localhost:8787
```

With no keys at all it runs: the prepared lessons, the solver, quizzes, live games and the teacher portal all work. Add `GEMINI_API_KEYS` (a free Google AI Studio key) or `ANTHROPIC_API_KEY` to turn on the AI tutor, Ask AI and AI quiz drafts; add `TELEGRAM_BOT_TOKEN` and `MINI_APP_URL` to run the bot. See the README's configuration table. For development: `npm run dev` (Mini App on 5173 plus the API on 8787).

Checks: `npm run typecheck`, `npm test`. A `Dockerfile` is included (`docker build -t smart-schools . && docker run -p 8787:8787 smart-schools`); it was updated for this layout but not built in the final check, because Docker was not running on the machine used. The route above (clone, `npm ci`, `npm run build:all`, `npm start`) was run from a fresh clone and works.

## Team and contact

[Team names and contact: to be added before submitting.]
