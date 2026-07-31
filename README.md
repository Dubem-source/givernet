# GiverNet

Donation tracking & volunteer management for non-profits. Log monetary and in-kind
donations, track inventory of item donations, and coordinate volunteer shifts.

Built with **Next.js 16 (App Router)**, **TypeScript**, and **Tailwind CSS**.
Backend is **Supabase** (Postgres + Auth) — no separate server to run.

## Why Supabase

You need *some* backend for auth, a shared database, and row-level security so
staff accounts can safely read/write the same data. Supabase gives you all of
that as a hosted Postgres instance with a generous free tier — no infrastructure
to manage. Everything here talks to Supabase directly from the Next.js app
(browser client for interactive pages, server client + middleware for session
handling and route protection).

## 1. Create a Supabase project

1. Go to https://supabase.com → New project.
2. Once it's ready, open **Project Settings → API** and copy:
   - Project URL
   - `anon` public key

## 2. Set up the database

1. Open the **SQL Editor** in your Supabase project.
2. Paste the contents of `supabase/schema.sql` and run it.
   This creates the `donors`, `donations`, `inventory_items`, `volunteers`,
   `shifts`, and `shift_signups` tables, plus row-level security policies that
   allow any authenticated (logged-in) user full read/write access — good
   enough for a small staff team. Tighten these later if you add role tiers
   (e.g. read-only volunteers vs. admins).

## 3. Create a staff login

Supabase Auth handles sign-in. Create your first staff account:

1. In Supabase, go to **Authentication → Users → Add user**.
2. Set an email + password (or enable email invites).
3. Use those credentials on the GiverNet login page.

There's no public sign-up page by design — this is an internal staff tool.

## 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 5. Install and run

```bash
npm install
npm run dev
```

Visit http://localhost:3000 — you'll be redirected to `/login`, then to
`/dashboard` after signing in.

## Project structure

```
app/
  login/                 sign-in page
  (app)/                 authenticated shell (sidebar + mobile nav)
    dashboard/            overview: totals, low stock, upcoming shifts
    donations/             log & browse monetary + in-kind gifts
    inventory/              stock levels with quick +/- adjustment
    volunteers/              roster with skills & active/inactive status
    shifts/                   schedule shifts, assign volunteers
components/               Sidebar, MobileNav, Modal, StatCard
lib/
  supabase/               browser + server Supabase clients
  types.ts                shared TypeScript types
supabase/schema.sql       full database schema + RLS policies
middleware.ts             protects /dashboard, /donations, etc. — redirects to /login if signed out
```

## Notes

- Currency is formatted as ₦ (Naira) in a couple of places — search for `₦`
  in `app/(app)/dashboard/page.tsx` and `app/(app)/donations/page.tsx` if you
  want a different currency symbol.
- Donation records store `donor_name` directly (defaulting to "Anonymous")
  rather than requiring a full donor record, so front-desk logging stays fast.
  The `donors` table is there if you later want to link gifts to full donor
  profiles for receipts/tax letters.
- Inventory quantities update immediately in the UI, then sync to Supabase —
  if you need strict auditing of who changed what, add a `updated_by` column
  and an `inventory_adjustments` log table.
