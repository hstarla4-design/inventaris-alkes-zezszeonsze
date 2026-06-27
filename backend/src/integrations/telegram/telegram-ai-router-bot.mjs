import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { PNG } from "pngjs";
import { buildOpenClawInventoryAnalysis, isOpenClawInventoryQuestion } from "../../automation/openclaw-inventory.mjs";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });

const SUPABASE_URL = process.env.SUPABASE_URL || "https://brupcvzzrzflfujaijnw.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "sb_publishable_eQ8iUSOr42sMAgHjXE2ecA_FtvIDoRF";
const STATE_FILE = path.join(process.cwd(), ".openclaw-state", "telegram-ai-router-state.json");
const LOG_FILE = path.join(process.cwd(), ".openclaw-state", "telegram-ai-router.log");
const REPORTS_DIR = path.join(process.cwd(), ".openclaw-state", "reports");
const INSTANCE_LOCK_FILE = path.join(process.cwd(), ".openclaw-state", "telegram-ai-router.lock");
const POLL_TIMEOUT = 25;
const DASHBOARD_URL = process.env.DASHBOARD_URL || "https://inventarisalkes-7f32c.web.app";

const supabaseHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

function ensureStateDir() {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
}

function log(line) {
  ensureStateDir();
  fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${line}\n`);
}

function isProcessAlive(pid) {
  const number = Number(pid);
  if (!Number.isFinite(number) || number <= 0) return false;
  try {
    process.kill(number, 0);
    return true;
  } catch {
    return false;
  }
}

function acquireSingleInstanceLock() {
  ensureStateDir();
  if (fs.existsSync(INSTANCE_LOCK_FILE)) {
    const existingPid = fs.readFileSync(INSTANCE_LOCK_FILE, "utf8").trim();
    if (isProcessAlive(existingPid)) {
      log(`another ai router instance is already running with pid ${existingPid}; exiting`);
      console.log(`Bot AI sudah berjalan di proses lain (PID ${existingPid}). Tutup proses lama dulu jika ingin restart.`);
      process.exit(0);
    }
    fs.rmSync(INSTANCE_LOCK_FILE, { force: true });
  }

  fs.writeFileSync(INSTANCE_LOCK_FILE, String(process.pid));
  const release = () => {
    try {
      if (fs.existsSync(INSTANCE_LOCK_FILE) && fs.readFileSync(INSTANCE_LOCK_FILE, "utf8").trim() === String(process.pid)) {
        fs.rmSync(INSTANCE_LOCK_FILE, { force: true });
      }
    } catch {
      // Ignore lock cleanup errors on shutdown.
    }
  };
  process.once("exit", release);
  process.once("SIGINT", () => {
    release();
    process.exit(0);
  });
  process.once("SIGTERM", () => {
    release();
    process.exit(0);
  });
}

function readJsonFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return null;
  }
}

function readOpenClawConfig() {
  const local = readJsonFile(path.join(process.cwd(), ".openclaw-state", "openclaw.json")) || {};
  const global = readJsonFile(path.join(process.env.USERPROFILE || "", ".openclaw", "openclaw.json")) || {};
  return { local, global };
}

function readTextFile(filePath) {
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf8").trim();
}

function readOpenAiKey() {
  return (
    process.env.OPENAI_API_KEY ||
    readTextFile(path.join(process.cwd(), ".openclaw-state", "openai-api-key.txt"))
  );
}

const config = readOpenClawConfig();
const TELEGRAM_TOKEN = process.env.AI_TELEGRAM_BOT_TOKEN ||
  config.local?.channels?.telegram?.botToken ||
  config.global?.channels?.telegram?.botToken ||
  "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  config.local?.models?.providers?.google?.apiKey ||
  config.global?.models?.providers?.google?.apiKey ||
  "";
const OPENAI_API_KEY = readOpenAiKey();
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const DEEPSEEK_PROVIDER_ID = process.env.DEEPSEEK_PROVIDER_ID || "custom-ai-sumopod-com";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-pro";
const deepSeekProvider = config.local?.models?.providers?.[DEEPSEEK_PROVIDER_ID] ||
  config.global?.models?.providers?.[DEEPSEEK_PROVIDER_ID] ||
  {};
const DEEPSEEK_BASE_URL = (process.env.DEEPSEEK_BASE_URL || deepSeekProvider.baseUrl || "").replace(/\/+$/, "");
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || deepSeekProvider.apiKey || "";

if (!TELEGRAM_TOKEN) throw new Error("Token @AIAsistenInventaris_bot tidak ditemukan.");
if (!DEEPSEEK_BASE_URL || !DEEPSEEK_API_KEY) throw new Error("DeepSeek custom provider Sumopod belum lengkap di konfigurasi OpenClaw.");

async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function withTimeout(promise, timeoutMs, timeoutMessage) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function safeOpenClawAnalysis(question, user) {
  if (!isOpenClawInventoryQuestion(question)) return "";
  try {
    return await withTimeout(
      buildOpenClawInventoryAnalysis({ user, question }),
      15000,
      "Analisis OpenClaw melewati batas waktu 15 detik"
    );
  } catch (error) {
    return `Analisis OpenClaw gagal dibaca: ${error.message}`;
  }
}

function extractModelText(data) {
  const choice = data?.choices?.[0] || {};
  const message = choice.message || {};
  const content = message.content;

  if (typeof content === "string" && content.trim()) return content.trim();
  if (Array.isArray(content)) {
    const text = content
      .map((part) => part?.text || part?.content || part?.value || "")
      .join("\n")
      .trim();
    if (text) return text;
  }

  return (
    choice.text ||
    message.reasoning_content ||
    message.reasoning ||
    message.output_text ||
    data.output_text ||
    data.text ||
    data.content ||
    ""
  ).trim();
}

function logModelShape(providerName, data) {
  const choice = data?.choices?.[0] || {};
  const message = choice.message || {};
  const summary = {
    provider: providerName,
    rootKeys: Object.keys(data || {}).slice(0, 12),
    choiceKeys: Object.keys(choice || {}).slice(0, 12),
    messageKeys: Object.keys(message || {}).slice(0, 12),
    finishReason: choice.finish_reason || choice.finishReason || null,
    contentType: Array.isArray(message.content) ? "array" : typeof message.content,
    contentLength: typeof message.content === "string" ? message.content.length : null,
    textLength: typeof choice.text === "string" ? choice.text.length : null,
    reasoningLength: typeof message.reasoning_content === "string" ? message.reasoning_content.length : null,
  };
  log(`model response shape: ${JSON.stringify(summary)}`);
}

function loadState() {
  ensureStateDir();
  if (!fs.existsSync(STATE_FILE)) return { offset: 0 };
  return { offset: 0, ...JSON.parse(fs.readFileSync(STATE_FILE, "utf8").replace(/^\uFEFF/, "")) };
}

function saveState(state) {
  ensureStateDir();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function escapeValue(value) {
  return encodeURIComponent(String(value ?? "").replaceAll('"', '""'));
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function safeText(value) {
  return String(value ?? "-")
    .replace(/[^\x09\x0A\x0D\x20-\x7EÀ-ÿ]/g, "-")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim() || "-";
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function todayJakartaKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function dateKey(value) {
  if (!value) return "";
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatCurrency(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) return "-";
  return `Rp ${Math.round(number).toLocaleString("id-ID")}`;
}

function formatCurrencyReadable(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) return "-";
  const absolute = Math.abs(number);
  const compact = (divisor, suffix) =>
    `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(number / divisor)} ${suffix}`;
  if (absolute >= 1_000_000_000_000) return compact(1_000_000_000_000, "triliun");
  if (absolute >= 1_000_000_000) return compact(1_000_000_000, "miliar");
  if (absolute >= 1_000_000) return compact(1_000_000, "juta");
  if (absolute >= 1_000) return compact(1_000, "ribu");
  return formatCurrency(number);
}

function countBy(rows, getter) {
  const result = new Map();
  for (const row of rows || []) {
    const key = safeText(getter(row) || "-");
    result.set(key, (result.get(key) || 0) + 1);
  }
  return Array.from(result, ([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function sumBy(rows, labelGetter, valueGetter) {
  const result = new Map();
  for (const row of rows || []) {
    const key = safeText(labelGetter(row) || "-");
    const value = Number(valueGetter(row) || 0);
    result.set(key, (result.get(key) || 0) + (Number.isFinite(value) ? value : 0));
  }
  return Array.from(result, ([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function sumCost(rows, costGetter) {
  return (rows || []).reduce((sum, row) => sum + (Number(costGetter(row) || 0) || 0), 0);
}

function cleanTelegramText(value) {
  return String(value || "")
    .replace(/\*\*/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*[-*_]{3,}\s*$/gm, "")
    .replace(/;\s*cek ketersediaan suku cadang/gi, "")
    .replace(/cek ketersediaan suku cadang;?\s*/gi, "")
    .replace(/surat perintah kerja/gi, "pengajuan kerja")
    .replace(/\btroubleshooting awal\b/gi, "pengecekan data awal")
    .replace(/\btroubleshooting\b/gi, "pengecekan data")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitTelegramText(text, limit = 2800) {
  const value = String(text || "").trim();
  if (!value) return [""];
  if (value.length <= limit) return [value];

  const chunks = [];
  let rest = value;
  while (rest.length > limit) {
    let cut = rest.lastIndexOf("\n\n", limit);
    if (cut < limit * 0.55) cut = rest.lastIndexOf("\n", limit);
    if (cut < limit * 0.55) cut = Math.max(
      rest.lastIndexOf(". ", limit),
      rest.lastIndexOf("; ", limit),
      rest.lastIndexOf(": ", limit)
    );
    if (cut < limit * 0.55) cut = rest.lastIndexOf(" ", limit);
    if (cut < limit * 0.55) cut = limit;

    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);

  return chunks.map((chunk, index) => (
    chunks.length > 1 ? `Bagian ${index + 1}/${chunks.length}\n\n${chunk}` : chunk
  ));
}

function stripHtmlTags(value) {
  return String(value || "").replace(/<[^>]*>/g, "");
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9@+]+/g, " ")
    .trim();
}

function daysUntil(value) {
  if (!value) return null;
  const target = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / 86400000);
}

function isDueWithin30OrOverdue(value) {
  const days = daysUntil(value);
  return days !== null && days <= 30;
}

function latestByAlat(rows, dateField) {
  const map = new Map();
  for (const row of rows || []) {
    const existing = map.get(row.alat_id);
    const nextDate = String(row?.[dateField] || row.created_at || "");
    const existingDate = String(existing?.[dateField] || existing?.created_at || "");
    if (!existing || nextDate.localeCompare(existingDate) > 0) map.set(row.alat_id, row);
  }
  return map;
}

function calibrationStatusForTool(tool, kalibrasiByAlat = new Map()) {
  const latest = kalibrasiByAlat.get(tool.id);
  if (!latest && !tool?.kalibrasi_terakhir && !tool?.kalibrasi_berikutnya) return "Belum Kalibrasi";
  const progress = normalize(latest?.status_progres || latest?.status || "");
  if (/proses|berjalan|on progress|sedang/.test(progress)) return "Sedang Kalibrasi";
  if (/tidak lulus|gagal/.test(normalize(latest?.hasil || ""))) return "Tidak Lulus";
  const certificateDays = daysUntil(latest?.berlaku_sampai);
  if (certificateDays !== null && certificateDays < 0) return "Sertifikat Kedaluwarsa";
  const days = daysUntil(tool.kalibrasi_berikutnya);
  if (days !== null && days < 0) return "Terlambat";
  if (days !== null && days <= 30) return "Akan Jatuh Tempo";
  return "Valid";
}

function maintenanceStatusLabel(row = {}) {
  const value = `${row.jenis || ""} ${row.hasil || ""} ${row.keterangan || ""}`;
  if (/emergency|breakdown/i.test(value)) return "Breakdown";
  if (/corrective berat/i.test(value)) return "Corrective Berat";
  if (/corrective ringan/i.test(value)) return "Corrective Ringan";
  if (/corrective/i.test(value)) return "Corrective Ringan";
  return "Preventive Maintenance";
}

function queryTerms(question = "") {
  return [...new Set(
    normalize(question)
      .split(/\s+/)
      .filter((term) => term.length >= 3 && ![
        "yang", "dan", "dari", "untuk", "pada", "dengan", "data", "buatkan",
        "tolong", "berapa", "apakah", "bagaimana", "mana", "saya", "alat",
      ].includes(term)),
  )];
}

function relevanceScore(question, values = []) {
  const terms = queryTerms(question);
  if (!terms.length) return 0;
  const haystack = normalize(values.filter((value) => value !== null && value !== undefined).join(" "));
  return terms.reduce((score, term) => score + (haystack.includes(term) ? (term.length >= 8 ? 4 : 2) : 0), 0);
}

function topRelevant(question, rows, valuesGetter, limit = 35) {
  return (rows || [])
    .map((row) => ({ row, score: relevanceScore(question, valuesGetter(row)) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.row);
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
  return telegramAliases(telegramIdField).includes(candidate);
}

function telegramIdentityAliases(from = {}) {
  return [
    String(from.id || ""),
    from.username ? `@${from.username}` : "",
    from.username || "",
  ].filter(Boolean);
}

function normalizeRoleName(role) {
  const value = normalize(role);
  if (value === "admin") return "Admin";
  if (value === "teknisi") return "Teknisi";
  if (value === "supervisor") return "Supervisor";
  if (value === "kepala supervisor") return "Kepala Supervisor";
  if (value === "kepala ruangan" || value === "kepala ruang" || value === "kepala unit") return "Kepala Ruangan";
  if (value.includes("vendor") || value === "maintenance" || value === "maintaince" || value === "kalibrasi") return "Vendor";
  return role || "Guest";
}

function vendorName(user) {
  return user?.nama_pt || user?.nama || user?.username || "";
}

function vendorService(user) {
  return normalize(user?.vendor_layanan || user?.service_type || user?.role_detail || user?.role || "");
}

function isVendorMaintenance(user) {
  return normalizeRoleName(user?.role) === "Vendor" && vendorService(user).includes("maintenance");
}

function isVendorKalibrasi(user) {
  return normalizeRoleName(user?.role) === "Vendor" && vendorService(user).includes("kalibrasi");
}

function roleAiGuide(user) {
  const role = normalizeRoleName(user?.role);
  if (role === "Admin") {
    return [
      "Role Admin: berperan sebagai pengendali sistem. Bantu analisis seluruh data, risiko aset, user, vendor, biaya, approval, performa maintenance/kalibrasi, dan rekomendasi kebijakan operasional.",
      "Admin memakai OpenAI/ChatGPT jika tersedia; jika kuota habis fallback ke Gemini.",
    ].join(" ");
  }
  if (role === "Teknisi") {
    return [
      "Role Teknisi:",
      "- Posisikan diri sebagai asisten kerja teknisi elektromedis, bukan sekadar bot CRUD.",
      "- Fokus hanya pada inventarisasi dan workflow data alat: prioritas kerja, histori alat, status kondisi, status maintenance, status kalibrasi, pengajuan, vendor, jadwal, dan kelengkapan data.",
      "- Bantu teknisi menyusun prioritas harian dengan pembobotan inventaris: ruangan kritis, kondisi alat, status aktif, histori pekerjaan, jadwal preventive maintenance, jadwal kalibrasi, status pengajuan, vendor, dan kelengkapan data.",
      "- Untuk pertanyaan alat tertentu, gunakan data Supabase/website yang tersedia: nama alat, serial number, ruangan, kondisi, status, vendor, jadwal, histori maintenance, dan histori kalibrasi.",
      "- Jika data spesifik belum ada, jelaskan data yang belum terbaca dan arahkan user mengecek dashboard atau bot operasional.",
      "- Jika teknisi meminta tambah/edit/hapus/approve/upload/download QR, arahkan ke @InventarisAlkesOpenclaw_bot.",
      "- Format jawaban teknisi ideal: ringkasan prioritas, kriteria penilaian, prioritas 1/2/3, alasan berbasis data, tindak lanjut workflow, dan catatan laporan.",
    ].join("\n");
  }
  if (role === "Kepala Ruangan") {
    return [
      "Role Kepala Ruangan:",
      "- Posisikan diri sebagai asisten kepala ruangan untuk menjaga alat tetap siap pakai di ruangan sendiri.",
      "- Fokus pada kondisi alat ruangan, dampak ke pelayanan, alat yang perlu dilaporkan, status tindak lanjut teknisi/vendor, maintenance, kalibrasi, dan laporan ke teknisi.",
      "- Jelaskan dengan bahasa operasional yang mudah dipahami non-teknisi, tetapi tetap akurat.",
      "- Jangan menampilkan data ruangan lain kecuali DATA yang diberikan memang sudah memuatnya untuk role ini.",
      "- Jika akun belum punya ruangan_id atau data ruangan tidak ditemukan, katakan akun belum terhubung ke ruangan.",
      "- Boleh membantu membuat narasi laporan kerusakan berdasarkan keluhan user, tetapi fakta alat/ruangan/status harus mengikuti data.",
      "- Format jawaban kepala ruangan ideal: kondisi ruangan, risiko pelayanan, tindakan yang perlu dilakukan, dan contoh laporan singkat.",
    ].join("\n");
  }
  if (role === "Supervisor" || role === "Kepala Supervisor") {
    return [
      "Role Supervisor:",
      "- Posisikan diri sebagai asisten pengambil keputusan elektromedis level manajemen.",
      "- Bantu membaca risiko, prioritas approval, efektivitas preventive maintenance, corrective/breakdown, kalibrasi, vendor, biaya, availability alat, dan dampak ke pelayanan.",
      "- Setiap angka, status, vendor, biaya, dan daftar alat harus diturunkan dari DATA Supabase/website yang diberikan.",
      "- Boleh memberi rekomendasi strategis, tetapi bedakan fakta data, interpretasi, dan saran keputusan.",
      "- Jika data belum cukup untuk keputusan final, berikan opsi keputusan dan data tambahan yang perlu dicek.",
      "- Jangan mengeksekusi approval langsung. Untuk aksi persetujuan/tolak, arahkan ke @InventarisAlkesOpenclaw_bot atau dashboard website.",
      "- Format jawaban supervisor ideal: ringkasan eksekutif, temuan utama, risiko, rekomendasi keputusan, dan tindak lanjut.",
    ].join("\n");
  }
  if (role === "Vendor") {
    return isVendorMaintenance(user)
      ? "Role Vendor Maintenance: jawab hanya pekerjaan maintenance milik vendor sendiri, progres, foto sebelum/sesudah, sparepart, invoice, dan feedback ke teknisi."
      : isVendorKalibrasi(user)
        ? "Role Vendor Kalibrasi: jawab hanya pekerjaan kalibrasi milik vendor sendiri, hasil lulus/tidak lulus, sertifikat, nilai ukur, dan feedback ke teknisi."
        : "Role Vendor: layanan vendor belum jelas. Minta admin mengisi vendor_layanan Maintenance atau Kalibrasi.";
  }
  return "Guest: boleh menjawab umum, tetapi jangan membuka data sensitif dan arahkan pendaftaran/login bila perlu.";
}

function groundingRules(user) {
  const role = normalizeRoleName(user?.role);
  const roleName = role === "Supervisor" ? "Kepala Supervisor" : role;
  return [
    "ATURAN DATA DAN ANALISIS:",
    "- Sumber fakta utama adalah blok DATA yang dibaca dari Supabase dan dipakai oleh website dashboard.",
    "- Untuk fakta spesifik seperti angka, tanggal, serial number, ruangan, vendor, status, biaya, histori, jadwal, dan nama alat, gunakan hanya data yang terlihat di DATA.",
    "- Jawab seluruhnya dalam bahasa Indonesia.",
    "- Jika DATA memuat record yang cocok dengan nama alat, serial, barcode, nomor sertifikat, vendor, tanggal, atau status yang ditanyakan, record tersebut wajib dipakai dan tidak boleh dinyatakan tidak ada.",
    "- Hasil kalibrasi Tidak Lulus harus ditulis Tidak Lulus. Jangan mengubahnya menjadi Lulus.",
    "- Nilai uang harus bersumber tepat dari DATA. Untuk nominal besar, sebutkan dengan bahasa yang mudah dibaca seperti Rp 10,46 miliar, Rp 215,2 juta, atau Rp 850 ribu; angka Rupiah lengkap boleh ditambahkan dalam kurung untuk kebutuhan audit.",
    "- Jika data spesifik tidak terlihat, katakan singkat: \"Data itu belum terlihat di data yang saya baca.\"",
    "- Untuk serial number yang tidak terlihat, tulis singkat \"SN: -\" atau hilangkan baris SN. Jangan menulis kalimat panjang seperti \"tidak terbaca detail di DATA\".",
    "- Tidak ada troubleshooting teknis dan jangan memakai kata troubleshooting. Jika user bertanya cara memperbaiki alat, arahkan ke SOP teknisi/vendor dan bantu dari sisi data inventaris: histori, status, jadwal, vendor, pengajuan, dan laporan.",
    "- Jika pertanyaan butuh data lengkap tetapi DATA hanya ringkasan, jawab berdasarkan data yang terbaca saat ini dan sebutkan keterbatasannya.",
    "- Saat jawaban menyangkut keputusan kerja, pisahkan bila berguna: Fakta data, Analisis, Rekomendasi, Langkah lanjut.",
    "- Jangan menulis contoh alat fiktif seperti Ventilator ICU atau Patient Monitor NICU kecuali alat itu benar-benar ada di DATA.",
    "- Jika perlu membuat prioritas tetapi DATA tidak memuat daftar alat yang cocok, jelaskan kriteria prioritasnya tanpa menyebut alat spesifik.",
    "- Jangan mengaku sudah membuka website langsung; katakan data berasal dari Supabase/dashboard yang diberikan ke AI.",
    `Role aktif yang harus dipatuhi: ${roleName || "Guest"}.`,
  ].join("\n");
}

function answerStyleGuide(user) {
  const role = normalizeRoleName(user?.role);
  const common = [
    "GAYA JAWABAN:",
    "- Jawaban harus terasa seperti asisten inventaris elektromedis yang membantu membaca data dan menentukan prioritas, bukan sekadar membaca tabel.",
    "- Gunakan bahasa natural, rapi, dan langsung ke keputusan.",
    "- Jangan gunakan format Markdown seperti **tebal**, ### heading, atau garis pemisah ---. Gunakan teks polos yang rapi untuk Telegram.",
    "- Judul cukup ditulis seperti: Ringkasan:, Kriteria Penilaian:, Prioritas 1:, Catatan Data:.",
    "- Jika menyusun prioritas, gunakan level seperti Prioritas 1, Prioritas 2, Prioritas 3.",
    "- Untuk setiap alat yang disebut, berikan alasan dan saran tindakan singkat berdasarkan data yang ada.",
    "- Jika data tidak cukup, jangan mengisi sendiri. Tulis data yang belum terbaca dan beri kriteria pengecekan.",
  ];

  if (role === "Teknisi") {
    return [
      ...common,
      "- Untuk teknisi, jangan sekadar mengurutkan alat rusak. Susun prioritas dari kombinasi beberapa faktor data.",
      "- Faktor prioritas inventaris teknisi:",
      "  1. Ruangan kritis: ICU, NICU, PICU, IGD, OK lebih tinggi jika memang terbaca di DATA.",
      "  2. Kondisi alat: Rusak/Breakdown lebih tinggi dari Maintenance; Maintenance lebih tinggi dari Baik.",
      "  3. Status alat: alat Aktif yang bermasalah lebih prioritas daripada Tidak Aktif.",
      "  4. Histori: alat dengan maintenance/corrective/breakdown berulang naik prioritas.",
      "  5. Jadwal: preventive maintenance atau kalibrasi terlambat/mendekati jatuh tempo naik prioritas.",
      "  6. Pengajuan/vendor: alat yang sudah diajukan tetapi belum selesai perlu follow up.",
      "  7. Kelengkapan data: alat penting dengan serial/jadwal/vendor/histori kosong perlu masuk catatan audit data.",
      "- Pola jawaban teknisi yang harus diikuti jika user meminta prioritas:",
      "  Ringkasan:",
      "  Dari data yang terbaca, prioritas kerja teknisi disusun dari kombinasi kondisi alat, ruangan, status aktif, histori pekerjaan, jadwal maintenance/kalibrasi, pengajuan, dan vendor.",
      "  Kriteria penilaian:",
      "  - [jelaskan faktor yang benar-benar relevan dengan data yang terbaca]",
      "  Prioritas 1 - Risiko Operasional Tinggi",
      "  1. [Nama alat] - [Ruangan] - [Serial number jika terbaca]",
      "     Kondisi: [kondisi dari DATA]",
      "     Status: [status dari DATA]",
      "     Histori/Jadwal: [hanya jika terbaca]",
      "     Alasan: [alasan berdasarkan DATA, bukan asumsi]",
      "     Tindak lanjut: [cek histori data/status pengajuan/vendor/catat laporan sesuai DATA]",
      "  Prioritas 2 - Risiko Sedang / Perlu Follow Up",
      "  [alat yang maintenance, PM/kalibrasi mendekati, atau pengajuan belum selesai]",
      "  Prioritas 3 - Monitoring / Audit Data",
      "  [alat baik tetapi jadwal dekat, atau data penting belum lengkap]",
      "  Catatan data:",
      "  Sebutkan data apa yang belum terbaca jika ada, misalnya serial number, vendor, histori, atau jadwal.",
    ].join("\n");
  }

  if (role === "Kepala Ruangan") {
    return [
      ...common,
      "- Untuk kepala ruangan, utamakan bahasa sederhana: dampak ke pelayanan, alat pengganti, kapan lapor teknisi, dan status tindak lanjut.",
      "- Jangan memakai istilah teknis panjang jika tidak perlu.",
    ].join("\n");
  }

  if (role === "Supervisor" || role === "Kepala Supervisor") {
    return [
      ...common,
      "- Untuk supervisor, gunakan gaya eksekutif, premium, padat, dan rapi seperti memo manajemen rumah sakit.",
      "- Jangan terlalu panjang. Targetkan jawaban utama cukup 1 sampai 2 pesan Telegram, kecuali user jelas meminta laporan lengkap.",
      "- Hindari paragraf panjang. Gunakan blok pendek dengan label jelas.",
      "- Pola jawaban supervisor yang disukai:",
      "  Ringkasan Eksekutif:",
      "  [2-4 kalimat keputusan utama berdasarkan data]",
      "  Indikator Utama:",
      "  - Total biaya: [angka jika terbaca]",
      "  - Vendor dominan: [nama dan nilai/jumlah jika terbaca]",
      "  - Risiko terbesar: [vendor/alat/progres jika terbaca]",
      "  Evaluasi Vendor:",
      "  1. [Vendor] - [status evaluasi: Baik/Perlu Perhatian/Perlu Evaluasi]",
      "     Data: [jumlah pekerjaan, jenis pekerjaan, biaya, progres, alat bermasalah]",
      "     Risiko: [risiko berbasis data]",
      "     Keputusan: [rekomendasi singkat]",
      "  Prioritas Tindak Lanjut:",
      "  1. [aksi keputusan paling penting]",
      "  2. [aksi berikutnya]",
      "  Catatan Data:",
      "  [sebutkan hanya data penting yang kosong atau belum tercatat]",
      "- Beri penilaian seperti Baik, Perlu Perhatian, atau Risiko Tinggi hanya jika didukung indikator data yang terbaca.",
      "- Untuk analisis vendor, wajib pakai data maintenance, kalibrasi, pengajuan, surat vendor, progres, biaya, hasil lulus/tidak lulus, dan alat bermasalah jika tersedia di DATA.",
      "- Jangan menulis 'data tidak terlihat' jika DATA sudah memuat ringkasan vendor, biaya, progres, atau histori. Gunakan ringkasan yang tersedia.",
    ].join("\n");
  }

  return common.join("\n");
}

async function telegram(method, payload = {}) {
  const timeoutMs = method === "getUpdates" ? (POLL_TIMEOUT + 10) * 1000 : 15000;
  const response = await fetchWithTimeout(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }, timeoutMs);
  const data = await response.json();
  if (!data.ok) throw new Error(`${method}: ${data.description || "Telegram API error"}`);
  return data.result;
}

async function sendMessage(chatId, text) {
  const cleanText = cleanTelegramText(text);
  const chunks = splitTelegramText(cleanText);
  let result = null;
  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    try {
      result = await telegram("sendMessage", {
        chat_id: chatId,
        text: escapeHtml(chunk),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      });
    } catch (error) {
      log(`send html failed for ${chatId} chunk ${index + 1}/${chunks.length}: ${error.message}`);
      result = await telegram("sendMessage", {
        chat_id: chatId,
        text: stripHtmlTags(chunk),
        disable_web_page_preview: true,
      });
    }
    log(`send ok for ${chatId} chunk ${index + 1}/${chunks.length}`);
  }
  return result;
}

async function sendDocument(chatId, filePath, caption = "") {
  const bytes = fs.readFileSync(filePath);
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("caption", cleanTelegramText(caption).slice(0, 900));
  form.append("document", new Blob([bytes], { type: "application/pdf" }), path.basename(filePath));

  const response = await fetchWithTimeout(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendDocument`, {
    method: "POST",
    body: form,
  }, 60000);
  const data = await response.json();
  if (!data.ok) throw new Error(`sendDocument: ${data.description || "Telegram API error"}`);
  return data.result;
}

