-- GiverNet schema
-- Run this in the Supabase SQL editor (or via `supabase db push`)

create extension if not exists "pgcrypto";

-- Donors -----------------------------------------------------------
create table if not exists donors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

-- Donations ----------------------------------------------------------
create table if not exists donations (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid references donors(id) on delete set null,
  donor_name text not null default 'Anonymous',
  type text not null check (type in ('monetary', 'item')),
  amount numeric(12,2),
  item_name text,
  quantity integer,
  category text,
  notes text,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint monetary_has_amount check (type <> 'monetary' or amount is not null),
  constraint item_has_name check (type <> 'item' or item_name is not null)
);

-- Inventory ----------------------------------------------------------
create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'General',
  quantity integer not null default 0,
  unit text not null default 'units',
  low_stock_threshold integer not null default 5,
  updated_at timestamptz not null default now()
);

-- Volunteers -----------------------------------------------------------
create table if not exists volunteers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text,
  skills text[],
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

-- Shifts -----------------------------------------------------------
create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity integer not null default 1,
  status text not null default 'open' check (status in ('open', 'filled', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

-- Shift signups (join table) --------------------------------------------
create table if not exists shift_signups (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references shifts(id) on delete cascade,
  volunteer_id uuid not null references volunteers(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (shift_id, volunteer_id)
);

-- Row Level Security ----------------------------------------------------
-- MVP policy: any authenticated user (i.e. any logged-in staff/admin account)
-- can read and write. Tighten this once you add role distinctions.
alter table donors enable row level security;
alter table donations enable row level security;
alter table inventory_items enable row level security;
alter table volunteers enable row level security;
alter table shifts enable row level security;
alter table shift_signups enable row level security;

create policy "Authenticated users full access" on donors
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users full access" on donations
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users full access" on inventory_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users full access" on volunteers
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users full access" on shifts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users full access" on shift_signups
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Helpful indexes ---------------------------------------------------------
create index if not exists idx_donations_received_at on donations(received_at desc);
create index if not exists idx_shifts_starts_at on shifts(starts_at);
create index if not exists idx_shift_signups_shift on shift_signups(shift_id);
