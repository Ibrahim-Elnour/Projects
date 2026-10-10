# Vigil

A campus-safety reporting interface for The Ohio State University. Reports are shared through Supabase; chat and notifications remain local browser demos.

## Run locally

```sh
npm install
cp .env.example .env
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` from Supabase Project Settings > API. In the Supabase SQL Editor, run `supabase/schema.sql` followed by `supabase/seed.sql`. Enable email/password under Authentication > Providers. Restart Vite after changing environment variables.

The demo map uses OpenStreetMap tiles, darkened in the interface. Internet access is required for map tiles.
