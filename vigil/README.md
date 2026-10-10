# Vigil — Campus Safety Platform

A full-stack web app where Ohio State students report thefts, robberies, and safety issues on an interactive campus map.

**[Live app →](https://vigil-osu.vercel.app)**
<p align="center">
  <img height="360" alt="Vigil on desktop" src="https://github.com/user-attachments/assets/f00a91ab-ded4-49c5-96b7-dbcb8baf04dc" />
  &nbsp;&nbsp;
  <img height="360" alt="Vigil on mobile" src="https://github.com/user-attachments/assets/fb447940-1df0-4688-ac98-ca18e7aa122e" />
</p>

## Features

- **Category filters:** filter reports by Theft, Robbery, Safety, or Other
- **Map-based reporting:** pick a report's location by clicking directly on the map
- **Report lifecycle:** the person who posted a report can mark it resolved, which moves it to History
- **Accounts:** email and password sign-up and login

## Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite |
| Database | PostgreSQL (Supabase) |
| Authentication | Supabase Auth |
| Hosting | Vercel |

## How It Works

The React frontend talks directly to a Supabase-hosted PostgreSQL database through the Supabase JS SDK. There's no separate backend server. Instead, security is enforced inside the database itself with **Row Level Security (RLS)**, so every request is checked against the logged-in user's identity no matter where it comes from.

## Database

Each report is a row in the `reports` table:

| Column | Purpose |
|---|---|
| `id` | Unique identifier |
| `title`, `category`, `description` | The report itself |
| `location_name`, `lat`, `lng` | Where it happened, used to place the map pin |
| `status` | `active` or `resolved` |
| `created_at` | When it was posted |
| `user_id` | The author, a foreign key to `auth.users` |

### Row Level Security Policies

```sql
create policy "Authenticated users can read reports"
on public.reports for select
to authenticated
using (true);

create policy "Users can create reports as themselves"
on public.reports for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Creators can resolve their active reports"
on public.reports for update
to authenticated
using (auth.uid() = user_id and status = 'active')
with check (auth.uid() = user_id and status = 'resolved');
```

- Only logged-in users can view reports.
- Users can only post reports under their own account.
- Only a report's author can change it, and the only change allowed is marking an active report resolved. Reports can't be rewritten or reopened, even by someone bypassing the app.

## Project Structure

```
vigil/
├── src/
│   ├── App.jsx        
│   ├── api.js        
│   ├── supabase.js    
│   ├── data.js       
│   ├── main.jsx       
│   └── styles.css     
├── supabase/
│   ├── schema.sql
│   └── seed.sql       
├── index.html
└── package.json
```

## Deployment

Hosted on Vercel, with the Supabase URL and key stored as environment variables. Every push to `main` triggers a new build and deploy.
