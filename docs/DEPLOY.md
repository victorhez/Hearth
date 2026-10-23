# Deploying Hearth

Vercel support is configured in this repository. The app exports its Express application through `src/index.mjs`; Vercel serves files in `public/` from its CDN and runs Express as a function. **This configuration is not a deployment:** import the GitHub repository and set the environment variables below before sharing a live URL. AWS is optional.

## Vercel (recommended for a public demo)

1. In Vercel, create a project and import `victorhez/Hearth` from GitHub. Keep the detected Express framework and the repository root as the project root.
2. Create a Redis database in Upstash (or connect the Vercel Upstash integration). In **Project Settings → Environment Variables**, add the database's REST URL and token as `LEGACYLINK_UPSTASH_URL` and `LEGACYLINK_UPSTASH_TOKEN` for **Production**, and for **Preview** if you want preview deployments to work.
3. Add these variables to the same environments:

   | Variable | Value |
   |---|---|
   | `LEGACYLINK_ACCOUNTS` | `1` |
   | `LEGACYLINK_SECRET` | A unique random secret, at least 32 random bytes; keep it only in Vercel's environment settings. |
   | `LEGACYLINK_TTS` | `edge` |
   | `NODE_ENV` | `production` |

   Generate a secret locally with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and paste the output directly into Vercel. Do not commit it or put it in a public issue.

4. Deploy. The deployment's own `VERCEL_URL` is used for Hearth's internal MCP requests; you do not need a hard-coded hostname. Check `https://<your-deployment>/health` and confirm it reports `"store":"upstash"` and `"accounts":true`.
5. Open the HTTPS homepage in Chrome or Edge, choose **Try the demo family**, and verify that telling a story and then asking about it works. Use this URL in the Devpost testing link only after completing that smoke test.

### Vercel behavior and limits

- Upstash is required. Vercel function filesystems are temporary, and separate function instances do not share memory. Hearth stores family data in Redis and persists each conversation turn there for 24 hours. Without the required environment variables, the app returns a configuration error instead of silently using temporary storage.
- The live device-screen event mirror (`/api/device/events`) is not available on Vercel because its current subscriber fan-out is process-local. The regular web app, MCP requests, and device `/api/say` calls remain available; use a persistent Node host such as Render for live screen mirroring.
- AWS credentials and services are not required. Add the Bedrock/Polly/DynamoDB variables only after you have configured and tested those services.
- Vercel's free plan and usage limits can change. Review the current plan limits and usage dashboard before sharing the deployment.
- `vercel.json` sets the function maximum duration to 60 seconds. The effective limit is subject to the Vercel plan.

To test with the Vercel development runtime, install/use the Vercel CLI, pull the project's environment variables, and run `vercel dev` from the repository root.

## Alternative: Render (free web service) + Upstash (free Redis)

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
