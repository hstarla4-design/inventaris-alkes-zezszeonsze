do $$
declare
  room_rec record;
  alat_id uuid;
  idx integer := 0;
  item_no integer;
  nama_list text[] := array[
    'Monitor Pasien', 'Syringe Pump', 'Infusion Pump',
    'Ventilator', 'Defibrillator', 'USG',
    'ECG', 'Suction Pump', 'Nebulizer',
    'Lampu Operasi', 'Autoclave', 'Bedside Monitor',
    'Pulse Oximeter', 'Electrosurgical Unit', 'Patient Warmer'
  ];
  merk_list text[] := array[
    'Philips', 'Terumo', 'B Braun',
    'Drager', 'Zoll', 'GE',
    'Bionet', 'Yuwell', 'Omron',
    'Mindray', 'Getinge', 'Nihon Kohden',
    'Masimo', 'Valleylab', 'Fisher Paykel'
  ];
  tipe_list text[] := array[
    'IntelliVue MX450', 'TE-SS830', 'Infusomat Space',
    'Savina 300', 'R Series', 'Vivid S70',
    'Cardio7', '7E-A', 'NE-C28',
    'HyLED 760', 'HS33', 'BSM-3562',
    'Rad-97', 'ForceTriad', 'IW950'
  ];
  kondisi_list text[] := array['Baik', 'Maintenance', 'Rusak'];
  maint_list text[] := array['Preventive', 'Corrective Ringan', 'Corrective Berat', 'Emergency (Breakdown)'];
  base_i integer;
  nama_alat_v text;
  merk_v text;
  tipe_v text;
  serial_v text;
  kode_v text;
  install_date date;
  maint_kind text;
  vendor_v text;
  foto_alat_v text;
  foto_sebelum_v text;
  foto_sesudah_v text;
  foto_sparepart_v text;
  invoice_v text;
  foto_nilai_ukur_v text;
  foto_sertifikat_v text;
