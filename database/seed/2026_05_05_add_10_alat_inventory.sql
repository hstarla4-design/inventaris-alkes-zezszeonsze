do $$
declare
  room_rec record;
  alat_id uuid;
  idx integer := 0;
  alat_name text;
  merk_name text;
  tipe_name text;
  kondisi_name text;
  barcode text;
  serial_no text;
  install_date date;
  maint_date date;
  kal_date date;
  svg text;
  foto_alat_v text;
  foto_sebelum_v text;
  foto_sesudah_v text;
  foto_sparepart_v text;
  invoice_v text;
  foto_nilai_ukur_v text;
  foto_sertifikat_v text;
begin
  for room_rec in
    select id, kode_ruangan, nama_ruangan
    from public.ruangan
    order by kode_ruangan
  loop
    idx := idx + 1;

    case room_rec.kode_ruangan
      when 'R001' then
        alat_name := 'Capnograph';
        merk_name := 'Mindray';
        tipe_name := 'PM-60';
        kondisi_name := 'Baik';
      when 'R002' then
        alat_name := 'Phototherapy Lamp';
        merk_name := 'Natus';
        tipe_name := 'neoBLUE';
        kondisi_name := 'Maintenance';
      when 'R003' then
        alat_name := 'Transport Ventilator';
        merk_name := 'Drager';
        tipe_name := 'Oxylog 3000';
        kondisi_name := 'Baik';
      when 'R004' then
        alat_name := 'Emergency Trolley';
        merk_name := 'OneMed';
        tipe_name := 'ET-01';
        kondisi_name := 'Baik';
      when 'R005' then
        alat_name := 'Laryngoscope Set';
        merk_name := 'Welch Allyn';
        tipe_name := 'Spectrum';
        kondisi_name := 'Baik';
      when 'R006' then
        alat_name := 'C-Arm Mobile';
        merk_name := 'Siemens';
        tipe_name := 'Cios Select';
        kondisi_name := 'Maintenance';
      when 'R007' then
        alat_name := 'Hematology Analyzer';
        merk_name := 'Sysmex';
        tipe_name := 'XN-1000';
        kondisi_name := 'Baik';
      when 'R008' then
        alat_name := 'Patient Bed Electric';
        merk_name := 'Paramount';
        tipe_name := 'Bed 9000';
        kondisi_name := 'Baik';
      when 'R009' then
        alat_name := 'Spirometer';
        merk_name := 'MIR';
        tipe_name := 'Spirobank II';
        kondisi_name := 'Maintenance';
      else
        alat_name := 'Ultrasonic Cleaner';
        merk_name := 'Crest';
        tipe_name := 'P1800D';
        kondisi_name := 'Baik';
    end case;

    barcode := upper(regexp_replace(room_rec.kode_ruangan || '-' || alat_name || '-' || merk_name || '-' || tipe_name, '[^A-Za-z0-9]+', '-', 'g'));
    serial_no := 'SN-' || room_rec.kode_ruangan || '-EXTRA-' || lpad(idx::text, 2, '0') || '-2026';
    install_date := date '2024-06-01' + idx;
    maint_date := current_date - (idx + 5);
    kal_date := current_date - (idx + 20);

    svg :=
      '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">' ||
      '<rect width="900" height="600" fill="#e8f4ff"/>' ||
      '<rect x="50" y="50" width="800" height="500" rx="30" fill="#ffffff"/>' ||
      '<text x="80" y="120" font-family="Arial" font-size="34" font-weight="700" fill="#0f172a">FOTO ALAT</text>' ||
      '<text x="80" y="170" font-family="Arial" font-size="24" fill="#334155">' || replace(room_rec.nama_ruangan, '&', 'dan') || '</text>' ||
      '<text x="80" y="245" font-family="Arial" font-size="30" font-weight="700" fill="#1d4ed8">' || replace(alat_name, '&', 'dan') || '</text>' ||
      '<text x="80" y="290" font-family="Arial" font-size="22" fill="#475569">' || replace(merk_name, '&', 'dan') || ' - ' || replace(tipe_name, '&', 'dan') || '</text>' ||
      '<rect x="80" y="340" width="260" height="150" rx="20" fill="#dbeafe"/>' ||
      '<rect x="380" y="340" width="420" height="150" rx="20" fill="#f8fafc"/>' ||
      '<text x="410" y="395" font-family="Arial" font-size="26" font-weight="700" fill="#0f172a">' || replace(alat_name, '&', 'dan') || '</text>' ||
      '<text x="410" y="435" font-family="Arial" font-size="18" fill="#475569">Foto ilustratif inventaris alat</text>' ||
      '</svg>';
    foto_alat_v := 'data:image/svg+xml;base64,' || encode(convert_to(svg, 'UTF8'), 'base64');

    svg :=
      '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="100%" height="100%" fill="#fee2e2"/><text x="60" y="130" font-family="Arial" font-size="34" font-weight="700" fill="#991b1b">SEBELUM MAINTENANCE</text><text x="60" y="220" font-family="Arial" font-size="28" fill="#7f1d1d">' || replace(alat_name, '&', 'dan') || '</text></svg>';
    foto_sebelum_v := 'data:image/svg+xml;base64,' || encode(convert_to(svg, 'UTF8'), 'base64');

    svg :=
      '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="100%" height="100%" fill="#dcfce7"/><text x="60" y="130" font-family="Arial" font-size="34" font-weight="700" fill="#166534">SESUDAH MAINTENANCE</text><text x="60" y="220" font-family="Arial" font-size="28" fill="#14532d">' || replace(alat_name, '&', 'dan') || '</text></svg>';
    foto_sesudah_v := 'data:image/svg+xml;base64,' || encode(convert_to(svg, 'UTF8'), 'base64');

    svg :=
      '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="100%" height="100%" fill="#e2e8f0"/><text x="60" y="130" font-family="Arial" font-size="34" font-weight="700" fill="#334155">FOTO SPARE PART</text><text x="60" y="220" font-family="Arial" font-size="28" fill="#1f2937">' || replace(alat_name, '&', 'dan') || '</text></svg>';
    foto_sparepart_v := 'data:image/svg+xml;base64,' || encode(convert_to(svg, 'UTF8'), 'base64');

    svg :=
      '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="100%" height="100%" fill="#fef3c7"/><text x="60" y="130" font-family="Arial" font-size="34" font-weight="700" fill="#92400e">INVOICE</text><text x="60" y="220" font-family="Arial" font-size="28" fill="#78350f">' || replace(alat_name, '&', 'dan') || '</text></svg>';
    invoice_v := 'data:image/svg+xml;base64,' || encode(convert_to(svg, 'UTF8'), 'base64');

    svg :=
      '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="100%" height="100%" fill="#dbeafe"/><text x="60" y="130" font-family="Arial" font-size="34" font-weight="700" fill="#1d4ed8">NILAI UKUR</text><text x="60" y="220" font-family="Arial" font-size="28" fill="#1e3a8a">' || replace(alat_name, '&', 'dan') || '</text></svg>';
    foto_nilai_ukur_v := 'data:image/svg+xml;base64,' || encode(convert_to(svg, 'UTF8'), 'base64');

    svg :=
      '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="100%" height="100%" fill="#ecfdf5"/><text x="60" y="130" font-family="Arial" font-size="34" font-weight="700" fill="#15803d">SERTIFIKAT</text><text x="60" y="220" font-family="Arial" font-size="28" fill="#14532d">' || replace(alat_name, '&', 'dan') || '</text></svg>';
    foto_sertifikat_v := 'data:image/svg+xml;base64,' || encode(convert_to(svg, 'UTF8'), 'base64');

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
      tanggal_sewa,
      status_kepemilikan
    ) values (
      barcode,
      alat_name,
      merk_name,
      tipe_name,
      serial_no,
      room_rec.id,
      'PT Medika Nusantara',
      extract(year from install_date)::int,
      kondisi_name,
      'Aktif',
      maint_date,
      maint_date + 30,
      kal_date,
      kal_date + 365,
      foto_alat_v,
      25000000 + (idx * 7500000),
      install_date + 30,
      install_date,
      null,
      'Milik RS'
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
    ) values (
      alat_id,
      case when idx % 3 = 0 then 'Preventive' when idx % 3 = 1 then 'Corrective Ringan' else 'Emergency (Breakdown)' end,
      maint_date,
      'Budi Teknisi',
      'Riwayat maintenance dummy tambahan untuk inventaris baru.',
      'Perawatan tambahan untuk ' || alat_name || ' di ' || room_rec.nama_ruangan,
      case when idx % 3 = 0 then null else 'PT Servis Medika Nusantara' end,
      case when idx % 3 = 0 then 'Selesai' else 'Selesai Vendor' end,
      foto_sebelum_v,
      foto_sesudah_v,
      case when idx % 3 = 0 then null else foto_sparepart_v end,
      case when idx % 3 = 0 then null else invoice_v end,
      'Maintenance',
      case when idx % 3 = 0 then 0 else 1250000 + (idx * 100000) end
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
    ) values (
      alat_id,
      kal_date,
      kal_date + 365,
      'PT Kalibrasi Nusantara',
      'Lulus',
      'CERT-' || room_rec.kode_ruangan || '-EXTRA-' || lpad(idx::text, 2, '0') || '-2026',
      'Kalibrasi dummy tambahan untuk inventaris baru.',
      'PT Kalibrasi Nusantara',
      'Sertifikat Terbit',
      foto_nilai_ukur_v,
      foto_sertifikat_v,
      'Kalibrasi'
    );
  end loop;

  perform pg_notify('pgrst', 'reload schema');
end $$;
