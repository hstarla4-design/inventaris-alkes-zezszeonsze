const SUPABASE_URL = process.env.SUPABASE_URL || "https://brupcvzzrzflfujaijnw.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "sb_publishable_eQ8iUSOr42sMAgHjXE2ecA_FtvIDoRF";

const MARKER = "ENTERPRISE-SUPERVISOR-SEED-20260608";
const TOTAL_NEW_ASSETS = 260;
const TODAY = new Date();

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

function iso(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(days) {
  const date = new Date(TODAY);
  date.setDate(date.getDate() + days);
  return iso(date);
}

function subDays(days) {
  const date = new Date(TODAY);
  date.setDate(date.getDate() - days);
  return iso(date);
}

async function request(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      ...headers,
      Prefer: "return=representation",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${response.status} ${path}: ${data?.message || data?.hint || text}`);
  }
  return data;
}

function chunk(rows, size = 50) {
  const result = [];
  for (let i = 0; i < rows.length; i += size) result.push(rows.slice(i, i + size));
  return result;
}

function normalizeCode(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function riskForName(name) {
  const value = String(name || "").toLowerCase();
  if (/ventilator|defibrillator|anestesi|monitor|infusion|syringe|incubator|warmer|c-arm|x-ray/.test(value)) return "Tinggi";
  if (/ecg|usg|suction|sterilizer|autoclave|analyzer|centrifuge|phototherapy|oximeter|capnograph/.test(value)) return "Sedang";
  return "Rendah";
}

function calibrationCost(name, risk) {
  const value = String(name || "").toLowerCase();
  if (/x-ray|c-arm/.test(value)) return 3500000;
  if (/analyzer|ventilator/.test(value)) return 2800000;
  if (/defibrillator|anestesi|incubator|warmer/.test(value)) return 2200000;
  if (/monitor/.test(value)) return 1800000;
  if (risk === "Tinggi") return 1600000;
  if (risk === "Sedang") return 950000;
  return 650000;
}

function maintenanceCost(risk) {
  if (risk === "Tinggi") return 450000;
  if (risk === "Sedang") return 300000;
  return 175000;
}

const catalog = [
  ["Patient Monitor", "Philips", "IntelliVue MX450", 125000000],
  ["Patient Monitor", "Mindray", "BeneVision N15", 98000000],
  ["Infusion Pump", "B. Braun", "Infusomat Space", 32500000],
  ["Syringe Pump", "Terumo", "TE-SS835", 28500000],
  ["Ventilator", "Drager", "Savina 300", 420000000],
  ["Transport Ventilator", "Drager", "Oxylog 3000", 285000000],
  ["Defibrillator", "Zoll", "R Series", 165000000],
  ["ECG", "Bionet", "Cardio7", 78000000],
  ["Pulse Oximeter", "Masimo", "Rad-97", 62000000],
  ["Suction Pump", "Yuwell", "7E-A", 8500000],
  ["Nebulizer", "Omron", "NE-C28", 2500000],
  ["C-Arm Mobile", "Siemens", "Cios Select", 1400000000],
  ["USG Portable", "GE", "Vivid S70", 650000000],
  ["Hematology Analyzer", "Sysmex", "XN-1000", 820000000],
  ["Centrifuge", "Hettich", "EBA 200", 48000000],
  ["Autoclave", "Getinge", "HS33", 310000000],
  ["Sterilizer", "Tuttnauer", "3870M", 225000000],
  ["Infant Warmer", "Fisher & Paykel", "IW950", 215000000],
  ["Phototherapy Lamp", "Natus", "neoBLUE", 64000000],
  ["Capnograph", "Mindray", "PM-60", 87000000],
];

const ownership = ["Milik RS", "Milik RS", "Milik RS", "KSO", "Sewa"];
const vendors = [
  "PT Servis Medika Nusantara",
  "PT KALIBRASI INDONESIA",
  "PT Medika Nusantara",
  "PT Global Alkes Prima",
  "PT Teknologi Kesehatan Mandiri",
];

async function main() {
  const markerRows = await request(`histori_alat?select=id&detail=ilike.*${MARKER}*&limit=1`);
  if (markerRows.length) {
    console.log("Seed enterprise sudah pernah dijalankan. Tidak ada data yang ditambah.");
    return;
  }

  const rooms = await request("ruangan?select=id,kode_ruangan,nama_ruangan&order=kode_ruangan.asc");
  if (!rooms.length) throw new Error("Data ruangan kosong.");

  const assets = Array.from({ length: TOTAL_NEW_ASSETS }, (_, index) => {
    const [nama, merk, tipe, basePrice] = catalog[index % catalog.length];
    const room = rooms[index % rooms.length];
    const risk = riskForName(nama);
    const number = String(index + 1).padStart(3, "0");
    const kode = normalizeCode(`${room.kode_ruangan || `R${(index % rooms.length) + 1}`} ${nama} ${merk} ${tipe} ENT ${number}`);
    const owned = ownership[index % ownership.length];
    const installed = subDays(30 + (index % 720));
    const pmLast = subDays(18 + (index % 24));
    const pmNext = risk === "Tinggi" ? addDays(12 + (index % 18)) : risk === "Sedang" ? addDays(45 + (index % 40)) : addDays(110 + (index % 80));
    const calLast = subDays(35 + (index % 90));
    const calNext = addDays(210 + (index % 130));
    return {
      nama_alat: nama,
      foto_alat: `https://placehold.co/640x420/e8f6f3/0b7569?text=${encodeURIComponent(nama)}`,
      merk,
      tipe,
      serial_number: `RSZS-ENT-${number}-${normalizeCode(merk).slice(0, 4)}`,
      kode_barcode: kode,
      harga_pembelian: Math.round(basePrice * (0.88 + (index % 9) * 0.035)),
      kalibrasi_awal: installed,
      ruangan_id: room.id,
      vendor: vendors[index % vendors.length],
      tahun_pembelian: 2024 + (index % 3),
      tanggal_instalasi: installed,
      kondisi: "Baik",
      status: "Aktif",
      maintenance_terakhir: pmLast,
      maintenance_berikutnya: pmNext,
      preventive_terakhir: pmLast,
      preventive_berikutnya: pmNext,
      kalibrasi_terakhir: calLast,
      kalibrasi_berikutnya: calNext,
      tingkat_risiko: risk,
      status_kepemilikan: owned,
      kso_nama_partner: owned === "KSO" ? vendors[(index + 1) % vendors.length] : null,
      kso_tipe_kerja_sama: owned === "KSO" ? "Revenue sharing (%)" : null,
      kso_persen_rs: owned === "KSO" ? "70" : null,
      kso_persen_vendor: owned === "KSO" ? "30" : null,
      kso_tanggal_mulai: owned === "KSO" ? installed : null,
      kso_tanggal_akhir: owned === "KSO" ? addDays(720 + (index % 180)) : null,
      sewa_vendor_leasing: owned === "Sewa" ? vendors[(index + 2) % vendors.length] : null,
      sewa_biaya_per_bulan: owned === "Sewa" ? Math.round(basePrice * 0.018) : null,
      sewa_durasi_kontrak: owned === "Sewa" ? "36 bulan" : null,
      sewa_tanggal_mulai: owned === "Sewa" ? installed : null,
      sewa_tanggal_akhir: owned === "Sewa" ? addDays(1080 + (index % 180)) : null,
      sewa_buyback: owned === "Sewa" ? "Opsional akhir kontrak" : null,
      __room: room,
      __risk: risk,
    };
  });

  const insertedAssets = [];
  for (const group of chunk(assets, 40)) {
    const payload = group.map(({ __room, __risk, ...asset }) => asset);
    const rows = await request("alat_kesehatan?on_conflict=kode_barcode", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(payload),
    });
    insertedAssets.push(...rows);
  }

  const roomById = new Map(rooms.map((room) => [room.id, room]));
  const maintenanceRows = insertedAssets.map((asset, index) => {
    const risk = asset.tingkat_risiko || riskForName(asset.nama_alat);
    return {
      alat_id: asset.id,
      jenis: "Preventive",
      tanggal: asset.preventive_terakhir || subDays(20 + (index % 20)),
      teknisi: index % 2 ? "ZainTeknisi" : "Budi Teknisi",
      vendor_pt: index % 5 === 0 ? "PT Servis Medika Nusantara" : null,
      status_progres: "Selesai",
      service_type: "Maintenance",
      biaya_perbaikan: maintenanceCost(risk),
      hasil: "Selesai, alat laik operasional",
      keterangan: `${MARKER} Preventive maintenance rutin. Checklist keselamatan, fungsi alarm, koneksi daya, kebersihan, dan uji fungsi selesai.`,
      foto_sebelum: `https://placehold.co/640x420/f8fafc/647086?text=${encodeURIComponent(`Sebelum ${asset.nama_alat}`)}`,
      foto_sesudah: `https://placehold.co/640x420/e5f6f3/057568?text=${encodeURIComponent(`Sesudah ${asset.nama_alat}`)}`,
    };
  });

  const calibrationRows = insertedAssets.map((asset, index) => {
    const risk = asset.tingkat_risiko || riskForName(asset.nama_alat);
    return {
      alat_id: asset.id,
      tanggal_kalibrasi: asset.kalibrasi_terakhir || subDays(45 + (index % 60)),
      berlaku_sampai: asset.kalibrasi_berikutnya || addDays(260 + (index % 80)),
      vendor: "PT KALIBRASI INDONESIA",
      vendor_pt: "PT KALIBRASI INDONESIA",
      status_progres: "Selesai",
      hasil: "Lulus",
      nomor_sertifikat: `CERT-RSZS-ENT-${String(index + 1).padStart(4, "0")}-2026`,
      catatan: `${MARKER} Kalibrasi selesai. Nilai ukur sesuai toleransi pabrikan dan sertifikat aktif.`,
      foto_nilai_ukur: `https://placehold.co/640x420/eaf2ff/2f78c5?text=${encodeURIComponent(`Nilai ukur ${asset.nama_alat}`)}`,
      foto_sertifikat: `https://placehold.co/640x420/f8fafc/0d9f91?text=${encodeURIComponent(`Sertifikat ${asset.nama_alat}`)}`,
      service_type: "Kalibrasi",
      biaya_kalibrasi: calibrationCost(asset.nama_alat, risk),
    };
  });

  for (const group of chunk(maintenanceRows, 50)) {
    await request("maintenance", { method: "POST", body: JSON.stringify(group) });
  }
  for (const group of chunk(calibrationRows, 50)) {
    await request("kalibrasi", { method: "POST", body: JSON.stringify(group) });
  }

  await request("histori_alat", {
    method: "POST",
    body: JSON.stringify({
      alat_id: insertedAssets[0]?.id || null,
      aksi: "Seed Enterprise Supervisor",
      petugas: "System",
      detail: `${MARKER} Menambah ${insertedAssets.length} alat detail lengkap, preventive maintenance, kalibrasi, foto, dan biaya kalibrasi.`,
    }),
  });

  console.log(`Selesai: ${insertedAssets.length} alat, ${maintenanceRows.length} maintenance, ${calibrationRows.length} kalibrasi.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
