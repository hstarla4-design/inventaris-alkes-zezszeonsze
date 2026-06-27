do $$
begin
  execute 'alter table public.pengajuan enable row level security';
  execute 'drop policy if exists "anon can read pengajuan" on public.pengajuan';
  execute 'drop policy if exists "anon can insert pengajuan" on public.pengajuan';
  execute 'drop policy if exists "anon can update pengajuan" on public.pengajuan';
  execute 'drop policy if exists "anon can delete pengajuan" on public.pengajuan';
  execute 'create policy "anon can read pengajuan" on public.pengajuan for select to anon using (true)';
  execute 'create policy "anon can insert pengajuan" on public.pengajuan for insert to anon with check (true)';
  execute 'create policy "anon can update pengajuan" on public.pengajuan for update to anon using (true) with check (true)';
  execute 'create policy "anon can delete pengajuan" on public.pengajuan for delete to anon using (true)';
  perform pg_notify('pgrst', 'reload schema');
end $$;
