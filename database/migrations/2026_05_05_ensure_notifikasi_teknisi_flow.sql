do $$
begin
  execute 'alter table public.notifikasi_teknisi add column if not exists tujuan_role text';
  execute 'alter table public.notifikasi_teknisi add column if not exists dibuat_oleh_role text';
  execute 'alter table public.notifikasi_teknisi add column if not exists status_pengerjaan text default ''Belum dikerjakan''';
  execute 'alter table public.notifikasi_teknisi add column if not exists catatan_update text';
  execute 'alter table public.notifikasi_teknisi add column if not exists foto_update text';
  execute 'alter table public.notifikasi_teknisi add column if not exists parent_id uuid';
  perform pg_notify('pgrst', 'reload schema');
end $$;
