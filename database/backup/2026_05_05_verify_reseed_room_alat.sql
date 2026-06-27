select jsonb_build_object(
  'total_alat', (select count(*) from public.alat_kesehatan),
  'total_maintenance', (select count(*) from public.maintenance),
  'total_kalibrasi', (select count(*) from public.kalibrasi),
  'per_ruangan', (
    select jsonb_agg(row_to_json(room_counts) order by room_counts.kode_ruangan)
    from (
      select r.kode_ruangan, r.nama_ruangan, count(a.id) as total_alat
      from public.ruangan r
      left join public.alat_kesehatan a on a.ruangan_id = r.id
      group by r.id, r.kode_ruangan, r.nama_ruangan
      order by r.kode_ruangan
    ) room_counts
  ),
  'sample', (
    select jsonb_agg(row_to_json(sample_rows))
    from (
      select nama_alat, ruangan_id, left(foto_alat, 40) as foto_prefix
      from public.alat_kesehatan
      order by created_at desc
      limit 3
    ) sample_rows
  )
) as hasil;