async function sendPhoto(chatId, filePath, caption = "") {
  const bytes = fs.readFileSync(filePath);
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("caption", cleanTelegramText(caption).slice(0, 900));
  form.append("photo", new Blob([bytes], { type: "image/png" }), path.basename(filePath));

  const response = await fetchWithTimeout(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`, {
    method: "POST",
    body: form,
  }, 60000);
  const data = await response.json();
  if (!data.ok) throw new Error(`sendPhoto: ${data.description || "Telegram API error"}`);
  return data.result;
}

async function getSupabase(pathName, options = {}) {
  const response = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/${pathName}`, {
    ...options,
    headers: {
      ...supabaseHeaders,
      ...options.headers,
    },
  }, 25000);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.message || data?.hint || `Supabase HTTP ${response.status}`);
  return data;
}

async function getSupabaseAll(pathName, pageSize = 1000) {
  const cleanPath = String(pathName)
    .replace(/([?&])limit=\d+&?/i, "$1")
    .replace(/([?&])offset=\d+&?/i, "$1")
    .replace(/[?&]$/, "");
  const rows = [];
  for (let offset = 0; ; offset += pageSize) {
    const separator = cleanPath.includes("?") ? "&" : "?";
    const page = await getSupabase(`${cleanPath}${separator}limit=${pageSize}&offset=${offset}`);
    if (!Array.isArray(page)) return page;
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

class SimplePdf {
  constructor() {
    this.width = 595.28;
    this.height = 841.89;
    this.pages = [];
    this.current = "";
    this.page();
  }

  page() {
    if (this.current) this.pages.push(this.current);
    this.current = "";
  }

  color(hex) {
    const value = String(hex || "#000000").replace("#", "");
    const r = parseInt(value.slice(0, 2), 16) / 255;
    const g = parseInt(value.slice(2, 4), 16) / 255;
    const b = parseInt(value.slice(4, 6), 16) / 255;
    return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
  }

  esc(value) {
    return safeText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  }

  y(top, h = 0) {
    return this.height - top - h;
  }

  text(value, x, top, size = 10, opts = {}) {
    const font = opts.bold ? "F2" : "F1";
    const color = this.color(opts.color || "#111827");
    this.current += `BT /${font} ${size} Tf ${color} rg ${x.toFixed(2)} ${this.y(top).toFixed(2)} Td (${this.esc(value)}) Tj ET\n`;
  }

  rect(x, top, w, h, opts = {}) {
    const y = this.y(top, h);
    if (opts.fill) {
      this.current += `${this.color(opts.fill)} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f\n`;
    }
    if (opts.stroke) {
      this.current += `${this.color(opts.stroke)} RG ${opts.lineWidth || 0.7} w ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S\n`;
    }
  }

  line(x1, top1, x2, top2, color = "#CBD5E1", width = 0.7) {
    this.current += `${this.color(color)} RG ${width} w ${x1.toFixed(2)} ${this.y(top1).toFixed(2)} m ${x2.toFixed(2)} ${this.y(top2).toFixed(2)} l S\n`;
  }

  wrap(value, maxChars) {
    const words = safeText(value).split(/\s+/);
    const lines = [];
    let line = "";
    for (const word of words) {
      if ((line + " " + word).trim().length > maxChars && line) {
        lines.push(line);
        line = word;
      } else {
        line = `${line} ${word}`.trim();
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : ["-"];
  }

  paragraph(value, x, top, maxChars, size = 9, opts = {}) {
    let y = top;
    for (const line of this.wrap(value, maxChars)) {
      this.text(line, x, y, size, opts);
      y += size + 3;
    }
    return y;
  }

  header(title, subtitle) {
    this.rect(35, 25, 62, 50, { fill: "#ECFDF5", stroke: "#99F6E4" });
    this.rect(54, 36, 24, 28, { fill: "#0F766E" });
    this.rect(46, 44, 40, 12, { fill: "#0EA5E9" });
    this.text("RUMAH SAKIT ZEZSZEONSZE", 112, 37, 14, { bold: true, color: "#047857" });
    this.text("Instalasi Elektromedis dan Inventaris Alat Kesehatan", 112, 55, 9, { color: "#475569" });
    this.text(`Tanggal: ${formatDate(new Date())}`, 425, 42, 9, { color: "#475569" });
    this.text(`Dashboard: ${DASHBOARD_URL.replace("https://", "")}`, 350, 58, 8, { color: "#475569" });
    this.line(35, 86, 560, 86, "#0F766E", 1.6);
    this.line(35, 90, 560, 90, "#D4AF37", 1);
    this.text(title, 35, 116, 14, { bold: true });
    this.paragraph(subtitle, 35, 134, 92, 9, { color: "#475569" });
    return 162;
  }

  kpi(label, value, x, top, w = 120) {
    this.rect(x, top, w, 52, { fill: "#F8FAFC", stroke: "#CBD5E1" });
    this.text(label, x + 10, top + 17, 8, { bold: true, color: "#64748B" });
    this.text(value, x + 10, top + 40, 17, { bold: true, color: "#0F172A" });
  }

  barList(title, rows, x, top, w, maxRows = 8, valueFormatter = (v) => String(v)) {
    this.text(title, x, top, 11, { bold: true });
    const max = Math.max(...rows.map((row) => Number(row.value) || 0), 1);
    let y = top + 22;
    for (const row of rows.slice(0, maxRows)) {
      this.rect(x, y, w, 21, { fill: "#F8FAFC", stroke: "#D8E2EF" });
      this.text(row.label, x + 8, y + 14, 8, { bold: true, color: "#475569" });
      const barX = x + 126;
      const barW = Math.max(12, (w - 190) * (Number(row.value) || 0) / max);
      this.rect(barX, y + 7, w - 180, 6, { fill: "#E2E8F0" });
      this.rect(barX, y + 7, barW, 6, { fill: "#0F766E" });
      this.text(valueFormatter(row.value), x + w - 58, y + 14, 8, { bold: true, color: "#334155" });
      y += 26;
    }
    return y;
  }

  table(title, columns, rows, x, top, w, options = {}) {
    this.text(title, x, top, 11, { bold: true });
    const widths = columns.map((column) => column.width);
    let y = top + 18;
    this.rect(x, y, w, 20, { fill: "#EAF2FB", stroke: "#94A3B8" });
    let cx = x;
    columns.forEach((column, index) => {
      this.text(column.label, cx + 4, y + 13, 7, { bold: true, color: "#334155" });
      cx += widths[index];
    });
    y += 20;
    rows.slice(0, options.maxRows || 10).forEach((row, rowIndex) => {
      const linesPerCell = columns.map((column, index) =>
        this.wrap(column.get(row, rowIndex), Math.max(8, Math.floor(widths[index] / 5.3)))
      );
      const rowHeight = Math.max(22, Math.max(...linesPerCell.map((lines) => lines.length)) * 10 + 8);
      if (y + rowHeight > 790) {
        this.page();
        y = this.header("LANJUTAN LAPORAN SUPERVISOR", "Tabel lanjutan dari halaman sebelumnya.");
      }
      this.rect(x, y, w, rowHeight, { fill: rowIndex % 2 ? "#FFFFFF" : "#F8FAFC", stroke: "#D8E2EF" });
      cx = x;
      columns.forEach((column, index) => {
        let ty = y + 12;
        for (const line of linesPerCell[index].slice(0, 3)) {
          this.text(line, cx + 4, ty, 7.5, { color: "#111827" });
          ty += 10;
        }
        cx += widths[index];
      });
      y += rowHeight;
    });
    return y + 6;
  }

  finalize(filePath) {
    if (this.current) this.pages.push(this.current);
    const objects = [];
    const add = (body) => {
      objects.push(body);
      return objects.length;
    };
    const fontRegular = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
    const fontBold = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
    const pageKids = [];
    for (const content of this.pages) {
      const stream = `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}endstream`;
      const contentId = add(stream);
      const pageId = add(`<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${this.width} ${this.height}] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${contentId} 0 R >>`);
      pageKids.push(pageId);
    }
    const pagesId = add(`<< /Type /Pages /Kids [${pageKids.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageKids.length} >>`);
    for (const id of pageKids) {
      objects[id - 1] = objects[id - 1].replace("/Parent 0 0 R", `/Parent ${pagesId} 0 R`);
    }
    const catalogId = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((body, index) => {
      offsets.push(Buffer.byteLength(pdf, "latin1"));
      pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
    });
    const xref = Buffer.byteLength(pdf, "latin1");
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let index = 1; index < offsets.length; index += 1) {
      pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, Buffer.from(pdf, "latin1"));
  }
}

function drawNarrativeSection(pdf, title, content, y = 162) {
  const paragraphs = String(content || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  pdf.text(title, 35, y, 12, { bold: true, color: "#0F172A" });
  y += 22;

  for (const paragraph of paragraphs) {
    const normalizedParagraph = paragraph
      .replace(/^(Ringkasan Eksekutif|Temuan Utama|Risiko|Rekomendasi|Tindak Lanjut)\s*:\s*/i, "$1. ");
    const lineCount = pdf.wrap(normalizedParagraph, 92).length;
    const height = lineCount * 12 + 18;
    if (y + height > 785) {
      pdf.page();
      y = pdf.header("LANJUTAN ANALISIS DAN KESIMPULAN", "Narasi lanjutan berdasarkan data Supabase pada ruang lingkup laporan.");
    }
    pdf.rect(35, y - 5, 525, height, { fill: "#F8FAFC", stroke: "#D8E2EF" });
    y = pdf.paragraph(normalizedParagraph, 48, y + 11, 88, 9, { color: "#334155" }) + 10;
  }

  return y;
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

async function registerTelegramAlias(row, from = {}) {
  const aliases = new Set([...telegramAliases(row.telegram_id), ...telegramIdentityAliases(from)]);
  const telegram_id = Array.from(aliases).filter(Boolean).join(" ");
  if (!telegram_id || telegram_id === row.telegram_id) return row;
  try {
    const updated = await patchSupabase(`user_petugas?id=eq.${encodeURIComponent(row.id)}`, { telegram_id });
    return updated?.[0] || { ...row, telegram_id };
  } catch {
    return { ...row, telegram_id };
  }
}

async function findUser(from, message = {}) {
  const candidates = telegramIdentityAliases(from);
  const contactPhone = normalizePhone(message.contact?.phone_number);
  const ownContact = message.contact?.user_id ? String(message.contact.user_id) === String(from.id) : Boolean(contactPhone);

  const rows = await getSupabase("user_petugas?select=*&status=eq.Aktif&limit=1000");
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

async function buildInventoryContext(user, question = "") {
  const [rooms, tools, maintenance, kalibrasi, pengajuan, suratVendor, historiAlat] = await Promise.all([
    getSupabase("ruangan?select=*&order=nama_ruangan.asc"),
    getSupabaseAll("alat_kesehatan?select=*&order=nama_alat.asc"),
    getSupabaseAll("maintenance?select=*,alat_kesehatan(nama_alat,merk,tipe)&order=tanggal.desc"),
    getSupabaseAll("kalibrasi?select=*,alat_kesehatan(nama_alat,merk,tipe)&order=tanggal_kalibrasi.desc"),
    getSupabaseAll("pengajuan?select=*,alat_kesehatan(nama_alat,merk,tipe)&order=created_at.desc").catch(() => []),
    getSupabaseAll("surat_vendor?select=nomor_surat,vendor_pt,jenis_layanan,email_status,created_at&order=created_at.desc").catch(() => []),
    getSupabaseAll("histori_alat?select=*&order=created_at.desc").catch(() => []),
  ]);

  const roomMap = new Map(rooms.map((room) => [room.id, room.nama_ruangan]));
  const role = normalizeRoleName(user?.role);
  const vendor = normalize(vendorName(user));
  const visibleTools = role === "Kepala Ruangan" && user?.ruangan_id
    ? tools.filter((tool) => tool.ruangan_id === user.ruangan_id)
    : role === "Vendor"
      ? tools.filter((tool) => {
          const toolVendor = normalize(tool.vendor || tool.vendor_pt || "");
          return vendor && toolVendor && (toolVendor.includes(vendor) || vendor.includes(toolVendor));
        })
      : tools;

  const visibleMaintenance = role === "Vendor"
    ? maintenance.filter((row) => {
        const recordVendor = normalize(row.vendor_pt || row.vendor || "");
        return isVendorMaintenance(user) && vendor && recordVendor && (recordVendor.includes(vendor) || vendor.includes(recordVendor));
      })
    : role === "Kepala Ruangan" && user?.ruangan_id
      ? maintenance.filter((row) => visibleTools.some((tool) => tool.id === row.alat_id))
      : maintenance;

  const visibleKalibrasi = role === "Vendor"
    ? kalibrasi.filter((row) => {
        const recordVendor = normalize(row.vendor_pt || row.vendor || "");
        return isVendorKalibrasi(user) && vendor && recordVendor && (recordVendor.includes(vendor) || vendor.includes(recordVendor));
      })
    : role === "Kepala Ruangan" && user?.ruangan_id
      ? kalibrasi.filter((row) => visibleTools.some((tool) => tool.id === row.alat_id))
      : kalibrasi;

  const visiblePengajuan = role === "Kepala Ruangan" && user?.ruangan_id
    ? pengajuan.filter((row) => row.ruangan_id === user.ruangan_id)
    : role === "Vendor"
      ? pengajuan.filter((row) => {
          const recordVendor = normalize(row.vendor_pt || "");
          return vendor && recordVendor && (recordVendor.includes(vendor) || vendor.includes(recordVendor));
        })
      : pengajuan;

  const visibleSurat = role === "Vendor"
    ? suratVendor.filter((row) => {
        const recordVendor = normalize(row.vendor_pt || "");
        return vendor && recordVendor && (recordVendor.includes(vendor) || vendor.includes(recordVendor));
      })
    : suratVendor;
  const visibleHistori = role === "Kepala Ruangan" && user?.ruangan_id
    ? historiAlat.filter((row) => visibleTools.some((tool) => tool.id === row.alat_id))
    : role === "Vendor"
      ? []
      : historiAlat;

  const latestKalibrasi = latestByAlat(visibleKalibrasi, "tanggal_kalibrasi");
  const latestMaintenance = latestByAlat(visibleMaintenance, "tanggal");
  const maintenanceDue = visibleTools.filter((tool) => isDueWithin30OrOverdue(tool.preventive_berikutnya || tool.maintenance_berikutnya));
  const maintenanceOverdue = visibleTools.filter((tool) => {
    const days = daysUntil(tool.preventive_berikutnya || tool.maintenance_berikutnya);
    return days !== null && days < 0;
  });
  const kalibrasiDue = visibleTools.filter((tool) => isDueWithin30OrOverdue(tool.kalibrasi_berikutnya));
  const kalibrasiOverdue = visibleTools.filter((tool) => {
    const days = daysUntil(tool.kalibrasi_berikutnya);
    return days !== null && days < 0;
  });
  const calibrationStatusRows = countBy(visibleTools, (tool) => calibrationStatusForTool(tool, latestKalibrasi));
  const maintenanceStatusRows = countBy(visibleMaintenance, maintenanceStatusLabel);

  const toolLines = visibleTools.slice(0, 80).map((item, index) => {
    const pmDays = daysUntil(item.preventive_berikutnya || item.maintenance_berikutnya);
    const kalDays = daysUntil(item.kalibrasi_berikutnya);
    return `${index + 1}. ${item.nama_alat || "-"} | ${item.merk || "-"} ${item.tipe || ""} | SN ${item.serial_number || "-"} | ${roomMap.get(item.ruangan_id) || "-"} | Kondisi ${item.kondisi || "-"} | Status ${item.status || "-"} | PM ${item.preventive_berikutnya || item.maintenance_berikutnya || "-"} (${pmDays ?? "-"} hari) | Kalibrasi ${calibrationStatusForTool(item, latestKalibrasi)} ${item.kalibrasi_berikutnya || "-"} (${kalDays ?? "-"} hari)`;
  });

  const maintenanceLines = visibleMaintenance.slice(0, 12).map((item, index) =>
    `${index + 1}. ${item.alat_kesehatan?.nama_alat || "-"} | ${item.tanggal || "-"} | ${maintenanceStatusLabel(item)} | ${item.hasil || item.status_progres || "-"} | Biaya ${formatCurrency(item.biaya_perbaikan)}`
  );

  const kalibrasiLines = visibleKalibrasi.slice(0, 12).map((item, index) =>
    `${index + 1}. ${item.alat_kesehatan?.nama_alat || "-"} | ${item.tanggal_kalibrasi || "-"} | ${item.hasil || "-"} | Berlaku ${item.berlaku_sampai || "-"} | Biaya ${formatCurrency(item.biaya_kalibrasi || item.biaya)}`
  );

  const pengajuanLines = visiblePengajuan.slice(0, 8).map((item, index) =>
    `${index + 1}. ${item.alat_kesehatan?.nama_alat || "-"} | ${item.jenis_pengajuan || "-"} | ${item.status || "-"} | Vendor ${item.vendor_pt || "-"}`
  );

  const suratLines = visibleSurat.slice(0, 6).map((item, index) =>
    `${index + 1}. ${item.nomor_surat || "-"} | ${item.jenis_layanan || "-"} | ${item.vendor_pt || "-"} | ${item.email_status || "-"}`
  );

  const toolMap = new Map(visibleTools.map((tool) => [tool.id, tool]));
  const relevantTools = topRelevant(question, visibleTools, (item) => [
    item.nama_alat, item.kode_barcode, item.serial_number, item.merk, item.tipe,
    item.vendor, item.kondisi, item.status, roomMap.get(item.ruangan_id),
  ], 30);
  const relevantMaintenance = topRelevant(question, visibleMaintenance, (item) => {
    const tool = toolMap.get(item.alat_id);
    return [
      tool?.nama_alat, tool?.kode_barcode, tool?.serial_number, tool?.merk, tool?.tipe,
      item.jenis, item.tanggal, item.teknisi, item.vendor_pt, item.status_progres,
      item.hasil, item.keterangan, item.biaya_perbaikan,
    ];
  }, 50);
  const relevantCalibration = topRelevant(question, visibleKalibrasi, (item) => {
    const tool = toolMap.get(item.alat_id);
    return [
      tool?.nama_alat, tool?.kode_barcode, tool?.serial_number, tool?.merk, tool?.tipe,
      item.tanggal_kalibrasi, item.berlaku_sampai, item.vendor_pt, item.vendor,
      item.hasil, item.status_progres, item.nomor_sertifikat, item.catatan,
      item.biaya_kalibrasi, item.biaya,
    ];
  }, 50);
  const relevantApplications = topRelevant(question, visiblePengajuan, (item) => {
    const tool = toolMap.get(item.alat_id);
    return [
      tool?.nama_alat, tool?.kode_barcode, tool?.serial_number, item.jenis_pengajuan,
      item.kategori, item.vendor_pt, item.status, item.catatan, item.created_at,
    ];
  }, 30);
  const relevantHistory = topRelevant(question, visibleHistori, (item) => {
    const tool = toolMap.get(item.alat_id);
    return [
      tool?.nama_alat, tool?.kode_barcode, tool?.serial_number,
      item.aksi, item.petugas, item.detail, item.created_at,
    ];
  }, 30);
  const relevantLines = [
    ...relevantTools.map((item) =>
      `MASTER ALAT | ${item.nama_alat || "-"} | barcode ${item.kode_barcode || "-"} | SN ${item.serial_number || "-"} | ${item.merk || "-"} ${item.tipe || ""} | ruangan ${roomMap.get(item.ruangan_id) || "-"} | kondisi ${item.kondisi || "-"} | status ${item.status || "-"} | vendor ${item.vendor || "-"} | harga ${formatCurrency(item.harga_pembelian)}`
    ),
    ...relevantMaintenance.map((item) => {
      const tool = toolMap.get(item.alat_id);
      return `HISTORI MAINTENANCE | ${tool?.nama_alat || "-"} | barcode ${tool?.kode_barcode || "-"} | SN ${tool?.serial_number || "-"} | tanggal ${formatDate(item.tanggal)} | jenis ${maintenanceStatusLabel(item)} | progres ${item.status_progres || "-"} | vendor ${item.vendor_pt || "-"} | teknisi ${item.teknisi || "-"} | biaya ${formatCurrency(item.biaya_perbaikan)} | hasil ${item.hasil || "-"} | catatan ${item.keterangan || "-"}`;
    }),
    ...relevantCalibration.map((item) => {
      const tool = toolMap.get(item.alat_id);
      return `HISTORI KALIBRASI | ${tool?.nama_alat || "-"} | barcode ${tool?.kode_barcode || "-"} | SN ${tool?.serial_number || "-"} | tanggal ${formatDate(item.tanggal_kalibrasi)} | hasil ${item.hasil || "-"} | progres ${item.status_progres || "-"} | berlaku ${formatDate(item.berlaku_sampai)} | vendor ${item.vendor_pt || item.vendor || "-"} | sertifikat ${item.nomor_sertifikat || "-"} | biaya ${formatCurrency(item.biaya_kalibrasi || item.biaya)} | catatan ${item.catatan || "-"}`;
    }),
    ...relevantApplications.map((item) => {
      const tool = toolMap.get(item.alat_id);
      return `PENGAJUAN | ${tool?.nama_alat || "-"} | SN ${tool?.serial_number || "-"} | jenis ${item.jenis_pengajuan || "-"} | kategori ${item.kategori || "-"} | vendor ${item.vendor_pt || "-"} | status ${item.status || "-"} | tanggal ${formatDate(item.created_at)}`;
    }),
    ...relevantHistory.map((item) => {
      const tool = toolMap.get(item.alat_id);
      return `PERUBAHAN DATA | ${tool?.nama_alat || "-"} | SN ${tool?.serial_number || "-"} | ${formatDate(item.created_at)} | ${item.aksi || "-"} | petugas ${item.petugas || "-"} | ${item.detail || "-"}`;
    }),
  ];

  return [
    `Sumber data: Supabase Inventaris Alkes yang dipakai website https://inventarisalkes-7f32c.web.app`,
    `User: ${user?.nama || "Tidak terdaftar"} (${role})`,
    `Panduan role: ${roleAiGuide(user)}`,
    role === "Kepala Ruangan" && !user?.ruangan_id ? "Catatan akses: akun Kepala Ruangan ini belum punya ruangan_id." : "",
    `Total alat terlihat: ${visibleTools.length}`,
    `Total ruangan: ${rooms.length}`,
    `Maintenance due/terlambat <= 30 hari: ${maintenanceDue.length}`,
    `Maintenance terlambat: ${maintenanceOverdue.length}`,
    `Kalibrasi due/terlambat <= 30 hari: ${kalibrasiDue.length}`,
    `Kalibrasi terlambat: ${kalibrasiOverdue.length}`,
    `Status kalibrasi dashboard: ${calibrationStatusRows.map((row) => `${row.label} ${row.value}`).join(", ") || "-"}`,
    `Status maintenance dashboard: ${maintenanceStatusRows.map((row) => `${row.label} ${row.value}`).join(", ") || "-"}`,
    "",
    "DATA PALING RELEVAN DENGAN PERTANYAAN (WAJIB DIPRIORITASKAN):",
    ...(relevantLines.length ? relevantLines : ["Tidak ada kecocokan langsung; gunakan ringkasan dan data terbaru di bawah tanpa mengarang."]),
    "",
    "Data alat ringkas:",
    ...(toolLines.length ? toolLines : ["Belum ada data alat."]),
    visibleTools.length > 80 ? `...dan ${visibleTools.length - 80} alat lain.` : "",
    "",
    "Maintenance terbaru:",
    ...(maintenanceLines.length ? maintenanceLines : ["Belum ada data maintenance."]),
    "",
    "Kalibrasi terbaru:",
    ...(kalibrasiLines.length ? kalibrasiLines : ["Belum ada data kalibrasi."]),
    "",
    "Pengajuan terbaru:",
    ...(pengajuanLines.length ? pengajuanLines : ["Belum ada data pengajuan."]),
    "",
    "Surat vendor terbaru:",
    ...(suratLines.length ? suratLines : ["Belum ada surat vendor."]),
  ].filter(Boolean).join("\n");
}

async function buildSupervisorReportData() {
  const [rooms, tools, maintenance, kalibrasi, pengajuan, suratVendor] = await Promise.all([
    getSupabase("ruangan?select=*&order=nama_ruangan.asc"),
    getSupabaseAll("alat_kesehatan?select=*&order=nama_alat.asc"),
    getSupabaseAll("maintenance?select=*&order=tanggal.desc").catch(() => []),
    getSupabaseAll("kalibrasi?select=*&order=tanggal_kalibrasi.desc").catch(() => []),
    getSupabaseAll("pengajuan?select=*&order=created_at.desc").catch(() => []),
    getSupabaseAll("surat_vendor?select=*&order=created_at.desc").catch(() => []),
  ]);

  const roomMap = new Map(rooms.map((room) => [room.id, room.nama_ruangan || room.kode_ruangan || "-"]));
  const toolMap = new Map(tools.map((tool) => [tool.id, tool]));
  const toolRoom = (tool) => roomMap.get(tool?.ruangan_id) || "-";
  const toolName = (id) => toolMap.get(id)?.nama_alat || "-";
  const toolSerial = (id) => toolMap.get(id)?.serial_number || "-";
  const toolRoomById = (id) => toolRoom(toolMap.get(id));
  const assetValue = (tool) => Number(tool.harga_pembelian || tool.nilai_aset || tool.harga || 0) || 0;
  const recordCost = (row) => Number(
    row.biaya_perbaikan ||
    row.biaya_kalibrasi ||
    row.biaya ||
    row.total_biaya ||
    row.biaya_vendor ||
    row.biaya_maintenance ||
    0
  ) || 0;
  const latestKalibrasi = latestByAlat(kalibrasi, "tanggal_kalibrasi");
  const finalStatuses = ["ditolak", "selesai supervisor", "diteruskan vendor", "selesai vendor", "selesai", "approved"];
  const isPending = (item) => {
    const status = normalize(item.status || item.status_pengajuan || "");
    return status && !finalStatuses.some((done) => status.includes(done));
  };

  const kondisiCounts = countBy(tools, (tool) => tool.kondisi || "Tidak Terisi");
  const roomCounts = countBy(tools, (tool) => toolRoom(tool));
  const categoryCounts = countBy(tools, (tool) => tool.nama_alat || "Tidak Terisi");
  const brandCounts = countBy(tools, (tool) => tool.merk || "Tidak Terisi");
  const maintenanceTypes = countBy(maintenance, maintenanceStatusLabel);
  const calibrationStatus = countBy(tools, (tool) => calibrationStatusForTool(tool, latestKalibrasi));
  const assetByRoom = sumBy(tools, (tool) => toolRoom(tool), assetValue);
  const costByVendor = sumBy([...maintenance, ...kalibrasi], (row) => row.vendor_pt || row.vendor || "Tanpa Vendor", recordCost);

  const activeTools = tools.filter((tool) => normalize(tool.status) !== "tidak aktif").length;
  const problemTools = tools.filter((tool) => /rusak|maintenance/i.test(tool.kondisi || ""));
  const maintenanceDue = tools.filter((tool) => isDueWithin30OrOverdue(tool.maintenance_berikutnya || tool.preventive_berikutnya)).length;
  const kalibrasiDue = tools.filter((tool) => isDueWithin30OrOverdue(tool.kalibrasi_berikutnya)).length;
  const maintenanceOverdue = tools.filter((tool) => {
    const days = daysUntil(tool.maintenance_berikutnya || tool.preventive_berikutnya);
    return days !== null && days < 0;
  }).length;
  const kalibrasiOverdue = tools.filter((tool) => {
    const days = daysUntil(tool.kalibrasi_berikutnya);
    return days !== null && days < 0;
  }).length;
  const pendingPengajuan = pengajuan.filter(isPending);
  const totalAsset = tools.reduce((sum, tool) => sum + assetValue(tool), 0);
  const totalCost = [...maintenance, ...kalibrasi].reduce((sum, row) => sum + recordCost(row), 0);

  return {
    rooms,
    tools,
    maintenance,
    kalibrasi,
    pengajuan,
    suratVendor,
    roomMap,
    toolMap,
    toolName,
    toolSerial,
    toolRoomById,
    toolRoom,
    assetValue,
    recordCost,
    counts: {
      kondisiCounts,
      roomCounts,
      categoryCounts,
      brandCounts,
      maintenanceTypes,
      calibrationStatus,
      assetByRoom,
      costByVendor,
    },
    metrics: {
      totalTools: tools.length,
      activeTools,
      totalRooms: rooms.length,
      totalVendor: new Set(tools.map((tool) => tool.vendor || tool.vendor_pt).filter(Boolean)).size,
      totalAsset,
      totalCost,
      problemTools: problemTools.length,
      maintenanceDue,
      kalibrasiDue,
      maintenanceOverdue,
      kalibrasiOverdue,
      pendingPengajuan: pendingPengajuan.length,
    },
    pendingPengajuan,
    problemTools,
  };
}

function topRows(rows, limit = 10) {
  return (rows || []).slice(0, limit);
}

function listRows(title, rows, mapper, empty = "Belum ada data.") {
  return [
    title,
    ...(rows.length ? rows.map((row, index) => `${index + 1}. ${mapper(row, index)}`) : [empty]),
  ].join("\n");
}

function buildVendorPerformanceRows(data) {
  const vendors = new Map();
  const add = (vendorNameValue, type, row) => {
    const vendor = safeText(vendorNameValue || "Tanpa Vendor");
    if (!vendors.has(vendor)) {
      vendors.set(vendor, {
        label: vendor,
        maintenance: 0,
        kalibrasi: 0,
        pengajuan: 0,
        surat: 0,
        biaya: 0,
        statuses: new Map(),
        failed: 0,
        problemTools: new Set(),
        latest: [],
      });
    }
    const item = vendors.get(vendor);
    if (type === "maintenance") item.maintenance += 1;
    if (type === "kalibrasi") item.kalibrasi += 1;
    if (type === "pengajuan") item.pengajuan += 1;
    if (type === "surat") item.surat += 1;
    item.biaya += data.recordCost(row);
    const status = safeText(row.status_progres || row.status || row.hasil || row.email_status || "Tanpa Status");
    item.statuses.set(status, (item.statuses.get(status) || 0) + 1);
    if (/tidak lulus|gagal|rusak|breakdown|terhambat|pending|menunggu/i.test(status)) item.failed += 1;
    const tool = data.toolMap.get(row.alat_id);
    if (tool?.nama_alat) item.problemTools.add(`${tool.nama_alat} (${data.toolRoom(tool)})`);
    item.latest.push(row);
  };

  data.maintenance.forEach((row) => add(row.vendor_pt || row.vendor, "maintenance", row));
  data.kalibrasi.forEach((row) => add(row.vendor_pt || row.vendor, "kalibrasi", row));
  data.pengajuan.forEach((row) => add(row.vendor_pt || row.vendor, "pengajuan", row));
  data.suratVendor.forEach((row) => add(row.vendor_pt || row.vendor, "surat", row));

  return Array.from(vendors.values())
    .map((item) => ({
      ...item,
      total: item.maintenance + item.kalibrasi + item.pengajuan + item.surat,
      statusSummary: Array.from(item.statuses, ([label, value]) => `${label}:${value}`).slice(0, 6).join(", "),
      problemToolsText: Array.from(item.problemTools).slice(0, 5).join("; ") || "-",
    }))
    .sort((a, b) => (b.failed - a.failed) || (b.biaya - a.biaya) || (b.total - a.total) || a.label.localeCompare(b.label));
}

async function buildSupervisorAiContext(user, question = "") {
  const data = await buildSupervisorReportData();
  const vendorRows = buildVendorPerformanceRows(data);
  const problemTools = data.problemTools
    .map((tool) => ({
      ...tool,
      roomName: data.toolRoom(tool),
      latestMaintenance: data.maintenance.find((row) => row.alat_id === tool.id),
      latestKalibrasi: data.kalibrasi.find((row) => row.alat_id === tool.id),
      maintenanceCount: data.maintenance.filter((row) => row.alat_id === tool.id).length,
      kalibrasiCount: data.kalibrasi.filter((row) => row.alat_id === tool.id).length,
      totalCost: [...data.maintenance, ...data.kalibrasi]
        .filter((row) => row.alat_id === tool.id)
        .reduce((sum, row) => sum + data.recordCost(row), 0),
    }))
    .sort((a, b) => (b.maintenanceCount + b.kalibrasiCount + b.totalCost) - (a.maintenanceCount + a.kalibrasiCount + a.totalCost));

  const highFrequencyTools = countBy([...data.maintenance, ...data.kalibrasi], (row) => {
    const tool = data.toolMap.get(row.alat_id);
    return tool ? `${tool.nama_alat} | ${tool.serial_number || "-"} | ${data.toolRoom(tool)}` : "Tanpa Alat";
  }).slice(0, 15);

  const maintenanceDetail = topRows(data.maintenance, 35).map((row) => {
    const tool = data.toolMap.get(row.alat_id);
    return [
      `${tool?.nama_alat || "-"} (${tool?.serial_number || "-"})`,
      data.toolRoom(tool),
      `jenis ${row.jenis || row.kategori || "-"}`,
      `vendor ${row.vendor_pt || row.vendor || "-"}`,
      `progres ${row.status_progres || row.status || row.hasil || "-"}`,
      `tanggal ${formatDate(row.tanggal)}`,
      `biaya ${formatCurrency(data.recordCost(row))}`,
    ].join(" | ");
  });

  const kalibrasiDetail = topRows(data.kalibrasi, 35).map((row) => {
    const tool = data.toolMap.get(row.alat_id);
    return [
      `${tool?.nama_alat || "-"} (${tool?.serial_number || "-"})`,
      data.toolRoom(tool),
      `hasil ${row.hasil || row.status_progres || row.status_kalibrasi || "-"}`,
      `vendor ${row.vendor_pt || row.vendor || "-"}`,
      `sertifikat ${row.nomor_sertifikat || "-"}`,
      `tanggal ${formatDate(row.tanggal_kalibrasi)}`,
      `berlaku ${formatDate(row.berlaku_sampai || row.kalibrasi_berikutnya)}`,
      `biaya ${formatCurrency(data.recordCost(row))}`,
    ].join(" | ");
  });

  const pengajuanDetail = topRows(data.pengajuan, 35).map((row) => {
    const tool = data.toolMap.get(row.alat_id);
    return [
      `${tool?.nama_alat || row.alat_kesehatan?.nama_alat || "-"} (${tool?.serial_number || "-"})`,
      data.roomMap.get(row.ruangan_id) || data.toolRoom(tool),
      `jenis ${row.jenis_pengajuan || row.jenis || "-"}`,
      `vendor ${row.vendor_pt || row.vendor || "-"}`,
      `status ${row.status || row.status_pengajuan || "-"}`,
      `tanggal ${formatDate(row.created_at || row.tanggal_pengajuan)}`,
    ].join(" | ");
  });
  const relevantTools = topRelevant(question, data.tools, (tool) => [
    tool.nama_alat, tool.kode_barcode, tool.serial_number, tool.merk, tool.tipe,
    tool.vendor, tool.kondisi, tool.status, data.toolRoom(tool),
  ], 35);
  const relevantMaintenance = topRelevant(question, data.maintenance, (row) => {
    const tool = data.toolMap.get(row.alat_id);
    return [tool?.nama_alat, tool?.kode_barcode, tool?.serial_number, row.jenis, row.tanggal, row.teknisi, row.vendor_pt, row.status_progres, row.hasil, row.keterangan, row.biaya_perbaikan];
  }, 60);
  const relevantCalibration = topRelevant(question, data.kalibrasi, (row) => {
    const tool = data.toolMap.get(row.alat_id);
    return [tool?.nama_alat, tool?.kode_barcode, tool?.serial_number, row.tanggal_kalibrasi, row.berlaku_sampai, row.vendor_pt, row.vendor, row.hasil, row.status_progres, row.nomor_sertifikat, row.catatan, row.biaya_kalibrasi];
  }, 60);
  const relevantSupervisorLines = [
    ...relevantTools.map((tool) => `MASTER ALAT | ${tool.nama_alat} | barcode ${tool.kode_barcode || "-"} | SN ${tool.serial_number || "-"} | ${data.toolRoom(tool)} | kondisi ${tool.kondisi || "-"} | status ${tool.status || "-"} | vendor ${tool.vendor || "-"} | nilai ${formatCurrency(data.assetValue(tool))}`),
    ...relevantMaintenance.map((row) => {
      const tool = data.toolMap.get(row.alat_id);
      return `HISTORI MAINTENANCE | ${tool?.nama_alat || "-"} | SN ${tool?.serial_number || "-"} | ${formatDate(row.tanggal)} | ${maintenanceStatusLabel(row)} | progres ${row.status_progres || "-"} | vendor ${row.vendor_pt || "-"} | biaya ${formatCurrency(data.recordCost(row))} | hasil ${row.hasil || "-"}`;
    }),
    ...relevantCalibration.map((row) => {
      const tool = data.toolMap.get(row.alat_id);
      return `HISTORI KALIBRASI | ${tool?.nama_alat || "-"} | SN ${tool?.serial_number || "-"} | ${formatDate(row.tanggal_kalibrasi)} | hasil ${row.hasil || "-"} | progres ${row.status_progres || "-"} | berlaku ${formatDate(row.berlaku_sampai)} | vendor ${row.vendor_pt || row.vendor || "-"} | sertifikat ${row.nomor_sertifikat || "-"} | biaya ${formatCurrency(data.recordCost(row))}`;
    }),
  ];

  return [
    `Sumber data: Supabase Inventaris Alkes yang sama dengan dashboard website ${DASHBOARD_URL}`,
    `User: ${user?.nama || user?.username || "Supervisor"} (${normalizeRoleName(user?.role)})`,
    "Catatan untuk AI: gunakan konteks Supervisor lengkap ini untuk analisis. Jangan mengatakan data tidak terbaca jika data ada di bagian ini.",
    "",
    "Ringkasan KPI Supervisor:",
    `Total alat: ${data.metrics.totalTools}`,
    `Alat aktif: ${data.metrics.activeTools}`,
    `Ruangan: ${data.metrics.totalRooms}`,
    `Vendor alat terisi: ${data.metrics.totalVendor}`,
    `Kondisi bermasalah (Rusak/Maintenance): ${data.metrics.problemTools}`,
    `Maintenance due 30 hari: ${data.metrics.maintenanceDue}`,
    `Maintenance terlambat/expired: ${data.metrics.maintenanceOverdue}`,
    `Kalibrasi due 30 hari: ${data.metrics.kalibrasiDue}`,
    `Kalibrasi terlambat/expired: ${data.metrics.kalibrasiOverdue}`,
    `Pengajuan pending/tindak lanjut: ${data.metrics.pendingPengajuan}`,
    `Nilai aset terbaca: ${formatCurrencyReadable(data.metrics.totalAsset)} (${formatCurrency(data.metrics.totalAsset)})`,
    `Total biaya pekerjaan terbaca: ${formatCurrencyReadable(data.metrics.totalCost)} (${formatCurrency(data.metrics.totalCost)})`,
    "",
    "DATA PALING RELEVAN DENGAN PERTANYAAN (WAJIB DIPRIORITASKAN):",
    ...(relevantSupervisorLines.length ? relevantSupervisorLines : ["Tidak ada kecocokan langsung; gunakan ringkasan lengkap tanpa mengarang."]),
    "",
    listRows("Distribusi kondisi alat:", data.counts.kondisiCounts, (row) => `${row.label}: ${row.value}`),
    "",
    listRows("Jumlah alat per ruangan:", data.counts.roomCounts, (row) => `${row.label}: ${row.value}`),
    "",
    listRows("Kategori alat terbanyak:", data.counts.categoryCounts.slice(0, 20), (row) => `${row.label}: ${row.value}`),
    "",
    listRows("Merek alat terbanyak:", data.counts.brandCounts.slice(0, 20), (row) => `${row.label}: ${row.value}`),
    "",
    listRows("Distribusi maintenance:", data.counts.maintenanceTypes, (row) => `${row.label}: ${row.value}`),
    "",
    listRows("Distribusi kalibrasi:", data.counts.calibrationStatus, (row) => `${row.label}: ${row.value}`),
    "",
    listRows("Nilai aset per ruangan:", data.counts.assetByRoom.slice(0, 15), (row) => `${row.label}: ${formatCurrency(row.value)}`),
    "",
    listRows("Biaya pekerjaan per vendor:", data.counts.costByVendor.slice(0, 15), (row) => `${row.label}: ${formatCurrency(row.value)}`),
    "",
    listRows("Evaluasi vendor gabungan (maintenance, kalibrasi, pengajuan, surat):", vendorRows.slice(0, 20), (row) =>
      `${row.label} | total aktivitas ${row.total} | maintenance ${row.maintenance} | kalibrasi ${row.kalibrasi} | pengajuan ${row.pengajuan} | surat ${row.surat} | biaya ${formatCurrency(row.biaya)} | indikator risiko/progres bermasalah ${row.failed} | status: ${row.statusSummary} | alat terkait: ${row.problemToolsText}`
    ),
    "",
    listRows("Alat kondisi Rusak/Maintenance yang perlu perhatian:", problemTools.slice(0, 25), (tool) =>
      `${tool.nama_alat} | SN ${tool.serial_number || "-"} | ${tool.roomName} | kondisi ${tool.kondisi || "-"} | status ${tool.status || "-"} | vendor ${tool.vendor || tool.vendor_pt || "-"} | histori maintenance ${tool.maintenanceCount} | histori kalibrasi ${tool.kalibrasiCount} | biaya histori ${formatCurrency(tool.totalCost)}`
    ),
    "",
    listRows("Alat paling sering muncul di histori maintenance/kalibrasi:", highFrequencyTools, (row) => `${row.label}: ${row.value} record`),
    "",
    listRows("Detail maintenance terbaru/terbanyak untuk analisis vendor:", maintenanceDetail, (row) => row),
    "",
    listRows("Detail kalibrasi terbaru/terbanyak untuk analisis vendor:", kalibrasiDetail, (row) => row),
    "",
    listRows("Pengajuan terbaru untuk analisis progres:", pengajuanDetail, (row) => row),
    "",
    listRows("Surat vendor terbaru:", topRows(data.suratVendor, 25), (row) =>
      `${row.nomor_surat || "-"} | ${row.vendor_pt || row.vendor || "-"} | ${row.jenis_layanan || "-"} | email ${row.email_status || "-"} | tanggal ${formatDate(row.created_at)}`
    ),
  ].join("\n");
}

async function buildAiContext(user, question = "") {
  const role = normalizeRoleName(user?.role);
  if (role === "Supervisor" || role === "Kepala Supervisor") {
    return buildSupervisorAiContext(user, question);
  }
  return buildInventoryContext(user, question);
}

function supervisorReportScope(question = "") {
  const text = normalize(question);
  if (text.includes("breakdown") || text.includes("emergency")) return "breakdown";
  if (text.includes("preventive")) return "preventive";
  if (text.includes("corrective")) return "corrective";
  if (text.includes("kalibrasi")) return "kalibrasi";
  if (text.includes("maintenance") || text.includes("maintaince")) return "maintenance";
  if (text.includes("vendor")) return "vendor";
  if (text.includes("keuangan") || text.includes("biaya") || text.includes("aset")) return "keuangan";
  if (text.includes("persetujuan") || text.includes("approval") || text.includes("pengajuan")) return "persetujuan";
  return "eksekutif";
}

function isPdfReportRequest(text, user) {
  const role = normalizeRoleName(user?.role);
  if (!["Teknisi", "Kepala Ruangan", "Supervisor", "Kepala Supervisor"].includes(role)) return false;
  const value = normalize(text);
  if (role === "Teknisi" || role === "Kepala Ruangan") {
    return /\b(pdf|dokumen pdf|cetak pdf)\b/.test(value);
  }
  return /\b(pdf|laporan|report|dokumen|cetak)\b/.test(value);
}

function reportAudience(user) {
  const role = normalizeRoleName(user?.role);
  if (role === "Kepala Ruangan") return "Kepala Ruangan";
  if (role === "Teknisi") return "Teknisi";
  return "Supervisor";
}

function scopeReportDataForUser(data, user) {
  const role = normalizeRoleName(user?.role);
  if (role !== "Kepala Ruangan") return data;

  const roomId = user?.ruangan_id;
  const tools = roomId ? data.tools.filter((tool) => tool.ruangan_id === roomId) : [];
  const toolIds = new Set(tools.map((tool) => tool.id));
  const maintenance = data.maintenance.filter((row) => toolIds.has(row.alat_id));
  const kalibrasi = data.kalibrasi.filter((row) => toolIds.has(row.alat_id));
  const pengajuan = data.pengajuan.filter((row) => toolIds.has(row.alat_id) || row.ruangan_id === roomId);
  const suratVendor = data.suratVendor.filter((row) => !row.pengajuan_id || pengajuan.some((item) => item.id === row.pengajuan_id));
  const latestKalibrasi = latestByAlat(kalibrasi, "tanggal_kalibrasi");
  const finalStatuses = ["ditolak", "selesai supervisor", "diteruskan vendor", "selesai vendor", "selesai", "approved"];
  const pendingPengajuan = pengajuan.filter((item) => {
    const status = normalize(item.status || item.status_pengajuan || "");
    return status && !finalStatuses.some((done) => status.includes(done));
  });
  const kondisiCounts = countBy(tools, (tool) => tool.kondisi || "Tidak Terisi");
  const roomCounts = countBy(tools, (tool) => data.toolRoom(tool));
  const categoryCounts = countBy(tools, (tool) => tool.nama_alat || "Tidak Terisi");
  const brandCounts = countBy(tools, (tool) => tool.merk || "Tidak Terisi");
  const maintenanceTypes = countBy(maintenance, maintenanceStatusLabel);
  const calibrationStatus = countBy(tools, (tool) => calibrationStatusForTool(tool, latestKalibrasi));
  const assetByRoom = sumBy(tools, (tool) => data.toolRoom(tool), data.assetValue);
  const costByVendor = sumBy([...maintenance, ...kalibrasi], (row) => row.vendor_pt || row.vendor || "Tanpa Vendor", data.recordCost);
  const problemTools = tools.filter((tool) => /rusak|maintenance/i.test(tool.kondisi || ""));

  return {
    ...data,
    rooms: roomId ? data.rooms.filter((room) => room.id === roomId) : [],
    tools,
    maintenance,
    kalibrasi,
    pengajuan,
    suratVendor,
    pendingPengajuan,
    problemTools,
    counts: {
      kondisiCounts,
      roomCounts,
      categoryCounts,
      brandCounts,
      maintenanceTypes,
      calibrationStatus,
      assetByRoom,
      costByVendor,
    },
    metrics: {
      totalTools: tools.length,
      activeTools: tools.filter((tool) => normalize(tool.status) !== "tidak aktif").length,
      totalRooms: roomId ? 1 : 0,
      totalVendor: new Set(tools.map((tool) => tool.vendor || tool.vendor_pt).filter(Boolean)).size,
      totalAsset: tools.reduce((sum, tool) => sum + data.assetValue(tool), 0),
      totalCost: [...maintenance, ...kalibrasi].reduce((sum, row) => sum + data.recordCost(row), 0),
      problemTools: problemTools.length,
      maintenanceDue: tools.filter((tool) => isDueWithin30OrOverdue(tool.maintenance_berikutnya || tool.preventive_berikutnya)).length,
      kalibrasiDue: tools.filter((tool) => isDueWithin30OrOverdue(tool.kalibrasi_berikutnya)).length,
      maintenanceOverdue: tools.filter((tool) => {
        const days = daysUntil(tool.maintenance_berikutnya || tool.preventive_berikutnya);
        return days !== null && days < 0;
      }).length,
      kalibrasiOverdue: tools.filter((tool) => {
        const days = daysUntil(tool.kalibrasi_berikutnya);
        return days !== null && days < 0;
      }).length,
      pendingPengajuan: pendingPengajuan.length,
    },
  };
}

function isDailySupervisorReport(question = "") {
  return /\b(hari ini|harian|today)\b/.test(normalize(question));
}

function prepareSupervisorReportData(data, question = "") {
  if (!isDailySupervisorReport(question)) {
    return {
      ...data,
      reportMode: "periodik",
      reportDateKey: "",
      reportDateLabel: "",
    };
  }

  const reportDateKey = todayJakartaKey();
  const maintenance = data.maintenance.filter((row) => dateKey(row.tanggal || row.created_at) === reportDateKey);
  const kalibrasi = data.kalibrasi.filter((row) => dateKey(row.tanggal_kalibrasi || row.created_at) === reportDateKey);
  const pengajuan = data.pengajuan.filter((row) => dateKey(row.created_at || row.tanggal_pengajuan) === reportDateKey);
  const suratVendor = data.suratVendor.filter((row) => dateKey(row.created_at || row.tanggal_surat) === reportDateKey);
  const maintenanceDueToday = data.tools.filter((tool) =>
    dateKey(tool.maintenance_berikutnya || tool.preventive_berikutnya) === reportDateKey
  );
  const calibrationDueToday = data.tools.filter((tool) =>
    dateKey(tool.kalibrasi_berikutnya) === reportDateKey
  );

  return {
    ...data,
    reportMode: "harian",
    reportDateKey,
    reportDateLabel: formatDate(reportDateKey),
    maintenance,
    kalibrasi,
    pengajuan,
    suratVendor,
    daily: {
      maintenance,
      kalibrasi,
      pengajuan,
      suratVendor,
      maintenanceDueToday,
      calibrationDueToday,
      maintenanceCost: sumCost(maintenance, data.recordCost),
      calibrationCost: sumCost(kalibrasi, data.recordCost),
      maintenanceTypes: countBy(maintenance, maintenanceStatusLabel),
      calibrationResults: countBy(kalibrasi, (row) =>
        row.hasil || row.status_progres || row.status_kalibrasi || "Belum Terisi"
      ),
      maintenanceByRoom: countBy(maintenance, (row) => data.toolRoomById(row.alat_id)),
      calibrationByRoom: countBy(kalibrasi, (row) => data.toolRoomById(row.alat_id)),
    },
  };
}

function reportTitle(scope) {
  const titles = {
    kalibrasi: "LAPORAN PEMANTAUAN KALIBRASI",
    maintenance: "LAPORAN PEMANTAUAN MAINTENANCE",
    preventive: "LAPORAN PREVENTIVE MAINTENANCE",
    corrective: "LAPORAN CORRECTIVE MAINTENANCE",
    breakdown: "LAPORAN BREAKDOWN ALAT",
    vendor: "LAPORAN EVALUASI VENDOR",
    keuangan: "LAPORAN ANALISIS KEUANGAN ASET",
    persetujuan: "LAPORAN PERSETUJUAN SUPERVISOR",
    eksekutif: "LAPORAN EKSEKUTIF SUPERVISOR",
  };
  return titles[scope] || titles.eksekutif;
}

function scopedMaintenanceRows(data, scope, daily = false) {
  const rows = daily ? data.daily.maintenance : data.maintenance;
  if (scope === "preventive") {
    return rows.filter((row) => maintenanceStatusLabel(row) === "Preventive Maintenance");
  }
  if (scope === "corrective") {
    return rows.filter((row) => maintenanceStatusLabel(row).startsWith("Corrective"));
  }
  if (scope === "breakdown") {
    return rows.filter((row) => maintenanceStatusLabel(row) === "Breakdown");
  }
  return rows;
}

async function buildSupervisorReportAiAnalysis(data, question, user) {
  const scope = supervisorReportScope(question);
  const audience = reportAudience(user);
  const isDaily = data.reportMode === "harian";
  const maintenanceRows = (
    ["maintenance", "preventive", "corrective", "breakdown", "vendor", "keuangan", "eksekutif"].includes(scope)
      ? scopedMaintenanceRows(data, scope, isDaily)
      : []
  ).slice(0, 30);
  const calibrationRows = (
    ["kalibrasi", "vendor", "keuangan", "eksekutif"].includes(scope)
      ? (isDaily ? data.daily.kalibrasi : data.kalibrasi)
      : []
  ).slice(0, 30);
  const facts = [
    `Jenis laporan: ${isDaily ? "harian" : "periodik"} ${scope}.`,
    isDaily ? `Tanggal laporan: ${data.reportDateLabel}.` : "",
    `Total alat master: ${data.metrics.totalTools}.`,
    `Maintenance pada periode laporan: ${maintenanceRows.length} record dengan biaya ${formatCurrencyReadable(sumCost(maintenanceRows, data.recordCost))} (${formatCurrency(sumCost(maintenanceRows, data.recordCost))}).`,
    `Kalibrasi pada periode laporan: ${calibrationRows.length} record dengan biaya ${formatCurrencyReadable(sumCost(calibrationRows, data.recordCost))} (${formatCurrency(sumCost(calibrationRows, data.recordCost))}).`,
    isDaily ? `Maintenance jatuh tempo hari ini: ${data.daily.maintenanceDueToday.length} alat.` : `Maintenance due 30 hari: ${data.metrics.maintenanceDue} alat.`,
    isDaily ? `Kalibrasi jatuh tempo hari ini: ${data.daily.calibrationDueToday.length} alat.` : `Kalibrasi due 30 hari: ${data.metrics.kalibrasiDue} alat.`,
    `Hasil kalibrasi: ${countBy(calibrationRows, (row) => row.hasil || row.status_progres || "Belum Terisi").map((row) => `${row.label} ${row.value}`).join(", ") || "tidak ada record"}.`,
    `Jenis maintenance: ${countBy(maintenanceRows, maintenanceStatusLabel).map((row) => `${row.label} ${row.value}`).join(", ") || "tidak ada record"}.`,
    "Detail maintenance:",
    ...maintenanceRows.map((row) =>
      `${formatDate(row.tanggal)} | ${data.toolName(row.alat_id)} | SN ${data.toolSerial(row.alat_id)} | ${data.toolRoomById(row.alat_id)} | ${maintenanceStatusLabel(row)} | ${row.vendor_pt || row.vendor || "-"} | ${formatCurrency(data.recordCost(row))}`
    ),
    "Detail kalibrasi:",
    ...calibrationRows.map((row) =>
      `${formatDate(row.tanggal_kalibrasi)} | ${data.toolName(row.alat_id)} | SN ${data.toolSerial(row.alat_id)} | ${data.toolRoomById(row.alat_id)} | ${row.hasil || row.status_progres || "-"} | ${row.vendor_pt || row.vendor || "-"} | ${formatCurrency(data.recordCost(row))}`
    ),
  ].filter(Boolean).join("\n");

  const response = await fetchWithTimeout(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        {
          role: "system",
          content: [
            "Anda adalah analis elektromedis Rumah Sakit ZezszeonSze.",
            `Laporan ini ditujukan untuk role ${audience}. Sesuaikan rekomendasi dengan kewenangan role tersebut.`,
            "Gunakan hanya fakta yang diberikan. Jangan mengarang angka, alat, biaya, vendor, tanggal, hasil, atau kesimpulan.",
            `Analisis hanya ruang lingkup laporan ${scope}. Jangan membahas jenis laporan lain kecuali diperlukan sebagai pembanding yang secara eksplisit tersedia di fakta.`,
            "Jawab dalam bahasa Indonesia formal dan ringkas.",
            "Buat tepat 4 bagian: Ringkasan Eksekutif, Temuan Utama, Risiko, Rekomendasi.",
            "Jangan tampilkan proses berpikir, rumus penjumlahan, markdown heading, atau tanda bintang.",
            "Jika tidak ada aktivitas pada periode laporan, nyatakan dengan jelas dan arahkan fokus ke jadwal jatuh tempo.",
          ].join(" "),
        },
        {
          role: "user",
          content: `Permintaan ${audience}: ${question}\n\nFAKTA DATABASE:\n${facts}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 900,
    }),
  }, 90000);

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.error?.message || result?.message || `DeepSeek HTTP ${response.status}`);
  }
  return cleanTelegramText(extractModelText(result) || "");
}

function drawDailySupervisorPdf(data, question, user, filePath, aiAnalysis = "") {
  const scope = supervisorReportScope(question);
  const audience = reportAudience(user);
  const pdf = new SimplePdf();
  const scopeLabel = scope === "kalibrasi"
    ? "KALIBRASI"
    : scope === "maintenance"
      ? "MAINTENANCE"
      : scope.toUpperCase();
  let y = pdf.header(
    `LAPORAN HARIAN ${scopeLabel}`,
    `Periode ${data.reportDateLabel}. Disusun dari data Supabase dan analisis AI untuk ${user?.nama || user?.username || audience} (${audience}).`
  );

  const daily = data.daily;
  pdf.kpi("Aktivitas Maintenance", String(daily.maintenance.length), 35, y, 120);
  pdf.kpi("Aktivitas Kalibrasi", String(daily.kalibrasi.length), 165, y, 120);
  pdf.kpi("Biaya Maintenance", formatCurrency(daily.maintenanceCost), 295, y, 130);
  pdf.kpi("Biaya Kalibrasi", formatCurrency(daily.calibrationCost), 435, y, 125);
  y += 72;
  pdf.kpi("Maintenance Jatuh Tempo", String(daily.maintenanceDueToday.length), 35, y, 150);
  pdf.kpi("Kalibrasi Jatuh Tempo", String(daily.calibrationDueToday.length), 200, y, 150);
  pdf.kpi("Pengajuan Dibuat", String(daily.pengajuan.length), 365, y, 95);
  pdf.kpi("Surat Vendor", String(daily.suratVendor.length), 470, y, 90);
  y += 80;

  const leftEnd = pdf.barList("Jenis maintenance hari ini", daily.maintenanceTypes, 35, y, 245, 6);
  const rightEnd = pdf.barList("Hasil kalibrasi hari ini", daily.calibrationResults, 305, y, 255, 6);
  y = Math.max(leftEnd, rightEnd) + 12;

  if (scope === "kalibrasi" || scope === "eksekutif") {
    const calibrationRows = daily.kalibrasi.length ? daily.kalibrasi : [{ empty: true }];
    y = pdf.table("Detail kalibrasi hari ini", [
      { label: "No", width: 24, get: (_, index) => index + 1 },
      { label: "Alat", width: 92, get: (row) => row.empty ? "Tidak ada aktivitas kalibrasi hari ini" : data.toolName(row.alat_id) },
      { label: "Serial", width: 92, get: (row) => row.empty ? "-" : data.toolSerial(row.alat_id) },
      { label: "Ruangan", width: 65, get: (row) => row.empty ? "-" : data.toolRoomById(row.alat_id) },
      { label: "Hasil", width: 62, get: (row) => row.empty ? "-" : row.hasil || row.status_progres || "-" },
      { label: "Vendor", width: 105, get: (row) => row.empty ? "-" : row.vendor_pt || row.vendor || "-" },
      { label: "Biaya", width: 85, get: (row) => row.empty ? formatCurrency(0) : formatCurrency(data.recordCost(row)) },
    ], calibrationRows, 35, y, 525, { maxRows: 16 });
  }

  if (scope === "maintenance" || scope === "eksekutif") {
    if (y > 625) {
      pdf.page();
      y = pdf.header("DETAIL MAINTENANCE HARI INI", `Periode ${data.reportDateLabel}.`);
    }
    const maintenanceRows = daily.maintenance.length ? daily.maintenance : [{ empty: true }];
    y = pdf.table("Detail maintenance hari ini", [
      { label: "No", width: 24, get: (_, index) => index + 1 },
      { label: "Alat", width: 92, get: (row) => row.empty ? "Tidak ada aktivitas maintenance hari ini" : data.toolName(row.alat_id) },
      { label: "Serial", width: 92, get: (row) => row.empty ? "-" : data.toolSerial(row.alat_id) },
      { label: "Ruangan", width: 65, get: (row) => row.empty ? "-" : data.toolRoomById(row.alat_id) },
      { label: "Jenis", width: 72, get: (row) => row.empty ? "-" : maintenanceStatusLabel(row) },
      { label: "Vendor", width: 95, get: (row) => row.empty ? "-" : row.vendor_pt || row.vendor || "-" },
      { label: "Biaya", width: 85, get: (row) => row.empty ? formatCurrency(0) : formatCurrency(data.recordCost(row)) },
    ], maintenanceRows, 35, y, 525, { maxRows: 16 });
  }

  pdf.page();
  y = pdf.header("ANALISIS AI DAN REKOMENDASI", `Analisis berdasarkan record database pada ${data.reportDateLabel}.`);
  drawNarrativeSection(
    pdf,
    `Kesimpulan dan tindak lanjut untuk ${audience}`,
    aiAnalysis || "Analisis AI tidak tersedia. Data detail pada laporan tetap bersumber dari Supabase.",
    y
  );
  pdf.finalize(filePath);
}

function drawFocusedSupervisorPdf(data, question, user, filePath, aiAnalysis = "") {
  const scope = supervisorReportScope(question);
  const audience = reportAudience(user);
  const isDaily = data.reportMode === "harian";
  const maintenanceRows = scopedMaintenanceRows(data, scope, isDaily);
  const calibrationRows = isDaily ? data.daily.kalibrasi : data.kalibrasi;
  const vendorMaintenance = (isDaily ? data.daily.maintenance : data.maintenance).filter((row) => row.vendor_pt || row.vendor);
  const vendorCalibration = calibrationRows.filter((row) => row.vendor_pt || row.vendor);
  const vendorLetters = isDaily ? data.daily.suratVendor : data.suratVendor;
  const pdf = new SimplePdf();
  let y = pdf.header(
    reportTitle(scope),
    `${isDaily ? `Periode ${data.reportDateLabel}. ` : ""}Diminta oleh ${user?.nama || user?.username || audience} (${audience}). Data hanya memuat ruang lingkup ${scope}.`,
  );

  if (["maintenance", "preventive", "corrective", "breakdown"].includes(scope)) {
    const totalCost = sumCost(maintenanceRows, data.recordCost);
    const toolCount = new Set(maintenanceRows.map((row) => row.alat_id).filter(Boolean)).size;
    const vendorCount = new Set(maintenanceRows.map((row) => row.vendor_pt || row.vendor).filter(Boolean)).size;
    pdf.kpi("Total Pekerjaan", String(maintenanceRows.length), 35, y, 120);
    pdf.kpi("Alat Terkait", String(toolCount), 165, y, 110);
    pdf.kpi("Vendor Aktif", String(vendorCount), 285, y, 105);
    pdf.kpi("Total Biaya", formatCurrencyReadable(totalCost), 400, y, 160);
    y += 78;
    y = pdf.barList("Distribusi pekerjaan per ruangan", countBy(maintenanceRows, (row) => data.toolRoomById(row.alat_id)), 35, y, 525, 10);
    y += 10;
    y = pdf.table(`Detail ${reportTitle(scope).replace("LAPORAN ", "")}`, [
      { label: "No", width: 24, get: (_, index) => index + 1 },
      { label: "Tanggal", width: 62, get: (row) => formatDate(row.tanggal) },
      { label: "Alat", width: 95, get: (row) => data.toolName(row.alat_id) },
      { label: "Serial", width: 95, get: (row) => data.toolSerial(row.alat_id) },
      { label: "Ruangan", width: 62, get: (row) => data.toolRoomById(row.alat_id) },
      { label: "Jenis", width: 78, get: (row) => maintenanceStatusLabel(row) },
      { label: "Vendor", width: 62, get: (row) => row.vendor_pt || row.vendor || "-" },
      { label: "Biaya", width: 47, get: (row) => formatCurrency(data.recordCost(row)) },
    ], maintenanceRows.length ? maintenanceRows : [{ empty: true }], 35, y, 525, { maxRows: 22 });
  } else if (scope === "kalibrasi") {
    const totalCost = sumCost(calibrationRows, data.recordCost);
    const toolCount = new Set(calibrationRows.map((row) => row.alat_id).filter(Boolean)).size;
    const failed = calibrationRows.filter((row) => /tidak lulus|gagal/i.test(String(row.hasil || ""))).length;
    pdf.kpi("Total Kalibrasi", String(calibrationRows.length), 35, y, 120);
    pdf.kpi("Alat Terkait", String(toolCount), 165, y, 110);
    pdf.kpi("Tidak Lulus", String(failed), 285, y, 105);
    pdf.kpi("Total Biaya", formatCurrencyReadable(totalCost), 400, y, 160);
    y += 78;
    y = pdf.barList("Distribusi hasil kalibrasi", countBy(calibrationRows, (row) => row.hasil || row.status_progres || "Belum Terisi"), 35, y, 525, 10);
    y += 10;
    y = pdf.table("Detail Kalibrasi", [
      { label: "No", width: 24, get: (_, index) => index + 1 },
      { label: "Tanggal", width: 62, get: (row) => formatDate(row.tanggal_kalibrasi) },
      { label: "Alat", width: 92, get: (row) => data.toolName(row.alat_id) },
      { label: "Serial", width: 92, get: (row) => data.toolSerial(row.alat_id) },
      { label: "Ruangan", width: 60, get: (row) => data.toolRoomById(row.alat_id) },
      { label: "Hasil", width: 58, get: (row) => row.hasil || row.status_progres || "-" },
      { label: "Berlaku", width: 65, get: (row) => formatDate(row.berlaku_sampai) },
      { label: "Biaya", width: 72, get: (row) => formatCurrency(data.recordCost(row)) },
    ], calibrationRows.length ? calibrationRows : [{ empty: true }], 35, y, 525, { maxRows: 22 });
  } else if (scope === "vendor") {
    const vendorRows = [
      ...vendorMaintenance.map((row) => ({ ...row, source: "Maintenance", date: row.tanggal })),
      ...vendorCalibration.map((row) => ({ ...row, source: "Kalibrasi", date: row.tanggal_kalibrasi })),
    ];
    const vendorCount = new Set(vendorRows.map((row) => row.vendor_pt || row.vendor).filter(Boolean)).size;
    const vendorCost = sumCost(vendorRows, data.recordCost);
    pdf.kpi("Aktivitas Vendor", String(vendorRows.length), 35, y, 125);
    pdf.kpi("Vendor Aktif", String(vendorCount), 170, y, 110);
    pdf.kpi("Surat RS", String(vendorLetters.length), 290, y, 90);
    pdf.kpi("Total Biaya", formatCurrencyReadable(vendorCost), 390, y, 170);
    y += 78;
    y = pdf.barList("Aktivitas per vendor", countBy(vendorRows, (row) => row.vendor_pt || row.vendor || "-"), 35, y, 525, 10);
    y += 10;
    y = pdf.table("Detail Pekerjaan Vendor", [
      { label: "No", width: 24, get: (_, index) => index + 1 },
      { label: "Tanggal", width: 62, get: (row) => formatDate(row.date) },
      { label: "Layanan", width: 70, get: (row) => row.source },
      { label: "Alat", width: 100, get: (row) => data.toolName(row.alat_id) },
      { label: "Vendor", width: 140, get: (row) => row.vendor_pt || row.vendor || "-" },
      { label: "Status", width: 72, get: (row) => row.status_progres || row.hasil || "-" },
      { label: "Biaya", width: 57, get: (row) => formatCurrency(data.recordCost(row)) },
    ], vendorRows.length ? vendorRows : [{ empty: true }], 35, y, 525, { maxRows: 22 });
  } else if (scope === "keuangan") {
    const maintenanceCost = sumCost(isDaily ? data.daily.maintenance : data.maintenance, data.recordCost);
    const calibrationCost = sumCost(calibrationRows, data.recordCost);
    const totalCost = maintenanceCost + calibrationCost;
    pdf.kpi("Nilai Aset", formatCurrencyReadable(data.metrics.totalAsset), 35, y, 150);
    pdf.kpi("Maintenance", formatCurrencyReadable(maintenanceCost), 195, y, 120);
    pdf.kpi("Kalibrasi", formatCurrencyReadable(calibrationCost), 325, y, 110);
    pdf.kpi("Total Biaya", formatCurrencyReadable(totalCost), 445, y, 115);
    y += 82;
    y = pdf.barList("Nilai aset per ruangan", data.counts.assetByRoom, 35, y, 525, 10, formatCurrencyReadable);
    y += 10;
    pdf.barList("Biaya pekerjaan per vendor", data.counts.costByVendor, 35, y, 525, 10, formatCurrencyReadable);
  } else if (scope === "persetujuan") {
    const rows = isDaily ? data.daily.pengajuan : data.pendingPengajuan;
    pdf.kpi("Total Pengajuan", String(rows.length), 35, y, 130);
    pdf.kpi("Menunggu Keputusan", String(rows.filter((row) => /menunggu/i.test(String(row.status || ""))).length), 175, y, 150);
    y += 78;
    pdf.table("Detail Persetujuan", [
      { label: "No", width: 24, get: (_, index) => index + 1 },
      { label: "Tanggal", width: 62, get: (row) => formatDate(row.created_at || row.tanggal_pengajuan) },
      { label: "Alat", width: 110, get: (row) => data.toolName(row.alat_id) },
      { label: "Jenis", width: 105, get: (row) => row.jenis_pengajuan || row.jenis || "-" },
      { label: "Ruangan", width: 80, get: (row) => data.roomMap.get(row.ruangan_id) || data.toolRoomById(row.alat_id) },
      { label: "Status", width: 144, get: (row) => row.status || "-" },
    ], rows.length ? rows : [{ empty: true }], 35, y, 525, { maxRows: 22 });
  }

  pdf.page();
  y = pdf.header("ANALISIS AI DAN REKOMENDASI", `Analisis khusus ${scope} berdasarkan data Supabase pada ruang lingkup laporan.`);
  drawNarrativeSection(
    pdf,
    `Kesimpulan dan tindak lanjut untuk ${audience}`,
    aiAnalysis || "Analisis AI tidak tersedia. Data detail pada laporan tetap bersumber dari Supabase.",
    y
  );
  pdf.finalize(filePath);
}

function drawSupervisorPdf(data, question, user, filePath, aiAnalysis = "") {
  const scope = supervisorReportScope(question);
  const audience = reportAudience(user);
  if (scope !== "eksekutif") {
    drawFocusedSupervisorPdf(data, question, user, filePath, aiAnalysis);
    return;
  }
  if (data.reportMode === "harian") {
    drawDailySupervisorPdf(data, question, user, filePath, aiAnalysis);
    return;
  }
  const pdf = new SimplePdf();
  let y = pdf.header(reportTitle(scope), `Diminta oleh ${user?.nama || user?.username || audience} (${audience}). Isi laporan disusun dari data Supabase/dashboard sesuai permintaan: ${safeText(question).slice(0, 180)}`);

  pdf.kpi("Total Alat", String(data.metrics.totalTools), 35, y, 118);
  pdf.kpi("Alat Aktif", String(data.metrics.activeTools), 165, y, 118);
  pdf.kpi("Kondisi Bermasalah", String(data.metrics.problemTools), 295, y, 118);
  pdf.kpi("Persetujuan Pending", String(data.metrics.pendingPengajuan), 425, y, 135);
  y += 70;
  pdf.kpi("Maintenance Due 30 Hari", String(data.metrics.maintenanceDue), 35, y, 150);
  pdf.kpi("Kalibrasi Due 30 Hari", String(data.metrics.kalibrasiDue), 200, y, 150);
  pdf.kpi("Total Ruangan", String(data.metrics.totalRooms), 365, y, 90);
  pdf.kpi("Nilai Aset", formatCurrency(data.metrics.totalAsset), 465, y, 95);
  y += 78;

  pdf.text("Analisis Grafik Supervisor", 35, y, 13, { bold: true });
  y += 20;
  const leftEnd = pdf.barList("Distribusi kondisi alat", data.counts.kondisiCounts, 35, y, 245, 6);
  const rightEnd = pdf.barList("Jumlah alat per ruangan", data.counts.roomCounts, 305, y, 255, 8);
  y = Math.max(leftEnd, rightEnd) + 8;
  if (y > 610) {
    pdf.page();
    y = pdf.header("LANJUTAN ANALISIS GRAFIK", "Grafik lanjutan berdasarkan data dashboard Supervisor.");
  }
  const categoryEnd = pdf.barList("Kategori alat terbanyak", data.counts.categoryCounts, 35, y, 245, 7);
  const brandEnd = pdf.barList("Merek alat terbanyak", data.counts.brandCounts, 305, y, 255, 7);
  y = Math.max(categoryEnd, brandEnd) + 12;

  if (y > 650) {
    pdf.page();
    y = pdf.header("LANJUTAN LAPORAN SUPERVISOR", "Tabel dan analisis sesuai permintaan.");
  }

  if (scope === "kalibrasi" || scope === "eksekutif") {
    y = pdf.table("Data kalibrasi terbaru", [
      { label: "No", width: 24, get: (_, index) => index + 1 },
      { label: "Tanggal", width: 62, get: (row) => formatDate(row.tanggal_kalibrasi) },
      { label: "Alat", width: 95, get: (row) => data.toolName(row.alat_id) },
      { label: "Serial", width: 95, get: (row) => data.toolSerial(row.alat_id) },
      { label: "Ruangan", width: 62, get: (row) => data.toolRoomById(row.alat_id) },
      { label: "Hasil", width: 52, get: (row) => row.hasil || row.status_progres || "-" },
      { label: "Berlaku", width: 62, get: (row) => formatDate(row.berlaku_sampai || row.kalibrasi_berikutnya) },
      { label: "Biaya", width: 73, get: (row) => formatCurrency(data.recordCost(row)) },
    ], data.kalibrasi, 35, y, 525, { maxRows: scope === "kalibrasi" ? 18 : 8 });
  }

  if (y > 640) {
    pdf.page();
    y = pdf.header("LANJUTAN LAPORAN SUPERVISOR", "Tabel dan analisis sesuai permintaan.");
  }

  if (scope === "maintenance" || scope === "eksekutif") {
    y = pdf.table("Data maintenance terbaru", [
      { label: "No", width: 24, get: (_, index) => index + 1 },
      { label: "Tanggal", width: 62, get: (row) => formatDate(row.tanggal) },
      { label: "Alat", width: 95, get: (row) => data.toolName(row.alat_id) },
      { label: "Serial", width: 95, get: (row) => data.toolSerial(row.alat_id) },
      { label: "Ruangan", width: 62, get: (row) => data.toolRoomById(row.alat_id) },
      { label: "Jenis", width: 72, get: (row) => row.jenis || row.kategori || "-" },
      { label: "Vendor", width: 65, get: (row) => row.vendor_pt || row.vendor || "-" },
      { label: "Biaya", width: 50, get: (row) => formatCurrency(data.recordCost(row)) },
    ], data.maintenance, 35, y, 525, { maxRows: scope === "maintenance" ? 18 : 8 });
  }

  if (scope === "persetujuan") {
    y = pdf.table("Pengajuan menunggu keputusan / tindak lanjut", [
      { label: "No", width: 24, get: (_, index) => index + 1 },
      { label: "Tanggal", width: 62, get: (row) => formatDate(row.created_at || row.tanggal_pengajuan) },
      { label: "Alat", width: 100, get: (row) => data.toolName(row.alat_id) },
      { label: "Jenis", width: 95, get: (row) => row.jenis_pengajuan || row.jenis || "-" },
      { label: "Ruangan", width: 70, get: (row) => data.roomMap.get(row.ruangan_id) || data.toolRoomById(row.alat_id) },
      { label: "Vendor", width: 90, get: (row) => row.vendor_pt || row.vendor || "-" },
      { label: "Status", width: 84, get: (row) => row.status || "-" },
    ], data.pendingPengajuan.length ? data.pendingPengajuan : data.pengajuan, 35, y, 525, { maxRows: 20 });
  }

  if (scope === "vendor") {
    y = pdf.table("Surat dan pekerjaan vendor", [
      { label: "No", width: 24, get: (_, index) => index + 1 },
      { label: "Tanggal", width: 62, get: (row) => formatDate(row.created_at) },
      { label: "Nomor", width: 92, get: (row) => row.nomor_surat || "-" },
      { label: "Vendor", width: 138, get: (row) => row.vendor_pt || row.vendor || "-" },
      { label: "Layanan", width: 80, get: (row) => row.jenis_layanan || row.jenis || "-" },
      { label: "Email", width: 70, get: (row) => row.email_status || "-" },
      { label: "Status", width: 59, get: (row) => row.status || row.status_progres || "-" },
    ], data.suratVendor, 35, y, 525, { maxRows: 22 });
  }

  if (scope === "keuangan") {
    pdf.page();
    y = pdf.header("ANALISIS KEUANGAN ASET", "Ringkasan nilai aset dan biaya pekerjaan dari data yang tersedia.");
    y = pdf.barList("Nilai aset per ruangan", data.counts.assetByRoom, 35, y, 525, 10, formatCurrency);
    y += 10;
    pdf.barList("Biaya pekerjaan per vendor", data.counts.costByVendor, 35, y, 525, 10, formatCurrency);
  }

  pdf.page();
  y = pdf.header("KESIMPULAN DAN TINDAK LANJUT", `Interpretasi ringkas untuk ${audience} berdasarkan data yang terbaca.`);
  const dominantCondition = data.counts.kondisiCounts[0];
  const dominantMaintenance = data.counts.maintenanceTypes[0];
  const topRoom = data.counts.roomCounts[0];
  const notes = [
    `Total alat yang terbaca: ${data.metrics.totalTools}, dengan ${data.metrics.problemTools} alat berada pada kondisi Rusak atau Maintenance.`,
    `Ruangan dengan jumlah alat terbanyak: ${topRoom?.label || "-"} (${topRoom?.value || 0} alat).`,
    `Kondisi dominan: ${dominantCondition?.label || "-"} (${dominantCondition?.value || 0} alat).`,
    `Jenis/status maintenance dominan: ${dominantMaintenance?.label || "-"} (${dominantMaintenance?.value || 0} record).`,
    `Pengajuan yang masih perlu dipantau: ${data.metrics.pendingPengajuan}.`,
    `Nilai aset yang terbaca dari kolom harga/nilai aset: ${formatCurrencyReadable(data.metrics.totalAsset)} (${formatCurrency(data.metrics.totalAsset)}).`,
    `Laporan ini disesuaikan dengan akses ${audience}. Untuk rincian lebih sempit, minta PDF dengan kata kunci kalibrasi, maintenance, vendor, keuangan, atau persetujuan.`,
  ];
  drawNarrativeSection(
    pdf,
    "Ringkasan keputusan",
    [
      aiAnalysis || "",
      "Ringkasan fakta utama.",
      ...notes,
    ].filter(Boolean).join("\n\n"),
    y
  );

  pdf.finalize(filePath);
}

async function createSupervisorPdfReport(question, user) {
  const sourceData = scopeReportDataForUser(await buildSupervisorReportData(), user);
  const data = prepareSupervisorReportData(sourceData, question);
  const slug = supervisorReportScope(question);
  const audience = reportAudience(user);
  let aiAnalysis = "";
  try {
    aiAnalysis = await buildSupervisorReportAiAnalysis(data, question, user);
  } catch (error) {
    log(`supervisor pdf ai analysis fallback: ${error.message}`);
    aiAnalysis = [
      "Ringkasan Eksekutif: Analisis AI belum tersedia, tetapi tabel laporan tetap dibuat dari data Supabase.",
      `Temuan Utama: ${data.reportMode === "harian" ? `Terdapat ${data.daily.maintenance.length} aktivitas maintenance dan ${data.daily.kalibrasi.length} aktivitas kalibrasi pada tanggal laporan.` : `Terdapat ${data.metrics.totalTools} alat dalam data master.`}`,
      `Risiko: ${audience} perlu memeriksa record jatuh tempo dan hasil pekerjaan yang belum selesai sesuai kewenangannya.`,
      "Rekomendasi: Validasi record pada tabel dan tindak lanjuti melalui dashboard atau bot operasional.",
    ].join("\n");
  }
  const suffix = data.reportMode === "harian" ? data.reportDateKey : Date.now();
  const fileName = `laporan-${normalize(audience).replaceAll(" ", "-")}-${slug}-${suffix}.pdf`;
  const filePath = path.join(REPORTS_DIR, fileName);
  drawSupervisorPdf(data, question, user, filePath, aiAnalysis);
  const caption = data.reportMode === "harian"
    ? [
      `LAPORAN HARIAN ${slug.toUpperCase()}`,
      `Tanggal: ${data.reportDateLabel}`,
      "",
      "RINGKASAN DATA",
      ...(["maintenance", "preventive", "corrective", "breakdown", "eksekutif"].includes(slug)
        ? [
            `Pekerjaan ${slug === "maintenance" || slug === "eksekutif" ? "maintenance" : slug} hari ini: ${scopedMaintenanceRows(data, slug, true).length}`,
            `Biaya: ${formatCurrencyReadable(sumCost(scopedMaintenanceRows(data, slug, true), data.recordCost))}`,
          ]
        : []),
      ...(["kalibrasi", "eksekutif"].includes(slug)
        ? [
            `Kalibrasi hari ini: ${data.daily.kalibrasi.length}`,
            `Biaya kalibrasi: ${formatCurrencyReadable(data.daily.calibrationCost)}`,
          ]
        : []),
      ...(slug === "vendor" ? [`Aktivitas vendor hari ini: ${data.daily.maintenance.filter((row) => row.vendor_pt || row.vendor).length + data.daily.kalibrasi.filter((row) => row.vendor_pt || row.vendor).length}`] : []),
      ...(slug === "keuangan" ? [`Total biaya hari ini: ${formatCurrencyReadable(data.daily.maintenanceCost + data.daily.calibrationCost)}`] : []),
      "",
      `PDF terlampir berisi detail database dan analisis AI untuk ${audience}.`,
    ].join("\n")
    : [
      `Laporan PDF ${audience} sudah dibuat: ${reportTitle(slug)}`,
      `Ruang lingkup: ${slug}`,
      "Isi PDF hanya memuat data, grafik, biaya, dan analisis yang sesuai dengan ruang lingkup tersebut.",
    ].join("\n");
  return {
    filePath,
    caption,
  };
}

function isSupervisorChartRequest(text, user) {
  const role = normalizeRoleName(user?.role);
  if (role !== "Supervisor" && role !== "Kepala Supervisor") return false;
  const value = normalize(text);
  return /\b(grafik|chart|gambar|visual|donut|diagram|infografis|dashboard visual)\b/.test(value);
}

function chartColor(hex) {
  const value = String(hex || "#000000").replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
    a: 255,
  };
}

function putPixel(png, x, y, color) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const index = (Math.floor(y) * png.width + Math.floor(x)) * 4;
  png.data[index] = color.r;
  png.data[index + 1] = color.g;
  png.data[index + 2] = color.b;
  png.data[index + 3] = color.a ?? 255;
}

function fillBox(png, x, y, w, h, hex) {
  const color = chartColor(hex);
  for (let yy = Math.max(0, y); yy < Math.min(png.height, y + h); yy += 1) {
    for (let xx = Math.max(0, x); xx < Math.min(png.width, x + w); xx += 1) {
      putPixel(png, xx, yy, color);
    }
  }
}

function strokeBox(png, x, y, w, h, hex, size = 1) {
  fillBox(png, x, y, w, size, hex);
  fillBox(png, x, y + h - size, w, size, hex);
  fillBox(png, x, y, size, h, hex);
  fillBox(png, x + w - size, y, size, h, hex);
}

const MINI_FONT = {
  " ": ["000", "000", "000", "000", "000", "000", "000"],
  "0": ["111", "101", "101", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "010", "010", "111"],
  "2": ["111", "001", "001", "111", "100", "100", "111"],
  "3": ["111", "001", "001", "111", "001", "001", "111"],
  "4": ["101", "101", "101", "111", "001", "001", "001"],
  "5": ["111", "100", "100", "111", "001", "001", "111"],
  "6": ["111", "100", "100", "111", "101", "101", "111"],
  "7": ["111", "001", "001", "010", "010", "100", "100"],
  "8": ["111", "101", "101", "111", "101", "101", "111"],
  "9": ["111", "101", "101", "111", "001", "001", "111"],
  "A": ["010", "101", "101", "111", "101", "101", "101"],
  "B": ["110", "101", "101", "110", "101", "101", "110"],
  "C": ["111", "100", "100", "100", "100", "100", "111"],
  "D": ["110", "101", "101", "101", "101", "101", "110"],
  "E": ["111", "100", "100", "110", "100", "100", "111"],
  "F": ["111", "100", "100", "110", "100", "100", "100"],
  "G": ["111", "100", "100", "101", "101", "101", "111"],
  "H": ["101", "101", "101", "111", "101", "101", "101"],
  "I": ["111", "010", "010", "010", "010", "010", "111"],
  "J": ["001", "001", "001", "001", "101", "101", "111"],
  "K": ["101", "101", "110", "100", "110", "101", "101"],
  "L": ["100", "100", "100", "100", "100", "100", "111"],
  "M": ["101", "111", "111", "101", "101", "101", "101"],
  "N": ["101", "111", "111", "111", "101", "101", "101"],
  "O": ["111", "101", "101", "101", "101", "101", "111"],
  "P": ["111", "101", "101", "111", "100", "100", "100"],
  "Q": ["111", "101", "101", "101", "111", "001", "001"],
  "R": ["110", "101", "101", "110", "110", "101", "101"],
  "S": ["111", "100", "100", "111", "001", "001", "111"],
  "T": ["111", "010", "010", "010", "010", "010", "010"],
  "U": ["101", "101", "101", "101", "101", "101", "111"],
  "V": ["101", "101", "101", "101", "101", "101", "010"],
  "W": ["101", "101", "101", "101", "111", "111", "101"],
  "X": ["101", "101", "101", "010", "101", "101", "101"],
  "Y": ["101", "101", "101", "010", "010", "010", "010"],
  "Z": ["111", "001", "001", "010", "100", "100", "111"],
  "-": ["000", "000", "000", "111", "000", "000", "000"],
  "/": ["001", "001", "010", "010", "010", "100", "100"],
  ".": ["000", "000", "000", "000", "000", "110", "110"],
  "%": ["101", "001", "010", "010", "010", "100", "101"],
  ":": ["000", "010", "010", "000", "010", "010", "000"],
};

function drawText(png, text, x, y, scale = 3, hex = "#111827") {
  const color = chartColor(hex);
  const value = safeText(text).toUpperCase().replace(/[^A-Z0-9 .:%/-]/g, " ");
  let cursor = x;
  for (const char of value) {
    const glyph = MINI_FONT[char] || MINI_FONT[" "];
    for (let row = 0; row < glyph.length; row += 1) {
      for (let col = 0; col < glyph[row].length; col += 1) {
        if (glyph[row][col] === "1") fillBox(png, cursor + col * scale, y + row * scale, scale, scale, hex);
      }
    }
    cursor += (glyph[0].length + 1) * scale;
  }
  return cursor;
}

function drawDonut(png, cx, cy, radius, innerRadius, rows, colors) {
  const total = rows.reduce((sum, row) => sum + Number(row.value || 0), 0) || 1;
  let start = -Math.PI / 2;
  const segments = rows.map((row, index) => {
    const angle = (Number(row.value || 0) / total) * Math.PI * 2;
    const item = { start, end: start + angle, color: chartColor(colors[index % colors.length]), row };
    start += angle;
    return item;
  });
  for (let y = cy - radius - 2; y <= cy + radius + 2; y += 1) {
    for (let x = cx - radius - 2; x <= cx + radius + 2; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < innerRadius || dist > radius) continue;
      let angle = Math.atan2(dy, dx);
      if (angle < -Math.PI / 2) angle += Math.PI * 2;
      const segment = segments.find((item) => angle >= item.start && angle < item.end) || segments[segments.length - 1];
      putPixel(png, x, y, segment.color);
    }
  }
  fillBox(png, cx - innerRadius, cy - innerRadius, innerRadius * 2, innerRadius * 2, "#FFFFFF");
  for (let y = cy - innerRadius; y <= cy + innerRadius; y += 1) {
    for (let x = cx - innerRadius; x <= cx + innerRadius; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (Math.sqrt(dx * dx + dy * dy) <= innerRadius) putPixel(png, x, y, chartColor("#FFFFFF"));
    }
  }
  drawText(png, String(total), cx - String(total).length * 9, cy - 12, 6, "#0F172A");
  drawText(png, "DATA", cx - 28, cy + 32, 3, "#64748B");
}

function drawBarListPng(png, title, rows, x, y, w, h, colors, formatter = (value) => String(value)) {
  fillBox(png, x, y, w, h, "#FFFFFF");
  strokeBox(png, x, y, w, h, "#D8E2EF", 2);
  drawText(png, title, x + 24, y + 24, 4, "#0F172A");
  const list = rows.slice(0, 7);
  const max = Math.max(...list.map((row) => Number(row.value) || 0), 1);
  let rowY = y + 68;
  list.forEach((row, index) => {
    fillBox(png, x + 24, rowY, w - 48, 34, "#F8FAFC");
    strokeBox(png, x + 24, rowY, w - 48, 34, "#D8E2EF", 1);
    drawText(png, String(row.label).slice(0, 18), x + 36, rowY + 9, 3, "#475569");
    fillBox(png, x + 210, rowY + 13, w - 320, 8, "#E2E8F0");
    fillBox(png, x + 210, rowY + 13, Math.max(8, Math.floor((w - 320) * Number(row.value || 0) / max)), 8, colors[index % colors.length]);
    drawText(png, formatter(row.value), x + w - 92, rowY + 9, 3, "#0F172A");
    rowY += 42;
  });
}

function createSupervisorChartPng(data, question, filePath) {
  const width = 1200;
  const height = 880;
  const png = new PNG({ width, height, colorType: 6 });
  fillBox(png, 0, 0, width, height, "#EEF7F7");
  fillBox(png, 30, 30, width - 60, 820, "#FFFFFF");
  strokeBox(png, 30, 30, width - 60, 820, "#CFE3E2", 2);
  fillBox(png, 30, 30, width - 60, 88, "#E8F7F5");
  drawText(png, "RUMAH SAKIT ZEZSZEONSZE", 58, 54, 4, "#047857");
  drawText(png, "GRAFIK SUPERVISOR ELEKTROMEDIS", 58, 82, 5, "#0F172A");
  drawText(png, formatDate(new Date()), 930, 62, 4, "#475569");

  const availability = data.metrics.totalTools
    ? Math.round(((data.metrics.totalTools - data.metrics.problemTools) / data.metrics.totalTools) * 1000) / 10
    : 0;
  const cards = [
    ["TOTAL ALAT", data.metrics.totalTools],
    ["ALAT AKTIF", data.metrics.activeTools],
    ["KONDISI MASALAH", data.metrics.problemTools],
    ["MAINT DUE", data.metrics.maintenanceDue],
    ["KAL DUE", data.metrics.kalibrasiDue],
    ["AVAIL", `${availability}%`],
  ];
  cards.forEach((card, index) => {
    const x = 58 + index * 184;
    fillBox(png, x, 145, 162, 86, "#F8FAFC");
    strokeBox(png, x, 145, 162, 86, "#D8E2EF", 2);
    drawText(png, card[0], x + 14, 164, 3, "#64748B");
    drawText(png, String(card[1]), x + 14, 192, 6, "#0F172A");
  });

  const colors = ["#0D9F91", "#2F7DD1", "#D18B19", "#E75B43", "#607087", "#5CC7A7", "#B8872F"];
  fillBox(png, 58, 260, 500, 260, "#FFFFFF");
  strokeBox(png, 58, 260, 500, 260, "#D8E2EF", 2);
  drawText(png, "DISTRIBUSI KONDISI", 84, 286, 4, "#0F172A");
  drawDonut(png, 190, 398, 88, 48, data.counts.kondisiCounts.slice(0, 5), colors);
  data.counts.kondisiCounts.slice(0, 5).forEach((row, index) => {
    fillBox(png, 330, 330 + index * 34, 18, 18, colors[index % colors.length]);
    drawText(png, `${String(row.label).slice(0, 16)} ${row.value}`, 360, 328 + index * 34, 3, "#0F172A");
  });

  fillBox(png, 590, 260, 552, 260, "#FFFFFF");
  strokeBox(png, 590, 260, 552, 260, "#D8E2EF", 2);
  drawText(png, "MAINTENANCE", 616, 286, 4, "#0F172A");
  drawDonut(png, 720, 398, 88, 48, data.counts.maintenanceTypes.slice(0, 5), colors);
  data.counts.maintenanceTypes.slice(0, 5).forEach((row, index) => {
    fillBox(png, 860, 330 + index * 34, 18, 18, colors[index % colors.length]);
    drawText(png, `${String(row.label).slice(0, 18)} ${row.value}`, 890, 328 + index * 34, 3, "#0F172A");
  });

  drawBarListPng(png, "JUMLAH ALAT PER RUANGAN", data.counts.roomCounts, 58, 550, 500, 260, colors);
  drawBarListPng(png, "NILAI ASET PER RUANGAN", data.counts.assetByRoom, 590, 550, 552, 260, colors, (value) => {
    const number = Number(value || 0);
    if (number >= 1000000000) return `${Math.round(number / 1000000000)}M`;
    if (number >= 1000000) return `${Math.round(number / 1000000)}JT`;
    return String(number);
  });

  drawText(png, "SUMBER DATA: SUPABASE DASHBOARD INVENTARIS ALAT KESEHATAN", 58, 830, 3, "#64748B");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, PNG.sync.write(png));
}

async function createSupervisorChartImage(question, user) {
  const data = await buildSupervisorReportData();
  const fileName = `grafik-supervisor-${Date.now()}.png`;
  const filePath = path.join(REPORTS_DIR, fileName);
  createSupervisorChartPng(data, question, filePath);
  const topCondition = data.counts.kondisiCounts[0];
  const topRoom = data.counts.roomCounts[0];
  const topMaintenance = data.counts.maintenanceTypes[0];
  return {
    filePath,
    caption: [
      "Grafik Supervisor Elektromedis",
      `Total alat: ${data.metrics.totalTools}`,
      `Kondisi dominan: ${topCondition?.label || "-"} (${topCondition?.value || 0})`,
      `Ruangan alat terbanyak: ${topRoom?.label || "-"} (${topRoom?.value || 0})`,
      `Maintenance dominan: ${topMaintenance?.label || "-"} (${topMaintenance?.value || 0})`,
      `Nilai aset terbaca: ${formatCurrency(data.metrics.totalAsset)}`,
    ].join("\n"),
  };
}

function systemPrompt(user, providerName) {
  return [
    `Kamu adalah AI Automation Assistant untuk Inventaris dan Maintenance Alat Kesehatan RS Zezszeonsze di Telegram.`,
    `Mode model: ${providerName}.`,
    `Jawab dalam bahasa Indonesia.`,
    `Gaya: ramah, cepat, tidak kaku, praktis, dan terasa seperti asisten elektromedis yang paham workflow rumah sakit.`,
    `Bot AI ini berbeda dari website dan bot operasional: fokus pada analisis inventaris, penjelasan data, rekomendasi prioritas, histori alat, ringkasan keputusan, dan penyusunan laporan/narasi.`,
    `Gunakan data inventaris yang diberikan sebagai sumber utama untuk fakta, lalu bantu user memahami arti datanya.`,
    `Ikuti batas akses role. Jangan bocorkan data role lain jika konteks sudah difilter.`,
    groundingRules(user),
    roleAiGuide(user),
    answerStyleGuide(user),
    `Untuk perubahan data seperti tambah, edit, hapus, approve, upload, kirim surat, atau download QR, arahkan user ke @InventarisAlkesOpenclaw_bot karena bot itu khusus operasional.`,
    `Jangan mengaku sudah melakukan aksi database kecuali memang ada tool operasional yang dipakai.`,
    `Jika pertanyaan user singkat atau santai, jawab natural dulu lalu bantu arahkan ke hal yang paling relevan.`,
    `Jika pertanyaan kompleks, gunakan struktur pendek: Ringkasan, Data yang terbaca, Analisis, Rekomendasi.`,
    `Role user: ${user?.role || "Guest"}.`,
  ].join("\n");
}

async function askGemini(question, user) {
  log(`answer phase: build context gemini for ${user?.username || user?.nama || "guest"}`);
  const context = await buildAiContext(user, question);
  log(`answer phase: openclaw analysis gemini`);
  const openClawAnalysis = await safeOpenClawAnalysis(question, user);
  const prompt = [
    systemPrompt(user, "Gemini untuk user"),
    "",
    "DATA:",
    context,
    openClawAnalysis ? "\nHASIL ANALISIS OPENCLAW INVENTORY:" : "",
    openClawAnalysis,
    "",
    "PERTANYAAN:",
    question,
  ].filter(Boolean).join("\n");
  const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1000 },
    }),
  }, 60000);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || "";
    if (/quota|rate.?limit|retry/i.test(message)) {
      return "Gemini sedang kena batas pemakaian sementara. Coba kirim ulang beberapa detik lagi.";
    }
    throw new Error(message || `Gemini HTTP ${response.status}`);
  }
  return data?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n").trim() ||
    "Saya belum bisa menemukan jawaban yang pas.";
}

async function askDeepSeek(question, user) {
  log(`answer phase: build context deepseek for ${user?.username || user?.nama || "guest"}`);
  const context = await buildAiContext(user, question);
  log(`answer phase: openclaw analysis deepseek`);
  const openClawAnalysis = await safeOpenClawAnalysis(question, user);
  log(`answer phase: call deepseek`);

  const response = await fetchWithTimeout(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: systemPrompt(user, "DeepSeek V4 Pro via Sumopod") },
        {
          role: "user",
          content: [
            `DATA:\n${context}`,
            openClawAnalysis ? `HASIL ANALISIS OPENCLAW INVENTORY:\n${openClawAnalysis}` : "",
            `PERTANYAAN:\n${question}`,
          ].filter(Boolean).join("\n\n"),
        },
      ],
      temperature: 0.2,
      max_tokens: 2800,
    }),
  }, 90000);

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || data?.message || "";
    if (response.status === 429 || /quota|rate.?limit|too many/i.test(message)) {
      return "DeepSeek/Sumopod sedang kena batas pemakaian sementara (429). Coba kirim ulang beberapa saat lagi.";
    }
    throw new Error(message || `DeepSeek HTTP ${response.status}`);
  }

  log(`answer phase: deepseek response ok`);
  const answer = extractModelText(data);
  if (answer) return answer;

  logModelShape("deepseek", data);
  if (openClawAnalysis && !openClawAnalysis.startsWith("Analisis OpenClaw gagal")) {
    return [
      "Saya belum menerima teks jawaban dari DeepSeek/Sumopod, jadi saya pakai hasil analisis inventaris otomatis yang terbaca dari data.",
      "",
      openClawAnalysis,
    ].join("\n");
  }

  return [
    "DeepSeek/Sumopod merespons, tetapi teks jawabannya kosong.",
    "Coba kirim ulang pertanyaan yang sama. Jika masih kosong, kemungkinan format respons provider custom perlu disesuaikan lagi.",
  ].join("\n");
}

async function askOpenAi(question, user) {
  if (!OPENAI_API_KEY) {
    return [
      "ChatGPT untuk admin belum aktif karena OpenAI API key belum dipasang.",
      "Gemini untuk user sudah tersedia.",
      "Kirim OpenAI API key nanti, lalu saya pasang ke router admin.",
    ].join("\n");
  }

  log(`answer phase: build context openai for ${user?.username || user?.nama || "guest"}`);
  const context = await buildAiContext(user, question);
  log(`answer phase: openclaw analysis openai`);
  const openClawAnalysis = await safeOpenClawAnalysis(question, user);
  const response = await fetchWithTimeout("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        { role: "system", content: systemPrompt(user, "ChatGPT untuk admin") },
        {
          role: "user",
          content: [
            `DATA:\n${context}`,
            openClawAnalysis ? `HASIL ANALISIS OPENCLAW INVENTORY:\n${openClawAnalysis}` : "",
            `PERTANYAAN:\n${question}`,
          ].filter(Boolean).join("\n\n"),
        },
      ],
      temperature: 0.2,
      max_output_tokens: 1000,
    }),
  }, 60000);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = data?.error?.code || "";
    const message = data?.error?.message || "";
    if (code === "insufficient_quota" || /quota|billing/i.test(message)) {
      const fallback = await askGemini(question, user);
      return [
        "Catatan admin: ChatGPT/OpenAI belum bisa dipakai karena kuota atau billing OpenAI belum aktif.",
        "Sementara saya jawab pakai Gemini dulu.",
        "",
        fallback,
      ].join("\n");
    }
    throw new Error(message || `OpenAI HTTP ${response.status}`);
  }
  return data.output_text || "Saya belum bisa menemukan jawaban yang pas.";
}

function aiMenuText(user, isAdmin) {
  const role = normalizeRoleName(user?.role);
  if (!user) {
    return [
      "AI Asisten Inventaris Alkes",
      "Akun: Guest",
      "",
      "Akun Telegram ini belum terdaftar sebagai petugas aktif.",
      "",
      "Demi keamanan data rumah sakit, mode Guest tidak bisa membaca data inventaris, maintenance, kalibrasi, vendor, biaya, atau laporan dashboard.",
      "",
      "Yang bisa dibantu:",
      "- cara daftar akun",
      "- cara menghubungkan Telegram ke akun petugas",
      "- penjelasan umum fungsi bot",
      "",
      `Website dashboard: ${DASHBOARD_URL}`,
      "",
      "Untuk mendaftar atau menghubungkan akun, buka website dashboard atau hubungi Admin agar Telegram kamu dicocokkan dengan data user_petugas.",
    ].join("\n");
  }
  const examples = {
    Admin: [
      "ringkas kondisi aset dan risiko terbesar hari ini",
      "bandingkan performa vendor maintenance dan kalibrasi",
      "buat ringkasan keputusan untuk rapat manajemen",
    ],
    Teknisi: [
      "buatkan prioritas kerja teknisi hari ini dari data alat",
      "alat mana yang sebaiknya dicek dulu dan kenapa?",
      "alat mana yang statusnya paling berisiko dari data inventaris?",
      "buatkan catatan pekerjaan maintenance yang rapi",
      "buat PDF laporan maintenance teknisi hari ini",
      "buat PDF laporan kalibrasi bulan ini",
    ],
    "Kepala Ruangan": [
      "ringkas kondisi alat di ruangan saya",
      "alat mana yang berisiko mengganggu pelayanan?",
      "buatkan laporan alat rusak untuk teknisi",
      "apa yang perlu saya follow up dari maintenance ruangan?",
      "buat PDF laporan kondisi alat ruangan saya",
      "buat PDF laporan kalibrasi ruangan bulan ini",
    ],
    Supervisor: [
      "buat ringkasan eksekutif kondisi elektromedis hari ini",
      "buatkan grafik supervisor kondisi alat, maintenance, kalibrasi, dan nilai aset",
      "kirim grafik visual dashboard supervisor",
      "pengajuan mana yang paling prioritas dan alasannya?",
      "analisis apakah preventive maintenance kita efektif",
      "vendor mana yang perlu dievaluasi dari data pekerjaan?",
      "buatkan PDF laporan supervisor kondisi alat dan grafik",
      "buat PDF laporan kalibrasi bulan ini",
    ],
    "Kepala Supervisor": [
      "buat ringkasan eksekutif kondisi elektromedis hari ini",
      "buatkan grafik supervisor kondisi alat, maintenance, kalibrasi, dan nilai aset",
      "kirim grafik visual dashboard supervisor",
      "pengajuan mana yang paling prioritas dan alasannya?",
      "analisis apakah preventive maintenance kita efektif",
      "vendor mana yang perlu dievaluasi dari data pekerjaan?",
      "buatkan PDF laporan supervisor kondisi alat dan grafik",
      "buat PDF laporan keuangan aset per ruangan",
    ],
    Vendor: [
      "tugas vendor saya apa saja?",
      "buatkan catatan feedback pekerjaan",
      "surat RS mana yang perlu ditindaklanjuti?",
    ],
    Guest: [
      "cara daftar akun?",
      "apa fungsi bot ini?",
    ],
  };
  return [
    "AI Asisten Inventaris Alkes",
    `Akun: ${user.nama || user.username} (${role})`,
    `Model: DeepSeek V4 Pro via Sumopod`,
    "",
    "Fungsi utama bot AI:",
    "- membaca data Supabase/dashboard sesuai role",
    "- menjelaskan arti data dengan bahasa kerja",
    "- memberi prioritas, analisis risiko, dan rekomendasi",
    "- membantu menyusun narasi laporan berdasarkan data inventaris",
    "- untuk aksi operasional tetap diarahkan ke bot operasional",
    "",
    "Contoh chat:",
    ...(examples[role] || examples.Guest).map((item) => `- ${item}`),
    "",
    "Catatan: untuk aksi nyata seperti tambah/edit/hapus/approve/upload/download QR, gunakan @InventarisAlkesOpenclaw_bot.",
  ].join("\n");
}

function guestReply(text, from = {}) {
  const value = normalize(text);
  const identity = [
    `Telegram ID: ${from?.id || "-"}`,
    from?.username ? `Username: @${from.username}` : "Username: -",
  ].join("\n");

  if (value.includes("daftar") || value.includes("register") || value.includes("akun") || value.includes("login")) {
    return [
      "Akun kamu belum terdaftar sebagai petugas aktif.",
      "",
      "Cara daftar akun:",
      `1. Buka website dashboard: ${DASHBOARD_URL}`,
      "2. Pilih Register jika belum punya akun.",
      "3. Isi nama, username, password, nomor HP, email, dan data Telegram jika diminta.",
      "4. Tunggu persetujuan Admin.",
      "",
      "Jika akun website sudah disetujui tetapi Telegram belum terhubung:",
      "1. Kirim data Telegram di bawah ini ke Admin.",
      "2. Admin akan mencocokkan Telegram ID dengan data user_petugas.",
      "3. Setelah terhubung, bot AI bisa membaca data sesuai role kamu.",
      "",
      "Data Telegram kamu:",
      identity,
      "",
      "Kirim data ini ke Admin supaya akun Telegram bisa dihubungkan.",
      "",
      "Catatan keamanan: sebelum terdaftar, bot AI tidak membaca data inventaris rumah sakit.",
    ].join("\n");
  }

  if (value.includes("fungsi") || value.includes("bot") || value.includes("bisa apa")) {
    return [
      "Fungsi bot AI ini adalah membantu petugas yang sudah terdaftar membaca dan menganalisis data inventaris alat kesehatan sesuai role.",
      "",
      `Website dashboard: ${DASHBOARD_URL}`,
      "",
      "Mode Guest hanya bisa melihat panduan umum.",
      "Data inventaris, maintenance, kalibrasi, vendor, biaya, dan laporan tidak dibuka untuk akun yang belum terdaftar.",
      "",
      identity,
    ].join("\n");
  }

  return [
    "Maaf, akun Telegram ini belum terdaftar sebagai petugas aktif.",
    "",
    "Untuk keamanan data rumah sakit, saya tidak bisa menjawab analisis inventaris atau membuka data dashboard pada mode Guest.",
    "",
    "Kamu bisa kirim:",
    "- cara daftar akun",
    "- cara menghubungkan Telegram ke akun petugas",
    "- apa fungsi bot ini",
    "",
    `Website dashboard: ${DASHBOARD_URL}`,
    "",
    "Data Telegram kamu untuk Admin:",
    identity,
  ].join("\n");
}

async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = String(message.text || message.caption || "").trim();
  if (!text) return;

  let user = null;
  try {
    log(`user lookup start for ${message.from?.id || "-"}`);
    user = await findUser(message.from, message);
    log(`user lookup ok for ${message.from?.id || "-"}: ${user ? `${user.username || user.nama || "-"} / ${user.role || "-"}` : "guest"}`);
  } catch (error) {
    log(`user lookup error for ${message.from?.id || "-"}: ${error.message}`);
    await sendMessage(chatId, "Bot AI belum bisa membaca data akun dari Supabase saat ini. Coba ulangi sebentar lagi, atau pastikan koneksi internet laptop/server aktif.");
    return;
  }

  if (text === "/start" || text === "/menu" || text === "/help") {
    await sendMessage(chatId, aiMenuText(user, false));
    return;
  }

  if (!user) {
    await sendMessage(chatId, guestReply(text, message.from));
    return;
  }

  try {
    if (isSupervisorChartRequest(text, user)) {
      log(`supervisor chart start for ${message.from?.id || "-"}: ${text}`);
      await sendMessage(chatId, "Siap, saya buatkan grafik Supervisor dari data dashboard yang terbaca. Tunggu sebentar ya.");
      const chart = await createSupervisorChartImage(text, user);
      log(`supervisor chart file ready for ${message.from?.id || "-"}: ${chart.filePath}`);
      await sendPhoto(chatId, chart.filePath, chart.caption);
      log(`supervisor chart sent for ${message.from?.id || "-"}`);
      if (!isPdfReportRequest(text, user)) return;
    }

    if (isPdfReportRequest(text, user)) {
      const audience = reportAudience(user);
      if (audience === "Kepala Ruangan" && !user?.ruangan_id) {
        await sendMessage(chatId, "Akun Kepala Ruangan belum terhubung ke ruangan. Minta Admin mengisi ruangan_id sebelum membuat laporan PDF.");
        return;
      }
      log(`${normalize(audience)} pdf start for ${message.from?.id || "-"}: ${text}`);
      await sendMessage(
        chatId,
        isDailySupervisorReport(text)
          ? `Siap. Saya sedang membaca data Supabase tanggal ${formatDate(todayJakartaKey())}, menyusun analisis AI untuk ${audience}, lalu membuat PDF laporan harian dengan format Rumah Sakit ZezszeonSze.`
          : `Siap. Saya sedang membaca data Supabase, menyusun analisis AI untuk ${audience}, lalu membuat PDF dengan format Rumah Sakit ZezszeonSze.`
      );
      const report = await createSupervisorPdfReport(text, user);
      log(`${normalize(audience)} pdf file ready for ${message.from?.id || "-"}: ${report.filePath}`);
      await sendDocument(chatId, report.filePath, report.caption);
      log(`${normalize(audience)} pdf sent for ${message.from?.id || "-"}`);
      return;
    }

    const answer = await askDeepSeek(text, user);
    await sendMessage(chatId, answer);
  } catch (error) {
    log(`answer error for ${message.from?.id || "-"}: ${error.message}`);
    await sendMessage(chatId, "AI belum bisa menjawab sekarang. Coba ulangi sebentar lagi, atau gunakan @InventarisAlkesOpenclaw_bot untuk operasional.");
  }
}

async function loop() {
  let me = null;
  while (!me) {
    try {
      me = await telegram("getMe");
      log(`router started as @${me.username}`);
    } catch (error) {
      log(`startup error: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
  let state = loadState();

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
          log(`message ${update.message.from?.id}: ${update.message.text || update.message.caption || ""}`);
          await handleMessage(update.message);
        }
      }
    } catch (error) {
      log(`loop error: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

acquireSingleInstanceLock();
loop();
