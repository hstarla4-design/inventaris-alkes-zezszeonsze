const SUPABASE_URL = process.env.SUPABASE_URL || "https://brupcvzzrzflfujaijnw.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "sb_publishable_eQ8iUSOr42sMAgHjXE2ecA_FtvIDoRF";
const MARKER = "SUPERVISOR-123-ASSET-SEED-20260609";
const TOTAL_NEW_ASSETS = 123;
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

function code(value, max = 94) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max);
}

function riskForName(name) {
  const value = String(name || "").toLowerCase();
  if (/ventilator|defibrillator|anestesi|monitor|infusion|syringe|incubator|warmer|c-arm|x-ray|injector/.test(value)) return "Tinggi";
  if (/ecg|usg|suction|sterilizer|autoclave|analyzer|centrifuge|phototherapy|oximeter|capnograph|nebulizer/.test(value)) return "Sedang";
  return "Rendah";
}

function maintenanceCost(kind, risk, index) {
  const base =
    kind === "Preventive"
      ? risk === "Tinggi"
        ? 950000
        : risk === "Sedang"
          ? 650000
          : 425000
      : kind === "Corrective Ringan"
        ? risk === "Tinggi"
          ? 1850000
          : risk === "Sedang"
            ? 1250000
            : 850000
        : kind === "Corrective Berat"
          ? risk === "Tinggi"
            ? 5600000
            : risk === "Sedang"
              ? 3600000
              : 2200000
          : risk === "Tinggi"
            ? 8300000
            : risk === "Sedang"
              ? 5400000
              : 3200000;
  return base + (index % 5) * 175000;
}

function calibrationCost(name, risk, index) {
  const value = String(name || "").toLowerCase();
  const base = /c-arm|x-ray|usg|analyzer/.test(value)
    ? 3200000
    : risk === "Tinggi"
      ? 2200000
      : risk === "Sedang"
        ? 1250000
        : 750000;
  return base + (index % 4) * 125000;
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
  if (!response.ok) throw new Error(`${response.status} ${path}: ${data?.message || data?.hint || text}`);
  return data;
}

function chunk(rows, size = 35) {
  const result = [];
  for (let i = 0; i < rows.length; i += size) result.push(rows.slice(i, i + size));
  return result;
}

const catalog = [
  ["Patient Monitor", "Philips", "IntelliVue MX550", 142000000],
  ["Patient Monitor Transport", "Mindray", "BeneVision N17", 118000000],
  ["Infusion Pump", "B. Braun", "Infusomat Space", 34500000],
  ["Syringe Pump", "Terumo", "TE-SS835", 29500000],
  ["Ventilator", "Drager", "Evita V600", 510000000],
  ["Anesthesia Machine", "Mindray", "A9", 780000000],
  ["Defibrillator", "Zoll", "R Series Plus", 184000000],
  ["ECG", "Bionet", "Cardio7", 84000000],
  ["Pulse Oximeter", "Masimo", "Rad-97", 68000000],
  ["Suction Pump", "Yuwell", "7E-A", 9500000],
  ["Nebulizer", "Omron", "NE-C28", 2800000],
  ["C-Arm Mobile", "Siemens", "Cios Alpha", 1760000000],
  ["USG Portable", "GE", "Venue Go", 725000000],
  ["Hematology Analyzer", "Sysmex", "XN-550", 690000000],
  ["Autoclave", "Getinge", "HS44", 360000000],
  ["Washer Disinfector", "Steelco", "DS 600", 430000000],
  ["Infant Warmer", "Fisher & Paykel", "IW950", 225000000],
  ["Phototherapy Lamp", "Natus", "neoBLUE", 68000000],
  ["Capnograph", "Mindray", "PM-60", 91000000],
  ["Operating Table Electric", "Maquet", "Alphamaxx", 335000000],
];

const ownership = ["Milik RS", "Milik RS", "Milik RS", "KSO", "Sewa"];
const vendors = [
  "PT Servis Medika Nusantara",
  "PT KALIBRASI INDONESIA",
  "PT Medika Nusantara",
  "PT Global Alkes Prima",
  "PT Teknologi Kesehatan Mandiri",
  "PT Prima Elektromedik Sejahtera",
];

