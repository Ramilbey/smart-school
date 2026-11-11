# Telegram setup: from zero to a QR code judges can scan

Steps marked **(you)** need your Telegram account, a hosting account, or a decision from you. Nothing in this repository registers a bot or contains a real token. BotFather's menu wording changes now and then, so if a button name differs slightly, look for the closest match.

---

## 1. Create the bot (you)

1. In Telegram, open **@BotFather**. Check the blue verification tick: it is the only official bot-management account.
2. Send `/newbot`.
3. Enter a display name, for example `Smart Schools`.
4. Enter a username ending in `bot`, for example `SmartSchoolsDemoBot`. It must be unique.

## 2. Get the token (you)

BotFather replies with a token like `123456789:AA…`. **Treat it like a password.** Anyone with it controls the bot.

- Don't paste it into chats, screenshots, slides or source files.
- If it leaks, send `/revoke` to @BotFather and pick the bot to get a new one.

## 3. Store the token in an environment variable (you)

Locally:

```bash
cp .env.example .env
```

Edit `.env` and set `TELEGRAM_BOT_TOKEN=<your token>`. `.env` is in `.gitignore`.

On a host, add `TELEGRAM_BOT_TOKEN` in its **Environment / Secrets** settings instead. Don't upload a `.env` file.

## 4. Deploy the Mini App to an HTTPS URL (you)

Telegram only opens Mini Apps over **HTTPS**. Pick one option.

### Option A, recommended: one server for everything

The Node server serves the Mini App, the API (tutor, `initData` validation, progress sync) and the bot. It works on any host that runs Node 20+ or Docker: Render, Railway, Fly.io, a VPS.

1. Put the `smart-schools-app` folder in a Git repository and push it to GitHub. The folder is not a Git repository yet, and `.gitignore` already excludes `.env`, `node_modules` and build output.
2. Create a web service from the repository:
   - **Build command:** `npm ci && npm run build`
   - **Start command:** `npm start`
   - **Node version:** 22. Or use the included `Dockerfile` instead of build/start commands.
   - **Health check path:** `/api/health`
