import dotenv from "dotenv";

dotenv.config({ path: "backend/.env", quiet: true });
dotenv.config({ path: ".env", quiet: true });

const SUPABASE_URL = process.env.SUPABASE_URL || "https://brupcvzzrzflfujaijnw.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY belum tersedia di backend/.env.");
}

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};
const unsupportedColumns = new Set();

const TODAY = new Date();
const SCHEDULE_START = new Date(TODAY);
SCHEDULE_START.setHours(0, 0, 0, 0);
SCHEDULE_START.setMonth(5, 24);
if (SCHEDULE_START < TODAY) {
  SCHEDULE_START.setFullYear(SCHEDULE_START.getFullYear() + 1);
}
const RISK_COST = {
  Tinggi: { calibration: 2200000, preventive: 950000, correctiveLight: 1850000, correctiveHeavy: 5600000, breakdown: 8300000 },
  Sedang: { calibration: 1250000, preventive: 650000, correctiveLight: 1250000, correctiveHeavy: 3600000, breakdown: 5400000 },
  Rendah: { calibration: 750000, preventive: 425000, correctiveLight: 850000, correctiveHeavy: 2200000, breakdown: 3200000 },
};
const VENDORS = [
  "PT Servis Medika Nusantara",
  "PT Kalibrasi Indonesia",
  "PT Prima Elektromedik Sejahtera",
  "PT Teknologi Kesehatan Mandiri",
  "PT Global Alkes Prima",
  "PT Medika Nusantara",
];
const TECHNICIANS = ["ZainTeknisi", "Budi Teknisi", "Tim Elektromedis RS ZezszeonSze"];

const EQUIPMENT_DEFAULTS = [
  [/patient monitor|bedside monitor|monitor pasien/i, ["Mindray", "BeneVision N17"]],
  [/infusion pump/i, ["B. Braun", "Infusomat Space"]],
  [/syringe pump/i, ["Terumo", "TE-SS835"]],
  [/ventilator/i, ["Drager", "Savina 300"]],
  [/defibrillator/i, ["Zoll", "R Series"]],
  [/ecg/i, ["Bionet", "Cardio7"]],
  [/suction pump/i, ["Yuwell", "7E-A"]],
  [/pulse oximeter/i, ["Masimo", "Rad-97"]],
  [/nebulizer/i, ["Omron", "NE-C28"]],
  [/autoclave|sterilizer/i, ["Getinge", "HS44"]],
  [/c-arm/i, ["Siemens", "Cios Alpha"]],
  [/anestesi/i, ["Mindray", "A9"]],
  [/incubator/i, ["Memmert", "IN30"]],
  [/warmer/i, ["Fisher & Paykel", "IW950"]],
  [/ultrasound|usg/i, ["GE", "Vivid S70"]],
  [/capnograph/i, ["Mindray", "PM-60"]],
];

function iso(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(days) {
  const date = new Date(TODAY);
  date.setDate(date.getDate() + days);
  return iso(date);
}

function addDaysFromSchedule(days) {
  const date = new Date(SCHEDULE_START);
  date.setDate(date.getDate() + days);
  return iso(date);
}

function addYears(value, years = 1) {
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  date.setFullYear(date.getFullYear() + years);
  return iso(date);
}

function subDays(days) {
  const date = new Date(TODAY);
  date.setDate(date.getDate() - days);
  return iso(date);
}

function slug(value, max = 32) {
  return String(value || "ALKES")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max) || "ALKES";
}

function riskForName(name) {
  const value = String(name || "").toLowerCase();
  if (/ventilator|defibrillator|anestesi|monitor|infusion|syringe|incubator|warmer|c-arm|x-ray|injector/.test(value)) return "Tinggi";
  if (/ecg|usg|suction|sterilizer|autoclave|analyzer|centrifuge|phototherapy|oximeter|capnograph|nebulizer/.test(value)) return "Sedang";
  return "Rendah";
}

function nextByRisk(risk, offset = 0) {
  if (risk === "Tinggi") return addDaysFromSchedule(offset % 31);
  if (risk === "Sedang") return addDaysFromSchedule(15 + (offset % 46));
  return addDaysFromSchedule(30 + (offset % 61));
}