begin
  if not exists (select 1 from public.ruangan) then
    insert into public.ruangan (kode_ruangan, nama_ruangan)
    values
      ('R001','ICU'),
      ('R002','NICU'),
      ('R003','PICU'),
      ('R004','IGD'),
      ('R005','OK'),
      ('R006','Radiologi'),
      ('R007','Laboratorium'),
      ('R008','Rawat Inap'),
      ('R009','Poli Klinik'),
      ('R010','CSSD')
    on conflict (kode_ruangan) do nothing;
  end if;

  if to_regclass('public.notifikasi_teknisi') is not null then
    delete from public.notifikasi_teknisi;
  end if;

  if to_regclass('public.pengajuan') is not null then
    delete from public.pengajuan;
  end if;

  if to_regclass('public.histori_alat') is not null then
    delete from public.histori_alat;
  end if;

  if to_regclass('public.mutasi_alat') is not null then
    delete from public.mutasi_alat;
  end if;

  delete from public.maintenance;
  delete from public.kalibrasi;
  delete from public.alat_kesehatan;

  for room_rec in
    select id, kode_ruangan, nama_ruangan
    from public.ruangan
    order by kode_ruangan
  loop
    idx := idx + 1;

    for item_no in 1..3 loop
      base_i := ((idx - 1) * 3 + item_no - 1) % array_length(nama_list, 1) + 1;
      nama_alat_v := nama_list[base_i];
      merk_v := merk_list[base_i];
      tipe_v := tipe_list[base_i];
      serial_v := 'SN-' || room_rec.kode_ruangan || '-' || lpad(item_no::text, 2, '0') || '-2026';
      kode_v := upper(regexp_replace(nama_alat_v || '-' || merk_v || '-' || tipe_v || '-' || serial_v, '[^A-Za-z0-9]+', '-', 'g'));
      install_date := date '2024-01-01' + ((idx * 17) + (item_no * 11));
      maint_kind := maint_list[((item_no - 1) % array_length(maint_list, 1)) + 1];
      vendor_v := case
        when item_no = 1 then 'PT Medika Prima'
        when item_no = 2 then 'PT Kalibrasi Nusantara'
        else 'PT Sarana Alkes'
      end;

      foto_alat_v := 'https://placehold.co/900x600/e8f3ff/164e63.png?text=Foto+Alat+' || replace(room_rec.nama_ruangan, ' ', '+') || '+' || replace(nama_alat_v, ' ', '+');
      foto_sebelum_v := 'https://placehold.co/900x600/fff7ed/9a3412.png?text=Sebelum+Maintenance+' || replace(nama_alat_v, ' ', '+');
      foto_sesudah_v := 'https://placehold.co/900x600/ecfdf5/166534.png?text=Sesudah+Maintenance+' || replace(nama_alat_v, ' ', '+');
      foto_sparepart_v := 'https://placehold.co/900x600/f1f5f9/334155.png?text=Foto+Sparepart+' || replace(nama_alat_v, ' ', '+');
      invoice_v := 'https://placehold.co/900x600/f8fafc/0f172a.png?text=Invoice+' || replace(vendor_v, ' ', '+');
      foto_nilai_ukur_v := 'https://placehold.co/900x600/eff6ff/1d4ed8.png?text=Nilai+Ukur+' || replace(nama_alat_v, ' ', '+');
      foto_sertifikat_v := 'https://placehold.co/900x600/f0fdf4/15803d.png?text=Sertifikat+Kalibrasi+' || replace(nama_alat_v, ' ', '+');

      insert into public.alat_kesehatan (
        kode_barcode,
        nama_alat,
        merk,
        tipe,
        serial_number,
        ruangan_id,
        vendor,
        tahun_pembelian,
        kondisi,
        status,
        maintenance_terakhir,
        maintenance_berikutnya,
        kalibrasi_terakhir,
        kalibrasi_berikutnya,
        foto_alat,
        harga_pembelian,
        kalibrasi_awal,
        tanggal_instalasi,
        tanggal_sewa
      )
      values (
        kode_v,
        nama_alat_v,
        merk_v,
        tipe_v,
        serial_v,
        room_rec.id,
        vendor_v,
        extract(year from install_date)::integer,
        kondisi_list[((item_no - 1) % array_length(kondisi_list, 1)) + 1],
        'Aktif',
        current_date - (20 + item_no),
        current_date + (30 + (item_no * 10)),
        current_date - (75 + (item_no * 15)),
        current_date + (180 + (item_no * 20)),
        foto_alat_v,
        45000000 + (idx * 3500000) + (item_no * 7500000),
        install_date + 30,
        install_date,
        null
      )
      returning id into alat_id;

      insert into public.maintenance (
        alat_id,
        jenis,
        tanggal,
        teknisi,
        hasil,
        keterangan,
        vendor_pt,
        status_progres,
        foto_sebelum,
        foto_sesudah,
        foto_sparepart,
        invoice,
        service_type,
        biaya_perbaikan
      )
      values (
        alat_id,
        maint_kind,
        current_date - (10 + item_no),
        'Budi Teknisi',
        case
          when maint_kind = 'Preventive' then 'Preventive selesai, fungsi alat normal'
          when maint_kind = 'Corrective Ringan' then 'Corrective ringan selesai, setting dan pembersihan komponen dilakukan'
          when maint_kind = 'Corrective Berat' then 'Corrective berat selesai, sparepart utama diganti vendor'
          else 'Breakdown ditangani vendor, alat sudah bisa dipakai'
        end,
        'Dummy riwayat maintenance lengkap untuk ' || nama_alat_v || ' di ruangan ' || room_rec.nama_ruangan,
        case when maint_kind = 'Preventive' then null else vendor_v end,
        case when maint_kind = 'Preventive' then 'Selesai' else 'Selesai Vendor' end,
        foto_sebelum_v,
        foto_sesudah_v,
        case when maint_kind = 'Preventive' then null else foto_sparepart_v end,
        case when maint_kind = 'Preventive' then null else invoice_v end,
        maint_kind,
        case when maint_kind = 'Preventive' then 0 else 1250000 + (item_no * 350000) end
      );

      insert into public.kalibrasi (
        alat_id,
        tanggal_kalibrasi,
        berlaku_sampai,
        vendor,
        hasil,
        nomor_sertifikat,
        catatan,
        vendor_pt,
        status_progres,
        foto_nilai_ukur,
        foto_sertifikat,
        service_type
      )
      values (
        alat_id,
        current_date - (45 + item_no),
        current_date + (320 + (item_no * 15)),
        'PT Kalibrasi Nusantara',
        case when item_no = 3 and idx % 4 = 0 then 'Tidak Lulus' else 'Lulus' end,
        'CERT-' || room_rec.kode_ruangan || '-' || lpad(item_no::text, 2, '0') || '-2026',
        'Dummy kalibrasi lengkap dengan foto nilai ukur dan sertifikat untuk ' || nama_alat_v,
        'PT Kalibrasi Nusantara',
        'Sertifikat Terbit',
        foto_nilai_ukur_v,
        foto_sertifikat_v,
        'Kalibrasi'
      );
    end loop;
  end loop;

  perform pg_notify('pgrst', 'reload schema');
end $$;
