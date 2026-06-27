do $$
declare
  alat_icu uuid;
  alat_ok uuid;
  alat_radiologi uuid;
  alat_igd uuid;
  alat_laboratorium uuid;
  alat_poli uuid;
  alat_rawat uuid;
  alat_nicu uuid;
  alat_cssd uuid;
  alat_picu uuid;
begin
  select a.id into alat_icu
  from public.alat_kesehatan a
  join public.ruangan r on r.id = a.ruangan_id
  where r.kode_ruangan = 'R001' and a.nama_alat = 'Ventilator'
  order by a.created_at desc
  limit 1;

  select a.id into alat_ok
  from public.alat_kesehatan a
  join public.ruangan r on r.id = a.ruangan_id
  where r.kode_ruangan = 'R005' and a.nama_alat = 'Mesin Anestesi'
  order by a.created_at desc
  limit 1;

  select a.id into alat_radiologi
  from public.alat_kesehatan a
  join public.ruangan r on r.id = a.ruangan_id
  where r.kode_ruangan = 'R006' and a.nama_alat = 'USG Portable'
  order by a.created_at desc
  limit 1;

  select a.id into alat_igd
  from public.alat_kesehatan a
  join public.ruangan r on r.id = a.ruangan_id
  where r.kode_ruangan = 'R004' and a.nama_alat = 'Defibrillator'
  order by a.created_at desc
  limit 1;

  select a.id into alat_laboratorium
  from public.alat_kesehatan a
  join public.ruangan r on r.id = a.ruangan_id
  where r.kode_ruangan = 'R007' and a.nama_alat = 'Centrifuge'
  order by a.created_at desc
  limit 1;

  select a.id into alat_poli
  from public.alat_kesehatan a
  join public.ruangan r on r.id = a.ruangan_id
  where r.kode_ruangan = 'R009' and a.nama_alat = 'ECG'
  order by a.created_at desc
  limit 1;

  select a.id into alat_rawat
  from public.alat_kesehatan a
  join public.ruangan r on r.id = a.ruangan_id
  where r.kode_ruangan = 'R008' and a.nama_alat = 'Bedside Monitor'
  order by a.created_at desc
  limit 1;

  select a.id into alat_nicu
  from public.alat_kesehatan a
  join public.ruangan r on r.id = a.ruangan_id
  where r.kode_ruangan = 'R002' and a.nama_alat = 'Monitor Pasien Neonatal'
  order by a.created_at desc
  limit 1;

  select a.id into alat_cssd
  from public.alat_kesehatan a
  join public.ruangan r on r.id = a.ruangan_id
  where r.kode_ruangan = 'R010' and a.nama_alat = 'Autoclave'
  order by a.created_at desc
  limit 1;

  select a.id into alat_picu
  from public.alat_kesehatan a
  join public.ruangan r on r.id = a.ruangan_id
  where r.kode_ruangan = 'R003' and a.nama_alat = 'Pulse Oximeter'
  order by a.created_at desc
  limit 1;

  insert into public.pengajuan (
    jenis_pengajuan, kategori, alat_id, ruangan_id, vendor_pt, catatan,
    dibuat_oleh, dibuat_oleh_role, tujuan_role, status, created_at
  ) values
    ('Maintenance', 'Preventive', alat_rawat, (select id from public.ruangan where kode_ruangan = 'R008'),
      null, 'Bedside monitor perlu preventive rutin bulanan.',
      'zain', 'Teknisi', 'Kepala Ruangan', 'Menunggu Kepala Ruangan', now() - interval '7 days'),
    ('Maintenance', 'Corrective Ringan', alat_icu, (select id from public.ruangan where kode_ruangan = 'R001'),
      'PT Servis Medika Nusantara', 'Ventilator ICU bunyi alarm dan perlu pengecekan sensor.',
      'budi', 'Teknisi', 'Kepala Ruangan', 'Menunggu Kepala Ruangan', now() - interval '6 days'),
    ('Maintenance', 'Corrective Berat', alat_igd, (select id from public.ruangan where kode_ruangan = 'R004'),
      'PT Servis Medika Nusantara', 'Defibrillator mengalami error pada bagian power supply.',
      'budi', 'Teknisi', 'Kepala Ruangan', 'Menunggu Supervisor', now() - interval '5 days'),
    ('Kalibrasi', null, alat_ok, (select id from public.ruangan where kode_ruangan = 'R005'),
      'PT Kalibrasi Nusantara', 'Mesin anestesi perlu kalibrasi berkala dan sertifikat terbaru.',
      'zain', 'Teknisi', 'Kepala Ruangan', 'Disetujui Supervisor', now() - interval '4 days'),
    ('Kalibrasi', null, alat_radiologi, (select id from public.ruangan where kode_ruangan = 'R006'),
      'PT Kalibrasi Nusantara', 'USG portable masuk jadwal kalibrasi triwulan.',
      'zain', 'Teknisi', 'Kepala Ruangan', 'Menunggu Kepala Ruangan', now() - interval '3 days'),
    ('Maintenance', 'Emergency (Breakdown)', alat_laboratorium, (select id from public.ruangan where kode_ruangan = 'R007'),
      'PT Servis Medika Nusantara', 'Centrifuge berhenti mendadak dan butuh perbaikan segera.',
      'budi', 'Teknisi', 'Kepala Ruangan', 'Diteruskan Vendor', now() - interval '2 days'),
    ('Maintenance', 'Preventive', alat_cssd, (select id from public.ruangan where kode_ruangan = 'R010'),
      null, 'Autoclave CSSD masuk preventive berkala.',
      'zain', 'Teknisi', 'Kepala Ruangan', 'Menunggu Kepala Ruangan', now() - interval '1 day');

  insert into public.notifikasi_teknisi (
    jenis_laporan, kategori, alat_id, ruangan_id, catatan, dibuat_oleh, status, created_at
  ) values
    ('Maintenance', 'Preventive', alat_nicu, (select id from public.ruangan where kode_ruangan = 'R002'),
      'Monitor neonatal di NICU perlu preventive dari kepala ruangan.', 'Kepala Ruangan NICU', 'Baru', now() - interval '3 days'),
    ('Kalibrasi', null, alat_picu, (select id from public.ruangan where kode_ruangan = 'R003'),
      'Pulse oximeter PICU perlu kalibrasi rutin.', 'Kepala Ruangan PICU', 'Baru', now() - interval '2 days'),
    ('Maintenance', 'Emergency (Breakdown)', alat_ok, (select id from public.ruangan where kode_ruangan = 'R005'),
      'Lampu operasi perlu dicek karena ada gangguan mendadak.', 'Kepala Ruangan OK', 'Baru', now() - interval '1 day');

  perform pg_notify('pgrst', 'reload schema');
end $$;