3. Add environment variables: `TELEGRAM_BOT_TOKEN`, `MINI_APP_URL` (the service's own `https://…` address, ending in `/app/` when the website is built into `dist-site`, see the README section "One address for everything"), and optionally `ANTHROPIC_API_KEY`.
4. **Pick the bot mode for your host:**
   - Always-on service (paid instance, VPS, Railway, Fly with a machine kept running): leave `BOT_MODE=polling`.
   - Host that **sleeps when idle**, such as Render's free plan: set `BOT_MODE=webhook` and a random `TELEGRAM_WEBHOOK_SECRET`. A sleeping service never polls, but a webhook wakes it. The first request after sleeping can take about a minute, so open the app once before you present.
5. Open `https://<your-service>/api/health` in a browser. You should see `{"ok":true,…}`.

### Option B: static Mini App, bot on your laptop

1. `npm run build`, then upload `dist/` to any static HTTPS host (Netlify, Vercel, Cloudflare Pages, GitHub Pages). The app works fully offline from its curated content. Without the API, the live AI tutor and cross-device progress are off.
2. On your laptop, set `TELEGRAM_BOT_TOKEN` and `MINI_APP_URL=<static URL>` in `.env`, then run `npm run build` and `npm run bot`. Polling needs no public address, only internet.

### Option C: a quick tunnel for testing only

```bash
npm run build
```

```bash
npm start
```

In a second terminal, run `cloudflared tunnel --url http://localhost:8787` (no account needed) or `ngrok http 8787`. Use the printed `https://…` address as `MINI_APP_URL` and restart. The ngrok free plan shows a warning page before the app, so don't use it for the live demo. A tunnel also stops when your laptop sleeps.

## 5. Point the bot at the Mini App

With `MINI_APP_URL` set and `BOT_SET_MENU_BUTTON=true` (the default), **the server configures the bot on startup**. It sets the `/start`, `/app`, `/reminders` and `/help` commands in English, Russian and Uzbek, the **Smart Schools** menu button next to the message field, and the bot description. The log shows `commands, menu button and descriptions configured`.

**(You) Register a direct Mini App link.** This is recommended for the QR code:

1. In @BotFather send `/newapp` and choose your bot.
2. Enter a title (`Smart Schools`), a short description, and a 640×360 image. A screenshot of the welcome screen works. Skip the GIF.
3. Enter the same HTTPS URL as `MINI_APP_URL`.
4. Enter the short name `app`.
5. Your direct link is `https://t.me/<YourBotUsername>/app`. Put it in `MINI_APP_DIRECT_LINK` too.

To set the menu button by hand instead, use @BotFather → `/mybots` → your bot → **Bot Settings** → **Menu Button** → send the URL and the title `Smart Schools`.

## 6. Test `/start`

Open `https://t.me/<YourBotUsername>` and press **Start**. You should get a language choice, then a grade choice (6 or 7), then a welcome with a button menu that stays under the message field. Tap **Solve my first problem**, answer wrong on purpose (a hint appears, not the answer), then type `2x + 3 = 11` (it works through the steps one at a time).

`/start g4`, `/start g7` and `/start teacher` still open that part of the Mini App directly.

Also try `/help`, `/app`, an unknown command like `/foo` (clear fallback), and plain text (points to the app). `/reminders test` sends a preview of the evening streak reminder straight away, with the **🔥 Keep my streak** button that starts today's problem; `/reminders off` and `/reminders on` switch the real evening reminders. If the Mini App URL is down, `/start` says it is temporarily unavailable and offers **Try again**.

## 7. Test on a phone (you)

Use both iOS and Android if you can. Check:

- [ ] **Open Smart Schools** opens full-height, and the header colour changes per mode (dark, warm, white).
- [ ] The welcome screen greets you by your Telegram first name. The "Browser mode" chip must **not** appear inside Telegram.
- [ ] Telegram's **Back** button (top left) goes back one screen. Android's hardware back does the same.
- [ ] Grade 4 → **Homework**: answer `3`. You get a hint, not the answer, and you feel a light vibration.
- [ ] Grade 7 → **Explore**: dragging the line moves it without closing or minimising the app.
- [ ] Settings (⚙) shows "Progress is linked to your Telegram account". Close and reopen the app: progress is still there.
- [ ] Reset demo progress works.
- [ ] The **Smart Schools** menu button next to the message field reopens the app.

## 8. Verify the QR code (you)

The pitch deck builds its QR codes (slides 11 and 15) from one line in `Smart_Schools_Documentation_Package/Pitch_Kit/Deck/index.html`:

```js
const DEMO_URL = 'https://t.me/your_bot_name/app';
```

Replace it with your real link. This is the only edit needed in the deck:

| Link | What a judge sees |
|---|---|
| `https://t.me/<bot>/app` (after step 5's `/newapp`) | **Recommended.** Opens the Mini App straight away |
| `https://t.me/<bot>/app?startapp=g4` or `?startapp=g7` | Opens the Mini App directly on Grade 4 or Grade 7 |
| `https://t.me/<bot>?start=demo` | Opens the bot chat. The judge presses Start and then the button |

Then:

1. Open the deck in Chrome. The amber "Placeholder link" warning under the QR code should be gone, and the URL shown should be yours.
2. Scan the QR code from the projector or screen at a realistic distance, with two different phones.
3. Confirm it opens **your** bot or app. If your account opens it automatically, test from a phone that has never used the bot.

## Webhook mode details

- The webhook URL defaults to `<origin of MINI_APP_URL>/telegram/webhook`. Override it with `WEBHOOK_URL`.
- Telegram sends `X-Telegram-Bot-Api-Secret-Token`, and the server rejects requests whose value doesn't match `TELEGRAM_WEBHOOK_SECRET`.
- To switch back to polling, set `BOT_MODE=polling`. On startup the server deletes the webhook automatically.
- To check what Telegram thinks, replace `<TOKEN>` in your own terminal and don't share the output:

```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```
