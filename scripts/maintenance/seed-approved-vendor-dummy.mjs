const SUPABASE_URL = process.env.SUPABASE_URL || "https://brupcvzzrzflfujaijnw.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "sb_publishable_eQ8iUSOr42sMAgHjXE2ecA_FtvIDoRF";

const TODAY = new Date();
const TODAY_ISO = TODAY.toISOString().slice(0, 10);
const YEAR = TODAY.getFullYear();
const TOKEN_PREFIX = "DUMMY-VENDOR-APPROVED-20260519";

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function encode(value) {
  return encodeURIComponent(String(value));
}

async function request(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${response.status}: ${data?.message || data?.hint || text}`);
  }
  return data;
}

function get(path) {
  return request(path);
}

function post(path, body) {
  return request(path, { method: "POST", body: JSON.stringify(body) });
}

function patch(path, body) {
  return request(path, { method: "PATCH", body: JSON.stringify(body) });
}

function roomByName(rooms, name) {
  const room = rooms.find((item) => item.nama_ruangan === name);
  if (!room) throw new Error(`Ruangan tidak ditemukan: ${name}`);
  return room;
}

function vendorByService(vendors, service, preferredName) {
  const preferred = vendors.find((item) => item.vendor_layanan === service && item.nama_pt === preferredName);
  const fallback = vendors.find((item) => item.vendor_layanan === service && item.email);
  const vendor = preferred || fallback;
  if (!vendor) throw new Error(`Vendor ${service} aktif dengan email tidak ditemukan.`);
  return vendor;
}

function detailLine(left, right) {
  return [left, right].filter(Boolean).join(" / ") || "-";
}

function buildLetterHtml({ item, alat, room, vendor, teknisi, nomor, service }) {
  const isKalibrasi = service === "Kalibrasi";
  const perihal = `Pengajuan ${service} Alat Kesehatan`;
  const action = isKalibrasi ? "Kalibrasi" : item.kategori;
  const opening = isKalibrasi
    ? "Sehubungan dengan upaya menjaga akurasi, keamanan, dan kelayakan operasional alat kesehatan di lingkungan Rumah Sakit Zeonsze, bersama ini kami mengajukan permohonan pelaksanaan kalibrasi alat kesehatan dengan rincian sebagai berikut:"
    : "Sehubungan dengan upaya menjaga kualitas, keselamatan, dan kelayakan operasional alat kesehatan di lingkungan Rumah Sakit Zeonsze, bersama ini kami mengajukan permohonan pelaksanaan maintenance alat kesehatan dengan rincian sebagai berikut:";

  return `
    <article style="font-family:Arial,Helvetica,sans-serif;color:#172033;line-height:1.5;max-width:920px;margin:0 auto;background:#fff">
      <header style="display:flex;justify-content:space-between;gap:28px;align-items:flex-start;border-bottom:6px solid #0b55ad;padding:22px 0 14px;margin-bottom:24px">
        <div>
          <div style="font-size:18px;letter-spacing:4px;color:#0b55ad">RUMAH SAKIT</div>
          <div style="font-size:52px;line-height:1;color:#0b55ad;font-weight:800;font-family:Georgia,serif">Zeonsze</div>
          <div style="font-size:14px;font-style:italic">Melayani dengan Hati, Menjaga Kesehatan Anda</div>
        </div>
        <div style="font-size:13px;line-height:1.55;color:#172033">
          <div>Jl. Sehat No. 123, Kel. Sejahtera</div>
          <div>Kec. Sehat Selalu, Kota Sehat</div>
          <div>Prov. Sehat, 12345</div>
          <div style="margin-top:8px">(021) 1234 5678</div>
          <div>info@rszeonsze.co.id</div>
          <div>www.rszeonsze.co.id</div>
        </div>
      </header>

      <p style="text-align:right;margin:0 0 22px">Tanggal, ${new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(TODAY)}</p>
      <table style="margin:0 0 26px">
        <tr><td style="padding:2px 14px 2px 0">Nomor</td><td style="padding:2px 12px">:</td><td>${escapeHtml(nomor)}</td></tr>
        <tr><td style="padding:2px 14px 2px 0">Lampiran</td><td style="padding:2px 12px">:</td><td>1 (satu) lembar</td></tr>
        <tr><td style="padding:2px 14px 2px 0">Perihal</td><td style="padding:2px 12px">:</td><td><strong>${escapeHtml(perihal)}</strong></td></tr>
      </table>

      <p>Kepada Yth.<br><strong>Pimpinan / Tim Teknisi</strong><br>${escapeHtml(vendor.nama_pt || vendor.nama || "-")}<br>di Tempat</p>
      <p>Dengan hormat,</p>
      <p>${escapeHtml(opening)}</p>

      <table style="border-collapse:collapse;width:100%;margin:20px 0 24px;font-size:14px">
        <thead>
          <tr style="background:#0b55ad;color:#fff">
            <th style="border:1px solid #8b95a7;padding:8px">No.</th>
            <th style="border:1px solid #8b95a7;padding:8px">Nama Alat</th>
            <th style="border:1px solid #8b95a7;padding:8px">Merk / Tipe</th>
            <th style="border:1px solid #8b95a7;padding:8px">Serial Number</th>
            <th style="border:1px solid #8b95a7;padding:8px">Jumlah</th>
            <th style="border:1px solid #8b95a7;padding:8px">Ruang / Lokasi</th>
            <th style="border:1px solid #8b95a7;padding:8px">Jenis Tindakan</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border:1px solid #8b95a7;padding:8px;text-align:center">1</td>
            <td style="border:1px solid #8b95a7;padding:8px">${escapeHtml(alat.nama_alat)}</td>
            <td style="border:1px solid #8b95a7;padding:8px">${escapeHtml(detailLine(alat.merk, alat.tipe))}</td>
            <td style="border:1px solid #8b95a7;padding:8px">${escapeHtml(alat.serial_number)}</td>
            <td style="border:1px solid #8b95a7;padding:8px;text-align:center">1 Unit</td>
            <td style="border:1px solid #8b95a7;padding:8px">${escapeHtml(room.nama_ruangan)}</td>
            <td style="border:1px solid #8b95a7;padding:8px">${escapeHtml(action)}</td>
          </tr>
        </tbody>
      </table>

      <p>Pelaksanaan kegiatan tersebut kami harapkan dapat dilakukan pada:</p>
      <table style="margin:0 0 22px">
        <tr><td style="padding:2px 14px 2px 0">Hari/Tanggal</td><td style="padding:2px 12px">:</td><td>${new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(TODAY)}</td></tr>
        <tr><td style="padding:2px 14px 2px 0">Lokasi</td><td style="padding:2px 12px">:</td><td>Rumah Sakit Zeonsze, Jl. Sehat No. 123</td></tr>
        <tr><td style="padding:2px 14px 2px 0">PIC Rumah Sakit</td><td style="padding:2px 12px">:</td><td>${escapeHtml(teknisi.nama || teknisi.username || "-")}</td></tr>
        <tr><td style="padding:2px 14px 2px 0">Nomor HP</td><td style="padding:2px 12px">:</td><td>${escapeHtml(teknisi.no_hp || "-")}</td></tr>
      </table>

      <p>Demikian surat pengajuan ini kami sampaikan. Besar harapan kami agar permohonan ini dapat segera diproses. Atas perhatian dan kerja sama yang baik, kami ucapkan terima kasih.</p>
      <div style="display:flex;justify-content:flex-end;margin-top:34px">
        <div style="text-align:left;min-width:260px">
          <p style="margin:0 0 62px">Hormat kami,<br><strong>Rumah Sakit Zeonsze</strong></p>
          <p style="margin:0"><strong><u>dr. Andika Pratama</u></strong><br>Direktur Utama</p>
        </div>
      </div>
      <footer style="border-top:5px solid #25a44a;margin-top:24px;padding:10px 0;text-align:center;color:#0b55ad;font-weight:700">Melayani dengan Hati, Menjaga Kesehatan Anda</footer>
    </article>
  `;
}

const dummyRows = [
  {
    token: `${TOKEN_PREFIX}-01`,
    service: "Maintenance",
    kategori: "Corrective Berat",
    room: "ICU",
    vendorPreferred: "PT Servis Medika Nusantara",
    alat: {
      kode_barcode: "R001-SYRINGE-PUMP-DUAL-TERUMO-SS835-DMY01",
      nama_alat: "Syringe Pump Dual Channel",
      merk: "Terumo",
      tipe: "TE-SS835",
      serial_number: "DMY-MTN-001",
      vendor: "PT Servis Medika Nusantara",
      harga_pembelian: 37500000,
      tanggal_instalasi: "2025-02-12",
      kalibrasi_awal: "2025-02-13",
      kondisi: "Maintenance",
    },
    catatan: "Pengajuan dummy corrective berat untuk vendor maintenance: alarm tekanan oklusi tidak stabil.",
  },
  {
    token: `${TOKEN_PREFIX}-02`,
    service: "Maintenance",
    kategori: "Emergency (Breakdown)",
    room: "OK",
    vendorPreferred: "PT Servis Medika Nusantara",
    alat: {
      kode_barcode: "R005-OPERATING-TABLE-MAQUET-ALPHAMAXX-DMY02",
      nama_alat: "Operating Table Electric",
      merk: "Maquet",
      tipe: "Alphamaxx",
      serial_number: "DMY-MTN-002",
      vendor: "PT Servis Medika Nusantara",
      harga_pembelian: 275000000,
      tanggal_instalasi: "2024-11-08",
      kalibrasi_awal: "2024-11-09",
      kondisi: "Rusak",
    },
    catatan: "Pengajuan dummy emergency breakdown: sistem elevasi meja operasi macet.",
  },
  {
    token: `${TOKEN_PREFIX}-03`,
    service: "Maintenance",
    kategori: "Corrective Berat",
    room: "CSSD",
    vendorPreferred: "PT Servis Medika Nusantara",
    alat: {
      kode_barcode: "R010-WASHER-STERILIZER-GETINGE-WD14-DMY03",
      nama_alat: "Washer Sterilizer",
      merk: "Getinge",
      tipe: "WD14",
      serial_number: "DMY-MTN-003",
      vendor: "PT Servis Medika Nusantara",
      harga_pembelian: 188000000,
      tanggal_instalasi: "2025-01-20",
      kalibrasi_awal: "2025-01-22",
      kondisi: "Maintenance",
    },
    catatan: "Pengajuan dummy corrective berat: siklus washing tidak mencapai suhu target.",
  },
  {
    token: `${TOKEN_PREFIX}-04`,
    service: "Kalibrasi",
    kategori: null,
    room: "NICU",
    vendorPreferred: "PT KALIBRASI INDONESIA",
    alat: {
      kode_barcode: "R002-PATIENT-MONITOR-TRANSPORT-MINDRAY-N17-DMY04",
      nama_alat: "Patient Monitor Transport",
      merk: "Mindray",
      tipe: "BeneVision N17",
      serial_number: "DMY-KAL-001",
      vendor: "PT KALIBRASI INDONESIA",
      harga_pembelian: 98000000,
      tanggal_instalasi: "2024-08-15",
      kalibrasi_awal: "2024-08-16",
      kondisi: "Baik",
    },
    catatan: "Pengajuan dummy kalibrasi tahunan patient monitor transport.",
  },
  {
    token: `${TOKEN_PREFIX}-05`,
    service: "Kalibrasi",
    kategori: null,
    room: "Radiologi",
    vendorPreferred: "PT KALIBRASI INDONESIA",
    alat: {
      kode_barcode: "R006-XRAY-MOBILE-SIEMENS-MOBILETT-MIRA-DMY05",
      nama_alat: "X-Ray Mobile",
      merk: "Siemens",
      tipe: "Mobilett Mira",
      serial_number: "DMY-KAL-002",
      vendor: "PT KALIBRASI INDONESIA",
      harga_pembelian: 445000000,
      tanggal_instalasi: "2024-09-18",
      kalibrasi_awal: "2024-09-19",
      kondisi: "Baik",
    },
    catatan: "Pengajuan dummy kalibrasi keluaran radiasi dan akurasi exposure.",
  },
  {
    token: `${TOKEN_PREFIX}-06`,
    service: "Kalibrasi",
    kategori: null,
    room: "Laboratorium",
    vendorPreferred: "PT KALIBRASI INDONESIA",
    alat: {
      kode_barcode: "R007-CHEMISTRY-ANALYZER-ABBOTT-ALINITY-C-DMY06",
      nama_alat: "Chemistry Analyzer",
      merk: "Abbott",
      tipe: "Alinity C",
      serial_number: "DMY-KAL-003",
      vendor: "PT KALIBRASI INDONESIA",
      harga_pembelian: 625000000,
      tanggal_instalasi: "2024-12-05",
      kalibrasi_awal: "2024-12-06",
      kondisi: "Baik",
    },
    catatan: "Pengajuan dummy kalibrasi parameter fotometri chemistry analyzer.",
  },
];

async function getOrCreateAlat(item, room) {
  const existing = await get(`alat_kesehatan?select=*&kode_barcode=eq.${encode(item.alat.kode_barcode)}&limit=1`);
  const payload = {
    ...item.alat,
    ruangan_id: room.id,
    status: "Aktif",
    status_kepemilikan: "Milik RS",
  };
  if (item.service === "Maintenance") {
    payload.maintenance_terakhir = TODAY_ISO;
    payload.maintenance_berikutnya = addDays(TODAY, 90);
  } else {
    payload.kalibrasi_terakhir = TODAY_ISO;
    payload.kalibrasi_berikutnya = addDays(TODAY, 365);
  }
  if (existing[0]) {
    await patch(`alat_kesehatan?id=eq.${encode(existing[0].id)}`, payload);
    return { ...existing[0], ...payload };
  }
  return (await post("alat_kesehatan", payload))[0];
}

async function upsertPengajuan({ item, alat, room, vendor, teknisi }) {
  const existing = await get(`pengajuan?select=*&catatan=ilike.*${encode(item.token)}*&limit=1`);
  const payload = {
    jenis_pengajuan: item.service,
    kategori: item.service === "Maintenance" ? item.kategori : null,
    alat_id: alat.id,
    ruangan_id: room.id,
    vendor_pt: vendor.nama_pt || vendor.nama || null,
    catatan: `${item.catatan} [${item.token}]`,
    dibuat_oleh: teknisi.username || teknisi.nama || "ZainTeknisi",
    dibuat_oleh_role: "Teknisi",
    tujuan_role: "Vendor",
    status: "Diteruskan Vendor",
  };
  if (existing[0]) {
    await patch(`pengajuan?id=eq.${encode(existing[0].id)}`, payload);
    return { ...existing[0], ...payload };
  }
  return (await post("pengajuan", payload))[0];
}

async function upsertWorkRecord({ item, alat, vendor }) {
  if (item.service === "Kalibrasi") {
    const existing = await get(`kalibrasi?select=*&alat_id=eq.${encode(alat.id)}&catatan=ilike.*${encode(item.token)}*&limit=1`);
    const payload = {
      alat_id: alat.id,
      tanggal_kalibrasi: TODAY_ISO,
      berlaku_sampai: addDays(TODAY, 365),
      vendor: vendor.nama_pt || vendor.nama || null,
      vendor_pt: vendor.nama_pt || vendor.nama || null,
      status_progres: "Baru",
      hasil: "Lulus",
      nomor_sertifikat: `CERT-${item.alat.kode_barcode.slice(0, 12)}-${YEAR}`,
      catatan: `${item.catatan} [${item.token}]`,
      service_type: "Kalibrasi",
    };
    if (existing[0]) {
      await patch(`kalibrasi?id=eq.${encode(existing[0].id)}`, payload);
      return { table: "kalibrasi", row: { ...existing[0], ...payload } };
    }
    return { table: "kalibrasi", row: (await post("kalibrasi", payload))[0] };
  }

  const existing = await get(`maintenance?select=*&alat_id=eq.${encode(alat.id)}&keterangan=ilike.*${encode(item.token)}*&limit=1`);
  const payload = {
    alat_id: alat.id,
    jenis: item.kategori,
    tanggal: TODAY_ISO,
    teknisi: "ZainTeknisi",
    vendor_pt: vendor.nama_pt || vendor.nama || null,
    status_progres: "Baru",
    hasil: "Menunggu pekerjaan vendor",
    keterangan: `${item.catatan} [${item.token}]`,
    service_type: "Maintenance",
  };
  if (existing[0]) {
    await patch(`maintenance?id=eq.${encode(existing[0].id)}`, payload);
    return { table: "maintenance", row: { ...existing[0], ...payload } };
  }
  return { table: "maintenance", row: (await post("maintenance", payload))[0] };
}

async function upsertHistory({ item, alat, vendor, work }) {
  const existing = await get(`histori_alat?select=id&alat_id=eq.${encode(alat.id)}&detail=ilike.*${encode(item.token)}*&limit=1`);
  const payload = {
    alat_id: alat.id,
    aksi: "Pengajuan Vendor Approved",
    petugas: "ZainTeknisi",
    detail: `${item.service} ${item.kategori || ""} langsung disetujui supervisor dan diteruskan ke ${vendor.nama_pt || vendor.nama}. Record ${work.table}:${work.row.id}. [${item.token}]`,
  };
  if (existing[0]) {
    await patch(`histori_alat?id=eq.${encode(existing[0].id)}`, payload);
    return existing[0];
  }
  return (await post("histori_alat", payload))[0];
}

async function upsertLetterAndEmail({ item, alat, room, vendor, teknisi, pengajuan, work }) {
  const existing = await get(`surat_vendor?select=*&pengajuan_id=eq.${encode(pengajuan.id)}&limit=1`);
  const nomor = `${String(dummyRows.findIndex((row) => row.token === item.token) + 32).padStart(3, "0")}/RSZS/IPRS/V/${YEAR}`;
  const subject = `Pengajuan ${item.service} Alat Kesehatan - ${alat.nama_alat}`;
  const html = buildLetterHtml({ item, alat, room, vendor, teknisi, nomor, service: item.service });
  const suratPayload = {
    pengajuan_id: pengajuan.id,
    record_ref: `${work.table}:${work.row.id}`,
    nomor_surat: nomor,
    vendor_pt: vendor.nama_pt || vendor.nama || null,
    jenis_layanan: item.service,
    subject,
    to_email: vendor.email || null,
    html_surat: html,
    email_status: vendor.email ? "Queued" : "No Email",
    dibuat_oleh: teknisi.username || teknisi.nama || "ZainTeknisi",
  };

  let surat = existing[0];
  if (surat) {
    await patch(`surat_vendor?id=eq.${encode(surat.id)}`, suratPayload);
    surat = { ...surat, ...suratPayload };
  } else {
    surat = (await post("surat_vendor", suratPayload))[0];
  }

  if (vendor.email) {
    const existingQueue = await get(`email_queue?select=*&surat_id=eq.${encode(surat.id)}&limit=1`);
    const queuePayload = {
      surat_id: surat.id,
      to_email: vendor.email,
      subject,
      html_body: html,
      status: "Queued",
      error_message: null,
    };
    if (existingQueue[0]) {
      await patch(`email_queue?id=eq.${encode(existingQueue[0].id)}`, queuePayload);
    } else {
      await post("email_queue", queuePayload);
    }
  }
}

async function main() {
  const [rooms, vendors, petugas] = await Promise.all([
    get("ruangan?select=*&order=kode_ruangan.asc"),
    get("user_petugas?select=*&role=eq.Vendor&status=eq.Aktif"),
    get("user_petugas?select=*&username=eq.ZainTeknisi&limit=1"),
  ]);
  const teknisi = petugas[0] || { nama: "ZainTeknisi", username: "ZainTeknisi" };

  for (const item of dummyRows) {
    const room = roomByName(rooms, item.room);
    const vendor = vendorByService(vendors, item.service, item.vendorPreferred);
    const alat = await getOrCreateAlat(item, room);
    const pengajuan = await upsertPengajuan({ item, alat, room, vendor, teknisi });
    const work = await upsertWorkRecord({ item, alat, vendor });
    await upsertHistory({ item, alat, vendor, work });
    await upsertLetterAndEmail({ item, alat, room, vendor, teknisi, pengajuan, work });
    console.log(`${item.token}: ${alat.nama_alat} -> ${item.service} -> ${vendor.nama_pt || vendor.nama}`);
  }

  const alatCount = await get("alat_kesehatan?select=id");
  const queuedEmail = await get(`email_queue?select=id&status=eq.Queued`);
  console.log(`Total alat sekarang: ${alatCount.length}`);
  console.log(`Email queued: ${queuedEmail.length}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