function equipmentIdentity(item) {
  const match = EQUIPMENT_DEFAULTS.find(([pattern]) => pattern.test(String(item.nama_alat || "")));
  return match?.[1] || ["MedTech", `Model-${slug(item.nama_alat, 10)}`];
}

function priceByRisk(risk, index) {
  const base = risk === "Tinggi" ? 285000000 : risk === "Sedang" ? 85000000 : 28000000;
  return base + (index % 9) * (risk === "Tinggi" ? 17500000 : risk === "Sedang" ? 6500000 : 2500000);
}

function equipmentPhoto(item, serial) {
  const name = String(item.nama_alat || "Alat Kesehatan").replace(/[<>&"']/g, "");
  const code = String(serial || item.kode_barcode || "").replace(/[<>&"']/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560"><rect width="900" height="560" rx="36" fill="#edfafa"/><rect x="32" y="32" width="836" height="496" rx="28" fill="#ffffff" stroke="#9bd8d3" stroke-width="4"/><circle cx="155" cy="190" r="76" fill="#0f9f91"/><path d="M155 135v110M100 190h110" stroke="#fff" stroke-width="28" stroke-linecap="round"/><text x="270" y="165" font-family="Arial" font-size="34" font-weight="700" fill="#102238">${name}</text><text x="270" y="220" font-family="Arial" font-size="24" fill="#52647a">Inventaris RS ZezszeonSze</text><text x="270" y="275" font-family="Arial" font-size="22" fill="#0b796f">${code}</text><text x="70" y="455" font-family="Arial" font-size="20" fill="#52647a">Foto identitas alat - data inventaris terverifikasi</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function maintenancePhoto(label, item, color) {
  const name = String(item.nama_alat || "Alat Kesehatan").replace(/[<>&"']/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560"><rect width="900" height="560" fill="#f8fafc"/><rect x="35" y="35" width="830" height="490" rx="28" fill="#ffffff" stroke="${color}" stroke-width="5"/><text x="70" y="130" font-family="Arial" font-size="34" font-weight="700" fill="${color}">${label}</text><text x="70" y="205" font-family="Arial" font-size="30" fill="#152238">${name}</text><text x="70" y="265" font-family="Arial" font-size="22" fill="#52647a">Dokumentasi pekerjaan elektromedis RS ZezszeonSze</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function calibrationPhoto(label, item) {
  return maintenancePhoto(label, item, "#2563eb");
}

async function request(path, options = {}) {
  let response;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        ...options,
        headers: {
          ...headers,
          Prefer: "return=representation",
          ...(options.headers || {}),
        },
      });
      break;
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 600));
    }
  }
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${response.status} ${path}: ${data?.message || data?.hint || text}`);
  }
  return data;
}

async function patch(table, id, payload) {
  let safePayload = Object.fromEntries(
    Object.entries(payload).filter(([column]) => !unsupportedColumns.has(`${table}.${column}`)),
  );
  while (Object.keys(safePayload).length) {
    try {
      return await request(`${table}?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(safePayload),
      });
    } catch (error) {
      const missingColumn = String(error.message).match(/Could not find the '([^']+)' column/i)?.[1];
      if (!missingColumn || !(missingColumn in safePayload)) throw error;
      unsupportedColumns.add(`${table}.${missingColumn}`);
      delete safePayload[missingColumn];
      console.warn(`[SKIP COLUMN] ${table}.${missingColumn} tidak tersedia di schema aktif.`);
    }
  }
  return [];
}

async function insert(table, payload) {
  let safePayload = Object.fromEntries(
    Object.entries(payload).filter(([column]) => !unsupportedColumns.has(`${table}.${column}`)),
  );
  while (Object.keys(safePayload).length) {
    try {
      return await request(table, {
        method: "POST",
        body: JSON.stringify(safePayload),
      });
    } catch (error) {
      const missingColumn = String(error.message).match(/Could not find the '([^']+)' column/i)?.[1];
      if (!missingColumn || !(missingColumn in safePayload)) throw error;
      unsupportedColumns.add(`${table}.${missingColumn}`);
      delete safePayload[missingColumn];
      console.warn(`[SKIP COLUMN] ${table}.${missingColumn} tidak tersedia di schema aktif.`);
    }
  }
  return [];
}

async function runBatches(tasks, size = 8) {
  for (let i = 0; i < tasks.length; i += size) {
    await Promise.all(tasks.slice(i, i + size).map((task) => task()));
  }
}

