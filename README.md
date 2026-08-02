# Moors

Basic forum built with Next.js, Supabase, and Vercel.

## Setup

### 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the contents of `supabase/schema.sql`.
3. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` public key
4. For local dev, disable email confirmation (optional but easier):
   - **Authentication → Providers → Email** → turn off **Confirm email**

### 2. Local env

```bash
cp .env.local.example .env.local
```

Fill in your Supabase URL and anon key.

### 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.

In Supabase **Authentication → URL Configuration**, set:

- **Site URL**: your Vercel URL (e.g. `https://moors.vercel.app`)
- **Redirect URLs**: same URL + `http://localhost:3000` for local dev

## What's included

- Sign up / log in / log out
- List threads (sorted by last activity)
- Create thread with opening post
- View thread and replies
- Post replies (logged-in users)

## Project structure

- `supabase/schema.sql` — database tables + RLS policies
- `src/app/actions/` — server actions for auth and posts
- `src/app/threads/` — thread pages
- `src/lib/supabase/` — Supabase client helpers
