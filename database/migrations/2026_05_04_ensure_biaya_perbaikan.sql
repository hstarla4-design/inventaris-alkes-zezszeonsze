do $$
begin
  execute 'alter table public.maintenance add column if not exists biaya_perbaikan numeric';
  perform pg_notify('pgrst', 'reload schema');
end $$;
