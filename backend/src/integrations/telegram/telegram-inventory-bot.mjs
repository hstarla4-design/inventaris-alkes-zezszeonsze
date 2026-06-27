import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });

const SUPABASE_URL = process.env.SUPABASE_URL || "https://brupcvzzrzflfujaijnw.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "sb_publishable_eQ8iUSOr42sMAgHjXE2ecA_FtvIDoRF";
const POLL_TIMEOUT = 25;
const STATE_FILE = path.join(process.cwd(), ".openclaw-state", "telegram-inventory-bot-state.json");
const LOG_FILE = path.join(process.cwd(), ".openclaw-state", "telegram-inventory-bot.log");

const supabaseHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

function ensureStateDir() {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
}

function log(line) {
  ensureStateDir();
  const stamp = new Date().toISOString();
  fs.appendFileSync(LOG_FILE, `[${stamp}] ${line}\n`);
}

function readOpenClawToken() {
  const customTokenPath = path.join(process.cwd(), ".openclaw-state", "telegram-inventory-bot-token.txt");
  if (fs.existsSync(customTokenPath)) {
    return fs.readFileSync(customTokenPath, "utf8").trim();
  }
  const configPath = path.join(process.env.USERPROFILE || "", ".openclaw", "openclaw.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  return config?.channels?.telegram?.botToken || "";
}

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || readOpenClawToken();
if (!TELEGRAM_TOKEN) {
  throw new Error("Telegram bot token tidak ditemukan.");
}
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

function loadState() {
  ensureStateDir();
  if (!fs.existsSync(STATE_FILE)) return { offset: 0, topics: {}, pending: {} };
  const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  return { offset: 0, topics: {}, pending: {}, ...state };
}

function saveState(state) {
  ensureStateDir();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function escapeValue(value) {
  return encodeURIComponent(String(value ?? "").replaceAll('"', '""'));
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function telegramAliases(value) {
  return String(value || "")
    .split(/[\s,|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D+/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return `0${digits.slice(2)}`;
  return digits;
}

function matchesTelegram(candidate, telegramIdField) {
  const aliases = telegramAliases(telegramIdField);
  return aliases.includes(candidate);
}

function telegramIdentityAliases(from = {}) {
  return [
    String(from.id || ""),
    from.username ? `@${from.username}` : "",
    from.username || "",
  ].filter(Boolean);
}

async function registerTelegramAlias(row, from = {}) {
  const aliases = new Set([...telegramAliases(row.telegram_id), ...telegramIdentityAliases(from)]);
  const telegram_id = Array.from(aliases).filter(Boolean).join(" ");
  if (!telegram_id || telegram_id === row.telegram_id) return row;
  try {
    const updated = await patchSupabase(`user_petugas?id=eq.${escapeValue(row.id)}`, { telegram_id });
    return updated?.[0] || { ...row, telegram_id };
  } catch {
    return { ...row, telegram_id };
  }
}

function commandText(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed.startsWith("/")) return trimmed;
  const command = trimmed.split(/\s+/)[0].split("@")[0].toLowerCase();
  const rest = trimmed.split(/\s+/).slice(1).join(" ");
  const aliases = {
    "/menu": "menu",
    "/help": "menu",
    "/commands": "menu",
    "/start": "/start",
    "/new": "/new",
    "/batal": "batal",
    "/cancel": "batal",
    "/ringkasan": "ringkasan",
    "/notifikasi": "notifikasi",
    "/daftar_user": "daftar user",
    "/daftar_alat": "cari alat",
    "/alat": "cari alat",
    "/daftar_ruangan": "daftar ruangan",
    "/cari_alat": "cari alat",
    "/download_qr": "download qr code alat",
    "/ruangan": `ruangan ${rest}`.trim(),
    "/qr": `qr ${rest}`.trim(),
    "/laporan_kr": "buat laporan kr",
    "/status_laporan": "cek status laporan saya",
    "/histori_laporan": "cek histori laporan kr",
    "/pengajuan": "buat pengajuan",
    "/status_pengajuan": "cek status pengajuan",
    "/maintenance": "cek daftar maintenance",
    "/tambah_maintenance": "tambahkan data maintenance alat",
    "/edit_maintenance": "edit maintenance",
    "/delete_maintenance": "delete maintenance",
    "/histori_maintenance": "cek histori maintenance alat",
    "/kalibrasi": "cek daftar kalibrasi",
    "/tambah_kalibrasi": "tambahkan data kalibrasi alat",
    "/edit_kalibrasi": "edit kalibrasi",
    "/delete_kalibrasi": "delete kalibrasi",
    "/histori_kalibrasi": "cek histori kalibrasi alat",
    "/tambah_alat": "tambahkan alat baru",
    "/tambahkan": "tambahkan alat baru",
    "/edit_alat": "edit alat",
    "/histori_alat": "cek histori alat",
    "/approve_pengajuan": "approve pengajuan",
    "/tolak_pengajuan": "tolak pengajuan",
    "/tugas_saya": "tugas saya",
    "/surat_rs": "surat rs",
    "/surat_vendor": "surat rs",
    "/feedback_vendor": "feedback vendor",
    "/feedback": "feedback vendor",
    "/upload_foto_alat": "upload foto alat",
    "/upload_foto_sebelum": "upload foto sebelum",
    "/upload_foto_sesudah": "upload foto sesudah",
    "/upload_sparepart": "upload foto sparepart",
    "/upload_invoice": "upload invoice",
    "/upload_nilai_ukur": "upload foto nilai ukur",
    "/upload_sertifikat": "upload sertifikat",
  };
  return aliases[command] || trimmed;
}

function isSlashCommand(text) {
  return String(text || "").trim().startsWith("/");
}

function normalizeRoleName(role) {
  const value = normalize(role);
  if (value === "admin") return "Admin";
  if (value === "teknisi") return "Teknisi";
  if (value === "supervisor") return "Supervisor";
  if (value === "kepala supervisor") return "Kepala Supervisor";
  if (value === "kepala ruangan" || value === "kepala ruang" || value === "kepala unit") return "Kepala Ruangan";
  if (value.includes("vendor") || value === "maintenance" || value === "maintaince" || value === "kalibrasi") return "Vendor";
  return role || "";
}

function canAccessRole(user, roles) {
  return roles.includes(normalizeRoleName(user?.role));
}

function vendorName(user) {
  return user?.nama_pt || user?.nama || user?.username || "";
}

function vendorService(user) {
  return normalize(user?.vendor_layanan || user?.service_type || user?.role_detail || user?.role_original || user?.role || "");
}

function isVendorMaintenance(user) {
  return user?.role === "Vendor" && vendorService(user).includes("maintenance");
}

function isVendorKalibrasi(user) {
  return user?.role === "Vendor" && vendorService(user).includes("kalibrasi");
}

function vendorCanAccessType(user, type) {
  if (user?.role !== "Vendor") return true;
  if (type === "maintenance") return isVendorMaintenance(user);
  if (type === "kalibrasi") return isVendorKalibrasi(user);
  return false;
}

function recordMatchesVendor(row, user) {
  const name = normalize(vendorName(user));
  if (!name) return false;
  const recordVendor = normalize(row.vendor_pt || row.vendor || "");
  return Boolean(recordVendor) && (recordVendor.includes(name) || name.includes(recordVendor));
}

async function rowsForRecordAccess(user, type) {
  const rows = type === "maintenance" ? await getMaintenanceRows() : await getKalibrasiRows();
  if (user?.role !== "Vendor") return rows;
  if (!vendorCanAccessType(user, type)) return [];
  return rows.filter((row) => recordMatchesVendor(row, user));
}

function roleOperationalHint(user) {
  const role = normalizeRoleName(user?.role);
  if (role === "Admin") {
    return "Admin bisa memantau semua data, user, alat, ruangan, pengajuan, maintenance, kalibrasi, QR, dan ringkasan.";
  }
  if (role === "Teknisi") {
    return "Kelola inventaris, pekerjaan maintenance dan kalibrasi, pengajuan, QR, notifikasi, serta data ruangan.";
  }
  if (role === "Kepala Ruangan") {
    return "Pantau alat di ruangan sendiri, buat laporan, periksa histori, dan tindak lanjuti persetujuan awal.";
  }
  if (role === "Kepala Supervisor" || role === "Supervisor") {
    return "Pantau kondisi operasional dan putuskan pengajuan maintenance atau kalibrasi sesuai kewenangan.";
  }
  if (role === "Vendor") {
    return isVendorMaintenance(user)
      ? "Vendor Maintenance hanya melihat dan update pekerjaan maintenance milik vendor sendiri."
      : isVendorKalibrasi(user)
        ? "Vendor Kalibrasi hanya melihat dan update pekerjaan kalibrasi milik vendor sendiri."
        : "Vendor perlu vendor_layanan Maintenance atau Kalibrasi agar tugasnya bisa difilter.";
  }
  return "Role belum dikenali. Ketik /menu untuk melihat akses yang tersedia.";
}

function escapeTelegramHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function menuIdentity(user) {
  const name = escapeTelegramHtml(user?.nama || user?.username || "Petugas");
  const role = escapeTelegramHtml(normalizeRoleName(user?.role) || "-");
  return [`<b>INVENTARIS ALAT KESEHATAN</b>`, `${name}  |  ${role}`];
}

function menuCommand(command, description) {
  return `<code>${command}</code>\n${description}`;
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

function scoreAlat(item, text) {
  const haystack = normalize(`${item.nama_alat} ${item.merk} ${item.tipe} ${item.kode_barcode}`);
  const words = normalize(text).split(/\s+/).filter(Boolean);
  return words.reduce((score, word) => score + (haystack.includes(word) ? 1 : 0), 0);
}

function scanBaseUrl() {
  return process.env.SCAN_BASE_URL || "https://inventarisalkes-7f32c.web.app";
}

function scanAlatUrl(code) {
  const url = new URL(scanBaseUrl());
  url.searchParams.set("qr", String(code || "").trim());
  return url.toString();
}

async function telegram(method, payload = {}) {
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!data.ok) throw new Error(`${method}: ${data.description || "Telegram API error"}`);
  return data.result;
}

async function transcribeTelegramVoice(message) {
  if (!OPENAI_API_KEY) {
    return {
      ok: false,
      reason: "Voice diterima, tapi transkripsi belum aktif. Set OPENAI_API_KEY dulu di environment bot.",
    };
  }

  const fileId = message.voice?.file_id || message.audio?.file_id;
  if (!fileId) return { ok: false, reason: "File voice tidak ditemukan." };

  const file = await telegram("getFile", { file_id: fileId });
  const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${file.file_path}`;
  const voiceResponse = await fetch(fileUrl);
  if (!voiceResponse.ok) return { ok: false, reason: "Gagal mengambil voice dari Telegram." };

  const voiceBytes = await voiceResponse.arrayBuffer();
  const form = new FormData();
  form.append("model", "gpt-4o-mini-transcribe");
  form.append("file", new Blob([voiceBytes], { type: message.voice?.mime_type || "audio/ogg" }), "telegram-voice.ogg");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, reason: data?.error?.message || "Gagal transkripsi voice." };
  }

  return { ok: true, text: String(data.text || "").trim() };
}

async function sendMessage(chatId, text, threadId = null) {
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
  if (threadId) payload.message_thread_id = threadId;
  return telegram("sendMessage", payload);
}

async function sendPhoto(chatId, photo, caption = "", threadId = null) {
  const payload = {
    chat_id: chatId,
    photo,
    caption,
  };
  if (threadId) payload.message_thread_id = threadId;
  return telegram("sendPhoto", payload);
}

async function getSupabase(pathName, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${pathName}`, {
    ...options,
    headers: {
      ...supabaseHeaders,
      ...options.headers,
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.message || data?.hint || `Supabase HTTP ${response.status}`);
  return data;
}

async function postSupabase(pathName, body) {
  return getSupabase(pathName, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
}

async function patchSupabase(pathName, body) {
  return getSupabase(pathName, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
}

async function deleteSupabase(pathName) {
  return getSupabase(pathName, { method: "DELETE" });
}

async function findUser(from, message = {}) {
  const candidates = telegramIdentityAliases(from);
  const contactPhone = normalizePhone(message.contact?.phone_number);
  const ownContact = message.contact?.user_id ? String(message.contact.user_id) === String(from.id) : Boolean(contactPhone);

  const rows = await getSupabase(`user_petugas?select=*&status=eq.Aktif&limit=1000`);
  for (const row of rows) {
    if (candidates.some((candidate) => matchesTelegram(candidate, row.telegram_id))) {
      return { ...row, role_original: row.role, role: normalizeRoleName(row.role) };
    }
  }
  if (contactPhone && ownContact) {
    for (const row of rows) {
      if (normalizePhone(row.no_hp) === contactPhone) {
        const linked = await registerTelegramAlias(row, from);
        return { ...linked, role_original: linked.role, role: normalizeRoleName(linked.role) };
      }
    }
  }

  return null;
}

async function findRoom(user) {
  if (!user?.ruangan_id) return null;
  const rows = await getSupabase(`ruangan?select=*&id=eq.${escapeValue(user.ruangan_id)}&limit=1`);
  return rows[0] || null;
}

async function getRoomTools(roomId) {
  return getSupabase(
    `alat_kesehatan?select=id,kode_barcode,nama_alat,merk,tipe,serial_number,kondisi,status,ruangan_id,maintenance_terakhir,maintenance_berikutnya,kalibrasi_terakhir,kalibrasi_berikutnya&ruangan_id=eq.${escapeValue(roomId)}&order=nama_alat.asc`
  );
}

function alatLine(item, index) {
  return `${index + 1}. ${item.nama_alat || "-"} | ${item.merk || "-"} ${item.tipe || ""} | ${item.kondisi || "-"} | ${item.status || "-"}`;
}

function findAlat(alatRows, text) {
  const exact = alatRows.find((item) => normalize(text).includes(normalize(item.nama_alat)));
  if (exact) return exact;

  const ranked = alatRows
    .map((item) => ({ item, score: scoreAlat(item, text) }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.score > 0 ? ranked[0].item : null;
}

function findAlatMatches(alatRows, text) {
  const query = normalize(text)
    .replace(/^cari alat\s*/, "")
    .replace(/^qr\s*/, "")
    .trim();
  if (!query) return [];
  const queryWords = query.split(/\s+/).filter(Boolean);

  return alatRows
    .map((item) => {
      const name = normalize(item.nama_alat);
      const searchable = normalize([
        item.nama_alat,
        item.merk,
        item.tipe,
        item.serial_number,
        item.kode_barcode,
      ].filter(Boolean).join(" "));
      const allWordsMatch = queryWords.every((word) => searchable.includes(word));
      let score = scoreAlat(item, query);
      if (name === query) score += 100;
      else if (name.includes(query)) score += 60;
      if (searchable.includes(query)) score += 30;
      return { item, score, allWordsMatch };
    })
    .filter((entry) => entry.allWordsMatch)
    .sort((a, b) => b.score - a.score || String(a.item.nama_alat).localeCompare(String(b.item.nama_alat)))
    .map((entry) => entry.item);
}

function isInventoryQuestion(text) {
  const value = normalize(text);
  return (
    value.includes("berapa alat") ||
    value.includes("daftar alat") ||
    value.includes("inventaris") ||
    value.includes("alat ruangan") ||
    value.includes("data alat")
  );
}

function isNotificationText(text) {
  const value = normalize(text);
  if (value.includes("cek ") || value.includes("daftar ") || value.includes("histori ") || value.includes("download ")) {
    return false;
  }
  return [
    "hilang",
    "rusak",
    "mati",
    "error",
    "selang",
    "kabel",
    "bocor",
    "pecah",
    "perlu kalibrasi",
    "butuh kalibrasi",
    "perlu maintenance",
    "butuh maintenance",
    "preventive",
    "breakdown",
  ].some((word) => value.includes(word));
}

const TOPIC_LABELS = {
  overview: "Overview",
  daftar_alat: "Daftar Alat",
  maintenance: "Maintenance",
  kalibrasi: "Kalibrasi",
  pengajuan: "Pengajuan",
  notifikasi: "Notifikasi",
  register_user: "Register User",
  general: "General",
};

function detectTopicModule(text) {
  const value = normalize(text);
  if (value.includes("daftar alat") || value.includes("inventaris") || value === "alat") return "daftar_alat";
  if (value.includes("maintenance") || value.includes("maintaince") || value.includes("perbaikan")) return "maintenance";
  if (value.includes("kalibrasi")) return "kalibrasi";
  if (value.includes("pengajuan")) return "pengajuan";
  if (value.includes("notifikasi") || value.includes("laporan")) return "notifikasi";
  if (value.includes("register") || value.includes("user")) return "register_user";
  if (value.includes("overview") || value.includes("ringkasan")) return "overview";
  if (value.includes("general") || value.includes("umum")) return "general";
  return null;
}

function topicKey(message) {
  return `${message.chat.id}:${message.message_thread_id || 0}`;
}

function pendingKey(message) {
  return `${message.chat.id}:${message.message_thread_id || 0}:${message.from?.id || "unknown"}`;
}

function topicContext(message, state) {
  const saved = state.topics?.[topicKey(message)] || null;
  return {
    threadId: message.message_thread_id || null,
    module: saved?.module || null,
    label: saved?.label || null,
  };
}

function topicSetupHelp() {
  return [
    "Setup topik Telegram:",
    "Ketik salah satu perintah ini di topic yang sesuai:",
    "",
    "set topik daftar alat",
    "set topik maintenance",
    "set topik kalibrasi",
    "set topik pengajuan",
    "set topik notifikasi",
    "set topik register user",
    "set topik overview",
    "",
    "Setelah diset, bot akan membaca topic itu seperti dashboard website.",
  ].join("\n");
}

function helpText(user) {
  const role = user.role || "-";
  const common = [
    ...menuIdentity(user),
    "",
    roleOperationalHint(user),
    "",
  ];

  if (role === "Kepala Ruangan") {
    return [
      ...common,
      "<b>AKSES CEPAT</b>",
      "Ketik: <code>alat ruangan</code>, <code>laporkan alat rusak</code>,",
      "<code>qr Ventilator</code>, atau <code>status laporan</code>.",
      "",
      "<b>ALAT DI RUANGAN</b>",
      menuCommand("/daftar_alat", "Lihat seluruh alat di ruangan kamu."),
      menuCommand("/cari_alat", "Cari alat berdasarkan nama, barcode, atau serial number."),
      menuCommand("/histori_alat", "Lihat riwayat lengkap sebuah alat."),
      menuCommand("/download_qr", "Unduh QR alat yang berada di ruangan kamu."),
      "",
      "<b>LAPORAN &amp; PERSETUJUAN</b>",
      menuCommand("/laporan_kr", "Buat laporan alat untuk diteruskan ke teknisi."),
      menuCommand("/status_laporan", "Periksa progres laporan yang sedang berjalan."),
      menuCommand("/histori_laporan", "Lihat laporan ruangan yang pernah dibuat."),
      menuCommand("/approve_pengajuan", "Setujui pengajuan awal dari ruangan kamu."),
      "",
      "<b>PEMANTAUAN</b>",
      menuCommand("/maintenance", "Pantau pekerjaan maintenance alat ruangan."),
      menuCommand("/kalibrasi", "Pantau status kalibrasi alat ruangan."),
      menuCommand("/ringkasan", "Lihat ringkasan operasional ruangan."),
      "",
      "<b>BANTUAN</b>",
      "<code>/help</code> lihat menu  |  <code>/batal</code> batalkan proses",
      "",
      "<i>Akses dibatasi hanya untuk alat dan pekerjaan di ruangan yang terhubung dengan akun ini.</i>",
    ].join("\n");
  }

  if (role === "Teknisi") {
    return [
      ...common,
      "<b>AKSES CEPAT</b>",
      "Ketik: <code>rusak</code>, <code>maintenance</code>, <code>kalibrasi</code>,",
      "<code>ruangan ICU</code>, atau <code>qr Ventilator</code>.",
      "",
      "<b>INVENTARIS</b>",
      menuCommand("/cari_alat", "Cari seluruh unit berdasarkan nama, merk, tipe, barcode, atau serial number."),
      menuCommand("/tambah_alat", "Daftarkan alat kesehatan baru."),
      menuCommand("/edit_alat", "Perbarui data alat yang sudah terdaftar."),
      menuCommand("/histori_alat", "Lihat histori lengkap alat."),
      menuCommand("/download_qr", "Unduh QR unik sebuah alat."),
      "",
      "<b>PEKERJAAN TEKNIS</b>",
      menuCommand("/maintenance", "Lihat daftar dan progres maintenance."),
      menuCommand("/tambah_maintenance", "Catat pekerjaan maintenance baru."),
      menuCommand("/kalibrasi", "Lihat daftar dan progres kalibrasi."),
      menuCommand("/tambah_kalibrasi", "Catat pekerjaan kalibrasi baru."),
      "",
      "<b>ALUR KERJA</b>",
      menuCommand("/pengajuan", "Buat pengajuan maintenance atau kalibrasi."),
      menuCommand("/status_pengajuan", "Pantau posisi dan status pengajuan."),
      menuCommand("/notifikasi", "Lihat pekerjaan dan notifikasi untuk teknisi."),
      menuCommand("/daftar_ruangan", "Lihat ringkasan alat per ruangan."),
      menuCommand("/ringkasan", "Lihat ringkasan inventaris terkini."),
      "",
      "<b>BANTUAN</b>",
      "<code>/help</code> lihat menu  |  <code>/batal</code> batalkan proses",
      "",
      "<i>Perintah edit, unggah foto, dan penghapusan tetap tersedia saat dibutuhkan dalam alur terkait.</i>",
    ].join("\n");
  }

  if (role === "Admin") {
    return [
      ...common,
      "",
      "OVERVIEW",
      "/ringkasan",
      "/daftar_ruangan",
      "",
      "REGISTER USER",
      "/daftar_user",
      "",
      "USER PETUGAS",
      "/daftar_user",
      "",
      "INVENTARIS",
      "/daftar_alat",
      "/cari_alat",
      "/tambah_alat",
      "/edit_alat",
      "/download_qr",
      "/histori_alat",
      "",
      "MONITORING",
      "/notifikasi",
      "/status_pengajuan",
      "/maintenance",
      "/tambah_maintenance",
      "/edit_maintenance",
      "/delete_maintenance",
      "/kalibrasi",
      "/tambah_kalibrasi",
      "/edit_kalibrasi",
      "/delete_kalibrasi",
    ].join("\n");
  }

  if (role === "Kepala Supervisor" || role === "Supervisor") {
    return [
      ...common,
      "<b>AKSES CEPAT</b>",
      "Ketik: <code>ringkasan</code>, <code>status pengajuan</code>,",
      "<code>approve pengajuan</code>, atau <code>tolak pengajuan</code>.",
      "",
      "<b>PEMANTAUAN</b>",
      menuCommand("/ringkasan", "Lihat ringkasan kondisi inventaris dan pekerjaan."),
      menuCommand("/maintenance", "Pantau pekerjaan maintenance lintas ruangan."),
      menuCommand("/kalibrasi", "Pantau pekerjaan dan status kalibrasi."),
      menuCommand("/notifikasi", "Lihat notifikasi operasional yang relevan."),
      "",
      "<b>PERSETUJUAN</b>",
      menuCommand("/status_pengajuan", "Lihat pengajuan yang menunggu atau sudah diproses."),
      menuCommand("/approve_pengajuan", "Setujui pengajuan sesuai kewenangan supervisor."),
      menuCommand("/tolak_pengajuan", "Tolak pengajuan disertai alasan keputusan."),
      "",
      "<b>AUDIT</b>",
      menuCommand("/cari_alat", "Cari dan periksa unit alat tertentu."),
      menuCommand("/histori_alat", "Telusuri riwayat maintenance, kalibrasi, dan mutasi alat."),
      "",
      "<b>BANTUAN</b>",
      "<code>/help</code> lihat menu  |  <code>/batal</code> batalkan proses",
      "",
      "<i>Untuk analisis mendalam, grafik, dan laporan PDF gunakan @AIAsistenInventaris_bot.</i>",
    ].join("\n");
  }

  if (role === "Vendor") {
    if (isVendorMaintenance(user)) {
      return [
        ...common,
        "",
        "TUGAS VENDOR MAINTENANCE",
        "/tugas_saya",
        "/maintenance",
        "/edit_maintenance",
        "/feedback_vendor",
        "/surat_rs",
        "/upload_sparepart",
        "/upload_invoice",
        "/upload_foto_sebelum",
        "/upload_foto_sesudah",
        "",
        "Catatan:",
        "Vendor Maintenance hanya melihat pekerjaan maintenance untuk PT/vendor sendiri.",
      ].join("\n");
    }

    if (isVendorKalibrasi(user)) {
      return [
        ...common,
        "",
        "TUGAS VENDOR KALIBRASI",
        "/tugas_saya",
        "/kalibrasi",
        "/edit_kalibrasi",
        "/feedback_vendor",
        "/surat_rs",
        "/upload_nilai_ukur",
        "/upload_sertifikat",
        "",
        "Catatan:",
        "Vendor Kalibrasi hanya melihat pekerjaan kalibrasi untuk PT/vendor sendiri.",
      ].join("\n");
    }

    return [
      ...common,
      "",
      "Akun vendor belum punya vendor_layanan.",
      "Isi vendor_layanan dengan Maintenance atau Kalibrasi di data petugas.",
    ].join("\n");
  }

  return common.join("\n");
}

async function replySummary(chatId, threadId = null) {
  const [alat, ruangan, notifikasi] = await Promise.all([
    getSupabase("alat_kesehatan?select=id,kondisi,status"),
    getSupabase("ruangan?select=id"),
    getSupabase("notifikasi_teknisi?select=id,status_pengerjaan&tujuan_role=eq.Teknisi"),
  ]);

  const rusak = alat.filter((item) => item.kondisi === "Rusak").length;
  const maintenance = alat.filter((item) => item.kondisi === "Maintenance").length;
  const belum = notifikasi.filter((item) => item.status_pengerjaan !== "Sudah selesai dikerjakan").length;

  await sendMessage(
    chatId,
    [
      "Ringkasan inventaris:",
      `Total alat: ${alat.length}`,
      `Total ruangan: ${ruangan.length}`,
      `Alat rusak: ${rusak}`,
      `Alat maintenance: ${maintenance}`,
      `Notifikasi teknisi belum selesai: ${belum}`,
    ].join("\n"),
    threadId
  );
}

async function replyUsers(chatId, threadId = null) {
  const users = await getSupabase("user_petugas?select=nama,username,role,telegram_id,no_hp,status&order=role.asc,nama.asc");
  const lines = ["Daftar user aktif:", ""];
  users
    .filter((user) => user.status === "Aktif")
    .forEach((user, index) => {
      lines.push(`${index + 1}. ${user.nama || "-"} | ${user.role || "-"} | ${user.telegram_id || "-"} | ${user.no_hp || "-"}`);
    });
  await sendMessage(chatId, lines.join("\n"), threadId);
}

async function findAlatForUser(user, text) {
  if (user.role === "Kepala Ruangan") {
    const room = await findRoom(user);
    if (!room) return { alat: null, room: null, candidates: [] };
    const candidates = await getRoomTools(room.id);
    return { alat: findAlat(candidates, text), room, candidates };
  }

  const candidates = await getSupabase("alat_kesehatan?select=id,kode_barcode,nama_alat,merk,tipe,kondisi,status,ruangan_id&order=nama_alat.asc");
  const alat = findAlat(candidates, text);
  const roomRows = alat?.ruangan_id
    ? await getSupabase(`ruangan?select=*&id=eq.${escapeValue(alat.ruangan_id)}&limit=1`)
    : [];
  return { alat, room: roomRows[0] || null, candidates };
}

async function replyQr(chatId, user, text, threadId = null) {
  const result = await findAlatForUser(user, text.replace(/^qr\s+/i, ""));
  if (!result.alat) {
    await sendMessage(chatId, "Alat tidak ditemukan. Coba ketik: qr suction pump", threadId);
    return;
  }

  const code = result.alat.kode_barcode || result.alat.id;
  const scanUrl = scanAlatUrl(code);
  const imageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(scanUrl)}`;
  await sendPhoto(
    chatId,
    imageUrl,
    [
      `QR Code ${result.alat.nama_alat}`,
      `Merk/Tipe: ${result.alat.merk || "-"} ${result.alat.tipe || ""}`,
      `Ruangan: ${result.room?.nama_ruangan || "-"}`,
      `Kode: ${code}`,
      `Scan URL: ${scanUrl}`,
    ].join("\n"),
    threadId
  );
}

async function replyQrForAlat(chatId, alat, threadId = null) {
  const roomRows = alat?.ruangan_id
    ? await getSupabase(`ruangan?select=nama_ruangan&id=eq.${escapeValue(alat.ruangan_id)}&limit=1`)
    : [];
  const code = alat?.kode_barcode || alat?.id;
  const scanUrl = scanAlatUrl(code);
  const imageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(scanUrl)}`;
  await sendPhoto(
    chatId,
    imageUrl,
    [
      `QR Code ${alat?.nama_alat || "-"}`,
      `Merk/Tipe: ${alat?.merk || "-"} / ${alat?.tipe || "-"}`,
      `Serial Number: ${alat?.serial_number || "-"}`,
      `Ruangan: ${roomRows[0]?.nama_ruangan || "-"}`,
      `Kode: ${code}`,
      `Scan URL: ${scanUrl}`,
    ].join("\n"),
    threadId
  );
}

async function replyInventory(chatId, user, room, threadId = null) {
  const alat = await getRoomTools(room.id);
  const perluTindak = alat.filter((item) => item.kondisi && item.kondisi !== "Baik");
  const lines = [
    `Ruangan ${room.nama_ruangan} memiliki ${alat.length} alat.`,
    "",
    ...alat.map(alatLine),
  ];
  if (perluTindak.length) {
    lines.push("", `Perlu tindak lanjut: ${perluTindak.length}`);
    lines.push(...perluTindak.map((item, index) => `${index + 1}. ${item.nama_alat} | ${item.kondisi}`));
  }
  await sendMessage(chatId, lines.join("\n"), threadId);
}

async function replyRoomMaintenanceList(chatId, room, threadId = null) {
  const alat = await getRoomTools(room.id);
  const lines = [
    `Daftar maintenance alat ruangan ${room.nama_ruangan}:`,
    "",
    ...alat.map((item, index) =>
      [
        `${index + 1}. ${item.nama_alat || "-"}`,
        `Merk/Tipe: ${item.merk || "-"} ${item.tipe || ""}`,
        `Kondisi: ${item.kondisi || "-"}`,
        `Maintenance terakhir: ${item.maintenance_terakhir || "-"}`,
        `Maintenance berikutnya: ${item.maintenance_berikutnya || "-"}`,
      ].join("\n")
    ),
  ];
  await sendMessage(chatId, lines.join("\n\n"), threadId);
}

async function replyRoomCalibrationList(chatId, room, threadId = null) {
  const alat = await getRoomTools(room.id);
  const lines = [
    `Daftar kalibrasi alat ruangan ${room.nama_ruangan}:`,
    "",
    ...alat.map((item, index) =>
      [
        `${index + 1}. ${item.nama_alat || "-"}`,
        `Merk/Tipe: ${item.merk || "-"} ${item.tipe || ""}`,
        `Kondisi: ${item.kondisi || "-"}`,
        `Kalibrasi terakhir: ${item.kalibrasi_terakhir || "-"}`,
        `Kalibrasi berikutnya: ${item.kalibrasi_berikutnya || "-"}`,
      ].join("\n")
    ),
  ];
  await sendMessage(chatId, lines.join("\n\n"), threadId);
}

async function replyAlatSearch(chatId, user, room, text, threadId = null) {
  const alatRows = await getRoomTools(room.id);
  const alat = findAlat(alatRows, text);
  if (!alat) {
    await sendMessage(
      chatId,
      [
        `Alat tidak ditemukan di ruangan ${room.nama_ruangan}.`,
        "",
        "Ketik salah satu nama alat ini:",
        ...alatRows.map((item) => `- ${item.nama_alat}`),
      ].join("\n"),
      threadId
    );
    return;
  }

  await sendMessage(
    chatId,
    [
      "Data alat ditemukan:",
      `Nama: ${alat.nama_alat || "-"}`,
      `Merk/Tipe: ${alat.merk || "-"} ${alat.tipe || ""}`,
      `Barcode: ${alat.kode_barcode || "-"}`,
      `Kondisi: ${alat.kondisi || "-"}`,
      `Status: ${alat.status || "-"}`,
      `Maintenance berikutnya: ${alat.maintenance_berikutnya || "-"}`,
      `Kalibrasi berikutnya: ${alat.kalibrasi_berikutnya || "-"}`,
      "",
      `Untuk QR, ketik: qr ${alat.nama_alat}`,
    ].join("\n"),
    threadId
  );
}

async function askForAlat(chatId, message, state, action, prompt, alatRows, threadId = null) {
  state.pending[pendingKey(message)] = { action, createdAt: new Date().toISOString() };
  saveState(state);
  await sendMessage(
    chatId,
    [
      prompt,
      "",
      "Pilihan alat:",
      ...alatRows.map((item, index) => `${index + 1}. ${item.nama_alat} | ${item.merk || "-"} ${item.tipe || ""}`),
      "",
      "Balas dengan nama alat atau nomor alat.",
    ].join("\n"),
    threadId
  );
}

async function askForAlatSearch(chatId, message, state, mode = "detail", threadId = null) {
  setPending(message, state, { action: "alat_search_query", mode });
  await sendMessage(
    chatId,
    [
      mode === "qr" ? "<b>CARI QR ALAT</b>" : "<b>CARI ALAT</b>",
      "",
      "Ketik nama alat, merk, tipe, barcode, atau serial number.",
      "",
      "Contoh:",
      "<code>Patient Monitor</code>",
      "<code>Philips IntelliVue</code>",
      "<code>RSZS-ENT-101-PHIL</code>",
      "",
      "<i>Bot akan menampilkan seluruh unit yang cocok, bukan hanya satu alat.</i>",
    ].join("\n"),
    threadId
  );
}

async function sendAlatSearchPage(chatId, message, state, user, matches, query, mode = "detail", page = 0, threadId = null) {
  const pageSize = 12;
  const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
  const safePage = Math.min(Math.max(page, 0), pageCount - 1);
  const start = safePage * pageSize;
  const rows = matches.slice(start, start + pageSize);
  const rooms = await getAllRooms();
  const roomMap = new Map(rooms.map((room) => [room.id, room.nama_ruangan]));

  setPending(message, state, {
    action: "alat_search_results",
    mode,
    query,
    page: safePage,
    alatIds: matches.map((item) => item.id),
  });

  const lines = [
    mode === "qr" ? "<b>HASIL PENCARIAN QR</b>" : "<b>HASIL PENCARIAN ALAT</b>",
    `Kata kunci: <b>${escapeTelegramHtml(query)}</b>`,
    `Ditemukan: <b>${matches.length} unit</b>  |  Halaman ${safePage + 1}/${pageCount}`,
    "",
  ];

  rows.forEach((item, index) => {
    lines.push(
      `<b>${start + index + 1}. ${escapeTelegramHtml(item.nama_alat || "-")}</b>`,
      `${escapeTelegramHtml(item.merk || "-")} / ${escapeTelegramHtml(item.tipe || "-")}`,
      `SN: <code>${escapeTelegramHtml(item.serial_number || "-")}</code>`,
      `Ruangan: ${escapeTelegramHtml(roomMap.get(item.ruangan_id) || "-")}  |  ${escapeTelegramHtml(item.kondisi || "-")}  |  ${escapeTelegramHtml(item.status || "-")}`,
      ""
    );
  });

  lines.push(
    mode === "qr"
      ? "Balas <b>nomor alat</b> untuk menerima QR unit tersebut."
      : "Balas <b>nomor alat</b> untuk membuka detail lengkap.",
    safePage + 1 < pageCount ? "Ketik <code>lanjut</code> untuk halaman berikutnya." : "",
    safePage > 0 ? "Ketik <code>kembali</code> untuk halaman sebelumnya." : "",
    "Ketik <code>batal</code> untuk menutup pencarian."
  );

  await sendMessage(chatId, lines.filter(Boolean).join("\n"), threadId);
}

function alatFromPendingReply(alatRows, text) {
  const index = Number.parseInt(String(text).trim(), 10);
  if (Number.isInteger(index) && index >= 1 && index <= alatRows.length) return alatRows[index - 1];
  return findAlat(alatRows, text);
}

function isPlainNumber(text) {
  return /^\d+$/.test(String(text || "").trim());
}

function splitParts(text) {
  return String(text || "")
    .split("|")
    .map((part) => part.trim());
}

function parseKeyValues(text) {
  const result = {};
  for (const part of splitParts(text)) {
    const match = part.match(/^([^:=]+)\s*[:=]\s*(.+)$/);
    if (match) result[normalize(match[1]).replaceAll(" ", "_")] = match[2].trim();
  }
  return result;
}

function parseToolEditText(text) {
  const normalized = normalize(text);
  const payload = {};

  if (["baik", "rusak", "maintenance"].includes(normalized)) {
    payload.kondisi = normalized === "baik" ? "Baik" : normalized === "rusak" ? "Rusak" : "Maintenance";
    return payload;
  }

  if (normalized === "aktif" || normalized === "tidak aktif" || normalized === "nonaktif") {
    payload.status = normalized === "aktif" ? "Aktif" : "Tidak Aktif";
    return payload;
  }

  const parts = splitParts(text);
  if (parts.length >= 4) {
    const [nama_alat, merkTipe, kondisi, status] = parts;
    if (nama_alat) payload.nama_alat = nama_alat;
    if (merkTipe) {
      const tokens = merkTipe.split(/\s+/).filter(Boolean);
      if (tokens.length > 1) {
        payload.merk = tokens[0];
        payload.tipe = tokens.slice(1).join(" ");
      } else {
        payload.merk = merkTipe;
      }
    }
    if (kondisi) payload.kondisi = kondisi;
    if (status) payload.status = status;
    return payload;
  }

  return payload;
}

function formatRecordLine(item, index, alat = null) {
  const name = alat?.nama_alat || item.alat_kesehatan?.nama_alat || item.nama_alat || "-";
  const date = item.tanggal || item.tanggal_kalibrasi || item.created_at || "-";
  const status = item.status_progres || item.status || item.hasil || "-";
  return `${index + 1}. ${name} | ${date} | ${status}`;
}

function setPending(message, state, pending) {
  state.pending[pendingKey(message)] = { ...pending, createdAt: new Date().toISOString() };
  saveState(state);
}

function clearPending(message, state) {
  delete state.pending[pendingKey(message)];
  saveState(state);
}

async function getAllRooms() {
  return getSupabase("ruangan?select=*&order=nama_ruangan.asc");
}

async function getAllTools() {
  return getSupabase("alat_kesehatan?select=*&order=nama_alat.asc");
}

async function getToolsForUser(user) {
  if (user?.role === "Kepala Ruangan") {
    const room = await findRoom(user);
    return room ? getRoomTools(room.id) : [];
  }

  if (user?.role === "Vendor") {
    const [tools, maintenanceRows, kalibrasiRows] = await Promise.all([
      getAllTools(),
      rowsForRecordAccess(user, "maintenance"),
      rowsForRecordAccess(user, "kalibrasi"),
    ]);
    const visibleIds = new Set([...maintenanceRows, ...kalibrasiRows].map((row) => row.alat_id).filter(Boolean));
    return tools.filter((tool) => visibleIds.has(tool.id));
  }

  return getAllTools();
}

async function getMaintenanceRows() {
  return getSupabase("maintenance?select=*,alat_kesehatan(nama_alat,merk,tipe)&order=tanggal.desc");
}

async function getKalibrasiRows() {
  return getSupabase("kalibrasi?select=*,alat_kesehatan(nama_alat,merk,tipe)&order=tanggal_kalibrasi.desc");
}

async function getPengajuanRows() {
  return getSupabase("pengajuan?select=*,alat_kesehatan(nama_alat,merk,tipe),ruangan(nama_ruangan)&order=created_at.desc");
}

function formatDateId(value = new Date()) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}

async function queueVendorLetterFromPengajuan(row, recordRef = "", actor = "") {
  const service = row.jenis_pengajuan === "Kalibrasi" ? "Kalibrasi" : "Maintenance";
  const vendorNameValue = row.vendor_pt || "";
  const vendorRows = vendorNameValue
    ? await getSupabase(`user_petugas?select=nama,nama_pt,email&role=eq.Vendor&status=eq.Aktif&or=(nama_pt.eq.${escapeValue(vendorNameValue)},nama.eq.${escapeValue(vendorNameValue)})&limit=1`).catch(() => [])
    : [];
  const email = vendorRows[0]?.email || null;
  const nomor = `${String(Date.now()).slice(-6)}/RSZS/IPRS/V/${new Date().getFullYear()}`;
  const alat = row.alat_kesehatan || {};
  const html = [
    `<h1>Rumah Sakit Zeonsze</h1>`,
    `<p>Tanggal, ${formatDateId()}</p>`,
    `<p>Nomor: ${nomor}<br>Perihal: <strong>Pengajuan ${service} Alat Kesehatan</strong></p>`,
    `<p>Kepada Yth.<br><strong>Pimpinan / Tim Teknisi</strong><br>${vendorNameValue || "Vendor terkait"}<br>di Tempat</p>`,
    `<p>Dengan hormat, bersama ini kami mengajukan permohonan pelaksanaan ${service.toLowerCase()} alat kesehatan.</p>`,
    `<table border="1" cellpadding="6" cellspacing="0"><tr><th>Nama Alat</th><th>Merk / Tipe</th><th>Ruangan</th><th>Jenis Tindakan</th></tr><tr><td>${alat.nama_alat || "-"}</td><td>${alat.merk || "-"} / ${alat.tipe || "-"}</td><td>${row.ruangan?.nama_ruangan || "-"}</td><td>${service === "Kalibrasi" ? "Kalibrasi" : row.kategori || "Maintenance"}</td></tr></table>`,
    `<p>PIC Rumah Sakit: ${row.dibuat_oleh || actor || "-"}<br>Nomor HP: ${row.dibuat_oleh_hp || "-"}</p>`,
    `<p>Hormat kami,<br><strong>Rumah Sakit Zeonsze</strong></p>`,
  ].join("");

  const suratRows = await postSupabase("surat_vendor", {
    pengajuan_id: row.id,
    record_ref: recordRef,
    nomor_surat: nomor,
    vendor_pt: vendorNameValue || null,
    jenis_layanan: service,
    subject: `Pengajuan ${service} Alat Kesehatan - ${alat.nama_alat || "-"}`,
    to_email: email,
    html_surat: html,
    email_status: email ? "Queued" : "No Email",
    dibuat_oleh: actor || null,
  }).catch(() => []);

  if (email) {
    await postSupabase("email_queue", {
      surat_id: suratRows[0]?.id || null,
      to_email: email,
      subject: `Pengajuan ${service} Alat Kesehatan - ${alat.nama_alat || "-"}`,
      html_body: html,
      status: "Queued",
    }).catch(() => {});
  }
}

async function replyToolDetail(chatId, user, alat, threadId = null) {
  const [roomRows, maintenanceRows, kalibrasiRows, mutasiRows] = await Promise.all([
    alat.ruangan_id ? getSupabase(`ruangan?select=*&id=eq.${escapeValue(alat.ruangan_id)}&limit=1`) : Promise.resolve([]),
    getSupabase(`maintenance?select=*&alat_id=eq.${escapeValue(alat.id)}&order=tanggal.desc&limit=3`),
    getSupabase(`kalibrasi?select=*&alat_id=eq.${escapeValue(alat.id)}&order=tanggal_kalibrasi.desc&limit=3`),
    getSupabase(`mutasi_alat?select=*,dari_ruangan:ruangan!mutasi_alat_dari_ruangan_id_fkey(nama_ruangan),ke_ruangan:ruangan!mutasi_alat_ke_ruangan_id_fkey(nama_ruangan)&alat_id=eq.${escapeValue(alat.id)}&order=tanggal_mutasi.desc&limit=3`).catch(() => []),
  ]);
  const room = roomRows[0]?.nama_ruangan || "-";
  const lastMaintenance = maintenanceRows[0];
  const lastKalibrasi = kalibrasiRows[0];

  await sendMessage(
    chatId,
    [
      "DETAIL ALAT",
      `Nama: ${alat.nama_alat || "-"}`,
      `Merk/Tipe: ${alat.merk || "-"} / ${alat.tipe || "-"}`,
      `Serial Number: ${alat.serial_number || "-"}`,
      `Barcode/QR: ${alat.kode_barcode || "-"}`,
      `Ruangan: ${room}`,
      `Kondisi: ${alat.kondisi || "-"}`,
      `Status: ${alat.status || "-"}`,
      `Vendor/Perusahaan: ${alat.vendor || alat.perusahaan || "-"}`,
      `Tahun pembelian: ${alat.tahun_pembelian || "-"}`,
      "",
      "JADWAL",
      `Maintenance terakhir: ${alat.maintenance_terakhir || lastMaintenance?.tanggal || "-"}`,
      `Maintenance berikutnya: ${alat.maintenance_berikutnya || "-"}`,
      `Kalibrasi terakhir: ${alat.kalibrasi_terakhir || lastKalibrasi?.tanggal_kalibrasi || "-"}`,
      `Kalibrasi berikutnya: ${alat.kalibrasi_berikutnya || lastKalibrasi?.berlaku_sampai || "-"}`,
      "",
      "RIWAYAT TERAKHIR",
      maintenanceRows.length
        ? `Maintenance: ${maintenanceRows.map((row) => `${row.tanggal || "-"} | ${row.jenis || "-"} | ${row.hasil || row.status_progres || "-"}`).join("; ")}`
        : "Maintenance: belum ada riwayat.",
      kalibrasiRows.length
        ? `Kalibrasi: ${kalibrasiRows.map((row) => `${row.tanggal_kalibrasi || "-"} | ${row.hasil || "-"} | ${row.nomor_sertifikat || "-"}`).join("; ")}`
        : "Kalibrasi: belum ada riwayat.",
      mutasiRows.length
        ? `Mutasi: ${mutasiRows.map((row) => `${row.tanggal_mutasi || "-"} | ${row.dari_ruangan?.nama_ruangan || "-"} -> ${row.ke_ruangan?.nama_ruangan || "-"}`).join("; ")}`
        : "Mutasi: belum ada riwayat.",
      "",
      canAccessRole(user, ["Admin", "Teknisi", "Kepala Ruangan"])
        ? `QR: ketik qr ${alat.serial_number || alat.kode_barcode || alat.nama_alat}`
        : "",
      canAccessRole(user, ["Admin", "Teknisi"]) ? "Edit: ketik edit alat" : "",
    ].filter(Boolean).join("\n"),
    threadId
  );
}

async function replyAllTools(chatId, user = null, threadId = null, message = null, state = null) {
  const tools = user ? await getToolsForUser(user) : await getAllTools();
  if (!tools.length) {
    await sendMessage(chatId, user?.role === "Vendor" ? "Belum ada alat yang terkait dengan tugas vendor ini." : "Belum ada data alat.", threadId);
    return;
  }
  if (message && state && canAccessRole(user, ["Admin", "Teknisi", "Kepala Ruangan"])) {
    setPending(message, state, {
      action: "select_tool_from_list",
      alatIds: tools.map((item) => item.id),
    });
  }
  await sendMessage(
    chatId,
    [
      "Daftar alat:",
      "",
      ...tools.map(alatLine),
      "",
      "Balas nomor alat untuk melihat detail. Contoh: 60",
      "Ketik batal untuk keluar dari mode pilih alat.",
    ].join("\n"),
    threadId
  );
}

async function replyRoomList(chatId, user = null, threadId = null) {
  if (user?.role === "Vendor") {
    await sendMessage(chatId, "Vendor tidak punya akses daftar semua ruangan. Gunakan /tugas_saya untuk melihat pekerjaan vendor.", threadId);
    return;
  }
  if (user?.role === "Kepala Ruangan") {
    const room = await findRoom(user);
    if (!room) {
      await sendMessage(chatId, "Akun Kepala Ruangan ini belum punya ruangan_id.", threadId);
      return;
    }
    const tools = await getRoomTools(room.id);
    await sendMessage(chatId, [`Ruangan kamu: ${room.nama_ruangan}`, `Total alat: ${tools.length}`, "", "Ketik daftar alat untuk melihat alat di ruangan kamu."].join("\n"), threadId);
    return;
  }
  const [rooms, tools] = await Promise.all([getAllRooms(), getAllTools()]);
  const lines = [
    "Daftar ruangan:",
    "",
    ...rooms.map((room, index) => {
      const total = tools.filter((tool) => tool.ruangan_id === room.id).length;
      return `${index + 1}. ${room.nama_ruangan} | ${total} alat`;
    }),
    "",
    "Contoh: ketik ICU atau ruangan ICU untuk melihat alat di ICU.",
  ];
  await sendMessage(chatId, lines.join("\n"), threadId);
}

async function findRoomByText(text) {
  const rooms = await getAllRooms();
  const clean = normalize(text)
    .replace(/^ruangan\s+/, "")
    .replace(/^alat\s+ruangan\s+/, "")
    .trim();
  return rooms.find((room) => normalize(room.nama_ruangan) === clean) ||
    rooms.find((room) => clean.includes(normalize(room.nama_ruangan))) ||
    rooms.find((room) => normalize(room.nama_ruangan).includes(clean));
}

async function replyRoomInventoryByText(chatId, text, threadId = null) {
  const room = await findRoomByText(text);
  if (!room) {
    await sendMessage(chatId, "Ruangan tidak ditemukan. Ketik daftar ruangan untuk melihat pilihan.", threadId);
    return;
  }
  await replyInventory(chatId, null, room, threadId);
}

async function replyRoomInventoryByTextForUser(chatId, user, text, threadId = null) {
  if (user?.role === "Vendor") {
    await sendMessage(chatId, "Vendor tidak punya akses melihat alat per ruangan. Gunakan /tugas_saya.", threadId);
    return;
  }
  const room = await findRoomByText(text);
  if (!room) {
    await sendMessage(chatId, "Ruangan tidak ditemukan. Ketik daftar ruangan untuk melihat pilihan.", threadId);
    return;
  }
  if (user?.role === "Kepala Ruangan") {
    const ownRoom = await findRoom(user);
    if (!ownRoom) {
      await sendMessage(chatId, "Akun Kepala Ruangan ini belum punya ruangan_id.", threadId);
      return;
    }
    if (ownRoom.id !== room.id) {
      await sendMessage(chatId, `Kepala Ruangan hanya bisa melihat data ruangan ${ownRoom.nama_ruangan}.`, threadId);
      return;
    }
  }
  await replyInventory(chatId, user, room, threadId);
}

async function replyRoomInventoryIfRoomName(chatId, text, threadId = null) {
  const room = await findRoomByText(`ruangan ${text}`);
  if (!room) return false;
  await replyInventory(chatId, null, room, threadId);
  return true;
}

async function replyInventoryCount(chatId, user = null, threadId = null) {
  const [rooms, tools, maintenanceRows, kalibrasiRows] = await Promise.all([
    getAllRooms(),
    user ? getToolsForUser(user) : getAllTools(),
    user ? rowsForRecordAccess(user, "maintenance") : getMaintenanceRows(),
    user ? rowsForRecordAccess(user, "kalibrasi") : getKalibrasiRows(),
  ]);
  const visibleToolIds = new Set(tools.map((item) => item.id).filter(Boolean));
  const maintenance = user && !canAccessRole(user, ["Admin", "Teknisi", "Kepala Supervisor", "Supervisor", "Vendor"])
    ? maintenanceRows.filter((row) => visibleToolIds.has(row.alat_id))
    : maintenanceRows;
  const kalibrasi = user && !canAccessRole(user, ["Admin", "Teknisi", "Kepala Supervisor", "Supervisor", "Vendor"])
    ? kalibrasiRows.filter((row) => visibleToolIds.has(row.alat_id))
    : kalibrasiRows;
  const rusak = tools.filter((item) => item.kondisi === "Rusak").length;
  const inMaintenance = tools.filter((item) => item.kondisi === "Maintenance").length;
  const visibleRoomIds = new Set(tools.map((item) => item.ruangan_id).filter(Boolean));
  await sendMessage(
    chatId,
    [
      user?.role === "Vendor" ? "Ringkasan tugas vendor:" : "Ringkasan data:",
      `Total alat: ${tools.length}`,
      `Total ruangan: ${user ? visibleRoomIds.size : rooms.length}`,
      `Alat rusak: ${rusak}`,
      `Alat maintenance: ${inMaintenance}`,
      `Total riwayat maintenance: ${maintenance.length}`,
      `Total riwayat kalibrasi: ${kalibrasi.length}`,
      "",
      user?.role === "Vendor" ? "Untuk detail pekerjaan, ketik: /tugas_saya" : "Untuk detail ruangan, ketik: ruangan ICU",
    ].join("\n"),
    threadId
  );
}

async function replySpecificToolCount(chatId, user, text, threadId = null) {
  const tools = user ? await getToolsForUser(user) : await getAllTools();
  const query = normalize(text)
    .replace("ada berapa alat", "")
    .replace("berapa alat", "")
    .replace("jumlah alat", "")
    .replace("total alat", "")
    .trim();
  if (!query) {
    await replyInventoryCount(chatId, user, threadId);
    return;
  }
  const matches = tools.filter((item) => normalize(`${item.nama_alat} ${item.merk} ${item.tipe} ${item.kode_barcode}`).includes(query));
  if (!matches.length) {
    await sendMessage(chatId, `Tidak ditemukan alat dengan kata kunci "${query}".`, threadId);
    return;
  }
  const byRoom = {};
  const rooms = await getAllRooms();
  for (const item of matches) {
    const room = rooms.find((row) => row.id === item.ruangan_id)?.nama_ruangan || "Tanpa ruangan";
    byRoom[room] = (byRoom[room] || 0) + 1;
  }
  await sendMessage(
    chatId,
    [
      `Ditemukan ${matches.length} alat untuk kata kunci "${query}".`,
      "",
      "Sebaran ruangan:",
      ...Object.entries(byRoom).map(([room, total]) => `- ${room}: ${total}`),
      "",
      "Daftar:",
      ...matches.slice(0, 20).map(alatLine),
    ].join("\n"),
    threadId
  );
}

async function replyTodayHistory(chatId, threadId = null) {
  const today = new Date().toISOString().slice(0, 10);
  const [maintenance, kalibrasi] = await Promise.all([
    getSupabase(`maintenance?select=*,alat_kesehatan(nama_alat,merk,tipe)&tanggal=eq.${today}&order=tanggal.desc`),
    getSupabase(`kalibrasi?select=*,alat_kesehatan(nama_alat,merk,tipe)&tanggal_kalibrasi=eq.${today}&order=tanggal_kalibrasi.desc`),
  ]);
  await sendMessage(
    chatId,
    [
      `Riwayat maintenance/kalibrasi hari ini (${today}):`,
      "",
      `Maintenance: ${maintenance.length}`,
      ...(maintenance.length ? maintenance.map((row, index) => `${index + 1}. ${row.alat_kesehatan?.nama_alat || "-"} | ${row.jenis || "-"} | ${row.hasil || row.keterangan || "-"}`) : ["Belum ada maintenance hari ini."]),
      "",
      `Kalibrasi: ${kalibrasi.length}`,
      ...(kalibrasi.length ? kalibrasi.map((row, index) => `${index + 1}. ${row.alat_kesehatan?.nama_alat || "-"} | ${row.hasil || "-"} | ${row.nomor_sertifikat || "-"}`) : ["Belum ada kalibrasi hari ini."]),
    ].join("\n"),
    threadId
  );
}

async function replyToolHistory(chatId, user, text, threadId = null) {
  const { alat } = await findAlatForUser(user, text.replace(/histori|cek|alat/gi, ""));
  if (!alat) {
    await sendMessage(chatId, "Alat tidak ditemukan. Contoh: Cek histori alat suction pump", threadId);
    return;
  }
  const [maintenance, kalibrasi] = await Promise.all([
    getSupabase(`maintenance?select=*&alat_id=eq.${escapeValue(alat.id)}&order=tanggal.desc`),
    getSupabase(`kalibrasi?select=*&alat_id=eq.${escapeValue(alat.id)}&order=tanggal_kalibrasi.desc`),
  ]);
  const lines = [
    `Histori alat: ${alat.nama_alat}`,
    `Kondisi sekarang: ${alat.kondisi || "-"}`,
    `Status sekarang: ${alat.status || "-"}`,
    "",
    "Maintenance:",
    ...(maintenance.length ? maintenance.map((item, index) => `${index + 1}. ${item.tanggal || "-"} | ${item.jenis || "-"} | ${item.hasil || item.keterangan || "-"}`) : ["Belum ada histori maintenance."]),
    "",
    "Kalibrasi:",
    ...(kalibrasi.length ? kalibrasi.map((item, index) => `${index + 1}. ${item.tanggal_kalibrasi || "-"} | ${item.hasil || "-"} | ${item.nomor_sertifikat || "-"}`) : ["Belum ada histori kalibrasi."]),
  ];
  await sendMessage(chatId, lines.join("\n"), threadId);
}

function barcodePart(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 32);
}

function generateBotBarcode(payload) {
  return [payload.nama_alat, payload.merk, payload.tipe, payload.serial_number].map(barcodePart).filter(Boolean).join("-");
}

function formatTemplate(title, fields, example, extraLines = []) {
  return [
    title,
    "",
    "Kirim format:",
    ...fields.map((field) => `${field} |`),
    "",
    "Contoh:",
    example,
    ...extraLines,
  ].join("\n");
}

async function startAddTool(chatId, message, state, threadId = null, forcedRoom = null) {
  setPending(message, state, { action: "add_tool", forcedRoomId: forcedRoom?.id || null, forcedRoomName: forcedRoom?.nama_ruangan || null });
  const rooms = await getAllRooms();
  const fields = forcedRoom
    ? ["Nama alat", "Merk", "Tipe", "Serial Number", "Kondisi", "Status", "Kepemilikan", "Harga/Tanggal"]
    : ["Nama alat", "Merk", "Tipe", "Serial Number", "Ruangan", "Kondisi", "Status", "Kepemilikan", "Harga/Tanggal"];
  const example = forcedRoom
    ? "Monitor Pasien | Mindray | BeneVision N15 | SN9001 | Baik | Aktif | Milik RS | 150000000"
    : "Monitor Pasien | Mindray | BeneVision N15 | SN9001 | ICU | Baik | Aktif | Milik RS | 150000000";
  await sendMessage(
    chatId,
    formatTemplate(
      "Tambahkan alat baru.",
      fields,
      example,
      forcedRoom
        ? ["", `Ruangan otomatis: ${forcedRoom.nama_ruangan}`]
        : ["", "Ruangan tersedia:", rooms.map((room) => room.nama_ruangan).join(", ")]
    ),
    threadId
  );
}

async function finishAddTool(chatId, message, state, user, text, threadId = null) {
  const pending = state.pending[pendingKey(message)] || {};
  const parts = splitParts(text);
  const [nama_alat, merk, tipe, serial_number] = parts;
  const roomName = pending.forcedRoomName || parts[4];
  const kondisi = pending.forcedRoomName ? parts[4] || "Baik" : parts[5] || "Baik";
  const status = pending.forcedRoomName ? parts[5] || "Aktif" : parts[6] || "Aktif";
  const kepemilikan = pending.forcedRoomName ? parts[6] || "Milik RS" : parts[7] || "Milik RS";
  const harga = pending.forcedRoomName ? parts[7] : parts[8];
  if (!nama_alat || !serial_number || !roomName) {
    await sendMessage(chatId, "Format belum lengkap. Isi minimal Nama alat, Serial Number, dan Ruangan.", threadId);
    return;
  }
  const rooms = await getAllRooms();
  const room = pending.forcedRoomId
    ? rooms.find((item) => item.id === pending.forcedRoomId)
    : rooms.find((item) => normalize(item.nama_ruangan) === normalize(roomName)) || rooms.find((item) => normalize(item.nama_ruangan).includes(normalize(roomName)));
  if (!room) {
    await sendMessage(chatId, `Ruangan "${roomName}" tidak ditemukan.`, threadId);
    return;
  }
  const payload = {
    nama_alat,
    merk: merk || null,
    tipe: tipe || null,
    serial_number,
    kode_barcode: generateBotBarcode({ nama_alat, merk, tipe, serial_number }),
    ruangan_id: room.id,
    kondisi,
    status,
    status_kepemilikan: kepemilikan || "Milik RS",
  };
  if (payload.status_kepemilikan === "Milik RS" && harga) payload.harga_pembelian = Number(harga) || null;
  const saved = await postSupabase("alat_kesehatan", payload);
  clearPending(message, state);
  await postSupabase("histori_alat", {
    alat_id: saved?.[0]?.id,
    aksi: "Tambah alat via Telegram",
    petugas: user.nama || user.username || null,
    detail: `${nama_alat} | ${room.nama_ruangan} | ${kondisi}`,
  }).catch(() => {});
  await sendMessage(chatId, `Alat berhasil ditambahkan.\nNama: ${nama_alat}\nRuangan: ${room.nama_ruangan}\nQR/Kode: ${payload.kode_barcode}`, threadId);
}

async function startEditTool(chatId, message, state, threadId = null) {
  setPending(message, state, { action: "edit_tool_pick" });
  const tools = await getAllTools();
  await sendMessage(chatId, ["Pilih alat yang mau diperbarui:", "", ...tools.map(alatLine), "", "Balas nomor atau nama alat."].join("\n"), threadId);
}

async function handleToolEdit(chatId, message, state, user, text, threadId = null) {
  const pending = state.pending[pendingKey(message)];
  const tools = await getAllTools();
  if (pending.action === "edit_tool_pick") {
    const alat = alatFromPendingReply(tools, text);
    if (!alat) {
      await sendMessage(chatId, "Alat tidak ditemukan.", threadId);
      return;
    }
    setPending(message, state, { action: "edit_tool_values", alatId: alat.id, alatName: alat.nama_alat });
    await sendMessage(
      chatId,
      [
        `Update data untuk: ${alat.nama_alat}`,
        "",
        "Kirim field yang mau diubah:",
        "kondisi=Baik |",
        "status=Aktif |",
        "ruangan=ICU |",
        "merk=GE |",
        "tipe=Vivid S70 |",
        "vendor=PT A |",
        "",
        "Atau format cepat:",
        "Ventilator | Drager Savina 750 | Maintenance | Aktif",
      ].join("\n"),
      threadId
    );
    return;
  }
  const values = parseKeyValues(text);
  const payload = parseToolEditText(text);
  for (const key of ["kondisi", "status", "merk", "tipe", "vendor"]) {
    if (values[key]) payload[key] = values[key];
  }
  if (values.ruangan) {
    const rooms = await getAllRooms();
    const room = rooms.find((item) => normalize(item.nama_ruangan) === normalize(values.ruangan)) || rooms.find((item) => normalize(item.nama_ruangan).includes(normalize(values.ruangan)));
    if (!room) {
      await sendMessage(chatId, `Ruangan "${values.ruangan}" tidak ditemukan.`, threadId);
      return;
    }
    payload.ruangan_id = room.id;
  }
  if (!Object.keys(payload).length) {
    await sendMessage(chatId, "Tidak ada field valid. Contoh: kondisi=Baik | status=Aktif", threadId);
    return;
  }
  await patchSupabase(`alat_kesehatan?id=eq.${escapeValue(pending.alatId)}`, payload);
  await postSupabase("histori_alat", {
    alat_id: pending.alatId,
    aksi: "Edit alat via Telegram",
    petugas: user.nama || user.username || null,
    detail: JSON.stringify(payload),
  }).catch(() => {});
  clearPending(message, state);
  await sendMessage(chatId, `Data alat ${pending.alatName} berhasil diperbarui.`, threadId);
}

async function replyMaintenanceList(chatId, user = null, threadId = null) {
  const rows = user ? await rowsForRecordAccess(user, "maintenance") : await getMaintenanceRows();
  if (user?.role === "Vendor" && !vendorCanAccessType(user, "maintenance")) {
    await sendMessage(chatId, "Akun vendor ini bukan Vendor Maintenance.", threadId);
    return;
  }
  await sendMessage(
    chatId,
    rows.length
      ? ["Daftar maintenance:", "", ...rows.slice(0, 20).map((row, index) => formatRecordLine(row, index))].join("\n")
      : "Belum ada data maintenance.",
    threadId
  );
}

async function replyKalibrasiList(chatId, user = null, threadId = null) {
  const rows = user ? await rowsForRecordAccess(user, "kalibrasi") : await getKalibrasiRows();
  if (user?.role === "Vendor" && !vendorCanAccessType(user, "kalibrasi")) {
    await sendMessage(chatId, "Akun vendor ini bukan Vendor Kalibrasi.", threadId);
    return;
  }
  await sendMessage(
    chatId,
    rows.length
      ? ["Daftar kalibrasi:", "", ...rows.slice(0, 20).map((row, index) => formatRecordLine(row, index))].join("\n")
      : "Belum ada data kalibrasi.",
    threadId
  );
}

async function startAddMaintenance(chatId, message, state, threadId = null) {
  setPending(message, state, { action: "add_maintenance" });
  const tools = await getAllTools();
  await sendMessage(
    chatId,
    formatTemplate(
      "Tambahkan data maintenance.",
      ["Nama alat", "Jenis", "Tanggal YYYY-MM-DD", "Hasil", "Keterangan", "Vendor/PT", "Biaya"],
      "Suction Pump | Corrective Ringan | 2026-05-07 | Selesai | Selang diganti | PT Medika | 250000",
      ["", "Alat tersedia:", ...tools.map((item, index) => `${index + 1}. ${item.nama_alat}`)]
    ),
    threadId
  );
}

async function finishAddMaintenance(chatId, message, state, user, text, threadId = null) {
  const [alatText, jenis = "Corrective Ringan", tanggal = new Date().toISOString().slice(0, 10), hasil, keterangan, vendor_pt, biaya] = splitParts(text);
  const tools = await getAllTools();
  const alat = alatFromPendingReply(tools, alatText);
  if (!alat) {
    await sendMessage(chatId, "Alat tidak ditemukan.", threadId);
    return;
  }
  await postSupabase("maintenance", {
    alat_id: alat.id,
    jenis,
    tanggal,
    teknisi: user.nama || user.username || null,
    hasil: hasil || null,
    keterangan: keterangan || null,
    vendor_pt: vendor_pt || null,
    biaya_perbaikan: biaya ? Number(biaya) || null : null,
    status_progres: "Selesai",
    service_type: "Maintenance",
  });
  await patchSupabase(`alat_kesehatan?id=eq.${escapeValue(alat.id)}`, { maintenance_terakhir: tanggal });
  clearPending(message, state);
  await sendMessage(chatId, `Data maintenance ${alat.nama_alat} berhasil ditambahkan.`, threadId);
}

async function startEditOrDeleteRecord(chatId, message, state, user, type, mode, threadId = null) {
  if (user?.role === "Vendor" && mode === "delete") {
    await sendMessage(chatId, "Vendor tidak boleh menghapus data pekerjaan.", threadId);
    return;
  }
  if (user?.role === "Vendor" && !vendorCanAccessType(user, type)) {
    await sendMessage(chatId, `Akun vendor ini tidak punya akses ${type}.`, threadId);
    return;
  }
  const rows = await rowsForRecordAccess(user, type);
  if (!rows.length) {
    await sendMessage(chatId, `Belum ada data ${type} untuk akun ini.`, threadId);
    return;
  }
  setPending(message, state, { action: `${mode}_${type}_pick` });
  await sendMessage(
    chatId,
    [
      `${mode === "delete" ? "Delete" : "Perbaharui"} data ${type}.`,
      "",
      ...rows.slice(0, 20).map((row, index) => formatRecordLine(row, index)),
      "",
      "Balas nomor data.",
    ].join("\n"),
    threadId
  );
}

async function handleRecordEditDelete(chatId, message, state, user, text, threadId = null) {
  const pending = state.pending[pendingKey(message)];
  const [mode, type, step] = pending.action.split("_");
  if (user?.role === "Vendor" && mode === "delete") {
    clearPending(message, state);
    await sendMessage(chatId, "Vendor tidak boleh menghapus data pekerjaan.", threadId);
    return;
  }
  if (user?.role === "Vendor" && !vendorCanAccessType(user, type)) {
    clearPending(message, state);
    await sendMessage(chatId, `Akun vendor ini tidak punya akses ${type}.`, threadId);
    return;
  }
  const rows = await rowsForRecordAccess(user, type);
  const table = type;

  if (step === "pick") {
    const index = Number.parseInt(text.trim(), 10);
    const row = rows[index - 1];
    if (!row) {
      await sendMessage(chatId, "Nomor data tidak ditemukan.", threadId);
      return;
    }
    if (mode === "delete") {
      await deleteSupabase(`${table}?id=eq.${escapeValue(row.id)}`);
      clearPending(message, state);
      await sendMessage(chatId, `Data ${type} berhasil dihapus.`, threadId);
      return;
    }
    setPending(message, state, { action: `${mode}_${type}_values`, recordId: row.id });
    await sendMessage(
      chatId,
      type === "maintenance"
        ? [
            "Kirim update maintenance:",
            "",
            "tanggal=2026-05-07 |",
            "hasil=Selesai |",
            "keterangan=Selang diganti |",
            "vendor_pt=PT A |",
            "biaya_perbaikan=250000 |",
            "status_progres=Selesai |",
          ].join("\n")
        : [
            "Kirim update kalibrasi:",
            "",
            "tanggal_kalibrasi=2026-05-07 |",
            "berlaku_sampai=2026-08-07 |",
            "hasil=Lulus |",
            "nomor_sertifikat=ABC |",
            "vendor=PT A |",
          ].join("\n"),
      threadId
    );
    return;
  }

  const values = parseKeyValues(text);
  const payload = {};
  const allowed = type === "maintenance"
    ? ["tanggal", "jenis", "hasil", "keterangan", "vendor_pt", "status_progres", "biaya_perbaikan"]
    : ["tanggal_kalibrasi", "berlaku_sampai", "vendor", "vendor_pt", "hasil", "nomor_sertifikat", "catatan", "status_progres"];
  for (const key of allowed) {
    if (values[key]) payload[key] = key === "biaya_perbaikan" ? Number(values[key]) || null : values[key];
  }
  if (!Object.keys(payload).length) {
    await sendMessage(chatId, "Tidak ada field valid.", threadId);
    return;
  }
  await patchSupabase(`${table}?id=eq.${escapeValue(pending.recordId)}`, payload);
  clearPending(message, state);
  await sendMessage(chatId, `Data ${type} berhasil diperbarui.`, threadId);
}

async function startAddKalibrasi(chatId, message, state, threadId = null) {
  setPending(message, state, { action: "add_kalibrasi" });
  const tools = await getAllTools();
  await sendMessage(
    chatId,
    formatTemplate(
      "Tambahkan data kalibrasi.",
      ["Nama alat", "Tanggal Kalibrasi", "Berlaku Sampai", "Vendor/PT", "Hasil", "Nomor Sertifikat", "Catatan"],
      "Infusion Pump | 2026-05-07 | 2026-08-07 | PT Kalibrasi Medika | Lulus | SERT-001 | OK",
      ["", "Alat tersedia:", ...tools.map((item, index) => `${index + 1}. ${item.nama_alat}`)]
    ),
    threadId
  );
}

async function finishAddKalibrasi(chatId, message, state, text, threadId = null) {
  const [alatText, tanggal_kalibrasi = new Date().toISOString().slice(0, 10), berlaku_sampai, vendor, hasil = "Lulus", nomor_sertifikat, catatan] = splitParts(text);
  const tools = await getAllTools();
  const alat = alatFromPendingReply(tools, alatText);
  if (!alat) {
    await sendMessage(chatId, "Alat tidak ditemukan.", threadId);
    return;
  }
  await postSupabase("kalibrasi", {
    alat_id: alat.id,
    tanggal_kalibrasi,
    berlaku_sampai: berlaku_sampai || null,
    vendor: vendor || null,
    vendor_pt: vendor || null,
    hasil,
    nomor_sertifikat: nomor_sertifikat || null,
    catatan: catatan || null,
    status_progres: "Selesai",
    service_type: "Kalibrasi",
  });
  await patchSupabase(`alat_kesehatan?id=eq.${escapeValue(alat.id)}`, { kalibrasi_terakhir: tanggal_kalibrasi, kalibrasi_berikutnya: berlaku_sampai || null });
  clearPending(message, state);
  await sendMessage(chatId, `Data kalibrasi ${alat.nama_alat} berhasil ditambahkan.`, threadId);
}

async function replyPengajuanList(chatId, user, threadId = null) {
  const rows = await getPengajuanRows();
  const visible = user.role === "Kepala Supervisor" || user.role === "Supervisor"
    ? rows.filter((row) => row.tujuan_role === "Kepala Supervisor" || row.status?.includes("Supervisor"))
    : rows;
  await sendMessage(
    chatId,
    visible.length
      ? ["Daftar pengajuan:", "", ...visible.slice(0, 20).map((row, index) => `${index + 1}. ${row.alat_kesehatan?.nama_alat || "-"} | ${row.jenis_pengajuan || "-"} | ${row.kategori || "-"} | ${row.status || "-"}`)].join("\n")
      : "Belum ada pengajuan.",
    threadId
  );
}

async function startApprovePengajuan(chatId, message, state, user, mode, threadId = null) {
  const rows = await getPengajuanRows();
  const visible = rows.filter((row) => mode === "supervisor" ? (row.tujuan_role === "Kepala Supervisor" || row.status === "Menunggu Supervisor") : row.status !== "Diteruskan Vendor");
  setPending(message, state, { action: `approve_pengajuan_${mode}` });
  await sendMessage(
    chatId,
    [
      `${mode === "reject" ? "Tolak" : "Approve"} pengajuan.`,
      "",
      ...visible.slice(0, 20).map((row, index) => `${index + 1}. ${row.alat_kesehatan?.nama_alat || "-"} | ${row.jenis_pengajuan || "-"} | ${row.status || "-"}`),
      "",
      "Balas nomor pengajuan.",
    ].join("\n"),
    threadId
  );
}

async function finishApprovePengajuan(chatId, message, state, text, threadId = null) {
  const pending = state.pending[pendingKey(message)];
  const mode = pending.action.replace("approve_pengajuan_", "");
  const rows = await getPengajuanRows();
  const visible = rows.filter((row) => mode === "supervisor" ? (row.tujuan_role === "Kepala Supervisor" || row.status === "Menunggu Supervisor") : row.status !== "Diteruskan Vendor");
  const index = Number.parseInt(text.trim(), 10);
  const row = visible[index - 1];
  if (!row) {
    await sendMessage(chatId, "Nomor pengajuan tidak ditemukan.", threadId);
    return;
  }
  if (mode === "reject") {
    await patchSupabase(`pengajuan?id=eq.${escapeValue(row.id)}`, { status: "Ditolak" });
    clearPending(message, state);
    await sendMessage(chatId, "Pengajuan ditolak.", threadId);
    return;
  }
  if (mode === "kepala") {
    await patchSupabase(`pengajuan?id=eq.${escapeValue(row.id)}`, { status: "Menunggu Supervisor", tujuan_role: "Kepala Supervisor" });
    clearPending(message, state);
    await sendMessage(chatId, "Pengajuan disetujui Kepala Ruangan dan diteruskan ke Supervisor.", threadId);
    return;
  }
  const needsVendor = row.jenis_pengajuan === "Kalibrasi" || row.kategori === "Corrective Berat" || row.kategori === "Emergency (Breakdown)";
  let recordRef = "";
  if (needsVendor) {
    const today = new Date().toISOString().slice(0, 10);
    if (row.jenis_pengajuan === "Kalibrasi") {
      const created = await postSupabase("kalibrasi", {
        alat_id: row.alat_id,
        tanggal_kalibrasi: today,
        vendor: row.vendor_pt || null,
        vendor_pt: row.vendor_pt || null,
        status_progres: "Baru",
        service_type: "Kalibrasi",
        catatan: row.catatan || null,
      });
      recordRef = `kalibrasi:${created[0]?.id || ""}`;
    } else {
      const created = await postSupabase("maintenance", {
        alat_id: row.alat_id,
        jenis: row.kategori || "Corrective Ringan",
        tanggal: today,
        vendor_pt: row.vendor_pt || null,
        status_progres: "Baru",
        service_type: "Maintenance",
        keterangan: row.catatan || null,
      });
      recordRef = `maintenance:${created[0]?.id || ""}`;
    }
  }
  await patchSupabase(`pengajuan?id=eq.${escapeValue(row.id)}`, {
    status: needsVendor ? "Diteruskan Vendor" : "Selesai Supervisor",
    tujuan_role: needsVendor ? "Vendor" : "Teknisi",
  });
  if (needsVendor) await queueVendorLetterFromPengajuan(row, recordRef, message.from?.username || message.from?.id).catch(() => {});
  clearPending(message, state);
  await sendMessage(chatId, needsVendor ? "Pengajuan disetujui Supervisor, diteruskan ke Vendor, dan surat masuk antrean email." : "Pengajuan disetujui Supervisor.", threadId);
}

async function startAddPengajuan(chatId, message, state, threadId = null) {
  setPending(message, state, { action: "add_pengajuan" });
  const tools = await getAllTools();
  await sendMessage(
    chatId,
    [
      formatTemplate(
        "Buat pengajuan.",
        ["Nama alat", "Jenis", "Kategori", "Vendor/PT", "Catatan"],
        "Suction Pump | Maintenance | Corrective Berat | PT Maintenance Medika | Selang hilang"
      ),
      "",
      "Contoh kalibrasi:",
      "Infusion Pump | Kalibrasi | - | PT Kalibrasi Medika | Jadwal kalibrasi ulang",
      "",
      "Alat tersedia:",
      ...tools.map((item, index) => `${index + 1}. ${item.nama_alat}`),
    ].join("\n"),
    threadId
  );
}

async function finishAddPengajuan(chatId, message, state, user, text, threadId = null) {
  const [alatText, jenisRaw = "Maintenance", kategoriRaw = "Preventive", vendor_pt, catatan] = splitParts(text);
  const tools = await getAllTools();
  const alat = alatFromPendingReply(tools, alatText);
  if (!alat) {
    await sendMessage(chatId, "Alat tidak ditemukan.", threadId);
    return;
  }
  const jenis_pengajuan = normalize(jenisRaw).includes("kalibrasi") ? "Kalibrasi" : "Maintenance";
  const kategori = jenis_pengajuan === "Kalibrasi" ? null : kategoriRaw || "Preventive";
  const needsVendor = jenis_pengajuan === "Kalibrasi" || kategori === "Corrective Berat" || kategori === "Emergency (Breakdown)";
  if (needsVendor && !vendor_pt) {
    await sendMessage(chatId, "Pengajuan ini butuh nama Vendor/PT.", threadId);
    return;
  }
  await postSupabase("pengajuan", {
    jenis_pengajuan,
    kategori,
    vendor_pt: needsVendor ? vendor_pt : null,
    alat_id: alat.id,
    ruangan_id: alat.ruangan_id || null,
    catatan: catatan || null,
    dibuat_oleh: user.username || user.nama || null,
    dibuat_oleh_role: user.role || null,
    dibuat_oleh_hp: user.no_hp || null,
    tujuan_role: "Kepala Ruangan",
    status: "Menunggu Kepala Ruangan",
  });
  clearPending(message, state);
  await sendMessage(chatId, `Pengajuan ${jenis_pengajuan} untuk ${alat.nama_alat} berhasil dikirim ke Kepala Ruangan.`, threadId);
}

async function replyVendorTasks(chatId, user, threadId = null) {
  if (!isVendorMaintenance(user) && !isVendorKalibrasi(user)) {
    await sendMessage(chatId, "Akun vendor ini belum punya vendor_layanan. Isi dengan Maintenance atau Kalibrasi di data petugas.", threadId);
    return;
  }
  const rows = [];
  if (isVendorMaintenance(user)) {
    rows.push(...(await rowsForRecordAccess(user, "maintenance")).map((row) => ({ ...row, type: "maintenance" })));
  }
  if (isVendorKalibrasi(user)) {
    rows.push(...(await rowsForRecordAccess(user, "kalibrasi")).map((row) => ({ ...row, type: "kalibrasi" })));
  }
  await sendMessage(
    chatId,
    rows.length
      ? ["Tugas vendor:", "", ...rows.slice(0, 20).map((row, index) => `${index + 1}. ${row.type} | ${row.alat_kesehatan?.nama_alat || "-"} | ${row.status_progres || "Baru"}`)].join("\n")
      : "Belum ada tugas vendor untuk akun ini.",
    threadId
  );
}

async function replyVendorLetters(chatId, user, threadId = null) {
  if (user?.role !== "Vendor") {
    await sendMessage(chatId, "Surat RS hanya tersedia untuk role Vendor.", threadId);
    return;
  }
  const name = normalize(vendorName(user));
  if (!name) {
    await sendMessage(chatId, "Akun vendor ini belum punya nama PT/vendor, jadi surat belum bisa difilter.", threadId);
    return;
  }
  const rows = await getSupabase("surat_vendor?select=nomor_surat,vendor_pt,jenis_layanan,subject,email_status,created_at&order=created_at.desc&limit=100").catch(() => []);
  const visible = rows.filter((row) => {
    const vendor = normalize(row.vendor_pt || "");
    return vendor && (vendor.includes(name) || name.includes(vendor));
  });
  await sendMessage(
    chatId,
    visible.length
      ? [
          "Surat pengajuan dari RS:",
          "",
          ...visible.slice(0, 20).map((row, index) => [
            `${index + 1}. ${row.nomor_surat || "-"}`,
            `Layanan: ${row.jenis_layanan || "-"}`,
            `Vendor: ${row.vendor_pt || "-"}`,
            `Status email: ${row.email_status || "-"}`,
            `Tanggal: ${String(row.created_at || "-").slice(0, 10)}`,
          ].join("\n")),
        ].join("\n\n")
      : "Belum ada surat RS untuk vendor ini.",
    threadId
  );
}

async function replyVendorFeedbackGuide(chatId, user, threadId = null) {
  const lines = [
    "Feedback Vendor",
    "",
    "Untuk mengirim hasil pekerjaan, gunakan dashboard website role Vendor bagian Feedback Vendor.",
    "Lewat bot, kamu bisa cek tugas dan update progres awal:",
    "/tugas_saya",
    isVendorMaintenance(user) ? "/edit_maintenance" : "",
    isVendorKalibrasi(user) ? "/edit_kalibrasi" : "",
    "",
    "Setelah vendor selesai, teknisi akan cek dan approve hasil pekerjaan dari dashboard Feedback Vendor.",
  ].filter(Boolean);
  await sendMessage(chatId, lines.join("\n"), threadId);
}

async function replyRoleSmartFallback(chatId, user, text, message, state, threadId = null) {
  const value = normalize(text);

  if (isPlainNumber(text)) {
    await sendMessage(
      chatId,
      [
        `Angka ${text} belum punya konteks.`,
        "Kalau ingin pilih data berdasarkan nomor, jalankan dulu daftar yang sesuai.",
        "",
        "Contoh:",
        "/daftar_alat lalu balas nomor alat",
        "/status_pengajuan lalu balas nomor pengajuan jika diminta",
      ].join("\n"),
      threadId
    );
    return;
  }

  const tools = await getToolsForUser(user);
  const matches = tools.length ? findAlatMatches(tools, text) : [];
  if (matches.length > 1) {
    await sendAlatSearchPage(chatId, message, state, user, matches, text, "detail", 0, threadId);
    return;
  }
  if (matches.length === 1) {
    await replyToolDetail(chatId, user, matches[0], threadId);
    return;
  }

  if (value.includes("surat")) {
    if (user.role === "Vendor") await replyVendorLetters(chatId, user, threadId);
    else await sendMessage(chatId, "Surat RS untuk vendor bisa dicek oleh role Vendor dengan /surat_rs.", threadId);
    return;
  }

  if (value.includes("feedback")) {
    if (user.role === "Vendor") await replyVendorFeedbackGuide(chatId, user, threadId);
    else await sendMessage(chatId, "Feedback vendor dicek di dashboard Feedback Vendor. Vendor mengirim feedback, teknisi melakukan approval.", threadId);
    return;
  }

  if (value.includes("pengajuan") || value.includes("approve") || value.includes("setujui") || value.includes("tolak")) {
    if (user.role === "Kepala Ruangan") {
      await startApprovePengajuan(chatId, message, state, user, value.includes("tolak") ? "reject" : "kepala", threadId);
      return;
    }
    if (user.role === "Supervisor" || user.role === "Kepala Supervisor") {
      if (value.includes("approve") || value.includes("setujui") || value.includes("tolak")) {
        await startApprovePengajuan(chatId, message, state, user, value.includes("tolak") ? "reject" : "supervisor", threadId);
      } else {
        await replyPengajuanList(chatId, user, threadId);
      }
      return;
    }
    if (user.role === "Admin" || user.role === "Teknisi") {
      await replyPengajuanList(chatId, user, threadId);
      return;
    }
  }

  if (value.includes("rusak")) {
    const rows = tools.filter((item) => item.kondisi === "Rusak");
    await sendMessage(
      chatId,
      rows.length ? ["Alat kondisi Rusak:", "", ...rows.slice(0, 30).map(alatLine)].join("\n") : "Tidak ada alat kondisi Rusak untuk akses role kamu.",
      threadId
    );
    return;
  }

  if (value.includes("maintenance") || value.includes("maintaince") || value.includes("perbaikan")) {
    await replyMaintenanceList(chatId, user, threadId);
    return;
  }

  if (value.includes("kalibrasi")) {
    await replyKalibrasiList(chatId, user, threadId);
    return;
  }

  if (value.includes("qr") || value.includes("barcode")) {
    if (canAccessRole(user, ["Admin", "Teknisi", "Kepala Ruangan"])) {
      await askForAlatSearch(chatId, message, state, "qr", threadId);
    } else {
      await sendMessage(chatId, `QR tidak tersedia untuk role ${user.role}.`, threadId);
    }
    return;
  }

  await sendMessage(
    chatId,
    [
      "Aku paham kamu sedang chat bebas, tapi belum cukup jelas mau menjalankan aksi apa.",
      roleOperationalHint(user),
      "",
      "Coba tulis dengan kata kunci seperti:",
      "daftar alat, ruangan ICU, maintenance, kalibrasi, pengajuan, surat RS, feedback vendor, QR Ventilator.",
      "",
      "Ketik /menu untuk melihat perintah role kamu.",
    ].join("\n"),
    threadId
  );
}

async function replyTechnicianSmartFallback(chatId, user, text, message, state, threadId = null) {
  const value = normalize(text);
  if (isPlainNumber(text)) {
    await sendMessage(
      chatId,
      [
        `Angka ${text} belum punya konteks.`,
        "Kalau mau memilih alat berdasarkan nomor, ketik /cari_alat lalu masukkan nama alat.",
        "",
        "Contoh:",
        "/cari_alat",
        "Patient Monitor",
      ].join("\n"),
      threadId
    );
    return;
  }

  const tools = await getToolsForUser(user);
  const matches = findAlatMatches(tools, text);
  if (matches.length > 1) {
    await sendAlatSearchPage(chatId, message, state, user, matches, text, "detail", 0, threadId);
    return;
  }
  if (matches.length === 1) {
    await replyToolDetail(chatId, user, matches[0], threadId);
    return;
  }

  if (value.includes("rusak")) {
    const rows = tools.filter((item) => item.kondisi === "Rusak");
    await sendMessage(
      chatId,
      rows.length
        ? ["Alat kondisi Rusak:", "", ...rows.map(alatLine), "", "Balas nama alat untuk melihat detail."].join("\n")
        : "Tidak ada alat dengan kondisi Rusak.",
      threadId
    );
    return;
  }

  if (value.includes("maintenance") || value.includes("maintaince") || value.includes("perbaikan")) {
    if (value.includes("alat") || value.includes("kondisi")) {
      const rows = tools.filter((item) => item.kondisi === "Maintenance");
      await sendMessage(
        chatId,
        rows.length
          ? ["Alat kondisi Maintenance:", "", ...rows.map(alatLine), "", "Untuk riwayat, ketik /maintenance."].join("\n")
          : "Tidak ada alat dengan kondisi Maintenance.",
        threadId
      );
      return;
    }
    await replyMaintenanceList(chatId, user, threadId);
    return;
  }

  if (value.includes("kalibrasi")) {
    await replyKalibrasiList(chatId, user, threadId);
    return;
  }

  if (value.includes("qr") || value.includes("barcode")) {
    await sendMessage(
      chatId,
      [
        "Untuk QR alat, ketik:",
        "/download_qr",
        "",
        "Atau langsung:",
        "qr Ventilator",
      ].join("\n"),
      threadId
    );
    return;
  }

  await sendMessage(
    chatId,
    [
      "Aku belum menangkap maksudnya.",
      "",
      "Untuk Teknisi, contoh yang bisa dipakai:",
      "/cari_alat - cari seluruh unit alat yang cocok",
      "rusak - tampilkan alat rusak",
      "maintenance - tampilkan riwayat maintenance",
      "kalibrasi - tampilkan riwayat kalibrasi",
      "ruangan ICU - tampilkan alat di ICU",
      "/download_qr - cari lalu pilih QR alat",
      "/menu - lihat semua perintah",
    ].join("\n"),
    threadId
  );
}

async function startUploadPhoto(chatId, message, state, kind, threadId = null) {
  setPending(message, state, { action: `upload_${kind}_pick` });
  await sendMessage(chatId, `Upload foto ${kind}. Kirim nama alat dulu.`, threadId);
}

async function handleUploadPhoto(chatId, message, state, user, text, threadId = null) {
  const pending = state.pending[pendingKey(message)];
  if (pending.action.endsWith("_pick")) {
    const tools = await getToolsForUser(user);
    const alat = alatFromPendingReply(tools, text);
    if (!alat) {
      await sendMessage(chatId, "Alat tidak ditemukan atau tidak tersedia untuk role kamu.", threadId);
      return;
    }
    setPending(message, state, { action: pending.action.replace("_pick", "_photo"), alatId: alat.id, alatName: alat.nama_alat });
    await sendMessage(chatId, `Sekarang kirim foto untuk ${alat.nama_alat}.`, threadId);
    return;
  }
  const photo = message.photo?.[message.photo.length - 1];
  if (!photo) {
    await sendMessage(chatId, "Kirim sebagai foto Telegram, bukan teks.", threadId);
    return;
  }
  const kind = pending.action.replace("upload_", "").replace("_photo", "");
  const fileId = photo.file_id;
  if (kind === "alat") {
    await patchSupabase(`alat_kesehatan?id=eq.${escapeValue(pending.alatId)}`, { foto_alat: fileId });
  } else if (kind.includes("kalibrasi")) {
    const rows = await getSupabase(`kalibrasi?select=*&alat_id=eq.${escapeValue(pending.alatId)}&order=tanggal_kalibrasi.desc&limit=1`);
    const column = kind.includes("sertifikat") ? "foto_sertifikat" : "foto_nilai_ukur";
    if (rows[0]) await patchSupabase(`kalibrasi?id=eq.${escapeValue(rows[0].id)}`, { [column]: fileId });
  } else {
    const rows = await getSupabase(`maintenance?select=*&alat_id=eq.${escapeValue(pending.alatId)}&order=tanggal.desc&limit=1`);
    const column = kind.includes("sesudah") ? "foto_sesudah" : kind.includes("sparepart") ? "foto_sparepart" : kind.includes("invoice") ? "invoice" : "foto_sebelum";
    if (rows[0]) await patchSupabase(`maintenance?id=eq.${escapeValue(rows[0].id)}`, { [column]: fileId });
  }
  clearPending(message, state);
  await sendMessage(chatId, `Foto ${kind} untuk ${pending.alatName} berhasil disimpan.`, threadId);
}

async function createNotification(chatId, user, room, text, threadId = null) {
  const alatRows = await getRoomTools(room.id);
  const alat = findAlat(alatRows, text);
  if (!alat) {
    await sendMessage(
      chatId,
      `Saya belum menemukan alat yang cocok di ruangan ${room.nama_ruangan}.\n\nAlat tersedia:\n${alatRows.map(alatLine).join("\n")}`,
      threadId
    );
    return;
  }

  const inferred = inferCategory(text);
  await postSupabase("notifikasi_teknisi", {
    jenis_laporan: inferred.jenis,
    kategori: inferred.kategori,
    alat_id: alat.id,
    ruangan_id: room.id,
    catatan: text,
    dibuat_oleh: user.username || user.nama || String(user.telegram_id || ""),
    dibuat_oleh_role: user.role,
    tujuan_role: "Teknisi",
    status: "Baru",
    status_pengerjaan: "Belum dikerjakan",
  });

  await sendMessage(
    chatId,
    [
      "Notifikasi berhasil dikirim ke Teknisi.",
      `Ruangan: ${room.nama_ruangan}`,
      `Alat: ${alat.nama_alat} (${alat.merk || "-"} ${alat.tipe || ""})`,
      `Jenis: ${inferred.jenis}${inferred.kategori ? ` / ${inferred.kategori}` : ""}`,
      "Status: Belum dikerjakan",
    ].join("\n"),
    threadId
  );
}

async function startKrReport(chatId, message, state, room, threadId = null) {
  const alatRows = await getRoomTools(room.id);
  setPending(message, state, { action: "add_kr_report", step: "alat", roomId: room.id });
  await sendMessage(
    chatId,
    formatTemplate(
      "Buat laporan KR ke Teknisi.",
      ["Nama alat", "Jenis", "Kategori", "Catatan"],
      "Suction Pump | Maintenance | Corrective Ringan | Selang hilang",
      [
        "",
        "Contoh kalibrasi:",
        "Infusion Pump | Kalibrasi | - | Perlu kalibrasi ulang",
        "",
        `Alat di ruangan ${room.nama_ruangan}:`,
        ...alatRows.map((item, index) => `${index + 1}. ${item.nama_alat} | ${item.merk || "-"} ${item.tipe || ""}`),
      ]
    ),
    threadId
  );
}

async function finishKrReport(chatId, message, state, user, text, threadId = null) {
  const pending = state.pending[pendingKey(message)];
  if (normalize(text).includes("buat laporan kr") || normalize(text).includes("buat laporan alat")) {
    const roomForRestart = await findRoom(user);
    await startKrReport(chatId, message, state, roomForRestart, threadId);
    return;
  }

  const room = pending.roomId ? { id: pending.roomId } : await findRoom(user);
  const alatRows = await getRoomTools(room.id);

  if (pending.step === "alat") {
    const alat = alatFromPendingReply(alatRows, text);
    if (!alat) {
      await sendMessage(chatId, "Alat tidak ditemukan di ruangan kamu. Balas nama alat atau nomor alat dari daftar.", threadId);
      return;
    }
    setPending(message, state, {
      action: "add_kr_report",
      step: "kategori",
      roomId: room.id,
      alatId: alat.id,
      alatName: alat.nama_alat,
    });
    await sendMessage(
      chatId,
      [
        `Alat dipilih: ${alat.nama_alat}`,
        "",
        "Pilih jenis/kategori laporan:",
        "preventive",
        "corrective ringan",
        "corrective berat",
        "breakdown",
        "kalibrasi",
      ].join("\n"),
      threadId
    );
    return;
  }

  if (pending.step === "kategori") {
    const value = normalize(text);
    let jenis = "Maintenance";
    let kategori = "Corrective Ringan";
    if (value.includes("kalibrasi")) {
      jenis = "Kalibrasi";
      kategori = null;
    } else if (value.includes("preventive")) {
      kategori = "Preventive";
    } else if (value.includes("berat")) {
      kategori = "Corrective Berat";
    } else if (value.includes("breakdown") || value.includes("emergency")) {
      kategori = "Emergency (Breakdown)";
    } else if (value.includes("ringan") || value.includes("corrective")) {
      kategori = "Corrective Ringan";
    }

    setPending(message, state, {
      action: "add_kr_report",
      step: "catatan",
      roomId: room.id,
      alatId: pending.alatId,
      alatName: pending.alatName,
      jenis,
      kategori,
    });
    await sendMessage(chatId, "Tulis catatan laporan. Contoh: selang hilang. Kalau tidak ada, ketik: -", threadId);
    return;
  }

  if (pending.step === "catatan") {
    const catatan = text === "-" ? null : text;
    await postSupabase("notifikasi_teknisi", {
      jenis_laporan: pending.jenis,
      kategori: pending.kategori,
      alat_id: pending.alatId,
      ruangan_id: room.id,
      catatan,
      dibuat_oleh: user.username || user.nama || String(user.telegram_id || ""),
      dibuat_oleh_role: user.role,
      tujuan_role: "Teknisi",
      status: "Baru",
      status_pengerjaan: "Belum dikerjakan",
    });
    clearPending(message, state);
    await sendMessage(
      chatId,
      [
        "Laporan KR berhasil dikirim ke Teknisi.",
        `Alat: ${pending.alatName}`,
        `Jenis: ${pending.jenis}${pending.kategori ? ` / ${pending.kategori}` : ""}`,
        `Catatan: ${catatan || "-"}`,
      ].join("\n"),
      threadId
    );
    return;
  }

  const [alatText, jenisRaw = "Maintenance", kategoriRaw = "Corrective Ringan", catatanRaw] = splitParts(text);
  const alat = alatFromPendingReply(alatRows, alatText);
  if (!alat) {
    await sendMessage(chatId, "Alat tidak ditemukan di ruangan kamu.", threadId);
    return;
  }
  const jenis = normalize(jenisRaw).includes("kalibrasi") ? "Kalibrasi" : "Maintenance";
  const kategori = jenis === "Kalibrasi" ? null : kategoriRaw || "Corrective Ringan";
  await postSupabase("notifikasi_teknisi", {
    jenis_laporan: jenis,
    kategori,
    alat_id: alat.id,
    ruangan_id: room.id,
    catatan: catatanRaw || text,
    dibuat_oleh: user.username || user.nama || String(user.telegram_id || ""),
    dibuat_oleh_role: user.role,
    tujuan_role: "Teknisi",
    status: "Baru",
    status_pengerjaan: "Belum dikerjakan",
  });
  clearPending(message, state);
  await sendMessage(
    chatId,
    [
      "Laporan KR berhasil dikirim ke Teknisi.",
      `Alat: ${alat.nama_alat}`,
      `Jenis: ${jenis}${kategori ? ` / ${kategori}` : ""}`,
      `Catatan: ${catatanRaw || "-"}`,
    ].join("\n"),
    threadId
  );
}

async function replyTechnicianNotifications(chatId, threadId = null) {
  const rows = await getSupabase(
    "notifikasi_teknisi?select=*,alat_kesehatan(nama_alat,merk,tipe),ruangan(nama_ruangan)&tujuan_role=eq.Teknisi&status_pengerjaan=eq.Belum%20dikerjakan&order=created_at.desc&limit=10"
  );

  if (!rows.length) {
    await sendMessage(chatId, "Belum ada notifikasi teknisi yang belum dikerjakan.", threadId);
    return;
  }

  const lines = ["Notifikasi teknisi belum dikerjakan:", ""];
  rows.forEach((row, index) => {
    lines.push(`${index + 1}. ${row.alat_kesehatan?.nama_alat || "-"} | ${row.ruangan?.nama_ruangan || "-"} | ${row.catatan || "-"}`);
  });
  await sendMessage(chatId, lines.join("\n"), threadId);
}

async function replyTodaySchedule(chatId, user, threadId = null) {
  const today = new Date().toISOString().slice(0, 10);
  const [tools, maintenance, kalibrasi, notifikasi, pengajuan] = await Promise.all([
    getAllTools(),
    getSupabase(`maintenance?select=*,alat_kesehatan(nama_alat,merk,tipe)&tanggal=eq.${today}&order=tanggal.desc`),
    getSupabase(`kalibrasi?select=*,alat_kesehatan(nama_alat,merk,tipe)&tanggal_kalibrasi=eq.${today}&order=tanggal_kalibrasi.desc`),
    getSupabase("notifikasi_teknisi?select=*,alat_kesehatan(nama_alat,merk,tipe),ruangan(nama_ruangan)&tujuan_role=eq.Teknisi&status_pengerjaan=eq.Belum%20dikerjakan&order=created_at.desc&limit=10"),
    getPengajuanRows(),
  ]);
  const dueMaintenance = tools.filter((item) => item.maintenance_berikutnya === today);
  const dueKalibrasi = tools.filter((item) => item.kalibrasi_berikutnya === today);
  const pendingPengajuan = pengajuan.filter((item) => item.status && !["Ditolak", "Diteruskan Vendor", "Selesai Supervisor"].includes(item.status));
  const lines = [
    `Jadwal dan tugas hari ini (${today}):`,
    "",
    `Notifikasi teknisi belum selesai: ${notifikasi.length}`,
    ...notifikasi.slice(0, 5).map((item, index) => `${index + 1}. ${item.alat_kesehatan?.nama_alat || "-"} | ${item.ruangan?.nama_ruangan || "-"} | ${item.catatan || "-"}`),
    "",
    `Maintenance terjadwal hari ini: ${dueMaintenance.length}`,
    ...dueMaintenance.slice(0, 5).map((item, index) => `${index + 1}. ${item.nama_alat} | ${item.merk || "-"} ${item.tipe || ""}`),
    "",
    `Kalibrasi terjadwal hari ini: ${dueKalibrasi.length}`,
    ...dueKalibrasi.slice(0, 5).map((item, index) => `${index + 1}. ${item.nama_alat} | ${item.merk || "-"} ${item.tipe || ""}`),
    "",
    `Riwayat maintenance yang dibuat hari ini: ${maintenance.length}`,
    `Riwayat kalibrasi yang dibuat hari ini: ${kalibrasi.length}`,
    `Pengajuan aktif: ${pendingPengajuan.length}`,
  ];
  await sendMessage(chatId, lines.join("\n"), threadId);
}

async function handleMessage(message, state) {
  const chatId = message.chat.id;
  const rawText = String(message.text || message.caption || "").trim();
  const text = commandText(rawText);
  const context = topicContext(message, state);
  const threadId = context.threadId;

  const user = await findUser(message.from, message);
  if (!user) {
    await sendMessage(
      chatId,
      `Akun Telegram ini belum terdaftar.\nTelegram ID kamu: ${message.from.id}\nUsername: ${message.from.username ? `@${message.from.username}` : "-"}`,
      threadId
    );
    return;
  }

  const normalized = normalize(text);
  const pending = state.pending[pendingKey(message)];

  if (!text && message.voice) {
    const result = await transcribeTelegramVoice(message);
    if (!result.ok) {
      await sendMessage(chatId, `${result.reason}\n\nSementara ini kirim teks biasa, contoh: notifikasi`, threadId);
      return;
    }
    if (!result.text) {
      await sendMessage(chatId, "Voice berhasil diproses, tapi teksnya kosong. Coba ulangi lebih jelas.", threadId);
      return;
    }
    await sendMessage(chatId, `Voice terbaca:\n${result.text}`, threadId);
    await handleMessage({ ...message, text: result.text, voice: undefined }, state);
    return;
  }

  if (!text && !(message.photo && pending?.action?.startsWith("upload_"))) return;

  if (text === "/start" || text === "/new" || normalized === "batal" || normalized === "cancel") {
    clearPending(message, state);
    await sendMessage(chatId, text === "/start" || text === "/new" ? helpText(user) : "Alur dibatalkan. Ketik menu untuk melihat perintah.", threadId);
    return;
  }

  if (normalized === "menu" || normalized === "bantuan") {
    clearPending(message, state);
    const topicLine = context.module ? `\n\nTopic aktif: Dashboard ${context.label}` : "";
    await sendMessage(chatId, `${helpText(user)}${topicLine}`, threadId);
    return;
  }

  if (pending && normalized.includes("alat") && (normalized.includes("berapa") || normalized.includes("jumlah") || normalized.includes("total") || normalized.includes("bukannya"))) {
    await replyInventoryCount(chatId, user, threadId);
    await sendMessage(chatId, "Alur sebelumnya masih aktif. Lanjut isi formatnya, atau ketik batal untuk membatalkan.", threadId);
    return;
  }

  if (pending && (normalized === "daftar alat" || normalized.includes("semua alat") || normalized.includes("list alat"))) {
    await replyAllTools(chatId, user, threadId, message, state);
    await sendMessage(chatId, "Alur sebelumnya masih aktif. Lanjut isi formatnya, atau ketik batal untuk membatalkan.", threadId);
    return;
  }

  if (pending?.action === "add_tool") {
    await finishAddTool(chatId, message, state, user, text, threadId);
    return;
  }

  if (pending?.action?.startsWith("edit_tool_")) {
    await handleToolEdit(chatId, message, state, user, text, threadId);
    return;
  }

  if (pending?.action === "add_maintenance") {
    await finishAddMaintenance(chatId, message, state, user, text, threadId);
    return;
  }

  if (pending?.action === "add_kalibrasi") {
    await finishAddKalibrasi(chatId, message, state, text, threadId);
    return;
  }

  if (pending?.action === "add_pengajuan") {
    await finishAddPengajuan(chatId, message, state, user, text, threadId);
    return;
  }

  if (pending?.action === "add_kr_report") {
    await finishKrReport(chatId, message, state, user, text, threadId);
    return;
  }

  if (/^(edit|delete)_(maintenance|kalibrasi)_/.test(pending?.action || "")) {
    await handleRecordEditDelete(chatId, message, state, user, text, threadId);
    return;
  }

  if (pending?.action?.startsWith("approve_pengajuan_")) {
    await finishApprovePengajuan(chatId, message, state, text, threadId);
    return;
  }

  if (pending?.action?.startsWith("upload_")) {
    await handleUploadPhoto(chatId, message, state, user, text, threadId);
    return;
  }

  if (pending?.action === "select_tool_from_list" && /^(edit|tambah|delete|hapus|ruangan|maintenance|maintaince|kalibrasi|pengajuan|notifikasi|ringkasan)\b/.test(normalized)) {
    clearPending(message, state);
  } else
  if (pending?.action === "select_tool_from_list") {
    const tools = await getToolsForUser(user);
    const visibleTools = Array.isArray(pending.alatIds) && pending.alatIds.length
      ? pending.alatIds.map((id) => tools.find((item) => item.id === id)).filter(Boolean)
      : tools;
    const alat = alatFromPendingReply(visibleTools, text);
    if (!alat) {
      if (isPlainNumber(text)) {
        await sendMessage(
          chatId,
          [
            `Nomor ${text} tidak ada di daftar alat.`,
            `Pilih nomor 1 sampai ${visibleTools.length}, atau ketik nama alat.`,
            "",
            "Contoh: 60",
            "Ketik batal untuk keluar dari mode pilih alat.",
          ].join("\n"),
          threadId
        );
        return;
      }
      await sendMessage(
        chatId,
        [
          "Saya belum menemukan alat itu dari daftar terakhir.",
          "Balas nomor alat, nama alat, atau ketik batal.",
          "",
          "Contoh: 1 atau Ventilator",
        ].join("\n"),
        threadId
      );
      return;
    }
    await replyToolDetail(chatId, user, alat, threadId);
    return;
  }

  if (pending?.action === "alat_search_query") {
    const tools = await getToolsForUser(user);
    const matches = findAlatMatches(tools, text);
    if (!matches.length) {
      await sendMessage(
        chatId,
        [
          "Alat tidak ditemukan.",
          "Coba gunakan nama yang lebih singkat, merk, tipe, barcode, atau serial number.",
          "",
          "Contoh: <code>Patient Monitor</code> atau <code>Philips</code>",
          "Ketik <code>batal</code> untuk menutup pencarian.",
        ].join("\n"),
        threadId
      );
      return;
    }
    await sendAlatSearchPage(chatId, message, state, user, matches, text, pending.mode || "detail", 0, threadId);
    return;
  }

  if (pending?.action === "alat_search_results") {
    const tools = await getToolsForUser(user);
    const matches = (pending.alatIds || []).map((id) => tools.find((item) => item.id === id)).filter(Boolean);
    if (!matches.length) {
      clearPending(message, state);
      await sendMessage(chatId, "Hasil pencarian sudah tidak tersedia. Ketik /cari_alat untuk mencari ulang.", threadId);
      return;
    }

    if (normalized === "lanjut" || normalized === "next") {
      await sendAlatSearchPage(chatId, message, state, user, matches, pending.query, pending.mode, (pending.page || 0) + 1, threadId);
      return;
    }
    if (normalized === "kembali" || normalized === "prev" || normalized === "sebelumnya") {
      await sendAlatSearchPage(chatId, message, state, user, matches, pending.query, pending.mode, (pending.page || 0) - 1, threadId);
      return;
    }

    if (!isPlainNumber(text)) {
      await sendMessage(
        chatId,
        "Balas nomor alat, ketik <code>lanjut</code>, <code>kembali</code>, atau <code>batal</code>.",
        threadId
      );
      return;
    }

    const selected = matches[Number.parseInt(text, 10) - 1];
    if (!selected) {
      await sendMessage(chatId, `Nomor ${escapeTelegramHtml(text)} tidak ada dalam hasil pencarian ini.`, threadId);
      return;
    }
    clearPending(message, state);
    if (pending.mode === "qr") {
      await replyQrForAlat(chatId, selected, threadId);
    } else {
      await replyToolDetail(chatId, user, selected, threadId);
    }
    return;
  }

  if (pending?.action === "search_alat" || pending?.action === "qr_alat") {
    const room = user.role === "Kepala Ruangan" ? await findRoom(user) : null;
    if (user.role === "Kepala Ruangan" && !room) {
      delete state.pending[pendingKey(message)];
      saveState(state);
      await sendMessage(chatId, "Akun Kepala Ruangan ini belum punya ruangan_id.", threadId);
      return;
    }
    const alatRows = user.role === "Kepala Ruangan" ? await getRoomTools(room.id) : await getToolsForUser(user);
    const alat = alatFromPendingReply(alatRows, text);
    delete state.pending[pendingKey(message)];
    saveState(state);

    if (!alat) {
      await sendMessage(chatId, "Alat tidak ditemukan. Balas nama alat atau nomor alat dari daftar.", threadId);
      return;
    }

    if (pending.action === "qr_alat") {
      if (!canAccessRole(user, ["Admin", "Teknisi", "Kepala Ruangan"])) {
        await sendMessage(chatId, `Perintah QR tidak tersedia untuk role ${user.role}.`, threadId);
        return;
      }
      await replyQr(chatId, user, `qr ${alat.nama_alat}`, threadId);
      return;
    }

    const roomRows = alat.ruangan_id
      ? await getSupabase(`ruangan?select=*&id=eq.${escapeValue(alat.ruangan_id)}&limit=1`)
      : [];
    await replyAlatSearch(chatId, user, roomRows[0] || { id: alat.ruangan_id, nama_ruangan: "-" }, alat.nama_alat, threadId);
    return;
  }

  if (normalized === "setup topik" || normalized === "daftar topik") {
    await sendMessage(chatId, topicSetupHelp(), threadId);
    return;
  }

  if (normalized.startsWith("set topik") || normalized.startsWith("atur topik")) {
    const module = detectTopicModule(text);
    if (!message.message_thread_id) {
      await sendMessage(chatId, "Perintah ini dipakai di dalam topic Telegram, bukan di chat utama.", threadId);
      return;
    }
    if (!module) {
      await sendMessage(chatId, topicSetupHelp(), threadId);
      return;
    }
    state.topics[topicKey(message)] = {
      module,
      label: TOPIC_LABELS[module] || module,
      chatTitle: message.chat.title || "",
      threadId: message.message_thread_id,
      updatedAt: new Date().toISOString(),
      updatedBy: user.username || user.nama || String(user.telegram_id || ""),
    };
    saveState(state);
    await sendMessage(chatId, `Topic ini sudah diset sebagai Dashboard ${TOPIC_LABELS[module] || module}.`, threadId);
    return;
  }

  if (text === "/help") {
    const topicLine = context.module ? `\n\nTopic aktif: Dashboard ${context.label}` : "";
    await sendMessage(chatId, `${helpText(user)}${topicLine}`, threadId);
    return;
  }

  if (normalized.startsWith("qr ")) {
    if (!canAccessRole(user, ["Admin", "Teknisi", "Kepala Ruangan"])) {
      await sendMessage(chatId, `Perintah QR tidak tersedia untuk role ${user.role}.`, threadId);
      return;
    }
    const tools = await getToolsForUser(user);
    const query = text.replace(/^qr\s+/i, "");
    const matches = findAlatMatches(tools, query);
    if (!matches.length) {
      await sendMessage(chatId, "Alat tidak ditemukan. Coba gunakan nama, merk, tipe, barcode, atau serial number.", threadId);
    } else if (matches.length === 1) {
      await replyQrForAlat(chatId, matches[0], threadId);
    } else {
      await sendAlatSearchPage(chatId, message, state, user, matches, query, "qr", 0, threadId);
    }
    return;
  }

  if (normalized.includes("download qr") || normalized.includes("qr code alat") || normalized === "qr alat") {
    if (canAccessRole(user, ["Admin", "Teknisi", "Kepala Ruangan"])) {
      if (user.role === "Kepala Ruangan" && !(await findRoom(user))) {
        await sendMessage(chatId, "Akun Kepala Ruangan ini belum punya ruangan_id.", threadId);
        return;
      }
      await askForAlatSearch(chatId, message, state, "qr", threadId);
      return;
    }
  }

  if (normalized === "cari alat" && canAccessRole(user, ["Admin", "Teknisi", "Kepala Ruangan", "Kepala Supervisor", "Supervisor"])) {
    if (user.role === "Kepala Ruangan" && !(await findRoom(user))) {
      await sendMessage(chatId, "Akun Kepala Ruangan ini belum punya ruangan_id.", threadId);
      return;
    }
    await askForAlatSearch(chatId, message, state, "detail", threadId);
    return;
  }

  if (normalized.includes("riwayat") && normalized.includes("hari ini") && (normalized.includes("maintenance") || normalized.includes("kalibrasi"))) {
    if (!canAccessRole(user, ["Admin", "Teknisi", "Kepala Supervisor", "Supervisor"])) {
      await sendMessage(chatId, `Perintah riwayat hari ini tidak tersedia untuk role ${user.role}.`, threadId);
      return;
    }
    await replyTodayHistory(chatId, threadId);
    return;
  }

  if (normalized === "daftar ruangan" || normalized.includes("list ruangan") || normalized.includes("semua ruangan")) {
    await replyRoomList(chatId, user, threadId);
    return;
  }

  if (normalized.includes("notifikasi") && (normalized.includes("ada") || normalized.includes("hari ini") || normalized.includes("apa"))) {
    if (user.role === "Vendor") {
      await replyVendorTasks(chatId, user, threadId);
      return;
    }
    if (!canAccessRole(user, ["Admin", "Teknisi", "Kepala Supervisor", "Supervisor"])) {
      await sendMessage(chatId, `Perintah notifikasi umum tidak tersedia untuk role ${user.role}.`, threadId);
      return;
    }
    await replyTechnicianNotifications(chatId, threadId);
    return;
  }

  if ((normalized.includes("jadwal") || normalized.includes("tugas")) && (normalized.includes("hari ini") || normalized.includes("apa"))) {
    if (user.role === "Vendor") {
      await replyVendorTasks(chatId, user, threadId);
      return;
    }
    if (!canAccessRole(user, ["Admin", "Teknisi", "Kepala Supervisor", "Supervisor"])) {
      await sendMessage(chatId, `Perintah jadwal umum tidak tersedia untuk role ${user.role}.`, threadId);
      return;
    }
    await replyTodaySchedule(chatId, user, threadId);
    return;
  }

  if (normalized.includes("berapa alat") || normalized.includes("jumlah alat") || normalized.includes("total alat")) {
    const hasSpecificQuery = normalize(text)
      .replace("ada berapa alat", "")
      .replace("berapa alat", "")
      .replace("jumlah alat", "")
      .replace("total alat", "")
      .trim();
    if (hasSpecificQuery) {
      await replySpecificToolCount(chatId, user, text, threadId);
    } else {
      await replyInventoryCount(chatId, user, threadId);
    }
    return;
  }

  if (normalized.includes("ringkasan") || context.module === "overview") {
    await replyInventoryCount(chatId, user, threadId);
    return;
  }

  if (normalized.startsWith("ruangan ") || normalized.startsWith("alat ruangan ") || normalized.includes("alat di ruangan")) {
    await replyRoomInventoryByTextForUser(chatId, user, text, threadId);
    return;
  }

  if (canAccessRole(user, ["Admin", "Teknisi", "Kepala Supervisor", "Supervisor"])) {
    const handledRoomName = await replyRoomInventoryIfRoomName(chatId, text, threadId);
    if (handledRoomName) return;
  }

  if (normalized.includes("ringkasan")) {
    await replySummary(chatId, threadId);
    return;
  }

  if (user.role === "Admin" && (normalized.includes("daftar user") || context.module === "register_user")) {
    await replyUsers(chatId, threadId);
    return;
  }

  if ((user.role === "Kepala Supervisor" || user.role === "Supervisor") && (normalized.includes("status pengajuan") || normalized === "pengajuan" || normalized.includes("cek pengajuan"))) {
    await replyPengajuanList(chatId, user, threadId);
    return;
  }

  if ((user.role === "Kepala Supervisor" || user.role === "Supervisor") && (normalized.includes("histori alat") || normalized.includes("cek histori alat"))) {
    await replyToolHistory(chatId, user, text, threadId);
    return;
  }

  if ((user.role === "Kepala Supervisor" || user.role === "Supervisor") && (normalized.includes("maintenance") || normalized.includes("maintaince"))) {
    await replyMaintenanceList(chatId, user, threadId);
    return;
  }

  if ((user.role === "Kepala Supervisor" || user.role === "Supervisor") && normalized.includes("kalibrasi")) {
    await replyKalibrasiList(chatId, user, threadId);
    return;
  }

  if (user.role === "Teknisi" && (normalized.includes("notifikasi") || context.module === "notifikasi")) {
    await replyTechnicianNotifications(chatId, threadId);
    return;
  }

  if (["Admin", "Teknisi"].includes(user.role)) {
    if (normalized === "cari alat" || normalized === "daftar alat" || normalized.includes("cek daftar alat") || normalized.includes("list alat") || normalized.includes("semua alat")) {
      await askForAlatSearch(chatId, message, state, "detail", threadId);
      return;
    }
    if (normalized.includes("tambahkan alat") || normalized.includes("tambahkan alat baru") || normalized.includes("tambah alat")) {
      await startAddTool(chatId, message, state, threadId);
      return;
    }
    if (normalized.includes("perbaharui data alat") || normalized.includes("update data alat") || normalized.includes("edit alat")) {
      await startEditTool(chatId, message, state, threadId);
      return;
    }
    if (normalized.includes("cek histori alat") || normalized.includes("histori alat")) {
      await replyToolHistory(chatId, user, text, threadId);
      return;
    }
    if (normalized.includes("cek daftar maintenance") || normalized.includes("cek daftar maintaince")) {
      await replyMaintenanceList(chatId, user, threadId);
      return;
    }
    if (normalized.includes("tambahkan data maintenance") || normalized.includes("tambah maintenance") || normalized.includes("tambah maintaince")) {
      await startAddMaintenance(chatId, message, state, threadId);
      return;
    }
    if (normalized.includes("perbaharui data maintenance") || normalized.includes("edit maintenance") || normalized.includes("edit maintaince")) {
      await startEditOrDeleteRecord(chatId, message, state, user, "maintenance", "edit", threadId);
      return;
    }
    if (normalized.includes("delete maintenance") || normalized.includes("hapus maintenance") || normalized.includes("delete maintaince")) {
      await startEditOrDeleteRecord(chatId, message, state, user, "maintenance", "delete", threadId);
      return;
    }
    if (normalized.includes("cek histori maintenance") || normalized.includes("histori maintenance")) {
      await replyToolHistory(chatId, user, text, threadId);
      return;
    }
    if (normalized.includes("cek daftar kalibrasi")) {
      await replyKalibrasiList(chatId, user, threadId);
      return;
    }
    if (normalized.includes("tambahkan data kalibrasi") || normalized.includes("tambah kalibrasi")) {
      await startAddKalibrasi(chatId, message, state, threadId);
      return;
    }
    if (normalized.includes("perbaharui data kalibrasi") || normalized.includes("edit kalibrasi")) {
      await startEditOrDeleteRecord(chatId, message, state, user, "kalibrasi", "edit", threadId);
      return;
    }
    if (normalized.includes("delete data kalibrasi") || normalized.includes("delete kalibrasi") || normalized.includes("hapus kalibrasi")) {
      await startEditOrDeleteRecord(chatId, message, state, user, "kalibrasi", "delete", threadId);
      return;
    }
    if (normalized.includes("cek histori kalibrasi") || normalized.includes("histori kalibrasi")) {
      await replyToolHistory(chatId, user, text, threadId);
      return;
    }
    if (normalized.includes("cek status pengajuan") || normalized === "pengajuan" || normalized.includes("cek pengajuan")) {
      await replyPengajuanList(chatId, user, threadId);
      return;
    }
    if (normalized.includes("buat pengajuan") || normalized.includes("pengajuan maintenance") || normalized.includes("pengajuan kalibrasi")) {
      await startAddPengajuan(chatId, message, state, threadId);
      return;
    }
    if (normalized.includes("upload foto alat")) {
      await startUploadPhoto(chatId, message, state, "alat", threadId);
      return;
    }
    if (normalized.includes("upload foto sebelum")) {
      await startUploadPhoto(chatId, message, state, "sebelum", threadId);
      return;
    }
    if (normalized.includes("upload foto sesudah")) {
      await startUploadPhoto(chatId, message, state, "sesudah", threadId);
      return;
    }
    if (normalized.includes("upload foto sparepart")) {
      await startUploadPhoto(chatId, message, state, "sparepart", threadId);
      return;
    }
    if (normalized.includes("upload foto sebelum")) {
      await startUploadPhoto(chatId, message, state, "sebelum", threadId);
      return;
    }
    if (normalized.includes("upload foto sesudah")) {
      await startUploadPhoto(chatId, message, state, "sesudah", threadId);
      return;
    }
    if (normalized.includes("upload invoice")) {
      await startUploadPhoto(chatId, message, state, "invoice", threadId);
      return;
    }
    if (normalized.includes("upload foto nilai ukur")) {
      await startUploadPhoto(chatId, message, state, "kalibrasi_nilai_ukur", threadId);
      return;
    }
    if (normalized.includes("upload sertifikat")) {
      await startUploadPhoto(chatId, message, state, "kalibrasi_sertifikat", threadId);
      return;
    }
  }

  if (user.role === "Kepala Ruangan" && (normalized.includes("approve pengajuan") || normalized.includes("setujui pengajuan"))) {
    await startApprovePengajuan(chatId, message, state, user, "kepala", threadId);
    return;
  }

  if ((user.role === "Kepala Supervisor" || user.role === "Supervisor") && (normalized.includes("approve pengajuan") || normalized.includes("setujui pengajuan"))) {
    await startApprovePengajuan(chatId, message, state, user, "supervisor", threadId);
    return;
  }

  if ((user.role === "Kepala Supervisor" || user.role === "Supervisor" || user.role === "Kepala Ruangan") && (normalized.includes("tolak pengajuan") || normalized.includes("reject pengajuan"))) {
    await startApprovePengajuan(chatId, message, state, user, "reject", threadId);
    return;
  }

  if (user.role === "Vendor") {
    if (normalized.includes("surat rs") || normalized.includes("surat vendor") || normalized.includes("surat pengajuan")) {
      await replyVendorLetters(chatId, user, threadId);
      return;
    }
    if (normalized.includes("feedback vendor") || normalized === "feedback") {
      await replyVendorFeedbackGuide(chatId, user, threadId);
      return;
    }
    if (normalized.includes("tugas saya") || normalized.includes("notifikasi vendor") || normalized.includes("maintenance saya") || normalized.includes("kalibrasi saya")) {
      await replyVendorTasks(chatId, user, threadId);
      return;
    }
    if (isVendorMaintenance(user) && (normalized.includes("edit maintenance") || normalized.includes("update maintenance"))) {
      await startEditOrDeleteRecord(chatId, message, state, user, "maintenance", "edit", threadId);
      return;
    }
    if (isVendorKalibrasi(user) && (normalized.includes("edit kalibrasi") || normalized.includes("update kalibrasi"))) {
      await startEditOrDeleteRecord(chatId, message, state, user, "kalibrasi", "edit", threadId);
      return;
    }
    if (normalized.includes("update progres")) {
      await sendMessage(
        chatId,
        isVendorMaintenance(user)
          ? "Untuk update progres, ketik: edit maintenance lalu pilih nomor data."
          : isVendorKalibrasi(user)
            ? "Untuk update progres, ketik: edit kalibrasi lalu pilih nomor data."
            : "Akun vendor ini belum punya layanan Maintenance/Kalibrasi.",
        threadId
      );
      return;
    }
    if (normalized.includes("cek daftar maintenance") || normalized === "maintenance" || normalized.includes("maintenance")) {
      await replyMaintenanceList(chatId, user, threadId);
      return;
    }
    if (normalized.includes("cek daftar kalibrasi") || normalized === "kalibrasi" || normalized.includes("kalibrasi")) {
      await replyKalibrasiList(chatId, user, threadId);
      return;
    }
    if (isVendorMaintenance(user) && normalized.includes("upload foto sparepart")) {
      await startUploadPhoto(chatId, message, state, "sparepart", threadId);
      return;
    }
    if (isVendorMaintenance(user) && normalized.includes("upload invoice")) {
      await startUploadPhoto(chatId, message, state, "invoice", threadId);
      return;
    }
    if (isVendorKalibrasi(user) && normalized.includes("upload foto nilai ukur")) {
      await startUploadPhoto(chatId, message, state, "kalibrasi_nilai_ukur", threadId);
      return;
    }
    if (isVendorKalibrasi(user) && normalized.includes("upload sertifikat")) {
      await startUploadPhoto(chatId, message, state, "kalibrasi_sertifikat", threadId);
      return;
    }
  }

  if (user.role === "Kepala Ruangan") {
    const room = await findRoom(user);
    if (!room) {
      await sendMessage(chatId, "Akun Kepala Ruangan ini belum punya ruangan_id.", threadId);
      return;
    }

    if (normalized.includes("buat laporan kr") || normalized.includes("buat laporan alat") || normalized.includes("laporan ke teknisi")) {
      await startKrReport(chatId, message, state, room, threadId);
      return;
    }

    if (normalized.includes("tambahkan alat") || normalized.includes("tambah alat")) {
      await startAddTool(chatId, message, state, threadId, room);
      return;
    }

    const pending = state.pending[pendingKey(message)];
    if (pending?.action === "search_alat" || pending?.action === "qr_alat") {
      const alatRows = await getRoomTools(room.id);
      const alat = alatFromPendingReply(alatRows, text);
      delete state.pending[pendingKey(message)];
      saveState(state);

      if (!alat) {
        await sendMessage(chatId, "Alat tidak ditemukan. Ketik Cari alat ruangan saya untuk mencoba lagi.", threadId);
        return;
      }

      if (pending.action === "qr_alat") {
        await replyQr(chatId, user, `qr ${alat.nama_alat}`, threadId);
        return;
      }

      await replyAlatSearch(chatId, user, room, alat.nama_alat, threadId);
      return;
    }

    if (normalized.includes("download qr code") || normalized === "download qr" || normalized === "qr alat") {
      await askForAlatSearch(chatId, message, state, "qr", threadId);
      return;
    }

    if (normalized.includes("cari alat")) {
      await askForAlatSearch(chatId, message, state, "detail", threadId);
      return;
    }

    if (normalized.includes("daftar kalibrasi") || normalized.includes("cek daftar kalibrasi")) {
      await replyRoomCalibrationList(chatId, room, threadId);
      return;
    }

    if (normalized.includes("daftar maintenance") || normalized.includes("cek daftar maintenance") || normalized.includes("daftar maintaince") || normalized.includes("cek daftar maintaince")) {
      await replyRoomMaintenanceList(chatId, room, threadId);
      return;
    }

    if (isInventoryQuestion(text) || context.module === "daftar_alat") {
      await replyInventory(chatId, user, room, threadId);
      return;
    }

    if (isNotificationText(text) || context.module === "maintenance" || context.module === "kalibrasi" || context.module === "notifikasi") {
      await createNotification(chatId, user, room, text, threadId);
      return;
    }
  }

  if (user.role === "Teknisi") {
    await replyTechnicianSmartFallback(chatId, user, text, message, state, threadId);
    return;
  }

  if (isSlashCommand(rawText)) {
    await sendMessage(
      chatId,
      [
        `Perintah ${rawText.split(/\s+/)[0]} tidak tersedia untuk role ${user.role}.`,
        "",
        "Ketik /menu untuk melihat perintah yang bisa dipakai role kamu.",
      ].join("\n"),
      threadId
    );
    return;
  }

  await replyRoleSmartFallback(chatId, user, text, message, state, threadId);
}

async function loop() {
  let state = loadState();
  log("bot started");

  while (true) {
    try {
      const updates = await telegram("getUpdates", {
        offset: state.offset || 0,
        timeout: POLL_TIMEOUT,
        allowed_updates: ["message"],
      });

      for (const update of updates) {
        state.offset = update.update_id + 1;
        saveState(state);
        if (update.message) {
          log(`message ${update.message.from?.id} thread ${update.message.message_thread_id || "-"}: ${update.message.text || update.message.caption || ""}`);
          await handleMessage(update.message, state);
        }
      }
    } catch (error) {
      log(`error: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

loop();
