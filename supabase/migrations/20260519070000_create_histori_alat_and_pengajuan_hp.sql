create table if not exists public.histori_alat (
  id uuid primary key default gen_random_uuid(),
  alat_id uuid references public.alat_kesehatan(id) on delete cascade,
  aksi text,
  petugas text,
  detail text,
  created_at timestamp default now()
);

alter table public.histori_alat enable row level security;

drop policy if exists "anon can read histori alat" on public.histori_alat;
create policy "anon can read histori alat"
on public.histori_alat for select
to anon
using (true);

drop policy if exists "anon can insert histori alat" on public.histori_alat;
create policy "anon can insert histori alat"
on public.histori_alat for insert
to anon
with check (true);

drop policy if exists "anon can update histori alat" on public.histori_alat;
create policy "anon can update histori alat"
on public.histori_alat for update
to anon
using (true)
with check (true);

alter table public.pengajuan add column if not exists dibuat_oleh_hp text;
