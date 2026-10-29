# SignalOS

Personal newsletter intelligence: Gmail in, clustered stories out, editorial website in between.

The AI interprets newsletters. PostgreSQL remembers. The website renders allowlisted layout sections. It does not rewrite its own React code every morning.

## What v1 does

1. Connects a dedicated Gmail account with `gmail.readonly`.
2. Syncs messages from the `AI-NEWSLETTERS` label.
3. Parses newsletter HTML into article candidates.
4. Uses Gemini (when configured) to summarize, classify, and cluster.
5. Publishes a daily edition to a typography-first Next.js paper.

Demo fixtures are opt-in for local development and are always disabled in production. The app is protected by a single app password; Gmail and story data are not public.

## Stack

- Next.js + TypeScript + Tailwind
- Supabase PostgreSQL
- Gmail API + OAuth
- Gemini via `@google/genai`
- Node worker (`apps/worker`)

## Setup

```bash
npm install
copy .env.example apps\web\.env.local
copy .env.example apps\worker\.env
npm run dev
```

Before starting the app, set `APP_PASSWORD` and `APP_SESSION_SECRET` in `apps\web\.env.local`. Generate a strong app password and session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Run the command twice and use one value for each setting. Keep both values private.

Open [http://localhost:3000](http://localhost:3000), sign in with the app password. Without connected data, the site shows an empty state. Set `NEXT_PUBLIC_DEMO_MODE=true` locally only if you want to preview the sample stories.

### 1. Database

Create a Supabase project. In its SQL Editor, run these files in order:

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/20261029000100_reliable_processing.sql`
3. Optionally, `supabase/seed.sql` for sample newsletter senders.

If you already ran `0001_init.sql`, run only the second migration.

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in both `apps\web\.env.local` and `apps\worker\.env`. Keep the service role key server-side; never prefix it with `NEXT_PUBLIC_`.

Keep `NEXT_PUBLIC_DEMO_MODE=false` for live data. Demo fixtures are disabled automatically in production.

### 2. Gmail

1. Google Cloud project → enable Gmail API.
2. Configure the OAuth consent screen and add your dedicated Gmail address as a test user while developing.
3. Create a Web application OAuth client with redirect URI `http://localhost:3000/api/gmail/callback`.
4. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, and `GOOGLE_ALLOWED_EMAIL` in both env files. `GOOGLE_ALLOWED_EMAIL` must be the exact dedicated inbox address.
5. Create the `AI-NEWSLETTERS` label in Gmail and apply it to the newsletters you want SignalOS to read.
6. Set `TOKEN_ENCRYPTION_KEY` to a long random secret in both env files. Generate one with the same Node command above.
7. Restart `npm run dev`, sign in, then open `http://localhost:3000/api/gmail/start` to authorize the Gmail account. Confirm Google shows the expected account and read-only permission.

`gmail.readonly` is a restricted Google scope. For a private local prototype, keep the OAuth app in testing and authorize only your account. Before making the app public or onboarding other users, check Google's current verification and security-assessment requirements.

### 3. Gemini

Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/app/apikey) and set `GEMINI_API_KEY` in `apps\worker\.env` only. The configured default model is `gemini-3.8-flash`; check the [current model catalog](https://ai.google.dev/gemini-api/docs/models) if you revisit this setup later.

### 4. Worker

```bash
npm run worker:backfill   # bounded import
npm run worker:process    # extract + Gemini
npm run worker:briefing   # publish today's edition
```

Run those commands from the repository root. Start with the bounded backfill, then process the imported mail, then publish a briefing. For ongoing local use, schedule `npm run worker:sync` and `npm run worker:process` every 10 minutes, and `npm run worker:briefing` once per day. Keep the web app and worker env files in sync for the Supabase and Gmail settings.

Do not run the full inbox through a Next.js request handler. The worker owns retries and long jobs.

## Production deployment

- Deploy `apps/web` to Vercel as the user-facing site. The Gmail OAuth start and callback endpoints are Next.js API routes in this app, so they use the Vercel site URL.
- Deploy the three scheduled worker jobs from the repository root with `render.yaml`. They run Gmail sync and processing every 10 minutes, then publish the daily briefing at 08:30 India time (03:00 UTC). Render cron jobs have no public URL; they connect directly to Supabase and Gmail.
- Set the Vercel production environment variables from `.env.example` (except `GEMINI_API_KEY`, which is only needed by the worker). Set `NEXT_PUBLIC_DEMO_MODE=false`, `APP_URL` to the Vercel URL, and `GOOGLE_REDIRECT_URI` to `https://<your-vercel-domain>/api/gmail/callback`.
- Set the `sync: false` variables requested by Render when applying the Blueprint. Use the same `TOKEN_ENCRYPTION_KEY` for the web app and every worker service.
- Add the exact production callback URL to the OAuth client's authorized redirect URIs in Google Cloud. Keep the authorized Gmail address restricted to `GOOGLE_ALLOWED_EMAIL`.
- Apply both SQL migrations in the Supabase SQL Editor before connecting Gmail. The repository/API credentials alone do not create the tables.

The worker services use Render's smallest cron compute plan. Render currently applies a $1/month minimum per cron service, so the three jobs have a $3/month minimum before any usage above that minimum.

## Security

- Newsletter text is untrusted. Prompts tell the model to ignore instructions inside emails.
- Refresh tokens are encrypted at rest and tied to the configured allowed Gmail address.
- Service role and Gemini keys stay server-side.
- Every page is behind the app-password session gate; raw mail and credentials stay backend-only.
- OAuth state is checked on callback, email processing is claimed atomically with retries, and article duplicates remain linked to each source email.

## Roadmap after the first milestone

Story clustering quality, embeddings, ranking from explicit feedback, adaptive layout configs, evidence-aware chat. Those layers only pay off once ingestion and provenance are reliable.
