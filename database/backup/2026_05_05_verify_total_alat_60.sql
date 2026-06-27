select jsonb_build_object(
  'total_alat', (select count(*) from public.alat_kesehatan),
  'per_ruangan', (
    select jsonb_agg(row_to_json(room_counts) order by room_counts.kode_ruangan)
    from (
      select r.kode_ruangan, r.nama_ruangan, count(a.id) as total_alat
      from public.ruangan r
      left join public.alat_kesehatan a on a.ruangan_id = r.id
      group by r.id, r.kode_ruangan, r.nama_ruangan
      order by r.kode_ruangan
    ) room_counts
  )
) as hasil;