async function main() {
  const marker = await request(`histori_alat?select=id&detail=ilike.*${MARKER}*&limit=1`);
  if (marker.length) {
    console.log("123 alat tambahan sudah pernah dibuat. Tidak ditambah ulang.");
    return;
  }

  const rooms = await request("ruangan?select=id,kode_ruangan,nama_ruangan&order=kode_ruangan.asc");
  if (rooms.length < 1) throw new Error("Ruangan kosong.");

  const assets = Array.from({ length: TOTAL_NEW_ASSETS }, (_, index) => {
    const [nama, merk, tipe, price] = catalog[index % catalog.length];
    const room = rooms[index % rooms.length];
    const risk = riskForName(nama);
    const seq = String(index + 1).padStart(3, "0");
    const installed = subDays(45 + (index % 620));
    const owned = ownership[index % ownership.length];
    const serial = `RSZS-ADD-${seq}-${code(nama, 8)}-${code(merk, 4)}`;
    return {
      nama_alat: nama,
      foto_alat: `https://placehold.co/640x420/e8f6f3/0b7569?text=${encodeURIComponent(`${nama} ${serial}`)}`,
      merk,
      tipe,
      serial_number: serial,
      kode_barcode: code(`${room.kode_ruangan} ${nama} ${merk} ${tipe} ADD ${seq}`),
      harga_pembelian: Math.round(price * (0.9 + (index % 7) * 0.04)),
      kalibrasi_awal: installed,
      ruangan_id: room.id,
      vendor: vendors[index % vendors.length],
      tahun_pembelian: 2022 + (index % 5),
      tanggal_instalasi: owned === "Milik RS" ? installed : null,
      tanggal_sewa: owned === "Sewa" ? installed : null,
      kondisi: index % 37 === 0 ? "Rusak" : index % 19 === 0 ? "Maintenance" : "Baik",
      status: index % 53 === 0 ? "Tidak Aktif" : "Aktif",
      maintenance_terakhir: subDays(20 + (index % 80)),
      maintenance_berikutnya: addDays(risk === "Tinggi" ? 20 + (index % 20) : risk === "Sedang" ? 55 + (index % 35) : 100 + (index % 45)),
      preventive_terakhir: subDays(20 + (index % 80)),
      preventive_berikutnya: addDays(risk === "Tinggi" ? 20 + (index % 20) : risk === "Sedang" ? 55 + (index % 35) : 100 + (index % 45)),
      kalibrasi_terakhir: subDays(40 + (index % 120)),
      kalibrasi_berikutnya: index % 41 === 0 ? subDays(6 + (index % 20)) : addDays(24 + (index % 280)),
      tingkat_risiko: risk,
      status_kepemilikan: owned,
      kso_nama_partner: owned === "KSO" ? vendors[(index + 1) % vendors.length] : null,
      kso_tipe_kerja_sama: owned === "KSO" ? "Revenue sharing (%)" : null,
      kso_persen_rs: owned === "KSO" ? "70" : null,
      kso_persen_vendor: owned === "KSO" ? "30" : null,
      kso_tanggal_mulai: owned === "KSO" ? installed : null,
      kso_tanggal_akhir: owned === "KSO" ? addDays(720 + (index % 180)) : null,
      sewa_vendor_leasing: owned === "Sewa" ? vendors[(index + 2) % vendors.length] : null,
      sewa_biaya_per_bulan: owned === "Sewa" ? Math.round(price * 0.017) : null,
      sewa_durasi_kontrak: owned === "Sewa" ? "36 bulan" : null,
      sewa_tanggal_mulai: owned === "Sewa" ? installed : null,
      sewa_tanggal_akhir: owned === "Sewa" ? addDays(1080 + (index % 180)) : null,
      sewa_buyback: owned === "Sewa" ? "Opsional akhir kontrak" : null,
      __risk: risk,
      __room: room,
    };
  });

  const insertedAssets = [];
  for (const group of chunk(assets)) {
    const payload = group.map(({ __risk, __room, ...asset }) => asset);
    const rows = await request("alat_kesehatan?on_conflict=kode_barcode", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(payload),
    });
    insertedAssets.push(...rows);
  }

  const maintenanceKinds = ["Preventive", "Corrective Ringan", "Corrective Berat", "Emergency (Breakdown)"];
  const maintenanceRows = insertedAssets.flatMap((asset, assetIndex) => {
    const risk = riskForName(asset.nama_alat);
    return Array.from({ length: 4 }, (_, historyIndex) => {
      const kind = maintenanceKinds[(assetIndex + historyIndex) % maintenanceKinds.length];
      return {
        alat_id: asset.id,
        jenis: kind,
        tanggal: subDays(18 + historyIndex * 45 + (assetIndex % 18)),
        teknisi: historyIndex % 2 ? "Budi Teknisi" : "ZainTeknisi",
        vendor_pt: historyIndex % 2 ? vendors[(assetIndex + historyIndex) % vendors.length] : null,
        status_progres: historyIndex === 0 && assetIndex % 9 === 0 ? "Proses" : "Selesai",
        service_type: "Maintenance",
        biaya_perbaikan: maintenanceCost(kind, risk, assetIndex + historyIndex),
        hasil: `${kind} alat ${asset.nama_alat} selesai dicatat`,
        keterangan: `${MARKER} Histori ${historyIndex + 1}: ${kind}, risiko ${risk}, serial ${asset.serial_number}.`,
        foto_sebelum: `https://placehold.co/640x420/f8fafc/647086?text=${encodeURIComponent(`Sebelum ${asset.serial_number}`)}`,
        foto_sesudah: `https://placehold.co/640x420/e5f6f3/057568?text=${encodeURIComponent(`Sesudah ${asset.serial_number}`)}`,
      };
    });
  });

  const kalibrasiRows = insertedAssets.flatMap((asset, assetIndex) => {
    const risk = riskForName(asset.nama_alat);
    return Array.from({ length: 4 }, (_, historyIndex) => ({
      alat_id: asset.id,
      tanggal_kalibrasi: subDays(25 + historyIndex * 70 + (assetIndex % 22)),
      berlaku_sampai: historyIndex === 0 && assetIndex % 31 === 0 ? subDays(5 + (assetIndex % 15)) : addDays(90 + historyIndex * 55 + (assetIndex % 120)),
      vendor: "PT KALIBRASI INDONESIA",
      vendor_pt: "PT KALIBRASI INDONESIA",
      status_progres: historyIndex === 0 && assetIndex % 13 === 0 ? "Proses" : "Selesai",
      hasil: assetIndex % 47 === 0 && historyIndex === 0 ? "Tidak Lulus" : "Lulus",
      biaya_kalibrasi: calibrationCost(asset.nama_alat, risk, assetIndex + historyIndex),
      nomor_sertifikat: `CERT-ADD-${String(assetIndex + 1).padStart(3, "0")}-${historyIndex + 1}-${code(asset.nama_alat, 10)}`,
      catatan: `${MARKER} Kalibrasi histori ${historyIndex + 1}, serial ${asset.serial_number}, risiko ${risk}.`,
      foto_nilai_ukur: `https://placehold.co/640x420/eaf2ff/2f78c5?text=${encodeURIComponent(`Nilai ukur ${asset.serial_number}`)}`,
      foto_sertifikat: `https://placehold.co/640x420/e8f6f3/0b7569?text=${encodeURIComponent(`Sertifikat ${asset.serial_number}`)}`,
    }));
  });

  for (const group of chunk(maintenanceRows)) {
    await request("maintenance", { method: "POST", body: JSON.stringify(group) });
  }
  for (const group of chunk(kalibrasiRows)) {
    await request("kalibrasi", { method: "POST", body: JSON.stringify(group) });
  }

  const historyRows = insertedAssets.map((asset) => ({
    alat_id: asset.id,
    aksi: "Seed alat tambahan",
    petugas: "System",
    detail: `${MARKER} ${asset.nama_alat} serial ${asset.serial_number} masuk sebagai data analisis supervisor.`,
  }));
  for (const group of chunk(historyRows)) {
    await request("histori_alat", { method: "POST", body: JSON.stringify(group) });
  }

  console.log(JSON.stringify({ added_assets: insertedAssets.length, maintenance: maintenanceRows.length, kalibrasi: kalibrasiRows.length }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
