# Smart Schools website

A one-page site for the UzHack prototype, plus a teacher portal and a student play page (below). Light and playful, built around **Zukko**, the owl from the app. It opens with the approved Smart Schools loading animation (counting 000 to 100), then scrolls through nine chapters. Headlines rise out of a mask and words light up as you scroll.

Frames (approved): the Design canvas "Smart Schools landing, best-in-class" (https://claude.ai/artifact/S15JXgSaYcxP9mEVonbjQa).

## How to check the animations

```bash
cd website
npm install
npm run dev        # http://localhost:5190
```

Open http://localhost:5190 in Chrome and scroll. Useful switches:

- `?still=1`: all motion off (same as the reduced-motion setting or the reduced-motion setting); skips the opening.
- Skip the opening with the Skip button or Esc.

```bash
npm run build      # static site in dist/ (index.html, teacher.html, play.html and their files)
npm run preview    # serve dist/ locally
node scripts/map-data.mjs   # only if you change the map: regenerates src/mapdata.js
```

`dist/` is plain static files: put it on any web host over http(s). Opening `index.html` from the disk does not work (browsers block ES modules from `file://`).

## Teacher portal and student page (`teacher.html`, `play.html`)

Two more pages next to the one-page site. They are plain JavaScript (no framework) in `src/portal/` and talk to the Smart Schools server (`../smart-schools-app`, see its README, "Teacher portal").

| Page | For | Code |
|---|---|---|
| `teacher.html` | Teachers: log in, make quizzes (by hand, from a textbook topic, or an AI draft), pick one of seven ready-made games (`src/portal/games.js`), start it on a big screen, read results | `src/portal/teacher.js` |
| `play.html?code=123456` | Students on their phones: type the code and a first name, answer | `src/portal/play.js` |

Shared: `api.js` (all server calls), `i18n.js` (the wording, English only), `portal.css`, `ui.js` (escaping and small helpers).

```bash
# terminal 1: the server (port 8787)
cd ../smart-schools-app && npm run dev
# terminal 2: this site (port 5190)
npm run dev
```

Open http://localhost:5190/teacher.html. In development the pages look for the server on the same computer at port 8787. For a built site on another host, build with `VITE_API_BASE=https://your-server.example npm run build` and add the site's address to `CORS_ORIGINS` on the server.

The published design artifact cannot reach a server on your laptop: there the portal pages only show "Cannot reach the Smart Schools server".

## Shapes you can hold (the original hand-figure app)

A chapter between "Two ages" and "Hints" (`#shapes`). The shapes are made by the **original hand-figure app by olimoverkinjon** (https://github.com/olimoverkinjon/hand-figure, commit `efc0162`), **used exactly as published, with no change to any of its files**. Raise a hand and a 3D shape appears above it; the number of raised fingers picks the shape (0 cylinder, 1 line, 2 flat sheet, 3 triangular prism, 4 cube, 5 pentagonal prism); the other hand pinches or opens to resize and flicks to spin. No shape shows until a hand is raised.

**The scroll story before the app** (the chapter is pinned while you scroll through it; `buildStory` in `src/shapes.js`, a GSAP timeline from 0 to 100 over the scroll):

1. A page from a textbook arrives with a drawing of a cube (the lines are drawn as you scroll; hidden edges are dotted). The hook: **"A cube on paper isn't a cube."** The page then turns edge-on to show it is only flat.
2. The page steps back. The question: **"With the Smart Schools system, how would students learn shapes in geometry?"** and under it, in mint, the follow-up: **"Care to check it out?"** with a bobbing arrow.
3. The story folds away and the frame with the app comes in ("Shapes you can hold."). Scrolling back up switches the camera and the app off.
- With motion off (`?still=1` or the system setting) there is no pinning: the story, the page and the frame are laid out one after the other.

The visitor then presses **Turn on camera and voice** (or **No camera? Watch the demo**, which is the app's own `?demo` mode), and the app opens in a frame on the page. Around it, the chapter adds only:

- a **voice** that explains each shape as it appears (11 short clips, Edge TTS voice `en-US-AvaMultilingualNeural`), with the same words as a caption;
- the **numbers of the shape** (faces, edges, vertices, and Euler's V − E + F = 2) in English;
- English for what the app says in Uzbek: the chapter hides the app's two small text lines and shows the same things in English. It finds the finger count by reading the app's status line.

| File | What |
|---|---|
| `vendor/hand-figure/` | The original repository, byte for byte (its own README, package.json, `src/`, `scripts/`). Do not edit |
| `scripts/build-hand-figure.mjs` | Runs the app's own `scripts/fetch-assets.mjs` (MediaPipe runtime and the 7.8 MB hand model), then builds it with vite into `public/hand-figure/` (git-ignored, about 27 MB). Runs before every `npm run build`; `FORCE=1` rebuilds |
| `src/shapes.js` | The wrapper: button, frame, voice, captions, English labels |
| `src/handHud.js` | Reads the app's status line and names the shapes and their counts |
| `scripts/make-shapes-voice.mjs` | Makes the voice clips in `public/media/shapes/` (needs edge-tts and ffmpeg; run only if you change the words) |
| `tests/handHud.test.mjs` | `npm test` |

- **Privacy:** the camera is read in the browser by the app. Nothing is recorded or sent. The page and the voice say so.
- **The camera and the voice start only on a click.** The camera switches off when the chapter is out of sight for a moment or the tab is hidden.
- **Needs https or localhost** for the camera (a browser rule). The demo works anywhere.
- **Heavy:** the app draws a lot and its runtime is about 19 MB; the old integrated graphics of a school computer may run it slowly.
- **Updating the app:** replace the files in `vendor/hand-figure/` with a newer copy and run `FORCE=1 node scripts/build-hand-figure.mjs`. If the app's status-line text changes, update `src/handHud.js`.

## What is on the page

| Chapter | What moves | Where the content comes from |
|---|---|---|
| Opening | The loading animation and a 000 to 100 counter | `src/smartLoader.ts`, a copy of `smart-schools-app/shared/smartLoader.ts` (source of truth) |
| 01 Meet Zukko | Zukko pops in, blinks, and his eyes and body follow the cursor. Chips float. Dotted wires carry lights into him. 35 dots pop in | Owl drawn from `smart-schools-app/src/components/Brand.tsx` (beak recoloured mint) |
| 02 Connected campus | An anamorphic sculpture (`src/anamorph.js`) in the look of the shapeofintelligence.com screenshot the user sent: near-black stage, huge silver slats, thin light type. About 300 vertical slats of varied widths (tall ones cut into pieces, plus hidden extras on the same lines of sight that only show from the side), each at its own depth, read as one word (CONNECT, ULANISH in Uzbek, СВЯЗЬ in Russian) from one viewpoint and as scattered slabs from any other. The chapter pins to the screen for about three screens of scroll and the viewpoint is tied to the scroll: the slats start scattered and fall into the word as you scroll. A slider, drag and two buttons also move the viewpoint (the next scroll takes over again). Lead: "How do we build tomorrow?" Caption: "Different perspectives. One shared vision." and the saying, which sits right under the word and lights up as it resolves: "(Connecting) today’s learners with tomorrow’s guidance—where teachers, AI, and global knowledge light the path forward." (a vision statement, not a feature list) | Copy chosen by the user ("Collaborative Intelligence"); the chapter makes no claim about group projects or exchange programs |
| 03 The loop | Check, Hint, Report cards rise | Film and app |
| 04 Under the hood | The AI hub (below) | The product description from the team, labelled with `smart-schools-app/docs/STATUS.md` |
| 05 Two ages | Two real phones rise and tilt in as you scroll | `public/shots/`, captured with `scripts/shots.mjs` |
| 06 Hints | Real slider: drag to cut both bars into 2, 3, 4, 6 or 12 pieces. Only 12 lines both edges up (3/4 = 9 of 12, 2/3 = 8 of 12) | The fraction lesson |
| 07 The report | Rows slide in; question 4 is marked | Sample data, labelled |
| 08 The film | The frame tilts flat as it scrolls in | `public/media/film-720.mp4` (the 1:47 pitch film) |
| 09 The school | A dotted globe rises and turns until Uzbekistan faces you, the camera dives in, the dots resolve into a dense map, cities ping, a lens opens on a school (tagged **Planned: not built yet**) | Natural Earth outlines via `world-atlas`, turned into dots by `scripts/map-data.mjs` |
| 09 Try it | Mint panel with QR and button | `https://t.me/yordamchi_ustoz_ai_bot?start=demo` |

### The AI hub, "under the hood" (`src/hub.js`)

A dark product-style dashboard in the look of the Grok Loop screenshots the user sent (same three views, same left side, character icons with eyes, cream input chips, orange and red panels). **Three buttons** at the top switch between three views that share one left side (the inputs, Zukko as the AI core, and the panels "What the AI does" and "What people and rules do"):

| Button | What it shows |
|---|---|
| **Systems** (default) | 15 cards, one for each tool: what it does, what it works with, what it connects to, a status dot, and a character icon. Grouped in six systems. Systems light up one after another and the log tells it in plain sentences. |
| **Live flow** | The same tools as pills, and the steps of each system as tags (plain English on top, the technical name small under it), with lights running along the wires into the teacher dashboard. A dashed loop sends a gap the teacher finds back to the tutor, extra practice and the student's retry. |
| **Results** | Every tool's wire converges into one green check ("5 systems, 1 dashboard"), the teacher's summary (72% correct, 7 students need extra support, 3 topics to explain again, 1 absent) and six before/after cards. |

Six systems, six colours: **AI classroom** (teal), **Classroom games** (purple), **Homework helper** (orange), **Personal AI tutor** (blue), **Smart attendance** (red, it counts people and never identifies faces), **Teacher dashboard** (green). Each system has a status dot (working / simulated / planned) from `smart-schools-app/docs/STATUS.md`. The game engine is kept apart from the AI that prepares content. The AI is never shown as controlling everything: the left panels split "What the AI does" from "What people and rules do".

**How it animates (the request flow).** The first time a view opens, every box on the right starts as a dim "slot NN · pending" placeholder (cards) or a greyed-out pill or tag, the two panels and the inputs are dimmed, and the wires are faint. Then each input lights up and sends a small **text chip** (for example "24 answers", "why 3/4 > 2/3?") along a white string into Zukko (the white dot rides ON the string, the text sits to its left), **fading out as it reaches Zukko**. From Zukko the request leaves as **a string of dots** along the wires to the two panels and then to the boxes, one by one. Each box wakes up when hit (the skeleton fades into the real card, the icon pops in, the toggle slides on; there is no glow or shake) and dots run on from it along its lines to the boxes it connects to, so the activation spreads across the columns. At the end every box is awake and **keeps receiving requests all the time** (one single loop sends a new request every 0.32 s (about 3 a second), a constant rate that never speeds up, and each hit passes on to the boxes it connects to, with a plain sentence added to the log). After the wake-up a hit does nothing to the box itself: no glow, no shake. The boxes are slightly see-through (about 84-86% opaque) so the lines behind them show a little. There is no one-system-at-a-time lighting. The Results view streams dots from every tool into the check. **All the little characters keep their eyes moving**: looking left, right, up and down, blinking, smiling and "thinking", each on its own timing (Zukko too). When a little icon smiles it also gives a quick happy shake (the boxes themselves never shake). Zukko shakes too, a bit less. Zukko's smile is two small thick arches. Every character (Zukko too) also has a thinking look: its eyes turn into three loading dots that bounce one after another for about two and a half seconds. Text chips are fully faded out before they reach Zukko, so nothing touches him; there is no halo pulse and no travelling dots on the left wires, only the chips coming in and the dot strings going out.

Everything is **demo data and simulated events**, and the page says so. On phones it shows one stacked view without the buttons.

## Change things

- **Copy:** `src/i18n.js`. In headings, `*text*` is drawn in the accent colour.
- **The AI hub:** `src/hub.js` (helpers, tags, scenarios in `SCEN`).
- **The map and dive:** `src/map.js`. Stages are driven by scroll progress `p` in `frame()`. The stage is `#mapstage` (560vh, `.stick` is sticky).
- **Re-capture the app screens** after the app changes: start the Mini App (`cd ../smart-schools-app && npm run dev:web`), then `node scripts/shots.mjs`.

## Language

English only. (The Uzbek and Russian versions of the site and the portal were taken out on 9 Nov 2026; a copy of the old files is in `_backup_before_english_only_2026-11-09.tar.gz` next to this folder.)

## Accessibility and motion

`prefers-reduced-motion`, `?still=1` or turn off the opening and every loop. Keyboard focus is visible, the film has captions, and the canvases are decorative: every fact is also in the page text.

## Not verified

- Not checked on a real GPU, in Safari or Firefox, or on a real phone. The preview pane renders WebGL at about 6 fps.
- The phone layout was only checked at 375 px in the preview pane.
- The Zukko eye blink and cursor tracking, the hub rounds and the scroll reveals were run, but not frame-by-frame.
- The map's globe-to-flat crossfade is not perspective-matched: the shape changes slightly as it crosses over.
- Cities and dots are an illustration. They are not real schools.

**Which request goes where.** The inputs are not random. Each one feeds its own boxes (see INPUT_TO in src/hub.js): Teacher's lesson goes to Quiz maker; Quiz answers to Quiz session and Answer marker; Lesson content to Game library and Game engine; Homework task to Homework helper and Hint ladder; Student's question to Personal tutor, Visual explainer and Language helper; Classroom camera to Photo counter and Attendance check. The dashboard boxes get their requests when the boxes that report to them pass them on. In the opening, a box wakes only after the request from its own input has reached Zukko and come out to it.

**Moods.** Every character, Zukko included, switches between clear moods on its own timing: look left, look right (sometimes a little up or down), stare (eyes wide and still), smile (arch eyes and a quick shake), think (three bouncing loading dots) and a blink. Each mood is held for a while (1 to 3 seconds) and never repeats twice in a row. The logic is setMode in src/hub.js.

**One speed on every string.** A request travels at the same speed (SPEED = 330 px/s in src/hub.js) on every string, long or short: its travel time is the length of the string divided by that speed, with no easing. The slow background dots on the strings also move at one speed (AMB = 40 px/s). The opening reads the real travel times, so a box wakes only after the dots reach it. The two left panels (What the AI does, What people and rules do) are sized to fit all their lines.

**No stops.** A request never pauses: a box passes the request on at the same instant the dots arrive (no wait between hops), the dots cross the left panel on a straight line from its left ring to its right ring, and the steady stream starts while the opening is still going (it only goes to boxes that are already awake). The opening sends its six requests 0.55 s apart. Eyes hidden in the phone layout are skipped.

Request dots are solid, with no glow halo around them.

The strings end at the box edges with no circle (no hollow ring, no status dot on the pills); status stays in the lane headers, the legend and the card toggles.

Every dot you see in the three desktop views is a real request. There are no background dots, and every dot moves by distance along its string at the same speed (SPEED in src/hub.js), so a curve does not make it speed up or slow down.

**Hero background.** The hero (first screen) sits on a dark line drawing of the Tashkent skyline (src/assets/hero-skyline.jpg: Hazrati Imam, Piramit Tower, Nest One, the TV tower and more). A dark gradient on the left keeps the headline readable and the bottom fades into the next section. The header turns dark over the hero.

The hero is cleared so the skyline shows: the blue disc, the four floating chips (Which is bigger, 24 of 35, Hint 2, Sample data), the dotted lines and the 35-dot strip are hidden with one CSS rule at the end of src/style.css. Delete that rule to bring them back.

The hero is now only the skyline picture. The headline, paragraph, buttons and Zukko are hidden by CSS rules at the end of src/style.css (the h1 stays as hidden text for screen readers), and the navigation bar has no background while the picture is on screen.

The hero picture is src/assets/hero-skyline.jpg, a 2752 x 1536 re-encode (443 KB) of the original Gemini_Generated_Image_9x5cy69x5cy69x5c.jpeg that sits in this folder. Replace that file to change the background.

The page behind the hero and the scrollbar are dark (#0a0d13), so no light border shows around the picture. The picture is moved down a little (background-position in src/style.css) so its top is not hidden under the navigation bar.

**The opening (hero).** The first screen is a scroll-driven chapter (src/herogl.js, 380vh tall and pinned). It starts as the whole Earth made of dots, which turns as you scroll until Uzbekistan faces you. The country then lights up (mint dots) with its border in bright dots, the camera zooms into it, and the skyline picture fades in over it. With reduced motion, or if WebGL is not available, only the skyline picture is shown. The globe dots come from the same Natural Earth data as the school map (src/mapdata.js).

**Smoothness of the opening.** The opening follows the scroll through a soft ease (a spring-like damping, about 0.2 s), so a wheel notch or a fast flick glides instead of jumping, and it keeps settling for a moment after you stop. The phases overlap and use a smootherstep curve so the motion never stops and starts. It starts with the globe low and large (only its top half in view, the middle of the globe on the bottom edge), rises to the centre as you begin to scroll, turns from the Atlantic to Uzbekistan, lights the country, dives in and fades to the skyline. Globe data note: scripts/map-data.mjs now stores the GLOBE dots as lon*100 and lat*100 so the whole world fits (before, anything outside lon -32 to 132 wrapped around onto Asia).

**The globe style (night Earth).** The opening globe is monochrome grey: a #131313 background with a faint grid and two small crosshairs, a sphere with a 10-degree graticule, land slightly lighter than the sea (from the Natural Earth land dots), a pale crescent on the sunny edge, city lights and scattered specks. The city lights are approximate (placed from a list of large cities in src/herogl.js), not real satellite data. Uzbekistan is marked with a bright dotted border and a dotted fill, and up close the land turns into dots because the land texture is coarse.

The globe turns about 55 degrees in total (from Europe and North Africa to Uzbekistan) with only a tiny sway when you are not scrolling. When the skyline picture is fully revealed it holds: the opening section is 560vh tall and the last 1.2 screens of scrolling keep the picture pinned in place before the next chapter arrives.

The zoom now goes in until Uzbekistan covers the whole window (the camera ends about 0.15 units from the surface, aimed at a spot well inside the country, 62.5E 42.4N on a wide screen and 63.9E 41.7N on a phone). Only then does the skyline picture fade in through the field of dots. The globe turns about 60 degrees in total.

The final zoom ends 0.10 units from the surface on a wide screen (0.15 on a phone), so the dotted country fills the entire window with no dark gaps before the picture appears. The camera near plane is 0.02 to allow that.

The old school chapter (blue globe, flat map, school lens) was removed from the page on request. Its code is still in src/map.js (not imported any more) and its texts are still in src/i18n.js. The navigation bar has no background at all while the opening is on screen (class clear in main.js), and the usual frosted bar afterwards.

The school message is back as plain text (section #school, keys mapTag, mapTitle, mapBody, tPlan, lensTitle): no globe, no map, no illustration.

**The film chapter** (src/film.js) now follows the CONNECT chapter. It arrives through a wall of silver slats, the same material as the sculpture: the slats open like blinds from the middle outwards, the film is revealed, then the frame grows until it fills the screen (on a tall phone: full width), holds for about a screen of scrolling, and the white sheet of the next chapter slides over it. The film does not autoplay. The film files live in public/media (film-720.mp4, film-poster.jpg, film.vtt).

Publishing note: the artifact does not serve .vtt files, so in the published copy the captions are published as media/film-captions.txt (the same text) and the page.html track points there.

**Words on the picture.** After the skyline is revealed, four statements (keys hgC1a to hgC4b in src/i18n.js) rise from below and turn over like a drum as you scroll, like a vertical rotating cylinder: the next line tilts into the middle while the old one tilts away upwards. The run is 800vh: 3.4 screens for the globe and the picture, then 0.6 screens to bring in the first line, 0.8 screens for each switch and 0.6 screens of hold. The drum maths is in main.js (hgWords). Uzbek and Russian lines are AI drafts.

Current words on the picture: "In every classroom, someone quietly gets lost." / "Zukko checks after every lesson that each student understood." / "Stuck? A hint, never the answer, so they learn it themselves." / "Built for Uzbekistan teachers, who stay in charge." (An earlier set: "In a class of 35, who really understood?", "Zukko asks a short quiz, and gives hints, not answers.", "The teacher sees at once who needs help.", "Made for Uzbekistan schools, with the teacher in charge.")

Current words on the picture (the user own copy, English kept as written, each split over two lines): "Where curiosity meets real-time intelligence." / "Instant clarity for teachers, infinite possibilities for students." / "Adaptive learning engine running beneath every lesson." / "Empowering educators to lead the next generation." Keys hgC1a to hgC4b in src/i18n.js; the Uzbek and Russian versions are AI drafts.

**Switching the hub views.** Each press of Systems, Live flow or Results (also the one already open) plays that view from the beginning. The old view recedes (fades, shrinks to 90% and drifts up) and the new one arrives from that same distance (fades in, grows from 90% to full size and settles down), then its boxes wake up one by one from their pending slots. See setView and prepare in src/hub.js.

**Correction to the note above:** the switch animation is per box, not for the whole view. Each box recedes on its own (fades, shrinks to 84% and drifts up 42px), one after another from the top left, and each new box arrives on its own the same way in reverse, then the intro wakes them. See leave, arrive and setView in src/hub.js.

Live flow has no big container behind each system any more (the bordered band was removed); each row keeps only a small header (number, name, status). Every box moves on its own in the tab switch, one after another in a queue (left and top first), with a step of 0.03 to 0.1 s between boxes depending on how many there are.

The lines now end exactly on the edge of each box (and start on the edge of each input chip); they used to stop 8 px short because of the small circles that were removed earlier.

When the AI hub is first scrolled into view, everything arrives one box after another (the left chips, the two panels, Zukko and the lines first, then the boxes of the open tab), each fading in and growing from smaller; then the opening plays. Until then nothing in the hub is visible. It does not replay when you scroll away and come back (press a tab to replay).

Correction: the hub arrival replays every time you scroll back into the section (if you were away for more than about a second), starting from nothing and playing the opening again. It is not first-time-only.
