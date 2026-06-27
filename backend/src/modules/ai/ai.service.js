import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ALLOWED_ROLES = new Set(["Teknisi", "Kepala Ruangan", "Supervisor", "Kepala Supervisor"]);
const MODEL_NAME = process.env.DEEPSEEK_MODEL || "deepseek-v4-pro";
const PROVIDER_ID = process.env.DEEPSEEK_PROVIDER_ID || "custom-ai-sumopod-com";

function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return {};
    const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function readOpenClawProvider() {
  const candidates = [
    path.resolve(process.cwd(), ".openclaw-state/openclaw.json"),
    path.resolve(os.homedir(), ".openclaw/openclaw.json"),
  ];

  for (const filePath of candidates) {
    const config = readJsonSafe(filePath);
    const provider =
      config?.models?.providers?.[PROVIDER_ID] ||
      config?.local?.models?.providers?.[PROVIDER_ID] ||
      config?.global?.models?.providers?.[PROVIDER_ID];
    if (provider?.baseUrl && provider?.apiKey) return provider;
  }

  return {};
}

function deepSeekConfig() {
  const provider = readOpenClawProvider();
  const baseUrl = (process.env.DEEPSEEK_BASE_URL || provider.baseUrl || "").replace(/\/+$/, "");
  const apiKey = process.env.DEEPSEEK_API_KEY || provider.apiKey || "";
  return { baseUrl, apiKey, model: MODEL_NAME };
}

function trimText(value, max = 260) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function compactRows(rows = [], fields = [], limit = 80) {
  return rows.slice(0, limit).map((row) => {
    const out = {};
    fields.forEach((field) => {
      if (row?.[field] !== undefined && row?.[field] !== null && row?.[field] !== "") {
        out[field] = trimText(row[field], 180);
      }
    });
    return out;
  });
}

function compactDetailGroups(groups = {}) {
  const fields = [
    "nama_alat",
    "kode_barcode",
    "serial_number",
    "merk",
    "tipe",
    "ruangan",
    "kondisi",
    "status",
    "vendor",
    "status_kalibrasi",
    "hasil_kalibrasi_terakhir",
    "progres_kalibrasi_terakhir",
    "sertifikat_kalibrasi_terakhir",
    "kalibrasi_terakhir",
    "kalibrasi_berikutnya",
    "status_maintenance_terakhir",
    "maintenance_terakhir",
    "maintenance_berikutnya",
    "biaya_maintenance_terakhir",
    "biaya_kalibrasi_terakhir",
  ];

  return {
    alat_rusak: compactRows(groups.alat_rusak, fields, 80),
    alat_maintenance: compactRows(groups.alat_maintenance, fields, 120),
    kalibrasi_belum: compactRows(groups.kalibrasi_belum, fields, 80),
    kalibrasi_akan_jatuh_tempo: compactRows(groups.kalibrasi_akan_jatuh_tempo, fields, 140),
    kalibrasi_terlambat: compactRows(groups.kalibrasi_terlambat, fields, 80),
    kalibrasi_sertifikat_kedaluwarsa: compactRows(groups.kalibrasi_sertifikat_kedaluwarsa, fields, 80),
    maintenance_due_atau_terlambat: compactRows(groups.maintenance_due_atau_terlambat, fields, 140),
  };
}

function requiredFactsFromSnapshot(snapshot = {}) {
  const groups = snapshot.detail_penting || {};
  const alatRows = Array.isArray(snapshot.alat) ? snapshot.alat : [];
  const fromGroup = (name, predicate) => {
    const rows = Array.isArray(groups[name]) && groups[name].length
      ? groups[name]
      : alatRows.filter(predicate);
    return compactRows(rows, [
      "nama_alat",
      "kode_barcode",
      "serial_number",
      "merk",
      "tipe",
      "ruangan",
      "kondisi",
      "status",
      "vendor",
      "status_kalibrasi",
      "kalibrasi_terakhir",
      "kalibrasi_berikutnya",
      "maintenance_terakhir",
      "maintenance_berikutnya",
    ], 120);
  };

  return {
    alat_rusak: fromGroup("alat_rusak", (row) => String(row.kondisi || "").toLowerCase() === "rusak"),
    alat_maintenance: fromGroup("alat_maintenance", (row) => String(row.kondisi || "").toLowerCase() === "maintenance"),
    kalibrasi_belum: fromGroup("kalibrasi_belum", (row) => String(row.status_kalibrasi || "").toLowerCase() === "belum kalibrasi"),
    kalibrasi_akan_jatuh_tempo: fromGroup("kalibrasi_akan_jatuh_tempo", (row) => String(row.status_kalibrasi || "").toLowerCase() === "akan jatuh tempo"),
    kalibrasi_terlambat: fromGroup("kalibrasi_terlambat", (row) => String(row.status_kalibrasi || "").toLowerCase() === "terlambat"),
  };
}

