# Putting Hearth online for free

This is the planned path for publishing the first web demo. **No public deployment is configured in this checkout yet.** The repository includes a Render blueprint; configure and test it before adding a public URL to Devpost. AWS is optional for this deployment.

Vercel configuration is not included. The current app is an Express server with a server-sent-events endpoint for live device state, so Render is the supported first target in this guide. A Vercel deployment would need a serverless adapter and explicit validation of streaming, static assets, and persistent storage.

## Recommended: Render (free web service) + Upstash (free Redis)

1. Push this repo to GitHub (public, MIT license included).
2. **Upstash:** create a free account at upstash.com → *Create database* (Redis, any region) → copy the **REST URL** and **REST token**.
3. **Render:** create a free account → *New* → *Blueprint* → pick the repo. `render.yaml` sets everything up. Paste the two Upstash values when asked. Render generates `LEGACYLINK_SECRET` for you.
4. Open the Render URL. You land on the sign-in page: **"Try the demo family"** gives every visitor a private, pre-filled sandbox with no sign-up.

Notes:
* Render's free tier sleeps after ~15 minutes idle, so the first visit takes up to a minute. Before judging, open the link yourself, or ping `/health` every 10 minutes with a free monitor such as UptimeRobot.
* Microphone and speech recognition need **HTTPS** and Chrome/Edge. Render gives you HTTPS automatically.
* The MCP endpoint is `https://<your-app>.onrender.com/mcp` and needs `Authorization: Bearer <token>`. Create a long-lived token in the app under *Hearth devices* (owner accounts), or use "Try the demo family" and copy its token from the browser (`localStorage["hl-token"]`).

## Other free options

* **Your own machine + Cloudflare Tunnel:** `npm start`, then `cloudflared tunnel --url http://localhost:3333`. Free HTTPS URL for as long as the tunnel runs. Good for a live demo.
* **Fly.io / Railway:** use the included `Dockerfile`; set the same variables.
* **Raspberry Pi at home:** run the server on the Pi itself (the device then works without any internet except for neural voices).

## Environment variables

| Variable | Purpose |
|---|---|
| `LEGACYLINK_ACCOUNTS=1` | Turn on sign-up, login, family invites, device tokens, demo sandboxes. Off = local shared-token mode |
| `LEGACYLINK_SECRET` | Signing key for login tokens (**required** in production; Render generates it) |
| `LEGACYLINK_UPSTASH_URL`, `LEGACYLINK_UPSTASH_TOKEN` | Free Redis storage (works on any host) |
| `LEGACYLINK_DDB_TABLE` | DynamoDB storage instead (partition key `household`, sort key `id`, both strings) |
| `LEGACYLINK_TOKEN` | Only for local shared-token mode |
| `BEDROCK_MODEL_ID`, `BEDROCK_EMBED_MODEL_ID`, `AWS_REGION` | Claude on Bedrock as the brain, Titan embeddings for search (needs AWS credits) |
| `LEGACYLINK_TTS` | `edge` (free neural voices), `polly`, or unset (auto) |
| `NODE_ENV=production` | Disables demo helpers that could wipe data |

With neither Upstash nor DynamoDB configured, data is stored in local files, which most free hosts erase on restart. Use Upstash for anything you want to keep.

## Security notes (read before sharing real family stories)

* Passwords are hashed with scrypt; login tokens are HMAC-signed and expire after 30 days; device tokens can be revoked; login attempts are rate-limited per IP.
* The household always comes from the signed token, never from a client header, and families cannot read each other's data (covered by `test/accounts.test.mjs`).
* Stories are stored unencrypted in your Redis/DynamoDB/file store. This is fine for a demo; for real use add encryption at rest and a proper email-verification and password-reset flow, which are not built yet.
* Demo sandboxes are fictional and are cleaned up after a day (Upstash: automatic expiry; files: hourly sweep).
