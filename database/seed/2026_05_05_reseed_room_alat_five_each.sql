do $$
declare
  room_rec record;
  spec record;
  alat_id uuid;
  room_idx integer := 0;
  alat_seq integer := 0;
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
  sql text;
  alat_template constant text := $svg$
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="%s"/>
      <stop offset="1" stop-color="%s"/>
    </linearGradient>
    <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#e2e8f0"/>
    </linearGradient>
    <filter id="shadow" x="-20%%" y="-20%%" width="140%%" height="140%%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#0f172a" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="900" height="600" fill="url(#bg)"/>
  <rect x="56" y="56" width="788" height="488" rx="34" fill="#ffffff" fill-opacity="0.16"/>
  <text x="90" y="126" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#ffffff">FOTO ALAT</text>
  <text x="90" y="160" font-family="Arial, sans-serif" font-size="20" fill="#eff6ff">%s</text>
  <g filter="url(#shadow)">
    <rect x="90" y="210" width="350" height="240" rx="28" fill="#f8fafc" fill-opacity="0.98"/>
    <rect x="130" y="250" width="165" height="110" rx="18" fill="url(#panel)"/>
    <rect x="175" y="278" width="75" height="50" rx="10" fill="%s"/>
    <rect x="315" y="250" width="58" height="160" rx="18" fill="#1e293b"/>
    <circle cx="172" cy="392" r="15" fill="#94a3b8"/>
    <circle cx="214" cy="392" r="15" fill="#94a3b8"/>
    <rect x="460" y="210" width="350" height="240" rx="28" fill="#f8fafc" fill-opacity="0.98"/>
    <rect x="500" y="250" width="280" height="16" rx="8" fill="%s"/>
    <rect x="500" y="282" width="230" height="16" rx="8" fill="%s"/>
    <rect x="500" y="314" width="170" height="16" rx="8" fill="%s"/>
    <rect x="500" y="350" width="200" height="12" rx="6" fill="#cbd5e1"/>
    <rect x="500" y="374" width="250" height="12" rx="6" fill="#cbd5e1"/>
    <text x="500" y="422" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#0f172a">%s</text>
    <text x="500" y="452" font-family="Arial, sans-serif" font-size="18" fill="#334155">%s</text>
  </g>
</svg>
$svg$;
  doc_template constant text := $svg$
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="%s"/>
      <stop offset="1" stop-color="%s"/>
    </linearGradient>
    <filter id="shadow" x="-20%%" y="-20%%" width="140%%" height="140%%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#0f172a" flood-opacity="0.16"/>
    </filter>
  </defs>
  <rect width="900" height="600" fill="url(#bg)"/>
  <g filter="url(#shadow)">
    <rect x="120" y="70" width="660" height="460" rx="28" fill="#ffffff"/>
    <rect x="165" y="110" width="220" height="18" rx="9" fill="%s"/>
    <rect x="165" y="146" width="300" height="12" rx="6" fill="#94a3b8"/>
    <rect x="165" y="185" width="560" height="16" rx="8" fill="#cbd5e1"/>
    <rect x="165" y="221" width="520" height="16" rx="8" fill="#cbd5e1"/>
    <rect x="165" y="257" width="480" height="16" rx="8" fill="#cbd5e1"/>
    <rect x="165" y="293" width="430" height="16" rx="8" fill="#cbd5e1"/>
    <rect x="165" y="345" width="180" height="130" rx="18" fill="%s" fill-opacity="0.14"/>
    <rect x="380" y="345" width="180" height="130" rx="18" fill="%s" fill-opacity="0.14"/>
    <rect x="595" y="345" width="110" height="130" rx="18" fill="%s" fill-opacity="0.14"/>
    <text x="165" y="430" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#0f172a">%s</text>
    <text x="165" y="462" font-family="Arial, sans-serif" font-size="18" fill="#334155">%s</text>
  </g>