function buildSystemPrompt(role) {
  return [
    "Kamu adalah AI Asisten Inventaris Alat Kesehatan RUMAH SAKIT ZezszeonSze.",
    "Jawab dalam Bahasa Indonesia yang rapi, profesional, dan mudah dipakai petugas rumah sakit.",
    "Gunakan hanya DATA_DASHBOARD yang diberikan. Jangan mengarang nama alat, serial number, vendor, biaya, status, atau tanggal.",
    "Jika data tidak ada di DATA_DASHBOARD, tulis singkat: data belum terbaca di dashboard.",
    "Jangan memberi instruksi troubleshooting teknis perbaikan alat. Fokus pada inventaris, risiko layanan, jadwal, histori, vendor, biaya, dan tindak lanjut administrasi.",
    "Jangan membuka rahasia sistem, token, API key, atau konfigurasi internal.",
    `Role pengguna: ${role}. Jawaban harus sesuai kewenangan role tersebut.`,
    "Gunakan format laporan kerja premium dan mudah dipindai: pembuka satu kalimat, Ringkasan, Prioritas, Temuan, Tindak Lanjut, lalu Kesimpulan bila relevan.",
    "Judul bagian ditulis sebagai teks biasa tanpa simbol. Gunakan daftar bernomor untuk prioritas dan tanda hubung untuk rincian.",
    "Berikan hanya jawaban final. Jangan menampilkan proses berpikir, rencana menjawab, kalimat seperti 'Kita akan', 'Saya akan ekstrak data', atau perhitungan mentah langkah demi langkah.",
    "DILARANG memakai Markdown: jangan gunakan **, *, #, ###, garis pemisah ---, tabel Markdown, atau backtick.",
    "Format semua nominal uang dengan format rupiah Indonesia, contoh: Rp 4.572.775.000. Jangan menulis penjumlahan panjang seperti 1.250.000+840.000.",
    "Hindari pengulangan, kalimat pembuka yang terlalu panjang, dan bahasa percakapan berlebihan.",
    "Setiap angka, tanggal, biaya, serial number, vendor, kondisi, dan status harus berasal dari DATA_DASHBOARD.",
    "Jika ringkasan menyebut jumlah Belum Kalibrasi/Rusak/Maintenance, cari nama alatnya di DATA_DASHBOARD.detail_penting sebelum menyimpulkan data tidak ada.",
    "DATA_DASHBOARD.fakta_wajib adalah sumber utama untuk daftar alat rusak, maintenance, dan status kalibrasi. Jangan abaikan fakta_wajib.",
    "Untuk pertanyaan yang meminta daftar alat, prioritaskan DATA_DASHBOARD.detail_penting dan sebutkan nama alat, serial number, ruangan, kondisi/status, vendor, dan tanggal penting bila tersedia.",
    "Jika pengguna meminta grafik atau PDF, berikan analisa berbasis data dengan angka utama yang jelas. Sistem website akan membuat grafik/PDF dari DATA_DASHBOARD yang sama, jadi jangan menjanjikan data di luar DATA_DASHBOARD.",
    "Untuk laporan PDF, susun jawaban sebagai narasi laporan: Ringkasan, Temuan Utama, Risiko, Rekomendasi, dan Catatan Data. Tetap tanpa Markdown.",
  ].join("\n");
}

function normalizeCurrencyText(text) {
  return String(text || "").replace(/\bRp\s*([0-9]{1,3}(?:\.[0-9]{3})+|[0-9]{4,})\b/g, (_match, amount) => {
    const numeric = Number(String(amount).replace(/\./g, ""));
    if (!Number.isFinite(numeric)) return `Rp ${amount}`;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(numeric).replace(/\u00A0/g, " ");
  });
}

