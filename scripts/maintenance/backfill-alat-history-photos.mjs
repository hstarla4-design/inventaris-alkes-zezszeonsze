import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://brupcvzzrzflfujaijnw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_eQ8iUSOr42sMAgHjXE2ecA_FtvIDoRF";
const DUMMY_MARKER_PATTERN = /\[DUMMY-VENDOR-APPROVED-[^\]]+\]/g;
const MIN_HISTORY_PER_ALAT = 3;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

function svgDataUrl(title, subtitle, accent = "#0f9f8f") {
  const safeTitle = escapeXml(title || "Foto alat");
  const safeSubtitle = escapeXml(subtitle || "Dokumentasi inventaris");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="960" height="600" viewBox="0 0 960 600">
      <rect width="960" height="600" fill="#f8fafc"/>
      <rect x="42" y="42" width="876" height="516" rx="24" fill="#ffffff" stroke="#d7dde7" stroke-width="4"/>
      <rect x="42" y="42" width="876" height="16" rx="8" fill="${accent}"/>
      <circle cx="160" cy="178" r="64" fill="${accent}" opacity="0.12"/>
      <rect x="112" y="148" width="96" height="60" rx="10" fill="${accent}" opacity="0.85"/>
      <rect x="128" y="164" width="64" height="12" rx="6" fill="#ffffff" opacity="0.9"/>
      <rect x="132" y="186" width="56" height="8" rx="4" fill="#ffffff" opacity="0.7"/>
      <text x="260" y="170" font-family="Arial, sans-serif" font-size="42" font-weight="800" fill="#172033">${safeTitle}</text>
      <text x="260" y="224" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#667085">${safeSubtitle}</text>
      <rect x="112" y="330" width="736" height="90" rx="18" fill="#eef6f5"/>
      <text x="148" y="386" font-family="Arial, sans-serif" font-size="28" font-weight="800" fill="#08766b">RS Zeonsze - Dokumentasi Alat Kesehatan</text>
      <text x="112" y="508" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#667085">Data ini merupakan placeholder dokumentasi untuk kelengkapan histori.</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/\s+/g, " ").trim())}`;
}

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function cleanText(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(DUMMY_MARKER_PATTERN, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function dateAdd(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function monthAdd(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next.toISOString().slice(0, 10);
}

async function selectAll(table, query = "*") {
  const { data, error } = await supabase.from(table).select(query);
  if (error) throw new Error(`${table}: ${error.message}`);
  return data || [];
}

async function patch(table, id, body) {
  const { error } = await supabase.from(table).update(body).eq("id", id);
  if (error) throw new Error(`${table}/${id}: ${error.message}`);
}

async function insert(table, rows) {
  if (!rows.length) return [];
  const { data, error } = await supabase.from(table).insert(rows).select();
  if (error) throw new Error(`${table} insert: ${error.message}`);
  return data || [];
}

function maintenancePayload(alat, index, sequence = 0) {
  const baseDates = ["2025-02-03", "2025-09-08", "2026-05-01"];
  const tanggal = dateAdd(baseDates[sequence % baseDates.length], (index + sequence * 3) % 24);
  const nextMaintenance = monthAdd(tanggal, 6);
  const title = alat.nama_alat || "Alat kesehatan";
  const jenisBySequence = ["Preventive", "Corrective Ringan", "Preventive"];
  return {
    alat_id: alat.id,
    jenis: alat.kondisi === "Rusak" && sequence === 1 ? "Corrective Ringan" : jenisBySequence[sequence % jenisBySequence.length],
    tanggal,
    teknisi: "Budi Teknisi",
    vendor_pt: alat.kondisi === "Rusak" ? "PT Servis Medika Nusantara" : null,
    status_progres: "Selesai",
    foto_sebelum: svgDataUrl("Foto sebelum maintenance", title, "#e15b43"),
    foto_sesudah: svgDataUrl("Foto sesudah maintenance", title, "#0f9f8f"),
    foto_sparepart: svgDataUrl("Foto sparepart", title, "#c9811d"),
    invoice: svgDataUrl("Invoice maintenance", title, "#172033"),
    biaya_perbaikan: alat.kondisi === "Rusak" && sequence === 1 ? 750000 : 0,
    hasil: sequence === 1 ? "Pengecekan fungsi dan perbaikan ringan selesai." : "Preventive maintenance selesai, alat dapat digunakan sesuai fungsi.",
    keterangan: `Riwayat maintenance ke-${sequence + 1} untuk inventaris dan histori QR.`,
    service_type: "Maintenance",
    _nextMaintenance: nextMaintenance,
  };
}

function kalibrasiPayload(alat, index, sequence = 0) {
  const baseDates = ["2024-07-10", "2025-07-10", "2026-04-01"];
  const tanggalKalibrasi = dateAdd(baseDates[sequence % baseDates.length], (index + sequence * 2) % 28);
  const berlakuSampai = monthAdd(tanggalKalibrasi, 12);
  const title = alat.nama_alat || "Alat kesehatan";
  return {
    alat_id: alat.id,
    tanggal_kalibrasi: tanggalKalibrasi,
    berlaku_sampai: berlakuSampai,
    vendor: "PT Kalibrasi Medika Indonesia",
    vendor_pt: "PT Kalibrasi Medika Indonesia",
    status_progres: "Selesai",
    foto_nilai_ukur: svgDataUrl("Nilai ukur kalibrasi", title, "#0f9f8f"),
    foto_sertifikat: svgDataUrl("Sertifikat kalibrasi", title, "#214fb8"),
    hasil: "Lulus",
    nomor_sertifikat: `CERT-${String(index + 1).padStart(3, "0")}-${String(sequence + 1).padStart(2, "0")}-RSZS`,
    catatan: `Riwayat kalibrasi ke-${sequence + 1} untuk inventaris dan histori QR.`,
    service_type: "Kalibrasi",
  };
}

async function main() {
  const alat = await selectAll("alat_kesehatan");
  const maintenance = await selectAll("maintenance");
  const kalibrasi = await selectAll("kalibrasi");

  const maintenanceByAlat = new Map();
  maintenance.forEach((item) => {
    if (!item.alat_id) return;
    if (!maintenanceByAlat.has(item.alat_id)) maintenanceByAlat.set(item.alat_id, []);
    maintenanceByAlat.get(item.alat_id).push(item);
  });

  const kalibrasiByAlat = new Map();
  kalibrasi.forEach((item) => {
    if (!item.alat_id) return;
    if (!kalibrasiByAlat.has(item.alat_id)) kalibrasiByAlat.set(item.alat_id, []);
    kalibrasiByAlat.get(item.alat_id).push(item);
  });

  const maintenanceRows = [];
  const kalibrasiRows = [];
  let alatUpdated = 0;

  for (const [index, item] of alat.entries()) {
    const fotoAlat = item.foto_alat || svgDataUrl("Foto alat", item.nama_alat, "#0f9f8f");
    const update = {};
    if (!item.foto_alat) update.foto_alat = fotoAlat;

    const existingMaintenanceCount = maintenanceByAlat.get(item.id)?.length || 0;
    for (let sequence = existingMaintenanceCount; sequence < MIN_HISTORY_PER_ALAT; sequence += 1) {
      const payload = maintenancePayload(item, index, sequence);
      const { _nextMaintenance, ...row } = payload;
      maintenanceRows.push(row);
      update.maintenance_terakhir = payload.tanggal;
      update.maintenance_berikutnya = payload._nextMaintenance;
    }

    const existingKalibrasiCount = kalibrasiByAlat.get(item.id)?.length || 0;
    for (let sequence = existingKalibrasiCount; sequence < MIN_HISTORY_PER_ALAT; sequence += 1) {
      const payload = kalibrasiPayload(item, index, sequence);
      kalibrasiRows.push(payload);
      update.kalibrasi_terakhir = payload.tanggal_kalibrasi;
      update.kalibrasi_berikutnya = payload.berlaku_sampai;
    }

    if (Object.keys(update).length) {
      await patch("alat_kesehatan", item.id, update);
      alatUpdated += 1;
    }
  }

  const insertedMaintenance = await insert("maintenance", maintenanceRows);
  const insertedKalibrasi = await insert("kalibrasi", kalibrasiRows);

  let maintenanceUpdated = 0;
  for (const item of maintenance) {
    const related = alat.find((row) => row.id === item.alat_id);
    const body = {};
    if (!item.foto_sebelum) body.foto_sebelum = svgDataUrl("Foto sebelum maintenance", related?.nama_alat, "#e15b43");
    if (!item.foto_sesudah) body.foto_sesudah = svgDataUrl("Foto sesudah maintenance", related?.nama_alat, "#0f9f8f");
    if (!item.foto_sparepart) body.foto_sparepart = svgDataUrl("Foto sparepart", related?.nama_alat, "#c9811d");
    if (!item.invoice) body.invoice = svgDataUrl("Invoice maintenance", related?.nama_alat, "#172033");
    for (const key of ["hasil", "keterangan", "status_progres", "vendor_pt"]) {
      const cleaned = cleanText(item[key]);
      if (cleaned !== item[key]) body[key] = cleaned || null;
    }
    if (Object.keys(body).length) {
      await patch("maintenance", item.id, body);
      maintenanceUpdated += 1;
    }
  }

  let kalibrasiUpdated = 0;
  for (const item of kalibrasi) {
    const related = alat.find((row) => row.id === item.alat_id);
    const body = {};
    if (!item.foto_nilai_ukur) body.foto_nilai_ukur = svgDataUrl("Nilai ukur kalibrasi", related?.nama_alat, "#0f9f8f");
    if (!item.foto_sertifikat) body.foto_sertifikat = svgDataUrl("Sertifikat kalibrasi", related?.nama_alat, "#214fb8");
    for (const key of ["catatan", "hasil", "nomor_sertifikat", "vendor", "vendor_pt", "status_progres"]) {
      const cleaned = cleanText(item[key]);
      if (cleaned !== item[key]) body[key] = cleaned || null;
    }
    if (Object.keys(body).length) {
      await patch("kalibrasi", item.id, body);
      kalibrasiUpdated += 1;
    }
  }

  const cleanupTables = [
    "alat_kesehatan",
    "maintenance",
    "kalibrasi",
    "histori_alat",
    "pengajuan",
    "notifikasi_teknisi",
    "feedback_vendor",
    "surat_vendor",
    "email_queue",
  ];

  const cleanup = {};
  for (const table of cleanupTables) {
    const rows = await selectAll(table).catch(() => []);
    let count = 0;
    for (const row of rows) {
      const body = {};
      Object.entries(row).forEach(([field, value]) => {
        if (typeof value !== "string") return;
        const cleaned = cleanText(value);
        if (cleaned !== value) body[field] = cleaned || null;
      });
      if (Object.keys(body).length) {
        await patch(table, row.id, body);
        count += 1;
      }
    }
    cleanup[table] = count;
  }

  console.log(
    JSON.stringify(
      {
        alat_total: alat.length,
        alat_updated: alatUpdated,
        maintenance_inserted: insertedMaintenance.length,
        kalibrasi_inserted: insertedKalibrasi.length,
        maintenance_updated: maintenanceUpdated,
        kalibrasi_updated: kalibrasiUpdated,
        marker_cleanup: cleanup,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
