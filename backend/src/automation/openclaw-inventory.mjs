import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });

const SUPABASE_URL = process.env.SUPABASE_URL || "https://brupcvzzrzflfujaijnw.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "sb_publishable_eQ8iUSOr42sMAgHjXE2ecA_FtvIDoRF";

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

function usage() {
  console.log(`Usage:
  node openclaw-inventory.mjs room-tools --telegram-id <id>
  node openclaw-inventory.mjs room-tools --telegram-username <@username>
  node openclaw-inventory.mjs room-tools --room <nama_ruangan>
  node openclaw-inventory.mjs notify-technician --telegram-id <id> --alat "<nama alat>" --catatan "<keluhan>"
  node openclaw-inventory.mjs notify-technician --telegram-id <id> --message "<kalimat laporan>"`);
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

async function get(path) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${body}`);
  }
  return response.json();
}

function escapeValue(value) {
  return encodeURIComponent(String(value).replaceAll('"', '""'));
}

function dateText(value) {
  return value || "-";
}

function alatLine(item, index) {
  return `${index + 1}. ${item.nama_alat || "-"} | ${item.merk || "-"} ${item.tipe || ""} | Kondisi: ${item.kondisi || "-"} | Status: ${item.status || "-"} | Barcode: ${item.kode_barcode || "-"}`;
}

function inferCategory(text) {
  const value = String(text || "").toLowerCase();
  if (value.includes("kalibrasi")) return { jenis: "Kalibrasi", kategori: null };
  if (value.includes("breakdown") || value.includes("emergency") || value.includes("mati total")) {
    return { jenis: "Maintenance", kategori: "Emergency (Breakdown)" };
  }
  if (value.includes("rusak berat") || value.includes("corrective berat")) {
    return { jenis: "Maintenance", kategori: "Corrective Berat" };
  }
  if (value.includes("preventive")) return { jenis: "Maintenance", kategori: "Preventive" };
  return { jenis: "Maintenance", kategori: "Corrective Ringan" };
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function safeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isDueWithin(value, days = 30) {
  const date = safeDate(value);
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date <= addDays(today, days);
}

function vendorName(user) {
  return user?.nama_pt || user?.nama || user?.username || "";
}

function vendorService(user) {
  return normalize(user?.vendor_layanan || user?.service_type || user?.role_detail || user?.role || "");
}

function roleName(user) {
  const role = normalize(user?.role);
  if (role === "kepala supervisor") return "Kepala Supervisor";
  if (role === "kepala ruangan" || role === "kepala ruang" || role === "kepala unit") return "Kepala Ruangan";
  if (role.includes("vendor")) return "Vendor";
  if (role === "admin") return "Admin";
  if (role === "teknisi") return "Teknisi";
  if (role === "supervisor") return "Supervisor";
  return user?.role || "Guest";
}

export function isOpenClawInventoryQuestion(question = "") {
  const value = normalize(question);
  return [
    "ringkas",
    "ringkasan",
    "summary",
    "prioritas",
    "urgent",
    "maintenance hari ini",
    "kalibrasi hari ini",
    "audit",
    "data kosong",
    "belum lengkap",
    "laporan harian",
    "laporan hari ini",
    "analisis dashboard",
    "analisa dashboard",
    "rekomendasi",
  ].some((word) => value.includes(word));
}

function filterToolsByRole(tools, user) {
  const role = roleName(user);
  if (role === "Kepala Ruangan") {
    return user?.ruangan_id ? tools.filter((item) => item.ruangan_id === user.ruangan_id) : [];
  }
  if (role === "Vendor") {
    const vendor = normalize(vendorName(user));
    if (!vendor) return [];
    return tools.filter((item) => {
      const toolVendor = normalize(item.vendor || item.vendor_pt || "");
      return toolVendor && (toolVendor.includes(vendor) || vendor.includes(toolVendor));
    });
  }
  return tools;
}

function filterRecordsByRole(records, tools, user, serviceType) {
  const role = roleName(user);
  if (role === "Kepala Ruangan") {
    const toolIds = new Set(tools.map((item) => item.id));
    return records.filter((item) => toolIds.has(item.alat_id));
  }
  if (role === "Vendor") {
    const vendor = normalize(vendorName(user));
    const service = vendorService(user);
    if (!vendor) return [];
    if (serviceType === "maintenance" && !service.includes("maintenance")) return [];
    if (serviceType === "kalibrasi" && !service.includes("kalibrasi")) return [];
    return records.filter((item) => {
      const recordVendor = normalize(item.vendor_pt || item.vendor || "");
      return recordVendor && (recordVendor.includes(vendor) || vendor.includes(recordVendor));
    });
  }
  return records;
}

function missingToolFields(item) {
  const fields = [
    ["nama_alat", "nama alat"],
    ["merk", "merk"],
    ["tipe", "tipe"],
    ["serial_number", "serial number"],
    ["kode_barcode", "kode barcode"],
    ["ruangan_id", "ruangan"],
    ["vendor", "vendor/perusahaan"],
    ["status_kepemilikan", "status kepemilikan"],
    ["tanggal_instalasi", "tanggal instalasi"],
    ["kalibrasi_berikutnya", "jadwal kalibrasi berikutnya"],
    ["maintenance_berikutnya", "jadwal maintenance berikutnya"],
    ["foto_alat", "foto alat"],
  ];
  return fields.filter(([key]) => !item[key]).map(([, label]) => label);
}

function priorityScore(item) {
  let score = 0;
  if (item.kondisi === "Rusak") score += 100;
  if (item.kondisi === "Maintenance") score += 70;
  if (isDueWithin(item.maintenance_berikutnya, 7)) score += 35;
  else if (isDueWithin(item.maintenance_berikutnya, 30)) score += 15;
  if (isDueWithin(item.kalibrasi_berikutnya, 7)) score += 35;
  else if (isDueWithin(item.kalibrasi_berikutnya, 30)) score += 15;
  if (!item.foto_alat) score += 5;
  return score;
}

function formatPriority(item, index, roomMap) {
  const reasons = [];
  if (item.kondisi === "Rusak" || item.kondisi === "Maintenance") reasons.push(`kondisi ${item.kondisi}`);
  if (isDueWithin(item.maintenance_berikutnya, 30)) reasons.push(`maintenance ${dateText(item.maintenance_berikutnya)}`);
  if (isDueWithin(item.kalibrasi_berikutnya, 30)) reasons.push(`kalibrasi ${dateText(item.kalibrasi_berikutnya)}`);
  return `${index + 1}. ${item.nama_alat || "-"} | ${item.merk || "-"} ${item.tipe || ""} | SN ${item.serial_number || "-"} | ${roomMap.get(item.ruangan_id) || "-"} | ${reasons.join(", ") || "perlu review"}`;
}

function intentTitle(question) {
  const value = normalize(question);
  if (value.includes("audit") || value.includes("kosong") || value.includes("belum lengkap")) return "Audit Data Kosong";
  if (value.includes("prioritas") || value.includes("urgent") || value.includes("rekomendasi")) return "Rekomendasi Prioritas";
  if (value.includes("laporan")) return "Laporan Harian";
  return "Ringkasan Otomatis";
}

export async function buildOpenClawInventoryAnalysis({ user = null, question = "" } = {}) {
  const [rooms, allTools, allMaintenance, allKalibrasi, pengajuan, notifikasi] = await Promise.all([
    get("ruangan?select=*&order=nama_ruangan.asc"),
    get("alat_kesehatan?select=*&order=nama_alat.asc"),
    get("maintenance?select=*,alat_kesehatan(nama_alat,merk,tipe,ruangan_id)&order=tanggal.desc&limit=500"),
    get("kalibrasi?select=*,alat_kesehatan(nama_alat,merk,tipe,ruangan_id)&order=tanggal_kalibrasi.desc&limit=500"),
    get("pengajuan?select=*,alat_kesehatan(nama_alat,merk,tipe)&order=created_at.desc&limit=200").catch(() => []),
    get("notifikasi_teknisi?select=*,alat_kesehatan(nama_alat,merk,tipe)&order=created_at.desc&limit=200").catch(() => []),
  ]);

  const role = roleName(user);
  const roomMap = new Map(rooms.map((room) => [room.id, room.nama_ruangan]));
  const tools = filterToolsByRole(allTools, user);
  const maintenance = filterRecordsByRole(allMaintenance, tools, user, "maintenance");
  const kalibrasi = filterRecordsByRole(allKalibrasi, tools, user, "kalibrasi");
  const toolIds = new Set(tools.map((item) => item.id));
  const visiblePengajuan = role === "Vendor"
    ? pengajuan.filter((item) => {
        const vendor = normalize(vendorName(user));
        const recordVendor = normalize(item.vendor_pt || "");
        return vendor && recordVendor && (recordVendor.includes(vendor) || vendor.includes(recordVendor));
      })
    : role === "Kepala Ruangan"
      ? pengajuan.filter((item) => item.ruangan_id === user?.ruangan_id || toolIds.has(item.alat_id))
      : pengajuan;
  const visibleNotifikasi = role === "Kepala Ruangan"
    ? notifikasi.filter((item) => item.ruangan_id === user?.ruangan_id || toolIds.has(item.alat_id))
    : role === "Vendor"
      ? []
      : notifikasi;

  const baik = tools.filter((item) => item.kondisi === "Baik").length;
  const rusak = tools.filter((item) => item.kondisi === "Rusak").length;
  const maintenanceCondition = tools.filter((item) => item.kondisi === "Maintenance").length;
  const dueMaintenance = tools.filter((item) => isDueWithin(item.maintenance_berikutnya, 30));
  const dueKalibrasi = tools.filter((item) => isDueWithin(item.kalibrasi_berikutnya, 30));
  const priority = [...tools].map((item) => ({ item, score: priorityScore(item) })).filter((row) => row.score > 0).sort((a, b) => b.score - a.score).slice(0, 10);
  const missing = tools.map((item) => ({ item, missing: missingToolFields(item) })).filter((row) => row.missing.length);
  const pendingPengajuan = visiblePengajuan.filter((item) => !["Ditolak", "Selesai Supervisor", "Diteruskan Vendor"].includes(item.status || ""));
  const openNotifications = visibleNotifikasi.filter((item) => item.status_pengerjaan !== "Sudah selesai dikerjakan");

  const value = normalize(question);
  const includeAudit = value.includes("audit") || value.includes("kosong") || value.includes("belum lengkap");
  const includePriority = value.includes("prioritas") || value.includes("urgent") || value.includes("rekomendasi") || !includeAudit;
  const includeReport = value.includes("laporan") || value.includes("harian") || value.includes("hari ini");

  const lines = [
    `OPENCLAW INVENTORY ANALYSIS - ${intentTitle(question)}`,
    `Role: ${role}`,
    user?.nama ? `User: ${user.nama}` : "",
    role === "Kepala Ruangan" ? `Ruang: ${roomMap.get(user?.ruangan_id) || "-"}` : "",
    role === "Vendor" ? `Vendor: ${vendorName(user) || "-"} | Layanan: ${user?.vendor_layanan || "-"}` : "",
    "",
    "Ringkasan kondisi:",
    `- Total alat terlihat: ${tools.length}`,
    `- Baik: ${baik}`,
    `- Rusak: ${rusak}`,
    `- Maintenance: ${maintenanceCondition}`,
    `- Maintenance jatuh tempo <= 30 hari: ${dueMaintenance.length}`,
    `- Kalibrasi jatuh tempo <= 30 hari: ${dueKalibrasi.length}`,
    `- Pengajuan aktif: ${pendingPengajuan.length}`,
    `- Notifikasi pekerjaan terbuka: ${openNotifications.length}`,
  ].filter(Boolean);

  if (includePriority) {
    lines.push(
      "",
      "Prioritas tindakan:",
      ...(priority.length ? priority.map((row, index) => formatPriority(row.item, index, roomMap)) : ["Belum ada prioritas kritis dari data yang terlihat."]),
    );
  }

  if (includeAudit) {
    lines.push(
      "",
      "Audit data kosong:",
      `- Alat dengan data belum lengkap: ${missing.length}`,
      ...(missing.slice(0, 12).map((row, index) => `${index + 1}. ${row.item.nama_alat || "-"} | ${roomMap.get(row.item.ruangan_id) || "-"} | kosong: ${row.missing.slice(0, 5).join(", ")}`)),
      missing.length > 12 ? `...dan ${missing.length - 12} alat lain perlu dilengkapi.` : "",
    );
  }

  if (includeReport) {
    lines.push(
      "",
      "Bahan laporan harian:",
      `- Riwayat maintenance terbaru tercatat: ${maintenance.length}`,
      `- Riwayat kalibrasi terbaru tercatat: ${kalibrasi.length}`,
      `- Pengajuan terbaru: ${visiblePengajuan.slice(0, 5).map((item) => `${item.alat_kesehatan?.nama_alat || "-"} (${item.status || "-"})`).join("; ") || "-"}`,
      `- Notifikasi terbuka: ${openNotifications.slice(0, 5).map((item) => `${item.alat_kesehatan?.nama_alat || "-"} (${item.status_pengerjaan || "-"})`).join("; ") || "-"}`,
    );
  }

  lines.push(
    "",
    "Arahan:",
    "- Untuk aksi tambah/edit/approve/upload/download QR, gunakan bot operasional.",
    "- Untuk keputusan, pakai daftar prioritas sebagai bahan review sebelum eksekusi.",
  );

  return lines.filter(Boolean).join("\n");
}

function telegramAliases(value) {
  return String(value || "")
    .split(/[\s,|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function matchesTelegram(candidate, telegramIdField) {
  const aliases = telegramAliases(telegramIdField);
  return aliases.includes(candidate);
}

function scoreAlat(item, text) {
  const haystack = normalize(`${item.nama_alat} ${item.merk} ${item.tipe} ${item.kode_barcode}`);
  const words = normalize(text).split(/\s+/).filter(Boolean);
  return words.reduce((score, word) => score + (haystack.includes(word) ? 1 : 0), 0);
}

async function roomAlat(roomId) {
  return get(`alat_kesehatan?select=id,kode_barcode,nama_alat,merk,tipe,serial_number,kondisi,status,ruangan_id&ruangan_id=eq.${escapeValue(roomId)}&order=nama_alat.asc`);
}

async function findAlatInRoom(roomId, alatText, messageText) {
  const alat = await roomAlat(roomId);
  const query = alatText || messageText;
  if (!query) return { alat: null, candidates: alat };

  const exact = alat.find((item) => normalize(item.nama_alat) === normalize(query));
  if (exact) return { alat: exact, candidates: alat };

  const contains = alat.find((item) => normalize(query).includes(normalize(item.nama_alat)));
  if (contains) return { alat: contains, candidates: alat };

  const ranked = alat
    .map((item) => ({ item, score: scoreAlat(item, query) }))
    .sort((a, b) => b.score - a.score);

  return { alat: ranked[0]?.score > 0 ? ranked[0].item : null, candidates: alat };
}

async function findUserByTelegram() {
  const telegramId = arg("--telegram-id");
  const username = arg("--telegram-username");
  if (!telegramId && !username) return null;

  const candidates = [telegramId, username].filter(Boolean);
  if (username && !username.startsWith("@")) candidates.push(`@${username}`);

  const rows = await get(`user_petugas?select=*&limit=1000`);
  for (const row of rows) {
    if (candidates.some((candidate) => matchesTelegram(candidate, row.telegram_id))) return row;
  }

  return null;
}

async function findRoom(user) {
  const explicitRoom = arg("--room");
  if (explicitRoom) {
    const rows = await get(`ruangan?select=*&nama_ruangan=ilike.${escapeValue(explicitRoom)}&limit=1`);
    return rows[0] || null;
  }

  if (!user?.ruangan_id) return null;
  const rows = await get(`ruangan?select=*&id=eq.${escapeValue(user.ruangan_id)}&limit=1`);
  return rows[0] || null;
}

async function roomTools() {
  const user = await findUserByTelegram();
  const room = await findRoom(user);

  if (!room) {
    console.log("Saya belum menemukan ruangan untuk akun ini. Pastikan user_petugas punya ruangan_id atau gunakan --room <nama_ruangan>.");
    return;
  }

  const alat = await get(`alat_kesehatan?select=id,kode_barcode,nama_alat,merk,tipe,serial_number,kondisi,status,maintenance_berikutnya,kalibrasi_berikutnya&ruangan_id=eq.${escapeValue(room.id)}&order=nama_alat.asc`);
  const perluTindak = alat.filter((item) => item.kondisi && item.kondisi !== "Baik");

  console.log(`Ruangan ${room.nama_ruangan} (${room.kode_ruangan}) memiliki ${alat.length} alat tercatat.`);
  if (user) {
    console.log(`Akun: ${user.nama} | Role: ${user.role}`);
  }
  console.log("");

  if (!alat.length) {
    console.log("Belum ada alat di ruangan ini.");
    return;
  }

  console.log("Daftar alat:");
  alat.forEach((item, index) => console.log(alatLine(item, index)));
  console.log("");
  console.log(`Alat perlu tindak lanjut: ${perluTindak.length}`);
  perluTindak.forEach((item, index) => {
    console.log(`${index + 1}. ${item.nama_alat || "-"} | Kondisi: ${item.kondisi || "-"} | Maintenance berikutnya: ${dateText(item.maintenance_berikutnya)} | Kalibrasi berikutnya: ${dateText(item.kalibrasi_berikutnya)}`);
  });
}

async function notifyTechnician() {
  const user = await findUserByTelegram();
  if (!user) {
    console.log("Gagal membuat notifikasi: Telegram ID ini belum terdaftar di user_petugas.");
    return;
  }

  if (user.role !== "Kepala Ruangan") {
    console.log(`Gagal membuat notifikasi: role ${user.role || "-"} tidak boleh membuat laporan Kepala Ruangan.`);
    return;
  }

  const room = await findRoom(user);
  if (!room) {
    console.log("Gagal membuat notifikasi: akun Kepala Ruangan belum punya ruangan_id.");
    return;
  }

  const message = arg("--message");
  const alatText = arg("--alat");
  const catatan = arg("--catatan") || message;
  const result = await findAlatInRoom(room.id, alatText, message);

  if (!result.alat) {
    console.log(`Gagal membuat notifikasi: alat tidak ditemukan di ruangan ${room.nama_ruangan}.`);
    console.log("Alat yang tersedia:");
    result.candidates.forEach((item, index) => console.log(alatLine(item, index)));
    return;
  }

  const inferred = inferCategory(catatan);
  const body = {
    jenis_laporan: inferred.jenis,
    kategori: inferred.kategori,
    alat_id: result.alat.id,
    ruangan_id: room.id,
    catatan: catatan || `Laporan ${result.alat.nama_alat}`,
    dibuat_oleh: user.username || user.nama || String(arg("--telegram-id") || arg("--telegram-username")),
    dibuat_oleh_role: user.role,
    tujuan_role: "Teknisi",
    status: "Baru",
    status_pengerjaan: "Belum dikerjakan",
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/notifikasi_teknisi`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || data?.hint || `Supabase HTTP ${response.status}`);
  }

  console.log("Notifikasi berhasil dikirim ke Teknisi.");
  console.log(`Ruangan: ${room.nama_ruangan}`);
  console.log(`Alat: ${result.alat.nama_alat} (${result.alat.merk || "-"} ${result.alat.tipe || ""})`);
  console.log(`Jenis: ${body.jenis_laporan}${body.kategori ? ` / ${body.kategori}` : ""}`);
  console.log(`Catatan: ${body.catatan}`);
  console.log(`Status: ${body.status_pengerjaan}`);
}

async function main() {
  const command = process.argv[2];
  if (command === "room-tools") {
    await roomTools();
    return;
  }
  if (command === "notify-technician") {
    await notifyTechnician();
    return;
  }
  usage();
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) {
  main().catch((error) => {
    console.error(`Gagal query inventaris: ${error.message}`);
    process.exit(1);
  });
}