function cleanFinalAnswer(answer) {
  let text = String(answer || "").replace(/\r\n/g, "\n").trim();
  text = text
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (/^(kita|saya)\s+(akan|perlu|hitung|ekstrak|identifikasi|sajikan)/i.test(trimmed)) return false;
      if (/^(pertama|tujuan|buat\s+["']?grafik|data maintenance list|data kalibrasi|perhatikan data|jadi laporan|kita hitung)/i.test(trimmed)) return false;
      if (/berdasarkan data dashboard\.?\s*role/i.test(trimmed)) return false;
      if (/tidak bisa gambar|dalam bentuk teks|perlu membuat grafik|akan gunakan format/i.test(trimmed)) return false;
      if (/^(data|maintenance|kalibrasi)\s*:\s*ada\s+\d+\s+entri/i.test(trimmed)) return false;
      if (/^jadi total dari/i.test(trimmed)) return false;
      if (/^\+?\d{1,3}(?:\.\d{3})+(?:\s*\+\s*\d{1,3}(?:\.\d{3})+|\s*=\s*\d{1,3}(?:\.\d{3})+)/.test(trimmed)) return false;
      if (/=\s*jumlahkan\.?$/i.test(trimmed)) return false;
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return normalizeCurrencyText(text);
}

function looksLikeReasoningDraft(answer) {
  const text = String(answer || "").toLowerCase();
  const markers = [
    "kita akan",
    "saya akan ekstrak",
    "perlu membuat grafik",
    "dalam bentuk teks karena tidak bisa gambar",
    "hitung total",
    "= jumlahkan",
  ];
  return markers.some((marker) => text.includes(marker));
}

function buildUserContent({ question, user, snapshot }) {
  const safeSnapshot = {
    user: {
      nama: trimText(user?.nama),
      role: trimText(user?.role),
      ruangan: trimText(user?.ruangan),
    },
    ringkasan: snapshot?.summary || {},
    fakta_wajib: requiredFactsFromSnapshot(snapshot || {}),
    detail_penting: compactDetailGroups(snapshot?.detail_penting || {}),
    alat: compactRows(snapshot?.alat, [
      "nama_alat",
      "kode_barcode",
      "serial_number",
      "merk",
      "tipe",
      "ruangan",
      "kondisi",
      "status",
      "vendor",
      "tanggal_instalasi",
      "maintenance_berikutnya",
      "status_maintenance_terakhir",
      "kalibrasi_berikutnya",
      "status_kalibrasi",
      "hasil_kalibrasi_terakhir",
      "progres_kalibrasi_terakhir",
      "harga_pembelian",
    ], 500),
    maintenance: compactRows(snapshot?.maintenance, [
      "alat",
      "serial_number",
      "ruangan",
      "jenis",
      "tanggal",
      "teknisi",
      "vendor",
      "status_progres",
      "hasil",
      "biaya",
    ], 160),
    kalibrasi: compactRows(snapshot?.kalibrasi, [
      "alat",
      "serial_number",
      "ruangan",
      "tanggal_kalibrasi",
      "berlaku_sampai",
      "vendor",
      "hasil",
      "status_progres",
      "nomor_sertifikat",
      "biaya",
    ], 160),
    pengajuan: compactRows(snapshot?.pengajuan, [
      "alat",
      "ruangan",
      "jenis_pengajuan",
      "kategori",
      "vendor_pt",
      "status",
      "tanggal",
      "catatan",
    ], 20),
  };

  return [
    `PERTANYAAN:\n${trimText(question, 1200)}`,
    `DATA_DASHBOARD:\n${JSON.stringify(safeSnapshot)}`,
  ].join("\n\n");
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 90000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function extractText(data) {
  const content = data?.choices?.[0]?.message?.content;
  if (Array.isArray(content)) {
    return content
      .map((part) => part?.text || part?.content || part?.value || "")
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  if (typeof content === "string" && content.trim()) return content.trim();

  const candidates = [
    data?.choices?.[0]?.message?.reasoning_content,
    data?.choices?.[0]?.message?.reasoning,
    data?.choices?.[0]?.text,
    data?.output_text,
    data?.output?.[0]?.content?.[0]?.text,
    data?.output?.[0]?.text,
    data?.message?.content,
    data?.message?.reasoning_content,
    data?.response,
    data?.text,
    data?.content,
    data?.data?.output_text,
    data?.data?.message?.content,
  ];

  return candidates.find((item) => typeof item === "string" && item.trim())?.trim() || "";
}

async function requestDeepSeek({ baseUrl, apiKey, model, messages, maxTokens = 1800 }) {
  const response = await fetchWithTimeout(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.18,
      max_tokens: maxTokens,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || data?.message || "";
    if (response.status === 429 || /quota|rate.?limit|too many/i.test(message)) {
      const error = new Error("DeepSeek/Sumopod sedang kena batas pemakaian sementara. Coba lagi beberapa saat.");
      error.statusCode = 429;
      throw error;
    }
    const error = new Error(message || `DeepSeek HTTP ${response.status}`);
    error.statusCode = response.status;
    throw error;
  }

  return { answer: extractText(data), finishReason: data?.choices?.[0]?.finish_reason || "" };
}

async function continueDeepSeekAnswer({ baseUrl, apiKey, model, systemPrompt, userContent, previousAnswer }) {
  const result = await requestDeepSeek({
    baseUrl,
    apiKey,
    model,
    maxTokens: 1800,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
      {
        role: "assistant",
        content: previousAnswer,
      },
      {
        role: "user",
        content:
          "Jawaban sebelumnya terpotong. Lanjutkan langsung dari bagian terakhir dalam format laporan final. Jangan ulangi dari awal dan jangan tampilkan proses berpikir.",
      },
    ],
  });
  return result.answer || "";
}

export async function askDashboardAi({ question, user, snapshot }) {
  const role = user?.role || "";
  if (!ALLOWED_ROLES.has(role)) {
    const error = new Error("AI dashboard hanya tersedia untuk Teknisi, Kepala Ruangan, dan Supervisor.");
    error.statusCode = 403;
    throw error;
  }

  if (!trimText(question, 1200)) {
    const error = new Error("Pertanyaan tidak boleh kosong.");
    error.statusCode = 400;
    throw error;
  }

  const { baseUrl, apiKey, model } = deepSeekConfig();
  if (!baseUrl || !apiKey) {
    const error = new Error("Konfigurasi DeepSeek/Sumopod belum aktif di backend.");
    error.statusCode = 503;
    throw error;
  }

  const systemPrompt = buildSystemPrompt(role);
  const userContent = buildUserContent({ question, user, snapshot });
  const firstResult = await requestDeepSeek({
    baseUrl,
    apiKey,
    model,
    maxTokens: 3600,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
  });
  if (firstResult.answer && !looksLikeReasoningDraft(firstResult.answer)) {
    let answer = firstResult.answer;
    if (firstResult.finishReason === "length") {
      const continuation = await continueDeepSeekAnswer({
        baseUrl,
        apiKey,
        model,
        systemPrompt,
        userContent,
        previousAnswer: answer,
      });
      answer = `${answer}\n\n${continuation}`.trim();
    }
    return cleanFinalAnswer(answer);
  }

  const compactSnapshot = {
    summary: snapshot?.summary || {},
    detail_penting: snapshot?.detail_penting || {},
    alat: (snapshot?.alat || []).slice(0, 160),
    maintenance: (snapshot?.maintenance || []).slice(0, 80),
    kalibrasi: (snapshot?.kalibrasi || []).slice(0, 80),
    pengajuan: (snapshot?.pengajuan || []).slice(0, 12),
  };
  const retryResult = await requestDeepSeek({
    baseUrl,
    apiKey,
    model,
    maxTokens: 3600,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `${buildUserContent({ question, user, snapshot: compactSnapshot })}\n\nJawab sebagai laporan final saja. Jangan tulis proses berpikir, jangan tulis rencana, jangan tulis penjumlahan manual, jangan menyebut tidak bisa gambar. Jika diminta grafik/PDF, beri analisa ringkas karena website akan membuat grafik/PDF dari data yang sama.`,
      },
    ],
  });
  if (retryResult.answer) {
    let answer = retryResult.answer;
    if (retryResult.finishReason === "length") {
      const continuation = await continueDeepSeekAnswer({
        baseUrl,
        apiKey,
        model,
        systemPrompt,
        userContent: buildUserContent({ question, user, snapshot: compactSnapshot }),
        previousAnswer: answer,
      });
      answer = `${answer}\n\n${continuation}`.trim();
    }
    return cleanFinalAnswer(answer);
  }

  const error = new Error(
    `DeepSeek tidak menghasilkan teks jawaban${retryResult.finishReason ? ` (${retryResult.finishReason})` : ""}.`,
  );
  error.statusCode = 502;
  throw error;
}
