do $$
begin
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'notifikasi_teknisi'
  ) then
    execute $q$
      create table public.notifikasi_teknisi (
        id uuid primary key default gen_random_uuid(),
        jenis_laporan text,
        kategori text,
        alat_id uuid references public.alat_kesehatan(id) on delete cascade,
        ruangan_id uuid references public.ruangan(id),
        catatan text,
        dibuat_oleh text,
        status text default 'Baru',
        created_at timestamp default now()
      )
    $q$;
  end if;

  execute 'alter table public.notifikasi_teknisi enable row level security';
  execute 'drop policy if exists "anon can read notifikasi teknisi" on public.notifikasi_teknisi';
  execute 'drop policy if exists "anon can insert notifikasi teknisi" on public.notifikasi_teknisi';
  execute 'drop policy if exists "anon can update notifikasi teknisi" on public.notifikasi_teknisi';
  execute 'drop policy if exists "anon can delete notifikasi teknisi" on public.notifikasi_teknisi';
  execute 'create policy "anon can read notifikasi teknisi" on public.notifikasi_teknisi for select to anon using (true)';
  execute 'create policy "anon can insert notifikasi teknisi" on public.notifikasi_teknisi for insert to anon with check (true)';
  execute 'create policy "anon can update notifikasi teknisi" on public.notifikasi_teknisi for update to anon using (true) with check (true)';
  execute 'create policy "anon can delete notifikasi teknisi" on public.notifikasi_teknisi for delete to anon using (true)';
  perform pg_notify('pgrst', 'reload schema');
end $$;