async function main() {
  const rooms = await request("ruangan?select=id,kode_ruangan,nama_ruangan&order=kode_ruangan.asc");
  const alat = await request(
    "alat_kesehatan?select=*&order=kode_barcode.asc",
  );
  const maintenance = await request("maintenance?select=*&order=tanggal.desc");
  const kalibrasi = await request("kalibrasi?select=*&order=tanggal_kalibrasi.desc");
  const historiAlat = await request("histori_alat?select=*&order=created_at.desc");

  if (!rooms.length || !alat.length) {
    throw new Error("Data ruangan atau alat tidak tersedia; sinkronisasi dibatalkan.");
  }

  const serialSeen = new Set();
  const alatPrepared = [];

  const alatUpdates = alat.map((item, index) => () => {
    const risk = riskForName(item.nama_alat);
    const seq = String(index + 1).padStart(4, "0");
    const room = rooms.find((entry) => entry.id === item.ruangan_id) || rooms[index % rooms.length];
    const [defaultBrand, defaultType] = equipmentIdentity(item);
    let serial = item.serial_number || `RSZS-${slug(item.nama_alat, 18)}-${seq}`;
    if (serialSeen.has(serial)) serial = `RSZS-${slug(item.nama_alat, 18)}-${seq}-${String(item.id).slice(0, 4).toUpperCase()}`;
    serialSeen.add(serial);
    const barcode = item.kode_barcode || `${room.kode_ruangan}-${slug(item.nama_alat, 20)}-${seq}`;

    let kondisi = "Baik";
    if (index % 41 === 0) kondisi = "Rusak";
    else if (index % 23 === 0 || index % 47 === 0) kondisi = "Maintenance";
    const status = kondisi === "Rusak" ? "Tidak Aktif" : "Aktif";
    const ownership = ["Milik RS", "KSO", "Sewa"][index % 10 === 0 ? 1 : index % 17 === 0 ? 2 : 0];
    const installationDate = item.tanggal_instalasi || subDays(120 + (index % 1600));

    let kalibrasiBerikutnya = addDaysFromSchedule(index % 120);
    let kalibrasiTerakhir = addYears(kalibrasiBerikutnya, -1);
    if (index % 43 === 0) {
      kalibrasiTerakhir = null;
      kalibrasiBerikutnya = addDaysFromSchedule(index % 120);
    }

    const payload = {
      nama_alat: item.nama_alat || `Alat Kesehatan ${seq}`,
      kode_barcode: barcode,
      foto_alat: item.foto_alat || equipmentPhoto(item, serial),
      merk: item.merk || defaultBrand,
      tipe: item.tipe || defaultType,
      serial_number: serial,
      ruangan_id: room.id,
      vendor: item.vendor || VENDORS[index % VENDORS.length],
      tahun_pembelian: item.tahun_pembelian || Number(installationDate.slice(0, 4)),
      harga_pembelian: Number(item.harga_pembelian) > 0 ? Number(item.harga_pembelian) : priceByRisk(risk, index),
      tanggal_instalasi: installationDate,
      kalibrasi_awal: item.kalibrasi_awal || installationDate,
      status_kepemilikan: ownership,
      kondisi,
      status,
      tingkat_risiko: risk,
      maintenance_terakhir: subDays(10 + (index % 75)),
      maintenance_berikutnya: nextByRisk(risk, index),
      preventive_terakhir: subDays(10 + (index % 75)),
      preventive_berikutnya: nextByRisk(risk, index),
      kalibrasi_terakhir: kalibrasiTerakhir,
      kalibrasi_berikutnya: kalibrasiBerikutnya,
      kso_nama_partner: ownership === "KSO" ? item.kso_nama_partner || VENDORS[index % VENDORS.length] : null,
      kso_tipe_kerja_sama: ownership === "KSO" ? item.kso_tipe_kerja_sama || "Kerja Sama Operasional Alat" : null,
      kso_persen_rs: ownership === "KSO" ? item.kso_persen_rs || "60%" : null,
      kso_persen_vendor: ownership === "KSO" ? item.kso_persen_vendor || "40%" : null,
      kso_fee_tetap: ownership === "KSO" ? Number(item.kso_fee_tetap) || 3500000 + (index % 5) * 500000 : null,
      kso_tanggal_mulai: ownership === "KSO" ? item.kso_tanggal_mulai || installationDate : null,
      kso_tanggal_akhir: ownership === "KSO" ? item.kso_tanggal_akhir || addDays(730 + (index % 365)) : null,
      kso_file_kontrak: ownership === "KSO" ? item.kso_file_kontrak || `KSO-RSZS-${seq}.pdf` : null,
      tanggal_sewa: ownership === "Sewa" ? item.tanggal_sewa || installationDate : null,
      sewa_vendor_leasing: ownership === "Sewa" ? item.sewa_vendor_leasing || VENDORS[index % VENDORS.length] : null,
      sewa_biaya_per_bulan: ownership === "Sewa" ? Number(item.sewa_biaya_per_bulan) || 4500000 + (index % 6) * 750000 : null,
      sewa_durasi_kontrak: ownership === "Sewa" ? item.sewa_durasi_kontrak || "36 bulan" : null,
      sewa_tanggal_mulai: ownership === "Sewa" ? item.sewa_tanggal_mulai || installationDate : null,
      sewa_tanggal_akhir: ownership === "Sewa" ? item.sewa_tanggal_akhir || addDays(1095 + (index % 180)) : null,
      sewa_buyback: ownership === "Sewa" ? item.sewa_buyback || "Opsional setelah kontrak selesai" : null,
      sewa_file_kontrak: ownership === "Sewa" ? item.sewa_file_kontrak || `SEWA-RSZS-${seq}.pdf` : null,
    };
    alatPrepared.push({ ...item, ...payload, index, room, risk });
    return patch("alat_kesehatan", item.id, payload);
  });

  await runBatches(alatUpdates);

  const preparedById = new Map(alatPrepared.map((item) => [item.id, item]));
  const alatRisk = new Map(alatPrepared.map((item) => [item.id, item.risk]));
  const maintenanceStatuses = ["Selesai", "Proses", "Menunggu Sparepart", "Selesai Vendor"];
  const maintenanceUpdates = maintenance.map((item, index) => () => {
    const tool = preparedById.get(item.alat_id) || alatPrepared[index % alatPrepared.length];
    const risk = alatRisk.get(item.alat_id) || "Sedang";
    let kind =
      tool.kondisi === "Rusak"
        ? "Emergency (Breakdown)"
        : tool.kondisi === "Maintenance"
          ? index % 2 === 0
            ? "Corrective Berat"
            : "Corrective Ringan"
          : index % 7 === 0
            ? "Corrective Ringan"
            : "Preventive";
    const cost =
      kind === "Preventive"
        ? RISK_COST[risk].preventive
        : kind === "Corrective Ringan"
          ? RISK_COST[risk].correctiveLight
          : kind === "Corrective Berat"
            ? RISK_COST[risk].correctiveHeavy
            : RISK_COST[risk].breakdown;
    return patch("maintenance", item.id, {
      jenis: kind,
      tanggal: index < 95 ? subDays(index % 28) : subDays(35 + (index % 240)),
      teknisi: item.teknisi || TECHNICIANS[index % TECHNICIANS.length],
      vendor_pt: item.vendor_pt || VENDORS[index % VENDORS.length],
      status_progres: maintenanceStatuses[index % maintenanceStatuses.length],
      biaya_perbaikan: cost + (index % 7) * 125000,
      hasil: kind === "Preventive" ? "Preventive selesai, alat siap digunakan" : `${kind} tercatat dan dipantau teknisi`,
      keterangan: `Pekerjaan ${kind} pada ${tool.nama_alat}; risiko ${risk}; hasil, jadwal, biaya, dan tindak lanjut tercatat untuk monitoring teknisi dan supervisor.`,
      foto_sebelum: item.foto_sebelum || maintenancePhoto("SEBELUM PEKERJAAN", tool, "#dc2626"),
      foto_sesudah: item.foto_sesudah || maintenancePhoto("SESUDAH PEKERJAAN", tool, "#0f9f91"),
      foto_sparepart: item.foto_sparepart || maintenancePhoto("DOKUMENTASI SPAREPART", tool, "#d97706"),
      invoice: item.invoice || `INV-MTN-RSZS-${String(index + 1).padStart(5, "0")}.pdf`,
      service_type: "Maintenance",
    });
  });

  await runBatches(maintenanceUpdates);

  const calibrationStatuses = ["Selesai", "Sertifikat Terbit", "Proses", "Baru"];
  const calibrationUpdates = kalibrasi.map((item, index) => () => {
    const tool = preparedById.get(item.alat_id) || alatPrepared[index % alatPrepared.length];
    const risk = alatRisk.get(item.alat_id) || "Sedang";
    const noCert = `CERT-RSZS-${String(index + 1).padStart(4, "0")}-${slug(tool?.nama_alat, 10)}`;
    const progress = index % 37 === 0 ? "Proses" : calibrationStatuses[index % calibrationStatuses.length];
    const calibrationDate = addDaysFromSchedule(-((index % 365) + 30));
    const validUntil = addYears(calibrationDate, 1);
    return patch("kalibrasi", item.id, {
      tanggal_kalibrasi: calibrationDate,
      berlaku_sampai: validUntil,
      hasil: index % 53 === 0 ? "Tidak Lulus" : "Lulus",
      status_progres: progress,
      biaya_kalibrasi: RISK_COST[risk].calibration + (index % 6) * 90000,
      nomor_sertifikat: noCert,
      vendor: item.vendor || item.vendor_pt || VENDORS[index % VENDORS.length],
      vendor_pt: item.vendor_pt || item.vendor || VENDORS[index % VENDORS.length],
      foto_nilai_ukur: item.foto_nilai_ukur || calibrationPhoto("HASIL NILAI UKUR", tool),
      foto_sertifikat: item.foto_sertifikat || calibrationPhoto("SERTIFIKAT KALIBRASI", tool),
      service_type: "Kalibrasi",
      catatan: `Kalibrasi ${tool.nama_alat}; status ${progress}; risiko ${risk}; biaya, hasil ukur, sertifikat, dan masa berlaku tercatat.`,
    });
  });

  await runBatches(calibrationUpdates);

  const maintenanceByAlat = new Map();
  maintenance.forEach((row) => {
    const rows = maintenanceByAlat.get(row.alat_id) || [];
    rows.push(row);
    maintenanceByAlat.set(row.alat_id, rows);
  });
  const calibrationByAlat = new Map();
  kalibrasi.forEach((row) => {
    const rows = calibrationByAlat.get(row.alat_id) || [];
    rows.push(row);
    calibrationByAlat.set(row.alat_id, rows);
  });

  const historyTasks = [];
  const syncHistoryByAlat = new Map();
  historiAlat.forEach((row) => {
    if (row.aksi === "Sinkronisasi Data Alat" && !syncHistoryByAlat.has(row.alat_id)) {
      syncHistoryByAlat.set(row.alat_id, row);
    }
  });
  alatPrepared.forEach((tool, index) => {
    const ownershipDetail =
      tool.status_kepemilikan === "KSO"
        ? `KSO dengan ${tool.kso_nama_partner}; ${tool.kso_tipe_kerja_sama}; bagian RS ${tool.kso_persen_rs}; bagian vendor ${tool.kso_persen_vendor}; fee tetap Rp ${Number(tool.kso_fee_tetap || 0).toLocaleString("id-ID")}; periode ${tool.kso_tanggal_mulai} sampai ${tool.kso_tanggal_akhir}.`
        : tool.status_kepemilikan === "Sewa"
          ? `Sewa dari ${tool.sewa_vendor_leasing}; biaya per bulan Rp ${Number(tool.sewa_biaya_per_bulan || 0).toLocaleString("id-ID")}; durasi ${tool.sewa_durasi_kontrak}; periode ${tool.sewa_tanggal_mulai} sampai ${tool.sewa_tanggal_akhir}.`
          : `Milik RS; harga pembelian Rp ${Number(tool.harga_pembelian || 0).toLocaleString("id-ID")}; tanggal instalasi ${tool.tanggal_instalasi}.`;
    const syncHistory = syncHistoryByAlat.get(tool.id);
    const syncPayload = {
      alat_id: tool.id,
      aksi: "Sinkronisasi Data Alat",
      petugas: "Sistem Inventaris RS ZezszeonSze",
      detail: `${tool.nama_alat} | SN ${tool.serial_number} | ${tool.room.nama_ruangan} | ${ownershipDetail}`,
    };
    historyTasks.push(() =>
      syncHistory ? patch("histori_alat", syncHistory.id, syncPayload) : insert("histori_alat", syncPayload),
    );

    const currentMaintenance = maintenanceByAlat.get(tool.id) || [];
    for (let offset = currentMaintenance.length; offset < 3; offset += 1) {
      const kind =
        offset === 0 && tool.kondisi === "Rusak"
          ? "Emergency (Breakdown)"
          : offset === 0 && tool.kondisi === "Maintenance"
            ? index % 2 === 0
              ? "Corrective Berat"
              : "Corrective Ringan"
            : offset === 0
              ? "Preventive"
              : offset === 1
                ? "Corrective Ringan"
                : "Preventive";
      const riskCost = RISK_COST[tool.risk];
      const cost =
        kind === "Preventive"
          ? riskCost.preventive
          : kind === "Corrective Ringan"
            ? riskCost.correctiveLight
            : kind === "Corrective Berat"
              ? riskCost.correctiveHeavy
              : riskCost.breakdown;
      historyTasks.push(() =>
        insert("maintenance", {
          alat_id: tool.id,
          jenis: kind,
          tanggal: subDays(offset * 75 + (index % 30)),
          teknisi: TECHNICIANS[(index + offset) % TECHNICIANS.length],
          vendor_pt: VENDORS[(index + offset) % VENDORS.length],
          status_progres: offset === 0 && tool.kondisi === "Maintenance" ? "Proses" : "Selesai",
          biaya_perbaikan: cost + (index % 7) * 125000,
          hasil: kind === "Emergency (Breakdown)" ? "Alat dinonaktifkan dan menunggu tindak lanjut perbaikan." : `${kind} selesai dan terdokumentasi.`,
          keterangan: `Histori lengkap ${kind}; risiko ${tool.risk}; ruangan ${tool.room.nama_ruangan}; tindak lanjut tercatat.`,
          foto_sebelum: maintenancePhoto("SEBELUM PEKERJAAN", tool, "#dc2626"),
          foto_sesudah: maintenancePhoto("SESUDAH PEKERJAAN", tool, "#0f9f91"),
          foto_sparepart: maintenancePhoto("DOKUMENTASI SPAREPART", tool, "#d97706"),
          invoice: `INV-MTN-${slug(tool.kode_barcode, 22)}-${offset + 1}.pdf`,
          service_type: "Maintenance",
        }),
      );
    }

    const currentCalibration = calibrationByAlat.get(tool.id) || [];
    for (let offset = currentCalibration.length; offset < 3; offset += 1) {
      const calibrationDate = addDaysFromSchedule(-(offset * 365 + (index % 120) + 30));
      historyTasks.push(() =>
        insert("kalibrasi", {
          alat_id: tool.id,
          tanggal_kalibrasi: calibrationDate,
          berlaku_sampai: addYears(calibrationDate, 1),
          vendor: VENDORS[(index + offset + 1) % VENDORS.length],
          vendor_pt: VENDORS[(index + offset + 1) % VENDORS.length],
          status_progres: offset === 0 && index % 11 === 0 ? "Proses" : "Sertifikat Terbit",
          hasil: index % 53 === 0 && offset === 0 ? "Tidak Lulus" : "Lulus",
          nomor_sertifikat: `CERT-${slug(tool.kode_barcode, 20)}-${offset + 1}`,
          biaya_kalibrasi: RISK_COST[tool.risk].calibration + (index % 6) * 90000,
          foto_nilai_ukur: calibrationPhoto("HASIL NILAI UKUR", tool),
          foto_sertifikat: calibrationPhoto("SERTIFIKAT KALIBRASI", tool),
          catatan: `Riwayat kalibrasi lengkap ${tool.nama_alat}; risiko ${tool.risk}; hasil dan masa berlaku terverifikasi.`,
          service_type: "Kalibrasi",
        }),
      );
    }
  });
  await runBatches(historyTasks, 6);

  console.log(
    JSON.stringify(
      {
        alat: alat.length,
        maintenance: maintenance.length,
        kalibrasi: kalibrasi.length,
        histori_ditambahkan: historyTasks.length,
        serial_unik: serialSeen.size,
        kolom_tidak_tersedia: [...unsupportedColumns],
        catatan: "Data alat, maintenance, dan kalibrasi sudah dilengkapi dan disinkronkan tanpa menghapus tabel.",
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
