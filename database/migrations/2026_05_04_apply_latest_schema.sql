do $$
begin
  execute 'alter table public.alat_kesehatan add column if not exists tanggal_instalasi date';
  execute 'alter table public.alat_kesehatan add column if not exists tanggal_sewa date';
  execute 'alter table public.alat_kesehatan add column if not exists kso_persen_rs text';
  execute 'alter table public.alat_kesehatan add column if not exists kso_persen_vendor text';
  perform pg_notify('pgrst', 'reload schema');
end $$;