</svg>
$svg$;
begin
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
    room_idx := room_idx + 1;

    sql := case room_rec.kode_ruangan
      when 'R001' then $q$
        select * from (values
          ('Monitor Pasien', 'Philips', 'IntelliVue MX450', 'Baik', 'Milik RS', 65000000, 'Preventive'),
          ('Ventilator', 'Drager', 'Savina 300', 'Maintenance', 'Milik RS', 180000000, 'Corrective Ringan'),
          ('Infusion Pump', 'B. Braun', 'Infusomat Space', 'Baik', 'Milik RS', 24500000, 'Corrective Berat'),
          ('Syringe Pump', 'Terumo', 'TE-SS830', 'Rusak', 'Milik RS', 22000000, 'Emergency (Breakdown)'),
          ('Suction Pump', 'Yuwell', '7E-A', 'Baik', 'Milik RS', 18500000, 'Preventive')
        ) as v(nama_alat, merk, tipe, kondisi, status_kepemilikan, harga_pembelian, maintenance_kind)
      $q$
      when 'R002' then $q$
        select * from (values
          ('Monitor Pasien Neonatal', 'Nihon Kohden', 'BSM-3562', 'Baik', 'Milik RS', 72000000, 'Preventive'),
          ('Infant Warmer', 'Fisher & Paykel', 'IW950', 'Maintenance', 'Milik RS', 145000000, 'Corrective Ringan'),
          ('Syringe Pump', 'Terumo', 'TE-SS830', 'Baik', 'Milik RS', 22500000, 'Corrective Berat'),
          ('Infusion Pump', 'B. Braun', 'Infusomat Space', 'Maintenance', 'Milik RS', 23500000, 'Emergency (Breakdown)'),
          ('Pulse Oximeter', 'Masimo', 'Rad-97', 'Baik', 'Milik RS', 28000000, 'Preventive')
        ) as v(nama_alat, merk, tipe, kondisi, status_kepemilikan, harga_pembelian, maintenance_kind)
      $q$
      when 'R003' then $q$
        select * from (values
          ('Monitor Pasien PICU', 'Philips', 'IntelliVue MX450', 'Baik', 'Milik RS', 68000000, 'Preventive'),
          ('Ventilator', 'Drager', 'Savina 300', 'Maintenance', 'Milik RS', 181000000, 'Corrective Ringan'),
          ('Infusion Pump', 'B. Braun', 'Infusomat Space', 'Baik', 'Milik RS', 24000000, 'Corrective Berat'),
          ('Pulse Oximeter', 'Masimo', 'Rad-97', 'Rusak', 'Milik RS', 26500000, 'Emergency (Breakdown)'),
          ('Nebulizer', 'Omron', 'NE-C28', 'Baik', 'Milik RS', 3500000, 'Preventive')
        ) as v(nama_alat, merk, tipe, kondisi, status_kepemilikan, harga_pembelian, maintenance_kind)
      $q$
      when 'R004' then $q$
        select * from (values
          ('Defibrillator', 'Zoll', 'R Series', 'Baik', 'Milik RS', 115000000, 'Preventive'),
          ('Monitor Pasien', 'Philips', 'IntelliVue MX450', 'Maintenance', 'Milik RS', 64000000, 'Corrective Ringan'),
          ('Ventilator', 'Drager', 'Savina 300', 'Baik', 'Milik RS', 179000000, 'Corrective Berat'),
          ('ECG', 'Bionet', 'Cardio7', 'Rusak', 'Milik RS', 21500000, 'Emergency (Breakdown)'),
          ('Suction Pump', 'Yuwell', '7E-A', 'Baik', 'Milik RS', 18000000, 'Preventive')
        ) as v(nama_alat, merk, tipe, kondisi, status_kepemilikan, harga_pembelian, maintenance_kind)
      $q$
      when 'R005' then $q$
        select * from (values
          ('Mesin Anestesi', 'Mindray', 'A7', 'Baik', 'Milik RS', 420000000, 'Preventive'),
          ('Lampu Operasi', 'Mindray', 'HyLED 760', 'Maintenance', 'Milik RS', 85000000, 'Corrective Ringan'),
          ('ESU', 'Valleylab', 'ForceTriad', 'Baik', 'Milik RS', 99000000, 'Corrective Berat'),
          ('Patient Warmer', 'Fisher & Paykel', 'IW950', 'Rusak', 'Milik RS', 135000000, 'Emergency (Breakdown)'),
          ('Suction Pump', 'Yuwell', '7E-A', 'Baik', 'Milik RS', 17000000, 'Preventive')
        ) as v(nama_alat, merk, tipe, kondisi, status_kepemilikan, harga_pembelian, maintenance_kind)
      $q$
      when 'R006' then $q$
        select * from (values
          ('USG Portable', 'GE', 'Vivid S70', 'Baik', 'Milik RS', 285000000, 'Preventive'),
          ('Monitor Pasien', 'Philips', 'IntelliVue MX450', 'Maintenance', 'Milik RS', 63000000, 'Corrective Ringan'),
          ('ECG', 'Bionet', 'Cardio7', 'Baik', 'Milik RS', 22500000, 'Corrective Berat'),
          ('Injector Kontras', 'Ulrich', 'CT Motion', 'Rusak', 'Milik RS', 95000000, 'Emergency (Breakdown)'),
          ('Printer Medis', 'Sony', 'UP-X898MD', 'Baik', 'Milik RS', 18500000, 'Preventive')
        ) as v(nama_alat, merk, tipe, kondisi, status_kepemilikan, harga_pembelian, maintenance_kind)
      $q$
      when 'R007' then $q$
        select * from (values
          ('Centrifuge', 'Hettich', 'EBA 200', 'Baik', 'Milik RS', 48000000, 'Preventive'),
          ('Microscope', 'Olympus', 'CX23', 'Maintenance', 'Milik RS', 36000000, 'Corrective Ringan'),
          ('Incubator', 'Memmert', 'IN30', 'Baik', 'Milik RS', 58000000, 'Corrective Berat'),
          ('Autoclave', 'Getinge', 'HS33', 'Rusak', 'Milik RS', 125000000, 'Emergency (Breakdown)'),
          ('Spectrophotometer', 'Thermo', 'Genesys 10S', 'Baik', 'Milik RS', 67000000, 'Preventive')
        ) as v(nama_alat, merk, tipe, kondisi, status_kepemilikan, harga_pembelian, maintenance_kind)
      $q$
      when 'R008' then $q$
        select * from (values
          ('Bedside Monitor', 'Philips', 'IntelliVue MX550', 'Baik', 'Milik RS', 76000000, 'Preventive'),
          ('Infusion Pump', 'B. Braun', 'Infusomat Space', 'Maintenance', 'Milik RS', 24000000, 'Corrective Ringan'),
          ('Suction Pump', 'Yuwell', '7E-A', 'Baik', 'Milik RS', 17500000, 'Corrective Berat'),
          ('Nebulizer', 'Omron', 'NE-C28', 'Rusak', 'Milik RS', 3400000, 'Emergency (Breakdown)'),
          ('Pulse Oximeter', 'Masimo', 'Rad-97', 'Baik', 'Milik RS', 29500000, 'Preventive')
        ) as v(nama_alat, merk, tipe, kondisi, status_kepemilikan, harga_pembelian, maintenance_kind)
      $q$
      when 'R009' then $q$
        select * from (values
          ('ECG', 'Bionet', 'Cardio7', 'Baik', 'Milik RS', 21000000, 'Preventive'),
          ('Pulse Oximeter', 'Masimo', 'Rad-97', 'Maintenance', 'Milik RS', 27500000, 'Corrective Ringan'),
          ('Nebulizer', 'Omron', 'NE-C28', 'Baik', 'Milik RS', 3200000, 'Corrective Berat'),
          ('Thermometer Infrared', 'Omron', 'MC-720', 'Rusak', 'Milik RS', 2100000, 'Emergency (Breakdown)'),
          ('Glucometer', 'Accu-Chek', 'Active', 'Baik', 'Milik RS', 1850000, 'Preventive')
        ) as v(nama_alat, merk, tipe, kondisi, status_kepemilikan, harga_pembelian, maintenance_kind)
      $q$
      when 'R010' then $q$
        select * from (values
          ('Autoclave', 'Tuttnauer', '3870M', 'Baik', 'Milik RS', 132000000, 'Preventive'),
          ('Sealing Machine', 'Audion', 'Seal 200', 'Maintenance', 'Milik RS', 26500000, 'Corrective Ringan'),
          ('Washer Disinfector', 'Steelco', 'DS 500', 'Baik', 'Milik RS', 275000000, 'Corrective Berat'),
          ('Drying Cabinet', 'Miele', 'A 104', 'Rusak', 'Milik RS', 68000000, 'Emergency (Breakdown)'),
          ('Sterilizer', 'Tuttnauer', '3870M', 'Baik', 'Milik RS', 128000000, 'Preventive')
        ) as v(nama_alat, merk, tipe, kondisi, status_kepemilikan, harga_pembelian, maintenance_kind)
      $q$
    end;

    for spec in execute sql loop
      alat_seq := alat_seq + 1;
      install_date := date '2024-01-01' + (room_idx * 19) + (spec.harga_pembelian::int % 20);
      maint_date := current_date - (12 + room_idx + (spec.harga_pembelian::int % 7));
      kal_date := current_date - (48 + room_idx + (spec.harga_pembelian::int % 11));

      svg := format(
        alat_template,
        case room_idx % 5
          when 0 then '#0f766e' when 1 then '#1d4ed8' when 2 then '#7c3aed' when 3 then '#c2410c' else '#0f172a' end,
        case room_idx % 5
          when 0 then '#ccfbf1' when 1 then '#dbeafe' when 2 then '#ede9fe' when 3 then '#ffedd5' else '#e2e8f0' end,
        room_rec.nama_ruangan,
        case room_idx % 5
          when 0 then '#14b8a6' when 1 then '#2563eb' when 2 then '#7c3aed' when 3 then '#ea580c' else '#0f172a' end,
        case room_idx % 5
          when 0 then '#0f766e' when 1 then '#1d4ed8' when 2 then '#7c3aed' when 3 then '#c2410c' else '#334155' end,
        case room_idx % 5
          when 0 then '#22c55e' when 1 then '#38bdf8' when 2 then '#a855f7' when 3 then '#fb923c' else '#475569' end,
        case room_idx % 5
          when 0 then '#94a3b8' when 1 then '#64748b' when 2 then '#94a3b8' when 3 then '#64748b' else '#94a3b8' end,
        spec.nama_alat,
        room_rec.nama_ruangan
      );
      foto_alat_v := 'data:image/svg+xml;base64,' || encode(convert_to(svg, 'UTF8'), 'base64');

      svg := format(
        doc_template,
        '#fee2e2',
        '#fecaca',
        '#b91c1c',
        '#fb7185',
        '#fecaca',
        '#fda4af',
        'SEBELUM MAINTENANCE',
        spec.nama_alat
      );
      foto_sebelum_v := 'data:image/svg+xml;base64,' || encode(convert_to(svg, 'UTF8'), 'base64');

      svg := format(
        doc_template,
        '#dcfce7',
        '#bbf7d0',
        '#15803d',
        '#86efac',
        '#bbf7d0',
        '#d1fae5',
        'SESUDAH MAINTENANCE',
        spec.nama_alat
      );
      foto_sesudah_v := 'data:image/svg+xml;base64,' || encode(convert_to(svg, 'UTF8'), 'base64');

      svg := format(
        doc_template,
        '#e2e8f0',
        '#cbd5e1',
        '#334155',
        '#94a3b8',
        '#cbd5e1',
        '#e2e8f0',
        'FOTO SPARE PART',
        spec.nama_alat
      );
      foto_sparepart_v := 'data:image/svg+xml;base64,' || encode(convert_to(svg, 'UTF8'), 'base64');

      svg := format(
        doc_template,
        '#fef3c7',
        '#fde68a',
        '#b45309',
        '#f59e0b',
        '#fcd34d',
        '#fef3c7',
        'INVOICE',
        spec.nama_alat
      );
      invoice_v := 'data:image/svg+xml;base64,' || encode(convert_to(svg, 'UTF8'), 'base64');

      svg := format(
        doc_template,
        '#dbeafe',
        '#bfdbfe',
        '#1d4ed8',
        '#93c5fd',
        '#bfdbfe',
        '#dbeafe',
        'NILAI UKUR',
        spec.nama_alat
      );
      foto_nilai_ukur_v := 'data:image/svg+xml;base64,' || encode(convert_to(svg, 'UTF8'), 'base64');

      svg := format(
        doc_template,
        '#ecfdf5',
        '#bbf7d0',
        '#15803d',
        '#86efac',
        '#bbf7d0',
        '#dcfce7',
        'SERTIFIKAT',
        spec.nama_alat
      );
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
      )
      values (
        upper(regexp_replace(room_rec.kode_ruangan || '-' || spec.nama_alat || '-' || spec.merk || '-' || spec.tipe, '[^A-Za-z0-9]+', '-', 'g')),
        spec.nama_alat,
        spec.merk,
        spec.tipe,
        'SN-' || room_rec.kode_ruangan || '-' || lpad(alat_seq::text, 2, '0') || '-2026',
        room_rec.id,
        'PT Medika Nusantara',
        extract(year from install_date)::int,
        spec.kondisi,
        'Aktif',
        maint_date,
        maint_date + 30,
        kal_date,
        kal_date + 365,
        foto_alat_v,
        spec.harga_pembelian,
        install_date + 30,
        install_date,
        null,
        spec.status_kepemilikan
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
        spec.maintenance_kind,
        maint_date,
        'Budi Teknisi',
        case
          when spec.maintenance_kind = 'Preventive' then 'Preventive selesai dan alat normal'
          when spec.maintenance_kind = 'Corrective Ringan' then 'Corrective ringan selesai'
          when spec.maintenance_kind = 'Corrective Berat' then 'Corrective berat selesai'
          else 'Breakdown selesai ditangani vendor'
        end,
        'Riwayat maintenance dummy lengkap untuk ' || spec.nama_alat || ' di ' || room_rec.nama_ruangan,
        case when spec.maintenance_kind = 'Preventive' then null else 'PT Servis Medika Nusantara' end,
        case when spec.maintenance_kind = 'Preventive' then 'Selesai' else 'Selesai Vendor' end,
        foto_sebelum_v,
        foto_sesudah_v,
        case when spec.maintenance_kind = 'Preventive' then null else foto_sparepart_v end,
        case when spec.maintenance_kind = 'Preventive' then null else invoice_v end,
        spec.maintenance_kind,
        case when spec.maintenance_kind = 'Preventive' then 0 else 1500000 + room_idx * 200000 end
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
        kal_date,
        kal_date + 365,
        'PT Kalibrasi Nusantara',
        case when room_idx % 4 = 0 and position('Monitor' in spec.nama_alat) > 0 then 'Tidak Lulus' else 'Lulus' end,
        'CERT-' || room_rec.kode_ruangan || '-' || replace(spec.nama_alat, ' ', '') || '-2026',
        'Riwayat kalibrasi dummy lengkap untuk ' || spec.nama_alat,
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
