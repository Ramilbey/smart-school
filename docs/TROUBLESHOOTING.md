# Troubleshooting

Start with the server log. On startup it prints which settings are present (never their values) and any bot errors.

## The bot doesn't answer `/start`

| Log line or symptom | Cause | Fix |
|---|---|---|
| `TELEGRAM_BOT_TOKEN not set; the bot is disabled` | No token, or still the `.env.example` placeholder | Set the real token and restart |
| `could not connect to Telegram: … (401): Unauthorized` | Wrong or revoked token | Copy the token again from @BotFather. After `/revoke`, the old one stops working |
| `could not connect to Telegram: fetch failed (ETIMEDOUT)`, while `curl https://api.telegram.org` works | Node's "happy eyeballs" gives IPv4 a short slot, then tries IPv6, which isn't routable. On a lossy network (seen on campus Wi-Fi, 19 Oct 2026) one lost packet kills the request | Since 19 Oct the server connects over IPv4 directly and lets the OS retry. `NET_AUTO_FAMILY=true` restores Node's behaviour (only on networks with working IPv6) |
| Commands get no reply; the log shows `no answer from Telegram for 35 s` or no `←` line for your message | The network drops or delays traffic to Telegram. Every incoming update is logged as `← /command` or `← message (photo)`, with a timestamp | Check the log for `←` lines. Requests now give up after 20 s and a failed reply is retried once. Try another network (phone hotspot) if timeouts continue |
| `conflict (409): another instance is polling or a webhook is set` | Two copies of the bot are running (laptop and server), or a webhook is still registered | Stop the other copy. In polling mode the server deletes old webhooks on startup, so restart it |
| No log lines at all when you message the bot | Host is asleep (free plans) in polling mode | Use `BOT_MODE=webhook` on hosts that sleep, or keep the service always on |
| Works in a private chat, silent in a group | By design: Web App buttons only work in private chats | In groups the bot answers `/start@YourBot` with a link to the private chat |

## The bot answers, but the app link is wrong or missing

- **"The Smart Schools app link has not been configured yet"**: `MINI_APP_URL` is empty, not `https://`, or still `example.com`. Fix it and restart.
- **"Smart Schools seems to be temporarily unavailable"**: the bot tried to reach `MINI_APP_URL` and failed (it re-checks every 60 s). Open the URL in a phone browser. **Open anyway** is still offered in case only the check failed, for example when a host blocks requests from itself.
- **Menu button missing**: it is set at startup when `BOT_SET_MENU_BUTTON=true` and the URL is valid. Telegram caches it, so close and reopen the chat, or set it manually in @BotFather → Bot Settings → Menu Button.

## The Mini App opens, but…

| Symptom | Fix |
|---|---|
| White or blank screen | The URL works over HTTPS but the JavaScript didn't load. After about 12 seconds the app shows "The app could not load…" with a Retry button. Check that `dist/` was built and deployed, and that you didn't upload `index.html` alone without `assets/` and `fonts/` |
| Telegram error page ("can't open") | URL down, wrong path, or invalid certificate. Test the exact URL in a phone browser |
| ngrok "You are about to visit" page | Free ngrok interstitial. Use cloudflared or a real host for demos |
| First open takes about a minute | Free-tier cold start. Open it once before presenting |
| An old version still shows | `index.html` is served `no-cache` and assets are fingerprinted. Fully close and reopen the Mini App. On Telegram Desktop, right-click inside the app → Reload |
| "Browser mode" chip inside Telegram | The app didn't receive `initData`. That happens when you open the URL directly in a browser instead of through the bot or `t.me` link. Always open via the bot or the direct link |
| Settings says "Progress is saved on this device" inside Telegram | The API wasn't reachable or rejected `initData`. Check that `TELEGRAM_BOT_TOKEN` on the server belongs to the **same bot** that opened the app, and that the device clock is roughly right (`INIT_DATA_MAX_AGE`, default 24 h) |
| Dragging the Grade 7 line pulls the app down | Telegram older than Bot API 7.7 can't disable swipe-to-close. Update Telegram, or use the k/b sliders under the graph |
| No vibration | Haptics depend on the device and Telegram version. They are optional |

## The tutor never says "AI reply"

That is the expected default. Without `ANTHROPIC_API_KEY` the tutor uses the curated, predefined hints, and the reply label says "Lesson hint".

With a key set:

- The log line `AI tutor: live (claude-opus-5-5)` confirms it at startup.
- `[tutor] AI key rejected` or `[tutor] AI error 4xx/5xx` means the provider refused the request. The student still gets the curated hint.
- Replies are also replaced by curated text when the guardrails reject them (answer revealed, wrong language, too long). This is intentional, so you will see a mix of "AI reply" and "Lesson hint".
- Calls are only allowed with valid Telegram `initData`, or with `ALLOW_DEV_AUTH=true` in local development. A browser hitting the production server gets 401 and falls back to curated hints.

## The QR code opens the wrong thing

- Check `DEMO_URL` in `Pitch_Kit/Deck/index.html`. The text under the QR code shows the exact link it encodes.
- `t.me/<bot>/app` only works after BotFather `/newapp` with short name `app`.
- Test from a phone that has never opened the bot.

## Local development

- `npm run dev` → http://localhost:5173. The API runs on 8787 and Vite proxies `/api`.
- Port in use: set `PORT=8790` in `.env` (Vite reads it for the proxy too).
- Reset local progress: ⚙ → Reset demo progress, or clear site data for localhost.
- `npm test` covers the logic. UI flows are checked by hand in the browser.
