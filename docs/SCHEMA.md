# Supabase Schema

Pantry Plate uses a single Supabase table for saved recipes. The pantry list
lives in `localStorage` on the client and does not need a table.

Run this SQL in **Supabase -> SQL Editor -> New query**:

```sql
create table public.favorites (
  id           bigserial primary key,
  recipe_id    text not null,
  title        text not null,
  image        text,
  missed_count integer,
  created_at   timestamptz default now()
);

-- For a class demo we leave RLS off so the anon key can read and insert.
-- If you turn RLS on, add policies that allow select/insert for the anon role.
alter table public.favorites disable row level security;
```

After running the SQL, copy the values from **Project Settings -> API**:

- **Project URL** -> `SUPABASE_URL`
- **anon public key** -> `SUPABASE_ANON_KEY`

Paste these into:

1. A local `.env` file (copy from `.env.example`) for `npm start`.
2. Vercel **Project -> Settings -> Environment Variables** for production.
