do $$
begin
  execute 'alter table public.alat_kesehatan add column if not exists status_kepemilikan text default ''Milik RS''';
  execute 'alter table public.alat_kesehatan add column if not exists kso_nama_partner text';
  execute 'alter table public.alat_kesehatan add column if not exists kso_tipe_kerja_sama text';
  execute 'alter table public.alat_kesehatan add column if not exists kso_fee_tetap numeric';
  execute 'alter table public.alat_kesehatan add column if not exists kso_tanggal_mulai date';
  execute 'alter table public.alat_kesehatan add column if not exists kso_tanggal_akhir date';
  execute 'alter table public.alat_kesehatan add column if not exists kso_file_kontrak text';
  execute 'alter table public.alat_kesehatan add column if not exists sewa_vendor_leasing text';
  execute 'alter table public.alat_kesehatan add column if not exists sewa_biaya_per_bulan numeric';
  execute 'alter table public.alat_kesehatan add column if not exists sewa_durasi_kontrak text';
  execute 'alter table public.alat_kesehatan add column if not exists sewa_tanggal_mulai date';
  execute 'alter table public.alat_kesehatan add column if not exists sewa_tanggal_akhir date';
  execute 'alter table public.alat_kesehatan add column if not exists sewa_buyback text';
  execute 'alter table public.alat_kesehatan add column if not exists sewa_file_kontrak text';
  perform pg_notify('pgrst', 'reload schema');
end $$;
