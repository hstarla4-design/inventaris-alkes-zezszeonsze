select jsonb_build_object(
  'pengajuan', (
    select jsonb_agg(row_to_json(p))
    from (
      select jenis_pengajuan, kategori, status, tujuan_role, dibuat_oleh, created_at
      from public.pengajuan
      order by created_at desc
      limit 7
    ) p
  ),
  'notifikasi', (
    select jsonb_agg(row_to_json(n))
    from (
      select jenis_laporan, kategori, status, dibuat_oleh, created_at
      from public.notifikasi_teknisi
      order by created_at desc
      limit 3
    ) n
  )
) as hasil;
