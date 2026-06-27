const SUPABASE_URL = window.APP_CONFIG?.SUPABASE_URL || "https://brupcvzzrzflfujaijnw.supabase.co";
const SUPABASE_ANON_KEY = window.APP_CONFIG?.SUPABASE_ANON_KEY || "sb_publishable_eQ8iUSOr42sMAgHjXE2ecA_FtvIDoRF";
const API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || "/api";
const AI_CHAT_URL = window.APP_CONFIG?.AI_CHAT_URL || `${API_BASE_URL}/ai/chat`;

const state = {
  user: JSON.parse(localStorage.getItem("petugas-session") || "null"),
  scanCode: new URLSearchParams(window.location.search).get("qr") || new URLSearchParams(window.location.search).get("scan") || "",
  scanId: new URLSearchParams(window.location.search).get("i") || new URLSearchParams(window.location.search).get("id") || "",
  ruangan: [],
  alat: [],
  maintenance: [],
  kalibrasi: [],
  mutasi: [],
  pengajuan: [],
  notifikasi: [],
  historiAlat: [],
  registerUsers: [],
  vendorUsers: [],
  vendorFeedback: [],
  suratVendor: [],
  emailQueue: [],
  qrDownload: null,
  selectedAlatId: null,
  roomFocusId: null,
  alatInsightFilter: null,
  selectedMaintenanceAlatId: null,
  selectedKalibrasiAlatId: null,
  editingAlatId: null,
  editingMaintenanceId: null,
  editingKalibrasiId: null,
  editingNotifikasiId: null,
  pendingPengajuanSourceId: null,
  alatFilter: { room: "", search: "" },
  maintenanceFilter: { room: "", search: "" },
  kalibrasiFilter: { room: "", search: "" },
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const elements = {
  topbar: $(".topbar"),
  scanView: $("#scan-view"),
  scanTitle: $("#scan-title"),
  scanSubtitle: $("#scan-subtitle"),
  scanContent: $("#scan-content"),
  loginView: $("#login-view"),
  dashboard: $("#dashboard"),
  sidebarToggle: $("#sidebar-toggle"),
  qrModal: $("#qr-modal"),
  qrModalTitle: $("#qr-modal-title"),
  qrDownloadImage: $("#qr-download-image"),
  qrDownloadLink: $("#qr-download-link"),
  qrOpenButton: $("#qr-open-button"),
  qrPrintButton: $("#qr-print-button"),
  loginForm: $("#login-form"),
  registerForm: $("#register-form"),
  loginMessage: $("#login-message"),
  registerMessage: $("#register-message"),
  approvalMessage: $("#approval-message"),
  registerRole: $("#register-role"),
  registerKepalaFields: $("#register-kepala-fields"),
  registerVendorFields: $("#register-vendor-fields"),
  registerRuangan: $("#register-ruangan"),
  sessionPill: $("#session-pill"),
  logoutButton: $("#logout-button"),
  refreshButton: $("#refresh-button"),
  alatForm: $("#alat-form"),
  maintenanceForm: $("#maintenance-form"),
  kalibrasiForm: $("#kalibrasi-form"),
  mutasiForm: $("#mutasi-form"),
  alatMessage: $("#alat-message"),
  alatSubmitButton: $("#alat-submit-button"),
  alatCancelButton: $("#alat-cancel-button"),
  openAlatFormButton: $("#open-alat-form-button"),
  openMaintenanceFormButton: $("#open-maintenance-form-button"),
  openKalibrasiFormButton: $("#open-kalibrasi-form-button"),
  openPengajuanMaintenanceFormButton: $("#open-pengajuan-maintenance-form-button"),
  openPengajuanKalibrasiFormButton: $("#open-pengajuan-kalibrasi-form-button"),
  activeRoomFilter: $("#active-room-filter"),
  activeRoomFilterText: $("#active-room-filter-text"),
  backRoomFilterButton: $("#back-room-filter-button"),
  clearRoomFilterButton: $("#clear-room-filter-button"),
  alatLogRuangan: $("#alat-log-ruangan"),
  alatLogSearch: $("#alat-log-search"),
  alatSearchButton: $("#alat-search-button"),
  maintenanceMessage: $("#maintenance-message"),
  kalibrasiMessage: $("#kalibrasi-message"),
  mutasiMessage: $("#mutasi-message"),
  pengajuanMessage: $("#pengajuan-message"),
  notifikasiMessage: $("#notifikasi-message"),
  notifikasiEditMessage: $("#notifikasi-edit-message"),
  notifikasiTable: $("#notifikasi-table"),
  notifikasiForm: $("#notifikasi-form"),
  notifikasiFormTitle: $("#notifikasi-form-title"),
  notifikasiStatus: $("#notifikasi-status"),
  notifikasiCatatanUpdate: $("#notifikasi-catatan-update"),
  notifikasiFotoUpdate: $("#notifikasi-foto-update"),
  notifikasiCancelButton: $("#notifikasi-cancel-button"),
  laporanKrForm: $("#laporan-kr-form"),
  laporanKrMessage: $("#laporan-kr-message"),
  laporanKrJenis: $("#laporan-kr-jenis"),
  laporanKrKategoriWrap: $("#laporan-kr-kategori-wrap"),
  laporanKrKategori: $("#laporan-kr-kategori"),
  laporanKrVendorWrap: $("#laporan-kr-vendor-wrap"),
  laporanKrVendor: $("#laporan-kr-vendor"),
  laporanKrAlat: $("#laporan-kr-alat"),
  laporanKrTable: $("#laporan-kr-table"),
  laporanKrHistoryTable: $("#laporan-kr-history-table"),
  alatRuangan: $("#alat-ruangan"),
  alatKepemilikan: $("#alat-kepemilikan"),
  alatKsoType: $("#alat-kso-type"),
  alatKsoSplitFields: $("#alat-kso-split-fields"),
  alatKsoFeeWrap: $("#alat-kso-fee-wrap"),
  alatSewaDurationWrap: $("#alat-sewa-duration-wrap"),
  alatTanggalInstalasi: $("#alat-tanggal-instalasi"),
  alatTanggalSewa: $("#alat-tanggal-sewa"),
  alatKsoFields: $("#alat-kso-fields"),
  alatSewaFields: $("#alat-sewa-fields"),
  maintenanceLogRoomWrap: $("#maintenance-log-room-wrap"),
  kalibrasiLogRoomWrap: $("#kalibrasi-log-room-wrap"),
  pengajuanJenis: $("#pengajuan-jenis"),
  pengajuanKategoriWrap: $("#pengajuan-kategori-wrap"),
  pengajuanKategori: $("#pengajuan-kategori"),
  pengajuanVendorWrap: $("#pengajuan-vendor-wrap"),
  pengajuanVendor: $("#pengajuan-vendor"),
  maintenanceRuangan: $("#maintenance-ruangan"),
  maintenanceAlat: $("#maintenance-alat"),
  maintenanceLogRuangan: $("#maintenance-log-ruangan"),
  maintenanceLogSearch: $("#maintenance-log-search"),
  maintenanceSearchButton: $("#maintenance-search-button"),
  kalibrasiRuangan: $("#kalibrasi-ruangan"),
  kalibrasiAlat: $("#kalibrasi-alat"),
  kalibrasiLogRuangan: $("#kalibrasi-log-ruangan"),
  kalibrasiLogSearch: $("#kalibrasi-log-search"),
  kalibrasiSearchButton: $("#kalibrasi-search-button"),
  mutasiAlat: $("#mutasi-alat"),
  mutasiDariRuangan: $("#mutasi-dari-ruangan"),
  mutasiKeRuangan: $("#mutasi-ke-ruangan"),
  pengajuanForm: $("#pengajuan-form"),
  pengajuanRuangan: $("#pengajuan-ruangan"),
  pengajuanAlat: $("#pengajuan-alat"),
  historyTeknisiTable: $("#history-teknisi-table"),
  vendorFeedbackForm: $("#vendor-feedback-form"),
  vendorFeedbackRecord: $("#vendor-feedback-record"),
  vendorFeedbackMessage: $("#vendor-feedback-message"),
  vendorFeedbackActionMessage: $("#vendor-feedback-action-message"),
  vendorFeedbackLayout: $("#vendor-feedback-layout"),
  vendorFeedbackTable: $("#vendor-feedback-table"),
  vendorLetterTable: $("#vendor-letter-table"),
  vendorSuratTable: $("#vendor-surat-table"),
  aiFloat: $("#ai-float"),
  aiFloatButton: $("#ai-float-button"),
  aiFloatPanel: $("#ai-float-panel"),
  aiFloatClose: $("#ai-float-close"),
  aiFloatTitle: $("#ai-float-title"),
  aiFloatSubtitle: $("#ai-float-subtitle"),
  aiChatMessages: $("#ai-chat-messages"),
  aiChatPrompts: $("#ai-chat-prompts"),
  aiChatForm: $("#ai-chat-form"),
  aiChatInput: $("#ai-chat-input"),
  aiMicButton: $("#ai-mic-button"),
  aiMicLabel: $("#ai-mic-label"),
  aiSpeechToggle: $("#ai-speech-toggle"),
  aiSpeechLabel: $("#ai-speech-label"),
  showRegisterButton: $("#show-register"),
  showLoginButton: $("#show-login"),
};

function authHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function supabase(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...options.headers,
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || data?.hint || `Supabase HTTP ${response.status}`);
  }

  return data;
}

async function supabaseOptional(path, fallback = []) {
  try {
    return await supabase(path);
  } catch {
    return fallback;
  }
}

async function supabaseAll(path, pageSize = 1000) {
  const cleanPath = String(path)
    .replace(/([?&])limit=\d+&?/i, "$1")
    .replace(/([?&])offset=\d+&?/i, "$1")
    .replace(/[?&]$/, "");
  const rows = [];
  for (let offset = 0; ; offset += pageSize) {
    const separator = cleanPath.includes("?") ? "&" : "?";
    const page = await supabase(`${cleanPath}${separator}limit=${pageSize}&offset=${offset}`);
    if (!Array.isArray(page)) return page;
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

async function supabaseAllOptional(path, fallback = []) {
  try {
    return await supabaseAll(path);
  } catch {
    return fallback;
  }
}

function setMessage(element, text, type = "") {
  element.textContent = text;
  element.className = `message ${type ? `is-${type}` : ""}`;
}

function showAuthMode(mode = "login") {
  const register = mode === "register";
  elements.loginForm.classList.toggle("is-hidden", register);
  elements.registerForm.classList.toggle("is-hidden", !register);
  setMessage(elements.loginMessage, "");
  setMessage(elements.registerMessage, "");
}

function badge(value) {
  const cls =
    value === "Rusak" || value === "Buruk" || value === "Risiko Tinggi" || value === "Expired"
      ? "is-danger"
      : value === "Maintenance" || value === "Tidak Aktif" || value === "Perlu Perhatian" || value === "Risiko Sedang"
        ? "is-warning"
        : "";
  return `<span class="badge ${cls}">${escapeHtml(value || "-")}</span>`;
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}

const PREVENTIVE_INTERVAL_MONTHS = {
  Tinggi: 1,
  Sedang: 3,
  Rendah: 6,
};

function isoDate(value) {
  if (!value) return "";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addMonthsToDate(value, months) {
  if (!value) return "";
  const source = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(source.getTime())) return "";
  const originalDay = source.getDate();
  source.setDate(1);
  source.setMonth(source.getMonth() + Number(months || 0));
  const lastDay = new Date(source.getFullYear(), source.getMonth() + 1, 0).getDate();
  source.setDate(Math.min(originalDay, lastDay));
  return isoDate(source.toISOString().slice(0, 10));
}

function inferRiskLevel(alat = {}) {
  const name = String(alat.nama_alat || "").toLowerCase();
  if (/(ventilator|defibrillator|anestesi|patient monitor|monitor pasien|infusion pump|syringe pump|incubator|infant warmer|c-arm)/.test(name)) {
    return "Tinggi";
  }
  if (/(ecg|usg|ultrasound|suction|sterilizer|autoclave|analyzer|centrifuge|phototherapy|pulse oximeter|capnograph)/.test(name)) {
    return "Sedang";
  }
  return "Rendah";
}

function preventiveRisk(alat = {}) {
  return alat.tingkat_risiko || inferRiskLevel(alat);
}

function daysUntil(value) {
  if (!value) return null;
  const target = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / 86400000);
}

function scheduleStatus(value) {
  const days = daysUntil(value);
  if (days === null) return { label: "Belum dijadwalkan", className: "is-warning" };
  if (days < 0) return { label: `Terlambat ${Math.abs(days)} hari`, className: "is-danger" };
  if (days === 0) return { label: "Hari ini", className: "is-warning" };
  if (days <= 7) return { label: `${days} hari lagi`, className: "is-danger" };
  return { label: `${days} hari lagi`, className: "is-warning" };
}

function riskBadge(value) {
  const risk = value || "Sedang";
  const className = risk === "Tinggi" ? "is-danger" : risk === "Sedang" ? "is-warning" : "";
  return `<span class="badge ${className}">${escapeHtml(risk)}</span>`;
}

function cleanLabel(value, fallback = "-") {
  const text = String(value ?? "").trim();
  if (!text || text === "undefined" || text === "null") return fallback;
  return text.replace(/\b(undefined|null)\s*[-/]\s*/gi, "").replace(/\s*[-/]\s*\b(undefined|null)\b/gi, "").trim() || fallback;
}

function roomName(id) {
  const room = state.ruangan.find((item) => item.id === id);
  return cleanLabel(room?.nama_ruangan);
}

function alatName(id) {
  return state.alat.find((item) => item.id === id)?.nama_alat || "-";
}

function alatVendor(id) {
  const alat = state.alat.find((item) => item.id === id);
  return cleanLabel(alat?.vendor || alat?.vendor_pt || alat?.perusahaan);
}

function reportVendorName(row) {
  return cleanLabel(row?.vendor_pt || row?.vendor || alatVendor(row?.alat_id));
}

function reportCount(value) {
  if (Array.isArray(value)) return value.length;
  if (value instanceof Set || value instanceof Map) return value.size;
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function safeReportKpiValue(value) {
  if (Array.isArray(value)) return value.length;
  if (value instanceof Set || value instanceof Map) return value.size;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const text = String(value ?? "").trim();
  if (!text || /^nan$/i.test(text) || /^undefined$/i.test(text) || /^null$/i.test(text)) return 0;
  return text;
}

function detailLine(primary, secondary) {
  return [primary, secondary].filter(Boolean).join(" / ") || "-";
}

function qrClip(value, maxLength) {
  const text = String(value || "-").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

function scanBaseUrl() {
  const origin = window.location?.origin || "";
  if (origin && origin !== "null" && origin.startsWith("http")) return origin;
  return "https://inventarisalkes-7f32c.web.app";
}

function scanAlatUrl(code) {
  const url = new URL(scanBaseUrl());
  url.searchParams.set("qr", String(code || "").trim());
  return url.toString();
}

function scanAlatIdUrl(id) {
  const url = new URL(scanBaseUrl());
  url.searchParams.set("i", String(id || "").trim());
  return url.toString();
}

function qrScanPayload(item) {
  if (!item || typeof item !== "object") return String(item || "-");
  return item.id ? scanAlatIdUrl(item.id) : scanAlatUrl(item.kode_barcode);
}

function qrCodeImage(value, label = value) {
  const payload = String(value || "-");
  const code = String(label || payload);
  const src = qrCodeSvgUrl(payload);

  return `
    <div class="qr-wrap">
      <img class="qr-image" src="${escapeHtml(src)}" alt="QR Code ${escapeHtml(code)}" loading="lazy" />
      <span class="barcode-text">${escapeHtml(code)}</span>
    </div>
  `;
}

function qrCodeSvgUrl(value) {
  const payload = String(value || "-");
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=12&data=${encodeURIComponent(payload)}`;
}

function localQrCodeSvgUrl(value) {
  const matrix = makeQrMatrix(String(value || "-"));
  const border = 3;
  const cell = 6;
  const size = (matrix.length + border * 2) * cell;
  const darkCells = [];

  matrix.forEach((row, y) => {
    row.forEach((isDark, x) => {
      if (isDark) {
        darkCells.push(`<rect x="${(x + border) * cell}" y="${(y + border) * cell}" width="${cell}" height="${cell}"/>`);
      }
    });
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><g fill="#111827">${darkCells.join("")}</g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function downloadQr(value, name = "", merk = "", autoDownload = false) {
  const code = String(value || "qr-code");
  const title = name ? String(name).toUpperCase() : "ALAT KESEHATAN";
  const canvas = buildQrDownloadCanvas({ value: code, title });
  const filename = [barcodePart(name), barcodePart(merk), "QR"].filter(Boolean).join("-") || barcodePart(code) || "QR-CODE";
  const imageUrl = canvas.toDataURL("image/png");
  const blob = dataUrlToBlob(imageUrl);
  const objectUrl = URL.createObjectURL(blob);

  if (state.qrDownload?.objectUrl) {
    URL.revokeObjectURL(state.qrDownload.objectUrl);
  }

  state.qrDownload = { imageUrl, objectUrl, filename: `${filename}.png`, title };
  if (elements.qrModalTitle) elements.qrModalTitle.textContent = title;
  if (elements.qrDownloadImage) elements.qrDownloadImage.src = imageUrl;
  if (elements.qrDownloadLink) {
    elements.qrDownloadLink.href = objectUrl;
    elements.qrDownloadLink.download = `${filename}.png`;
  }
  elements.qrModal?.classList.remove("is-hidden");

  if (autoDownload) {
    triggerQrDownloadLink();
  }
}

function triggerQrDownloadLink() {
  if (!state.qrDownload?.objectUrl) return;
  const link = document.createElement("a");
  link.href = state.qrDownload.objectUrl;
  link.download = state.qrDownload.filename || "QR-CODE.png";
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
}

async function saveCurrentQrDownload() {
  if (!state.qrDownload?.imageUrl) return;
  const filename = state.qrDownload.filename || "QR-CODE.png";
  const blob = dataUrlToBlob(state.qrDownload.imageUrl);
  const file = new File([blob], filename, { type: "image/png" });

  try {
    if (window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: "PNG Image",
            accept: { "image/png": [".png"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    }

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: state.qrDownload.title || "QR Code",
        text: "QR Code alat kesehatan",
      });
      return;
    }
  } catch (error) {
    if (error?.name === "AbortError") return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function openCurrentQrImage() {
  if (!state.qrDownload?.imageUrl) return;
  const popup = window.open();
  if (!popup) {
    alert("Browser memblokir tab baru. Tekan lama gambar QR lalu pilih Simpan gambar.");
    return;
  }
  popup.document.open();
  popup.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(state.qrDownload.title || "QR Code")}</title>
        <style>
          body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f8fafc; }
          img { width: min(94vw, 680px); height: auto; background: #fff; }
        </style>
      </head>
      <body><img src="${state.qrDownload.imageUrl}" alt="${escapeHtml(state.qrDownload.title || "QR Code")}" /></body>
    </html>
  `);
  popup.document.close();
}

function closeQrModal() {
  elements.qrModal?.classList.add("is-hidden");
}

function printCurrentQrDownload() {
  if (!state.qrDownload?.imageUrl) return;
  const popup = window.open("", "_blank", "width=760,height=920");
  if (!popup) {
    alert("Popup diblokir browser. Izinkan popup untuk print QR.");
    return;
  }
  popup.document.open();
  popup.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(state.qrDownload.title || "QR Code")}</title>
        <style>
          body { margin: 0; display: grid; min-height: 100vh; place-items: center; background: #fff; }
          img { width: min(92vw, 620px); height: auto; }
          @media print { body { min-height: auto; } img { width: 100%; } }
        </style>
      </head>
      <body><img src="${state.qrDownload.imageUrl}" alt="${escapeHtml(state.qrDownload.title || "QR Code")}" /></body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  popup.print();
}

function buildQrDownloadCanvas({ value, title }) {
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 860;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#d7dde7";
  ctx.lineWidth = 2;
  ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);

  ctx.fillStyle = "#0f9f8f";
  ctx.fillRect(32, 32, canvas.width - 64, 8);
  ctx.fillStyle = "#172033";
  ctx.textAlign = "center";
  ctx.font = "800 34px Arial, sans-serif";
  wrapCanvasText(ctx, title, canvas.width / 2, 108, 600, 40);

  const qrCanvas = document.createElement("canvas");
  drawQrToCanvas(qrCanvas, value, 16, 4);
  const qrSize = 560;
  ctx.drawImage(qrCanvas, (canvas.width - qrSize) / 2, 190, qrSize, qrSize);

  ctx.fillStyle = "#667085";
  ctx.font = "800 20px Arial, sans-serif";
  ctx.fillText("RS Zeonsze", canvas.width / 2, 808);

  return canvas;
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text || "").split(/\s+/);
  let line = "";
  let currentY = y;
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = test;
    }
  });
  if (line) ctx.fillText(line, x, currentY);
}

function dataUrlToBlob(dataUrl) {
  const [header, base64] = String(dataUrl || "").split(",");
  const mime = header.match(/data:(.*?);/)?.[1] || "image/png";
  const binary = atob(base64 || "");
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mime });
}

function drawQrToCanvas(canvas, value, cell = 12, border = 4) {
  const matrix = makeQrMatrix(String(value || "-"));
  const size = (matrix.length + border * 2) * cell;
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#111827";

  matrix.forEach((row, y) => {
    row.forEach((isDark, x) => {
      if (isDark) {
        ctx.fillRect((x + border) * cell, (y + border) * cell, cell, cell);
      }
    });
  });
}

function makeQrMatrix(value) {
  const bytes = Array.from(new TextEncoder().encode(value));
  const levels = [
    { version: 1, dataCodewords: 19, eccCodewords: 7 },
    { version: 2, dataCodewords: 34, eccCodewords: 10 },
    { version: 3, dataCodewords: 55, eccCodewords: 15 },
    { version: 4, dataCodewords: 80, eccCodewords: 20 },
  ];
  const spec = levels.find((item) => bytes.length <= item.dataCodewords - 2) || levels.at(-1);
  const data = makeQrDataCodewords(bytes, spec.dataCodewords);
  const ecc = reedSolomonRemainder(data, spec.eccCodewords);
  const bits = [...data, ...ecc].flatMap((byte) => byteToBits(byte));
  const size = 21 + (spec.version - 1) * 4;
  const matrix = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved = Array.from({ length: size }, () => Array(size).fill(false));

  drawFinder(matrix, reserved, 0, 0);
  drawFinder(matrix, reserved, size - 7, 0);
  drawFinder(matrix, reserved, 0, size - 7);
  drawTiming(matrix, reserved);
  drawAlignment(matrix, reserved, spec.version);
  reserveFormatAreas(reserved, spec.version);
  matrix[size - 8][8] = true;
  reserved[size - 8][8] = true;
  placeQrData(matrix, reserved, bits);
  drawFormatBits(matrix, reserved, "111011111000100");

  return matrix;
}

function makeQrDataCodewords(bytes, totalCodewords) {
  const bits = [0, 1, 0, 0, ...byteToBits(bytes.length)];
  bytes.forEach((byte) => bits.push(...byteToBits(byte)));

  const maxBits = totalCodewords * 8;
  bits.push(...Array(Math.min(4, maxBits - bits.length)).fill(0));
  while (bits.length % 8) bits.push(0);

  const codewords = [];
  for (let i = 0; i < bits.length; i += 8) {
    codewords.push(bitsToByte(bits.slice(i, i + 8)));
  }

  let pad = 0xec;
  while (codewords.length < totalCodewords) {
    codewords.push(pad);
    pad = pad === 0xec ? 0x11 : 0xec;
  }

  return codewords.slice(0, totalCodewords);
}

function byteToBits(byte) {
  return Array.from({ length: 8 }, (_, index) => (byte >> (7 - index)) & 1);
}

function bitsToByte(bits) {
  return bits.reduce((value, bit) => (value << 1) | bit, 0);
}

function drawFinder(matrix, reserved, x, y) {
  const size = matrix.length;

  for (let row = -1; row <= 7; row += 1) {
    for (let col = -1; col <= 7; col += 1) {
      const yy = y + row;
      const xx = x + col;
      if (yy < 0 || yy >= size || xx < 0 || xx >= size) continue;

      const inPattern = row >= 0 && row <= 6 && col >= 0 && col <= 6;
      const isDark = inPattern && (row === 0 || row === 6 || col === 0 || col === 6 || (row >= 2 && row <= 4 && col >= 2 && col <= 4));
      matrix[yy][xx] = isDark;
      reserved[yy][xx] = true;
    }
  }
}

function drawTiming(matrix, reserved) {
  for (let i = 8; i < matrix.length - 8; i += 1) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
    reserved[6][i] = true;
    reserved[i][6] = true;
  }
}

function drawAlignment(matrix, reserved, version) {
  if (version === 1) return;
  const center = 18 + (version - 2) * 4;

  for (let y = center - 2; y <= center + 2; y += 1) {
    for (let x = center - 2; x <= center + 2; x += 1) {
      const distance = Math.max(Math.abs(x - center), Math.abs(y - center));
      matrix[y][x] = distance !== 1;
      reserved[y][x] = true;
    }
  }
}

function reserveFormatAreas(reserved, version) {
  const size = reserved.length;

  for (let i = 0; i < 9; i += 1) {
    reserved[8][i] = true;
    reserved[i][8] = true;
  }

  for (let i = 0; i < 8; i += 1) {
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }

  if (version >= 7) {
    for (let i = 0; i < 6; i += 1) {
      for (let j = 0; j < 3; j += 1) {
        reserved[i][size - 11 + j] = true;
        reserved[size - 11 + j][i] = true;
      }
    }
  }
}

function placeQrData(matrix, reserved, bits) {
  const size = matrix.length;
  let bitIndex = 0;
  let upward = true;

  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right -= 1;

    for (let offset = 0; offset < size; offset += 1) {
      const y = upward ? size - 1 - offset : offset;

      for (let col = 0; col < 2; col += 1) {
        const x = right - col;
        if (reserved[y][x]) continue;

        const rawBit = bitIndex < bits.length ? bits[bitIndex] === 1 : false;
        const mask = (x + y) % 2 === 0;
        matrix[y][x] = rawBit !== mask;
        bitIndex += 1;
      }
    }

    upward = !upward;
  }
}

function drawFormatBits(matrix, reserved, bits) {
  const size = matrix.length;
  const bit = (index) => bits[index] === "1";

  for (let i = 0; i <= 5; i += 1) matrix[8][i] = bit(i);
  matrix[8][7] = bit(6);
  matrix[8][8] = bit(7);
  matrix[7][8] = bit(8);
  for (let i = 9; i < 15; i += 1) matrix[14 - i][8] = bit(i);

  for (let i = 0; i < 8; i += 1) matrix[size - 1 - i][8] = bit(i);
  for (let i = 8; i < 15; i += 1) matrix[8][size - 15 + i] = bit(i);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (x === 8 || y === 8) reserved[y][x] = true;
    }
  }
}

function reedSolomonRemainder(data, degree) {
  const generator = reedSolomonGenerator(degree);
  const result = Array(degree).fill(0);

  data.forEach((byte) => {
    const factor = byte ^ result.shift();
    result.push(0);

    generator.forEach((coefficient, index) => {
      result[index] ^= gfMultiply(coefficient, factor);
    });
  });

  return result;
}

function reedSolomonGenerator(degree) {
  let result = [1];

  for (let i = 0; i < degree; i += 1) {
    const next = Array(result.length + 1).fill(0);
    result.forEach((coefficient, index) => {
      next[index] ^= gfMultiply(coefficient, 1);
      next[index + 1] ^= gfMultiply(coefficient, gfPow(2, i));
    });
    result = next;
  }

  return result.slice(1);
}

function gfPow(base, exponent) {
  let result = 1;
  for (let i = 0; i < exponent; i += 1) result = gfMultiply(result, base);
  return result;
}

function gfMultiply(left, right) {
  let result = 0;
  let a = left;
  let b = right;

  while (b > 0) {
    if (b & 1) result ^= a;
    a <<= 1;
    if (a & 0x100) a ^= 0x11d;
    b >>= 1;
  }

  return result;
}

const ROLE_TABS = {
  Admin: ["overview", "alat", "maintenance", "kalibrasi", "mutasi", "pengajuan", "ruangan", "register"],
  Teknisi: ["overview", "alat", "maintenance", "kalibrasi", "mutasi", "pengajuan-maintenance", "pengajuan-kalibrasi", "notifikasi", "feedback-vendor", "ruangan"],
  "Kepala Ruangan": ["overview", "alat", "maintenance", "kalibrasi", "mutasi", "pengajuan", "laporan-kr"],
  Supervisor: ["supervisor-overview", "pengajuan", "maintenance", "kalibrasi", "ruangan", "supervisor-vendor", "supervisor-keuangan", "supervisor-laporan", "supervisor-detail-alat"],
  "Kepala Supervisor": ["supervisor-overview", "pengajuan", "maintenance", "kalibrasi", "ruangan", "supervisor-vendor", "supervisor-keuangan", "supervisor-laporan", "supervisor-detail-alat"],
  Vendor: ["overview", "maintenance", "kalibrasi", "feedback-vendor", "vendor-surat"],
};

function roleLabel(role) {
  return role || "-";
}

function isSupervisorRole(role = state.user?.role) {
  return role === "Supervisor" || role === "Kepala Supervisor";
}

function currentVendorScope() {
  return state.user?.nama_pt || state.user?.namaPt || "";
}

function currentRoomId() {
  return state.user?.ruangan_id || null;
}

function currentVendorService() {
  return state.user?.vendor_layanan || state.user?.vendorService || "";
}

function vendorLabel(user = state.user) {
  return user?.nama_pt || user?.nama || user?.username || "-";
}

function serviceForPengajuan(item) {
  return item.jenis_pengajuan === "Kalibrasi" ? "Kalibrasi" : "Maintenance";
}

function needsVendorForPengajuan(item) {
  return (
    item.jenis_pengajuan === "Kalibrasi" ||
    item.kategori === "Corrective Berat" ||
    item.kategori === "Emergency (Breakdown)"
  );
}

function allowedTabsForCurrentUser() {
  const tabs = ROLE_TABS[state.user?.role] || ["overview"];
  if (state.user?.role === "Vendor") {
    const service = currentVendorService();
    return tabs.filter((tab) => tab === "overview" || tab === "feedback-vendor" || tab === "vendor-surat" || tab === service?.toLowerCase());
  }
  return tabs;
}

function canSeeAlat(item) {
  if (!state.user) return false;
  if (state.user.role === "Admin" || state.user.role === "Teknisi" || isSupervisorRole()) return true;
  if (state.user.role === "Kepala Ruangan") return item.ruangan_id && item.ruangan_id === currentRoomId();

  if (state.user.role === "Vendor") {
    const service = currentVendorService();
    const vendorName = currentVendorScope();
    if (!vendorName) return false;

    const serviceRows = service === "Kalibrasi"
      ? state.kalibrasi.filter((row) => row.vendor_pt === vendorName)
      : state.maintenance.filter((row) => row.vendor_pt === vendorName);
    return serviceRows.some((row) => row.alat_id === item.id);
  }

  return false;
}

function canSeeRecordByRoom(item) {
  if (state.user?.role !== "Kepala Ruangan") return true;
  const roomId = currentRoomId();
  if (!roomId) return false;
  return item.ruangan_id === roomId;
}

function canSeeVendorRecord(item) {
  if (state.user?.role !== "Vendor") return true;
  const vendorName = currentVendorScope();
  const service = currentVendorService();
  if (!vendorName) return false;
  const recordVendor = item.vendor_pt || item.vendor || "";
  if (recordVendor !== vendorName) return false;
  if (!service || !item.service_type) return true;
  return cleanLabel(item.service_type).toLowerCase() === cleanLabel(service).toLowerCase();
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.readAsDataURL(file);
  });
}

function renderShell() {
  if (state.scanCode || state.scanId) {
    elements.topbar.classList.add("is-hidden");
    elements.scanView.classList.remove("is-hidden");
    elements.loginView.classList.add("is-hidden");
    elements.dashboard.classList.add("is-hidden");
    elements.sessionPill.textContent = "Scan QR";
    return;
  }

  elements.topbar.classList.remove("is-hidden");
  elements.scanView.classList.add("is-hidden");
  const isLoggedIn = Boolean(state.user);
  const isAdmin = state.user?.role === "Admin";
  const supervisor = isSupervisorRole();
  elements.loginView.classList.toggle("is-hidden", isLoggedIn);
  elements.dashboard.classList.toggle("is-hidden", !isLoggedIn);
  const extras =
    state.user?.role === "Kepala Ruangan"
      ? ` | ${roomName(state.user.ruangan_id)}`
      : state.user?.role === "Vendor"
        ? ` | ${currentVendorScope()}${currentVendorService() ? ` (${currentVendorService()})` : ""}`
        : "";
  elements.sessionPill.textContent = isLoggedIn ? `${state.user.nama} | ${state.user.role}${extras}` : "Belum login";
  $$(".admin-only").forEach((item) => item.classList.toggle("is-hidden", !isAdmin));
  const canManageAlat = ["Admin", "Teknisi"].includes(state.user?.role);
  elements.openAlatFormButton?.classList.toggle("is-hidden", !canManageAlat);
  elements.openMaintenanceFormButton?.classList.toggle("is-hidden", !canManageAlat);
  elements.openKalibrasiFormButton?.classList.toggle("is-hidden", !canManageAlat);
  elements.openPengajuanMaintenanceFormButton?.classList.toggle("is-hidden", !canManageAlat);
  elements.openPengajuanKalibrasiFormButton?.classList.toggle("is-hidden", !canManageAlat);
  const canUseDashboardAi = ["Teknisi", "Kepala Ruangan"].includes(state.user?.role) || supervisor;
  elements.aiFloat?.classList.toggle("is-hidden", !isLoggedIn || !canUseDashboardAi);
  if (isLoggedIn && canUseDashboardAi) renderAiWidgetIntro();
  if (!isLoggedIn || !canUseDashboardAi) elements.aiFloatPanel?.classList.add("is-hidden");
  if (!canManageAlat) {
    elements.alatForm?.classList.add("is-hidden");
    elements.openAlatFormButton?.classList.remove("is-active");
    closeMaintenanceForm();
    closeKalibrasiForm();
    pengajuanForms().forEach(closePengajuanSideForm);
  }

  const allowedTabs = new Set(allowedTabsForCurrentUser());
  $$(".tab[data-tab]").forEach((item) => item.classList.toggle("is-hidden", !allowedTabs.has(item.dataset.tab)));
  const pengajuanTab = document.querySelector('.tab[data-tab="pengajuan"]');
  if (pengajuanTab) pengajuanTab.textContent = supervisor ? "Persetujuan" : "Pengajuan";
  const maintenanceTab = document.querySelector('.tab[data-tab="maintenance"]');
  if (maintenanceTab) maintenanceTab.textContent = supervisor ? "Pemantauan Maintenance" : "Maintenance";
  const kalibrasiTab = document.querySelector('.tab[data-tab="kalibrasi"]');
  if (kalibrasiTab) kalibrasiTab.textContent = supervisor ? "Pemantauan Kalibrasi" : "Kalibrasi";

  const activeTab = Array.from(document.querySelectorAll(".tab.is-active[data-tab]")).find((item) =>
    allowedTabs.has(item.dataset.tab),
  )?.dataset.tab;
  if (!allowedTabs.has(activeTab)) {
    activateTab(allowedTabs.values().next().value || "overview");
  }
}

function aiRoleName() {
  if (isSupervisorRole()) return "Supervisor";
  return state.user?.role || "Guest";
}

function canUseDashboardAi() {
  return ["Teknisi", "Kepala Ruangan"].includes(state.user?.role) || isSupervisorRole();
}

function aiPromptSuggestions() {
  const role = aiRoleName();
  if (role === "Supervisor") {
    return [
      "Buatkan analisis eksekutif kondisi alat, maintenance, kalibrasi, vendor, dan biaya.",
      "Vendor mana yang perlu dievaluasi berdasarkan histori pekerjaan dan biaya?",
      "Buatkan rekomendasi keputusan prioritas minggu ini dari data dashboard.",
    ];
  }
  if (role === "Kepala Ruangan") {
    return [
      "Dari data ruangan saya, alat mana yang paling berisiko mengganggu pelayanan?",
      "Buatkan laporan singkat kondisi alat di ruangan saya.",
      "Pengajuan atau laporan mana yang perlu saya pantau?",
    ];
  }
  return [
    "Buat prioritas kerja teknisi hari ini berdasarkan risiko inventaris.",
    "Maintenance dan kalibrasi mana yang perlu ditindaklanjuti?",
    "Data alat apa yang masih kurang lengkap?",
  ];
}

function renderAiWidgetIntro() {
  if (!elements.aiFloat || !canUseDashboardAi()) return;
  const role = aiRoleName();
  if (elements.aiFloat.dataset.role === role && elements.aiChatMessages?.children.length) return;

  elements.aiFloat.dataset.role = role;
  elements.aiFloatTitle.textContent = `Asisten ${role}`;
  elements.aiFloatSubtitle.textContent = "";
  elements.aiChatMessages.innerHTML = `
    <div class="ai-chat__message">
      Halo ${escapeHtml(state.user?.nama || "petugas")}. Pilih rekomendasi cepat atau tulis pertanyaan analisis kamu.
    </div>
  `;
  elements.aiChatPrompts.innerHTML = aiPromptSuggestions()
    .map((prompt) => `<button class="ai-prompt" type="button" data-ai-prompt="${escapeHtml(prompt)}">${escapeHtml(prompt)}</button>`)
    .join("");
}

function appendAiMessage(text, type = "") {
  if (!elements.aiChatMessages) return null;
  const node = document.createElement("div");
  node.className = `ai-chat__message${type ? ` ${type}` : ""}`;
  node.textContent = type === "is-user" ? text : formatAiAnswer(text);
  elements.aiChatMessages.appendChild(node);
  elements.aiChatMessages.scrollTop = elements.aiChatMessages.scrollHeight;
  elements.aiChatMessages.closest(".ai-float__body")?.scrollTo({ top: 999999, behavior: "smooth" });
  return node;
}

function appendAiArtifact(html, type = "is-artifact") {
  if (!elements.aiChatMessages) return null;
  const node = document.createElement("div");
  node.className = `ai-chat__message ${type}`;
  node.innerHTML = html;
  elements.aiChatMessages.appendChild(node);
  elements.aiChatMessages.scrollTop = elements.aiChatMessages.scrollHeight;
  elements.aiChatMessages.closest(".ai-float__body")?.scrollTo({ top: 999999, behavior: "smooth" });
  return node;
}

let aiRecognition = null;
let aiIsListening = false;
let aiSpeechEnabled = localStorage.getItem("ai-speech-enabled") !== "false";
let aiSpeechRunId = 0;

function formatAiAnswer(text) {
  const cleanedLines = String(text || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (/^(kita|saya)\s+(akan|perlu|hitung|ekstrak|identifikasi|sajikan)/i.test(trimmed)) return false;
      if (/^(pertama|tujuan|buat\s+["']?grafik|data maintenance list|data kalibrasi)/i.test(trimmed)) return false;
      if (/^\+?\d{1,3}(?:\.\d{3})+(?:\s*\+\s*\d{1,3}(?:\.\d{3})+|\s*=\s*\d{1,3}(?:\.\d{3})+)/.test(trimmed)) return false;
      if (/=\s*jumlahkan\.?$/i.test(trimmed)) return false;
      return true;
    })
    .join("\n");

  return cleanedLines
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-*_]{3,}\s*$/gm, "")
    .replace(/^\s*\*\s+/gm, "- ")
    .replace(/\bRp\s*([0-9]{1,3}(?:\.[0-9]{3})+|[0-9]{4,})\b/g, (_match, amount) => money(String(amount).replace(/\./g, "")))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitSpeechText(text, maxLength = 230) {
  const cleanText = formatAiAnswer(text).replace(/\n+/g, ". ");
  const sentences = cleanText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleanText];
  const chunks = [];
  let current = "";
  sentences.forEach((sentence) => {
    const next = `${current} ${sentence}`.trim();
    if (next.length <= maxLength) {
      current = next;
      return;
    }
    if (current) chunks.push(current);
    if (sentence.length <= maxLength) {
      current = sentence.trim();
      return;
    }
    const words = sentence.trim().split(/\s+/);
    current = "";
    words.forEach((word) => {
      const wordNext = `${current} ${word}`.trim();
      if (wordNext.length > maxLength && current) {
        chunks.push(current);
        current = word;
      } else {
        current = wordNext;
      }
    });
  });
  if (current) chunks.push(current);
  return chunks.filter(Boolean);
}

function getStableIndonesianVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  if (!voices.length) return null;

  const storedUri = localStorage.getItem("ai-speech-voice-uri");
  const storedVoice = voices.find(
    (voice) => voice.voiceURI === storedUri && /^id(?:-|_)/i.test(voice.lang),
  );
  if (storedVoice) return storedVoice;
  if (storedUri) localStorage.removeItem("ai-speech-voice-uri");

  const preferredPatterns = [
    /google.*bahasa indonesia/i,
    /google.*indonesia/i,
    /microsoft.*gadis/i,
    /microsoft.*andika/i,
    /bahasa indonesia/i,
    /indonesia/i,
  ];
  let selected = null;
  for (const pattern of preferredPatterns) {
    selected = voices.find((voice) => pattern.test(`${voice.name} ${voice.lang}`));
    if (selected) break;
  }
  selected ||= voices
    .filter((voice) => /^id(?:-|_)/i.test(voice.lang))
    .sort((a, b) => a.name.localeCompare(b.name))[0];

  if (selected) localStorage.setItem("ai-speech-voice-uri", selected.voiceURI);
  return selected;
}

function updateAiVoiceControls() {
  elements.aiSpeechToggle?.classList.toggle("is-active", aiSpeechEnabled);
  if (elements.aiSpeechLabel) elements.aiSpeechLabel.textContent = aiSpeechEnabled ? "Suara aktif" : "Suara mati";
  elements.aiMicButton?.classList.toggle("is-listening", aiIsListening);
  if (elements.aiMicLabel) elements.aiMicLabel.textContent = aiIsListening ? "Mendengarkan..." : "Mikrofon";
}

async function speakAiAnswer(text) {
  if (!aiSpeechEnabled || !("speechSynthesis" in window) || !String(text || "").trim()) return;
  const runId = ++aiSpeechRunId;
  window.speechSynthesis.cancel();
  let voice = getStableIndonesianVoice();
  if (!voice) {
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 1200);
      window.speechSynthesis.addEventListener("voiceschanged", () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
    });
    voice = getStableIndonesianVoice();
  }

  const chunks = splitSpeechText(text);
  const speakChunk = (index) => {
    if (runId !== aiSpeechRunId || !aiSpeechEnabled || index >= chunks.length) return;
    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    utterance.lang = "id-ID";
    utterance.rate = 0.92;
    utterance.pitch = 1;
    utterance.volume = 1;
    if (voice && /^id(?:-|_)/i.test(voice.lang)) utterance.voice = voice;
    utterance.onend = () => speakChunk(index + 1);
    utterance.onerror = () => {
      if (runId === aiSpeechRunId) speakChunk(index + 1);
    };
    window.speechSynthesis.speak(utterance);
  };
  speakChunk(0);
}

function startAiVoiceInput() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    appendAiMessage("Mikrofon suara belum didukung browser ini. Gunakan Chrome terbaru atau ketik pertanyaan.", "is-notice");
    return;
  }

  if (aiIsListening && aiRecognition) {
    aiRecognition.stop();
    return;
  }

  aiRecognition = new Recognition();
  aiRecognition.lang = "id-ID";
  aiRecognition.continuous = false;
  aiRecognition.interimResults = true;
  let finalTranscript = "";

  aiRecognition.onstart = () => {
    aiIsListening = true;
    updateAiVoiceControls();
  };
  aiRecognition.onresult = (event) => {
    let interimTranscript = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const transcript = event.results[index][0]?.transcript || "";
      if (event.results[index].isFinal) finalTranscript += transcript;
      else interimTranscript += transcript;
    }
    elements.aiChatInput.value = (finalTranscript || interimTranscript).trim();
  };
  aiRecognition.onerror = (event) => {
    if (event.error !== "no-speech" && event.error !== "aborted") {
      appendAiMessage("Mikrofon tidak dapat digunakan. Periksa izin mikrofon browser.", "is-notice");
    }
  };
  aiRecognition.onend = () => {
    aiIsListening = false;
    updateAiVoiceControls();
    const question = elements.aiChatInput.value.trim();
    if (!question || !finalTranscript.trim()) return;
    elements.aiChatInput.value = "";
    sendDashboardAiQuestion(question);
  };
  aiRecognition.start();
}

function aiAlatSnapshot(item) {
  const latestMaintenance = latestMaintenanceForAlat(item.id);
  const latestCalibration = latestKalibrasiForAlat(item.id);
  return {
    nama_alat: item.nama_alat,
    kode_barcode: item.kode_barcode,
    serial_number: item.serial_number,
    merk: item.merk,
    tipe: item.tipe,
    ruangan: roomName(item.ruangan_id),
    kondisi: item.kondisi,
    status: item.status,
    vendor: item.vendor || item.vendor_pt,
    tanggal_instalasi: item.tanggal_instalasi || item.created_at,
    harga_pembelian: item.harga_pembelian,
    status_kepemilikan: item.status_kepemilikan,
    maintenance_terakhir: latestMaintenance?.tanggal,
    maintenance_berikutnya: item.preventive_berikutnya || item.maintenance_berikutnya,
    status_maintenance_terakhir: latestMaintenance?.jenis || latestMaintenance?.status_progres,
    biaya_maintenance_terakhir: latestMaintenance?.biaya_perbaikan,
    kalibrasi_terakhir: latestCalibration?.tanggal_kalibrasi,
    kalibrasi_berikutnya: item.kalibrasi_berikutnya,
    status_kalibrasi: calibrationStatusForAlat(item),
    hasil_kalibrasi_terakhir: latestCalibration?.hasil,
    progres_kalibrasi_terakhir: latestCalibration?.status_progres,
    sertifikat_kalibrasi_terakhir: latestCalibration?.nomor_sertifikat,
    biaya_kalibrasi_terakhir: latestCalibration?.biaya_kalibrasi || latestCalibration?.biaya,
  };
}

function buildAiSnapshot() {
  const alatRows = visibleAlatRows();
  const maintenanceRows = visibleMaintenanceRows();
  const kalibrasiRows = visibleKalibrasiRows();
  const pengajuanRows = visiblePengajuanRows();
  const activeRoom = currentRoomId() ? roomName(currentRoomId()) : "";
  const maintenanceDue = alatRows.filter((item) => {
    const days = daysUntil(item.preventive_berikutnya || item.maintenance_berikutnya);
    return days !== null && days <= 30;
  });
  const maintenanceOverdue = alatRows.filter((item) => {
    const days = daysUntil(item.preventive_berikutnya || item.maintenance_berikutnya);
    return days !== null && days < 0;
  });
  const kalibrasiDue = alatRows.filter((item) => {
    const days = daysUntil(item.kalibrasi_berikutnya);
    return days !== null && days <= 30;
  });
  const kalibrasiOverdue = alatRows.filter((item) => {
    const days = daysUntil(item.kalibrasi_berikutnya);
    return days !== null && days < 0;
  });
  const kalibrasiBelumRows = alatRows.filter((item) => calibrationStatusForAlat(item) === "Belum Kalibrasi");
  const kalibrasiValidRows = alatRows.filter((item) => calibrationStatusForAlat(item) === "Valid");
  const kalibrasiSedangRows = alatRows.filter((item) => calibrationStatusForAlat(item) === "Sedang Kalibrasi");
  const kalibrasiAkanRows = alatRows.filter((item) => calibrationStatusForAlat(item) === "Akan Jatuh Tempo");
  const kalibrasiTerlambatRows = alatRows.filter((item) => calibrationStatusForAlat(item) === "Terlambat");
  const kalibrasiKedaluwarsaRows = alatRows.filter((item) => calibrationStatusForAlat(item) === "Sertifikat Kedaluwarsa");
  const rusakRows = alatRows.filter((item) => item.kondisi === "Rusak");
  const kondisiMaintenanceRows = alatRows.filter((item) => item.kondisi === "Maintenance");

  return {
    summary: {
      total_alat: alatRows.length,
      total_ruangan: new Set(alatRows.map((item) => roomName(item.ruangan_id)).filter(Boolean)).size,
      kondisi_baik: alatRows.filter((item) => item.kondisi === "Baik").length,
      kondisi_rusak: alatRows.filter((item) => item.kondisi === "Rusak").length,
      kondisi_maintenance: alatRows.filter((item) => item.kondisi === "Maintenance").length,
      total_maintenance: maintenanceRows.length,
      total_kalibrasi: kalibrasiRows.length,
      total_pengajuan: pengajuanRows.length,
      total_biaya_maintenance: sumBy(maintenanceRows, (item) => item.biaya_perbaikan),
      total_biaya_kalibrasi: sumBy(kalibrasiRows, (item) => item.biaya_kalibrasi || item.biaya),
      maintenance_due_atau_terlambat_30_hari: maintenanceDue.length,
      maintenance_terlambat: maintenanceOverdue.length,
      kalibrasi_due_atau_terlambat_30_hari: kalibrasiDue.length,
      kalibrasi_terlambat: kalibrasiOverdue.length,
      status_kalibrasi: {
        valid: kalibrasiValidRows.length,
        sedang_kalibrasi: kalibrasiSedangRows.length,
        akan_jatuh_tempo: kalibrasiAkanRows.length,
        terlambat: kalibrasiTerlambatRows.length,
        belum_kalibrasi: kalibrasiBelumRows.length,
        tidak_lulus: alatRows.filter((item) => calibrationStatusForAlat(item) === "Tidak Lulus").length,
        sertifikat_kedaluwarsa: kalibrasiKedaluwarsaRows.length,
      },
      ruangan_aktif: activeRoom || "Semua ruangan sesuai akses role",
    },
    detail_penting: {
      alat_rusak: rusakRows.map(aiAlatSnapshot),
      alat_maintenance: kondisiMaintenanceRows.slice(0, 120).map(aiAlatSnapshot),
      kalibrasi_belum: kalibrasiBelumRows.map(aiAlatSnapshot),
      kalibrasi_akan_jatuh_tempo: kalibrasiAkanRows.slice(0, 160).map(aiAlatSnapshot),
      kalibrasi_terlambat: kalibrasiTerlambatRows.map(aiAlatSnapshot),
      kalibrasi_sertifikat_kedaluwarsa: kalibrasiKedaluwarsaRows.map(aiAlatSnapshot),
      maintenance_due_atau_terlambat: maintenanceDue.slice(0, 180).map(aiAlatSnapshot),
    },
    alat: alatRows.slice(0, 500).map(aiAlatSnapshot),
    maintenance: maintenanceRows.slice(0, 120).map((item) => ({
      alat: alatName(item.alat_id),
      serial_number: state.alat.find((alat) => alat.id === item.alat_id)?.serial_number,
      ruangan: roomName(state.alat.find((alat) => alat.id === item.alat_id)?.ruangan_id),
      jenis: item.jenis,
      tanggal: item.tanggal,
      teknisi: item.teknisi,
      vendor: item.vendor_pt || item.vendor,
      status_progres: item.status_progres,
      hasil: item.hasil,
      biaya: item.biaya_perbaikan,
    })),
    kalibrasi: kalibrasiRows.slice(0, 120).map((item) => ({
      alat: alatName(item.alat_id),
      serial_number: state.alat.find((alat) => alat.id === item.alat_id)?.serial_number,
      ruangan: roomName(state.alat.find((alat) => alat.id === item.alat_id)?.ruangan_id),
      tanggal_kalibrasi: item.tanggal_kalibrasi,
      berlaku_sampai: item.berlaku_sampai,
      vendor: item.vendor_pt || item.vendor,
      hasil: item.hasil,
      status_progres: item.status_progres,
      nomor_sertifikat: item.nomor_sertifikat,
      biaya: item.biaya_kalibrasi || item.biaya,
    })),
    pengajuan: pengajuanRows.slice(0, 80).map((item) => ({
      alat: alatName(item.alat_id),
      ruangan: roomName(item.ruangan_id || state.alat.find((alat) => alat.id === item.alat_id)?.ruangan_id),
      jenis_pengajuan: item.jenis_pengajuan,
      kategori: item.kategori,
      vendor_pt: item.vendor_pt,
      status: item.status,
      tanggal: item.created_at || item.tanggal,
      catatan: item.catatan,
    })),
  };
}

function aiRequestIntent(question) {
  const text = String(question || "").toLowerCase();
  return {
    chart: /(grafik|chart|diagram|visual|donut|bar|analisa visual|visualisasi)/i.test(text),
    pdf: /(pdf|laporan|generate laporan|buatkan laporan|unduh laporan|cetak laporan|export laporan)/i.test(text),
  };
}

function aiMetricRows(rows, keyGetter, valueGetter = () => 1) {
  const map = rows.reduce((acc, item) => {
    const key = cleanLabel(keyGetter(item));
    acc[key] = (acc[key] || 0) + Number(valueGetter(item) || 0);
    return acc;
  }, {});
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));
}

function aiChartRow(label, value, max, formatter = (item) => item) {
  const width = max ? Math.max(4, Math.round((Number(value || 0) / max) * 100)) : 0;
  return `
    <div class="ai-chart-row">
      <span>${escapeHtml(label)}</span>
      <i><b style="width:${width}%"></b></i>
      <strong>${escapeHtml(formatter(value))}</strong>
    </div>
  `;
}

function aiChartBlock(title, rows, formatter = (item) => item) {
  const cleanRows = rows.filter((item) => item.label && Number(item.value || 0) > 0).slice(0, 8);
  const max = Math.max(...cleanRows.map((item) => Number(item.value || 0)), 1);
  return `
    <section class="ai-artifact__block">
      <h4>${escapeHtml(title)}</h4>
      <div class="ai-chart-list">
        ${cleanRows.map((item) => aiChartRow(item.label, item.value, max, formatter)).join("") || `<p class="empty-state">Belum ada data.</p>`}
      </div>
    </section>
  `;
}

function aiChartData() {
  const alatRows = visibleAlatRows();
  const maintenanceRows = visibleMaintenanceRows();
  const kalibrasiRows = visibleKalibrasiRows();
  return {
    totalAlat: alatRows.length,
    kondisi: aiMetricRows(alatRows, (item) => item.kondisi || "Tidak Terisi"),
    kalibrasi: aiMetricRows(alatRows, (item) => calibrationStatusForAlat(item)),
    maintenance: aiMetricRows(maintenanceRows, (item) => item.jenis || "Tidak Terisi"),
    ruangan: aiMetricRows(alatRows, (item) => roomName(item.ruangan_id)),
    nilaiAset: aiMetricRows(alatRows, (item) => roomName(item.ruangan_id), (item) => item.harga_pembelian),
    vendorBiaya: aiMetricRows(
      [...maintenanceRows, ...kalibrasiRows],
      (item) => item.vendor_pt || item.vendor || "Tanpa Vendor",
      (item) => item.biaya_perbaikan || item.biaya_kalibrasi || item.biaya
    ),
  };
}

function appendDashboardAiChart(question) {
  const data = aiChartData();
  appendAiArtifact(`
    <article class="ai-artifact">
      <div class="ai-artifact__head">
        <span>Grafik AI</span>
        <strong>Analisis dashboard</strong>
      </div>
      <p class="ai-artifact__note">Visual ini dibuat dari data dashboard yang sama dengan analisa AI.</p>
      <div class="ai-chart-grid">
        ${aiChartBlock("Kondisi alat", data.kondisi)}
        ${aiChartBlock("Status kalibrasi", data.kalibrasi)}
        ${aiChartBlock("Jenis maintenance", data.maintenance)}
        ${aiChartBlock("Nilai aset per ruangan", data.nilaiAset, money)}
      </div>
    </article>
  `);
}

function aiReportRows(rows, columns, limit = 14) {
  const body = rows.slice(0, limit).map((row, index) => `
    <tr>
      ${columns.map((column) => `<td>${escapeHtml(column.value(row, index) ?? "-")}</td>`).join("")}
    </tr>
  `).join("");
  return `
    <table>
      <thead><tr>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}</tr></thead>
      <tbody>${body || `<tr><td colspan="${columns.length}">Belum ada data.</td></tr>`}</tbody>
    </table>
  `;
}

function openDashboardAiPdf(question, answer) {
  const snapshot = buildAiSnapshot();
  const chartData = aiChartData();
  const userLabel = `${state.user?.nama || state.user?.username || "Petugas"} | ${aiRoleName()}`;
  const issuedAt = new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short" }).format(new Date());
  const logoUrl = new URL("assets/images/rs-zezszeonsze-logo-full.png", window.location.href).href;
  const chartHtml = [
    ["Kondisi Alat", chartData.kondisi, (v) => v],
    ["Status Kalibrasi", chartData.kalibrasi, (v) => v],
    ["Jenis Maintenance", chartData.maintenance, (v) => v],
    ["Nilai Aset per Ruangan", chartData.nilaiAset, money],
  ].map(([title, rows, formatter]) => {
    const cleanRows = rows.filter((item) => item.label && Number(item.value || 0) > 0).slice(0, 8);
    const max = Math.max(...cleanRows.map((item) => Number(item.value || 0)), 1);
    return `
      <section class="pdf-card">
        <h3>${escapeHtml(title)}</h3>
        ${cleanRows.map((item) => {
          const width = Math.max(4, Math.round((Number(item.value || 0) / max) * 100));
          return `<div class="pdf-bar"><span>${escapeHtml(item.label)}</span><i><b style="width:${width}%"></b></i><strong>${escapeHtml(formatter(item.value))}</strong></div>`;
        }).join("") || `<p>Belum ada data.</p>`}
      </section>
    `;
  }).join("");

  const problemRows = [
    ...snapshot.detail_penting.alat_rusak,
    ...snapshot.detail_penting.alat_maintenance,
  ];
  const calibrationRows = [
    ...snapshot.detail_penting.kalibrasi_belum,
    ...snapshot.detail_penting.kalibrasi_akan_jatuh_tempo,
    ...snapshot.detail_penting.kalibrasi_terlambat,
    ...snapshot.detail_penting.kalibrasi_sertifikat_kedaluwarsa,
  ];
  const popup = window.open("", "_blank");
  if (!popup) {
    appendAiMessage("Browser memblokir popup PDF. Izinkan popup untuk website ini lalu klik tombol PDF lagi.", "is-notice");
    return;
  }
  popup.document.write(`<!doctype html>
    <html lang="id">
    <head>
      <meta charset="utf-8" />
      <title>Laporan AI Inventaris Alat Kesehatan</title>
      <style>
        *{box-sizing:border-box} body{margin:0;padding:30px;font-family:Arial,sans-serif;color:#111827;background:#fff}
        .letter{max-width:980px;margin:0 auto}
        .head{display:grid;grid-template-columns:92px 1fr;gap:18px;align-items:center;border-bottom:4px solid #0d9f91;padding-bottom:16px;margin-bottom:22px}
        .head img{width:86px;height:86px;object-fit:contain;border-radius:18px;border:1px solid #d8e7e7;padding:8px}
        h1{margin:0;font-size:26px;letter-spacing:.02em}.eyebrow{font-size:12px;font-weight:800;color:#087b70;letter-spacing:.16em;text-transform:uppercase}
        .meta{margin-top:8px;color:#5d6b82;font-size:12px;line-height:1.55}.summary{border:1px solid #d8e3ef;border-radius:14px;padding:16px;margin:16px 0;background:#f8fbfd;white-space:pre-wrap;line-height:1.55}
        .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0}.kpi{border:1px solid #d8e3ef;border-radius:12px;padding:12px;background:#fff}.kpi span{display:block;color:#5d6b82;font-size:11px;font-weight:800}.kpi strong{font-size:22px}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.pdf-card{border:1px solid #d8e3ef;border-radius:14px;padding:14px;break-inside:avoid}.pdf-card h3{margin:0 0 12px;font-size:16px}
        .pdf-bar{display:grid;grid-template-columns:130px 1fr 110px;gap:10px;align-items:center;margin:8px 0;font-size:12px}.pdf-bar i{height:9px;border-radius:999px;background:#e5edf5;overflow:hidden}.pdf-bar b{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#0d9f91,#2e79ce)}
        table{width:100%;border-collapse:collapse;margin:10px 0 18px;font-size:11px}th,td{border:1px solid #cfd9e6;padding:8px;text-align:left;vertical-align:top}th{background:#eef4f8;color:#4a5a73;text-transform:uppercase;font-size:10px}
        h2{font-size:18px;margin:24px 0 8px}.foot{margin-top:24px;color:#64748b;font-size:11px;border-top:1px solid #d8e3ef;padding-top:10px}
        @media print{body{padding:14mm}.no-print{display:none}.grid{grid-template-columns:1fr 1fr}}
      </style>
    </head>
    <body>
      <main class="letter">
        <header class="head">
          <img src="${logoUrl}" alt="Logo Rumah Sakit" />
          <div>
            <div class="eyebrow">Rumah Sakit ZezszeonSze</div>
            <h1>Laporan AI Inventaris Alat Kesehatan</h1>
            <div class="meta">Dibuat: ${escapeHtml(issuedAt)}<br />Pengguna: ${escapeHtml(userLabel)}<br />Pertanyaan: ${escapeHtml(question)}</div>
          </div>
        </header>
        <section class="kpis">
          <article class="kpi"><span>Total Alat</span><strong>${snapshot.summary.total_alat}</strong></article>
          <article class="kpi"><span>Rusak</span><strong>${snapshot.summary.kondisi_rusak}</strong></article>
          <article class="kpi"><span>Maintenance</span><strong>${snapshot.summary.kondisi_maintenance}</strong></article>
          <article class="kpi"><span>Kalibrasi Akan/Terlambat</span><strong>${snapshot.summary.kalibrasi_due_atau_terlambat_30_hari}</strong></article>
        </section>
        <h2>Analisa AI</h2>
        <section class="summary">${escapeHtml(answer)}</section>
        <h2>Grafik Ringkas</h2>
        <section class="grid">${chartHtml}</section>
        <h2>Alat Prioritas Kondisi</h2>
        ${aiReportRows(problemRows, [
          { label: "Nama Alat", value: (row) => row.nama_alat },
          { label: "Serial Number", value: (row) => row.serial_number },
          { label: "Ruangan", value: (row) => row.ruangan },
          { label: "Kondisi", value: (row) => row.kondisi },
          { label: "Vendor", value: (row) => row.vendor },
        ])}
        <h2>Prioritas Kalibrasi</h2>
        ${aiReportRows(calibrationRows, [
          { label: "Nama Alat", value: (row) => row.nama_alat },
          { label: "Serial Number", value: (row) => row.serial_number },
          { label: "Ruangan", value: (row) => row.ruangan },
          { label: "Status Kalibrasi", value: (row) => row.status_kalibrasi },
          { label: "Kalibrasi Berikutnya", value: (row) => formatDate(row.kalibrasi_berikutnya) },
        ])}
        <p class="foot">Laporan ini dibuat otomatis dari data dashboard/database yang sedang terbaca. Verifikasi dokumen fisik tetap dilakukan bila diperlukan.</p>
      </main>
      <script>window.addEventListener("load",()=>setTimeout(()=>window.print(),400));</script>
    </body>
    </html>`);
  popup.document.close();
}

function appendDashboardAiPdfAction(question, answer) {
  const node = appendAiArtifact(`
    <article class="ai-artifact ai-artifact--pdf">
      <div class="ai-artifact__head">
        <span>PDF AI</span>
        <strong>Laporan siap dibuat</strong>
      </div>
      <p class="ai-artifact__note">Berisi narasi AI, KPI, grafik ringkas, dan tabel prioritas dari data dashboard.</p>
      <button class="button button--primary ai-artifact__button" type="button">Buka PDF Laporan</button>
    </article>
  `);
  node?.querySelector("button")?.addEventListener("click", () => openDashboardAiPdf(question, answer));
}

async function sendDashboardAiQuestion(question) {
  appendAiMessage(question, "is-user");
  const intent = aiRequestIntent(question);
  const loading = appendAiMessage("Membaca data dashboard dan meminta analisis DeepSeek...", "is-loading");

  try {
    const response = await fetch(AI_CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        user: {
          nama: state.user?.nama,
          username: state.user?.username,
          role: aiRoleName(),
          ruangan: currentRoomId() ? roomName(currentRoomId()) : roomName(state.user?.ruangan_id),
        },
        snapshot: buildAiSnapshot(),
      }),
    });
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error("Layanan AI belum aktif. Jalankan backend AI terlebih dahulu.");
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || data?.message || `AI HTTP ${response.status}`);
    loading?.remove();
    if (!data.answer?.trim()) {
      throw new Error("DeepSeek tidak mengembalikan jawaban. Silakan coba lagi.");
    }
    appendAiMessage(data.answer);
    if (intent.chart) appendDashboardAiChart(question);
    if (intent.pdf) appendDashboardAiPdfAction(question, data.answer);
    speakAiAnswer(data.answer);
  } catch (error) {
    loading?.remove();
    appendAiMessage(`AI belum bisa menjawab: ${error.message}`);
  }
}

function renderScanView() {
  if (!state.scanCode && !state.scanId) return;

  const code = String(state.scanCode || "").trim();
  const scanId = String(state.scanId || "").trim();
  const alat =
    (scanId ? state.alat.find((item) => item.id === scanId) : null) ||
    (code ? state.alat.find((item) => item.kode_barcode === code) : null) ||
    null;

  elements.scanView.classList.remove("is-hidden");
  elements.loginView.classList.add("is-hidden");
  elements.dashboard.classList.add("is-hidden");
  elements.scanTitle.textContent = alat ? `${alat.nama_alat} - ${alat.kode_barcode}` : "Kode QR tidak ditemukan";
  elements.scanSubtitle.textContent = alat
    ? `Data alat kesehatan untuk ${roomName(alat.ruangan_id)}`
    : `Kode QR ${code || scanId || "-"} tidak cocok dengan data alat mana pun.`;

  if (!alat) {
    elements.scanContent.innerHTML = `
      <div class="panel scan-empty">
        <h2>Alat tidak ditemukan</h2>
        <p class="muted">Periksa kembali QR code atau pastikan data alat sudah tersimpan di database.</p>
      </div>
    `;
    return;
  }

  elements.scanContent.innerHTML = buildAlatDetailHtml(alat);
}

function activateTab(tabName) {
  $$(".tab").forEach((item) => item.classList.toggle("is-active", item.dataset.tab === tabName));
  $$(".tab-panel").forEach((panel) => panel.classList.add("is-hidden"));
  $(`#${tabName}-panel`).classList.remove("is-hidden");
  if (window.matchMedia("(min-width: 941px)").matches) {
    elements.dashboard.classList.remove("is-sidebar-open");
    elements.sidebarToggle?.setAttribute("aria-expanded", "false");
  }
}

function visibleAlatRows() {
  let rows = state.alat.filter(canSeeAlat);
  if (state.roomFocusId) rows = rows.filter((item) => item.ruangan_id === state.roomFocusId);
  if (state.alatInsightFilter) rows = rows.filter((item) => matchesAlatInsightFilter(item, state.alatInsightFilter));
  if (state.alatFilter.room) rows = rows.filter((item) => item.ruangan_id === state.alatFilter.room);
  const search = cleanLabel(state.alatFilter.search).toLowerCase();
  if (search) {
    rows = rows.filter((item) =>
      [
        item.nama_alat,
        item.kode_barcode,
        item.serial_number,
        item.merk,
        item.tipe,
        item.vendor,
        roomName(item.ruangan_id),
        item.kondisi,
        item.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search)),
    );
  }
  return rows;
}

function overviewAlatRows() {
  return state.alat.filter(canSeeAlat);
}

function overviewMaintenanceRows(alatRows = overviewAlatRows()) {
  const allowedIds = new Set(alatRows.map((item) => item.id));
  return state.maintenance.filter((item) => allowedIds.has(item.alat_id) && canSeeVendorRecord(item));
}

function overviewKalibrasiRows(alatRows = overviewAlatRows()) {
  const allowedIds = new Set(alatRows.map((item) => item.id));
  return state.kalibrasi.filter((item) => allowedIds.has(item.alat_id) && canSeeVendorRecord(item));
}

function clearRoomFocus(options = {}) {
  state.roomFocusId = null;
  state.alatInsightFilter = null;
  renderRooms();
  renderAlat();
  renderStats();
  if (options.backToRooms) {
    activateTab("ruangan");
  }
}

function openRoomFocus(roomId) {
  state.roomFocusId = roomId || null;
  state.alatInsightFilter = null;
  renderRooms();
  renderAlat();
  renderStats();
  activateTab("alat");
}

function openInsightFilter(type, value, label = "") {
  if (type === "room") {
    const room = state.ruangan.find((item) => roomName(item.id) === cleanLabel(value) || item.nama_ruangan === cleanLabel(value));
    if (room) {
      openRoomFocus(room.id);
      return;
    }
  }
  state.roomFocusId = null;
  state.alatInsightFilter = { type, value, label: label || value };
  renderRooms();
  renderAlat();
  renderStats();
  activateTab("alat");
  $("#alat-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function alatRowsByRoom(roomId = "") {
  const rows = visibleAlatRows();
  return roomId ? rows.filter((item) => item.ruangan_id === roomId) : rows;
}

function renderAlatOptions(target, rows, placeholder = "Belum ada alat") {
  target.innerHTML =
    rows
      .map((item) => `<option value="${item.id}">${escapeHtml(item.kode_barcode)} - ${escapeHtml(item.nama_alat)}</option>`)
      .join("") || `<option value="">${escapeHtml(placeholder)}</option>`;
}

function visibleMaintenanceRows() {
  return state.maintenance.filter((item) => {
    const alat = state.alat.find((row) => row.id === item.alat_id);
    return canSeeRecordByRoom(alat || {}) && canSeeVendorRecord(item);
  });
}

function visibleKalibrasiRows() {
  return state.kalibrasi.filter((item) => {
    const alat = state.alat.find((row) => row.id === item.alat_id);
    return canSeeRecordByRoom(alat || {}) && canSeeVendorRecord(item);
  });
}

function visibleMutasiRows() {
  return state.mutasi.filter((item) => {
    const alat = state.alat.find((row) => row.id === item.alat_id);
    if (!canSeeVendorRecord(item)) return false;
    if (state.user?.role === "Kepala Ruangan") {
      const roomId = currentRoomId();
      return item.dari_ruangan_id === roomId || item.ke_ruangan_id === roomId || (alat && alat.ruangan_id === roomId);
    }
    return true;
  });
}

function visiblePengajuanRows() {
  return state.pengajuan.filter((item) => {
    const alat = state.alat.find((row) => row.id === item.alat_id) || {};
    if (item.dibuat_oleh_role === "Kepala Ruangan" || item.status === "Laporan Kepala Ruangan") return false;
    if (state.user?.role === "Admin") return true;
    if (state.user?.role === "Teknisi") {
      return item.dibuat_oleh_role === "Kepala Ruangan" || item.dibuat_oleh === state.user.username || item.tujuan_role === "Teknisi";
    }
    if (state.user?.role === "Kepala Ruangan") {
      return item.ruangan_id === currentRoomId() || alat.ruangan_id === currentRoomId();
    }
    if (isSupervisorRole()) {
      return item.status === "Menunggu Supervisor" || item.status === "Disetujui Supervisor" || item.status === "Selesai Supervisor";
    }
    if (state.user?.role === "Vendor") {
      return item.tujuan_role === "Vendor" && item.vendor_pt === currentVendorScope() && serviceForPengajuan(item) === currentVendorService();
    }
    return false;
  });
}

function money(value) {
  const number = Number(value);
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    Number.isFinite(number) ? number : 0
  );
}

function moneyCompact(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number === 0) return "Rp 0";
  const absolute = Math.abs(number);
  const format = (divisor, suffix) =>
    `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(number / divisor)} ${suffix}`;
  if (absolute >= 1_000_000_000_000) return format(1_000_000_000_000, "triliun");
  if (absolute >= 1_000_000_000) return format(1_000_000_000, "miliar");
  if (absolute >= 1_000_000) return format(1_000_000, "juta");
  if (absolute >= 1_000) return format(1_000, "ribu");
  return money(number);
}

function percent(value) {
  const number = Number(value);
  return `${(Number.isFinite(number) ? number : 0).toFixed(1).replace(".", ",")}%`;
}

function kpiCategory(value, ranges = "highGood") {
  const score = Number(value || 0);
  if (ranges === "lowGood") {
    if (score <= 5) return ["Sangat Baik", "good"];
    if (score <= 10) return ["Baik", "ok"];
    if (score <= 20) return ["Perlu Perhatian", "warn"];
    return ["Buruk", "danger"];
  }
  if (score >= 95) return ["Sangat Baik", "good"];
  if (score >= 90) return ["Baik", "ok"];
  if (score >= 80) return ["Perlu Perhatian", "warn"];
  return ["Buruk", "danger"];
}

function monthKey(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toISOString().slice(0, 7);
}

function monthLabel(key) {
  if (!key || key === "-") return "-";
  const [year, month] = key.split("-");
  return `${month}/${year}`;
}

function groupCount(rows, fieldGetter) {
  return rows.reduce((acc, item) => {
    const key = cleanLabel(fieldGetter(item));
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function sumBy(rows, getter) {
  return rows.reduce((total, item) => total + Number(getter(item) || 0), 0);
}

function supervisorData() {
  const alatRows = state.alat;
  const maintenanceRows = state.maintenance;
  const kalibrasiRows = state.kalibrasi;
  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);
  const total = alatRows.length || 1;
  const breakdownRows = maintenanceRows.filter((item) => maintenanceStatusLabel(item) === "Breakdown");
  const breakdownToolIds = new Set(breakdownRows.map((item) => item.alat_id));
  const maintenanceDue = alatRows.filter((item) => {
    const days = daysUntil(item.preventive_berikutnya || item.maintenance_berikutnya);
    return days !== null && days <= 30;
  });
  const kalibrasiDue = alatRows.filter((item) => {
    const days = daysUntil(item.kalibrasi_berikutnya);
    return days !== null && days <= 30;
  });
  const pmScheduled = alatRows.filter((item) => item.preventive_berikutnya || item.maintenance_berikutnya).length || total;
  const pmDone = alatRows.filter((item) => item.preventive_terakhir).length;
  const calibrationRequired = alatRows.filter((item) => item.kalibrasi_berikutnya || item.kalibrasi_terakhir).length || total;
  const calibrated = alatRows.filter((item) => item.kalibrasi_terakhir).length;
  const pmOverdue = alatRows.filter((item) => {
    const days = daysUntil(item.preventive_berikutnya || item.maintenance_berikutnya);
    return days !== null && days < 0;
  }).length;
  const calibrationOverdue = alatRows.filter((item) => {
    const days = daysUntil(item.kalibrasi_berikutnya);
    return days !== null && days < 0;
  }).length;
  const activeBreakdown = alatRows.filter((item) =>
    item.status === "Aktif" && (item.kondisi === "Rusak" || breakdownToolIds.has(item.id))
  ).length;
  const readyTools = alatRows.filter((item) => item.status === "Aktif" && item.kondisi === "Baik").length;
  const totalMaintenanceCost = sumBy(maintenanceRows, (item) => item.biaya_perbaikan);
  const totalCalibrationCost = sumBy(kalibrasiRows, (item) => item.biaya || item.biaya_kalibrasi);
  const monthlyMaintenanceCost = sumBy(maintenanceRows.filter((item) => monthKey(item.tanggal) === currentMonth), (item) => item.biaya_perbaikan);
  const monthlyCalibrationCost = sumBy(kalibrasiRows.filter((item) => monthKey(item.tanggal_kalibrasi) === currentMonth), (item) => item.biaya || item.biaya_kalibrasi);
  const approvalPending = state.pengajuan.filter((item) => item.status === "Menunggu Supervisor").length;
  const availability = (readyTools / total) * 100;
  const pmCompliance = (pmDone / pmScheduled) * 100;
  const calibrationCompliance = (calibrated / calibrationRequired) * 100;
  const breakdownRate = (breakdownToolIds.size / total) * 100;
  const overdueMaintenance = (pmOverdue / pmScheduled) * 100;
  const overdueCalibration = (calibrationOverdue / calibrationRequired) * 100;
  return {
    alatRows,
    maintenanceRows,
    kalibrasiRows,
    currentMonth,
    total,
    active: alatRows.filter((item) => item.status === "Aktif").length,
    readyTools,
    activeBreakdown,
    maintenanceDue,
    kalibrasiDue,
    approvalPending,
    availability,
    pmCompliance,
    calibrationCompliance,
    breakdownRate,
    overdueMaintenance,
    overdueCalibration,
    totalMaintenanceCost,
    totalCalibrationCost,
    monthlyCost: monthlyMaintenanceCost + monthlyCalibrationCost,
  };
}

function preventiveSummaryForTools(alatRows = state.alat) {
  const upcomingIds = new Set(
    alatRows
      .filter((item) => {
        const days = daysUntil(item.preventive_berikutnya || item.maintenance_berikutnya);
        return days !== null && days >= 0 && days <= 30;
      })
      .map((item) => item.id),
  );
  const notDoneIds = new Set(
    alatRows
      .filter((item) => {
        const days = daysUntil(item.preventive_berikutnya || item.maintenance_berikutnya);
        return !upcomingIds.has(item.id) && (!item.preventive_terakhir || (days !== null && days < 0));
      })
      .map((item) => item.id),
  );
  return {
    done: alatRows.filter((item) => !upcomingIds.has(item.id) && !notDoneIds.has(item.id)).length,
    upcoming: upcomingIds.size,
    notDone: notDoneIds.size,
  };
}

function calibrationSummaryForTools(alatRows = state.alat) {
  const statuses = alatRows.map((item) => calibrationStatusForAlat(item));
  return {
    valid: statuses.filter((status) => status === "Valid").length,
    ongoing: statuses.filter((status) => status === "Sedang Kalibrasi").length,
    upcoming: statuses.filter((status) => status === "Akan Jatuh Tempo").length,
    overdue: statuses.filter((status) => status === "Terlambat").length,
    notDone: statuses.filter((status) => status === "Belum Kalibrasi").length,
    failed: statuses.filter((status) => status === "Tidak Lulus").length,
    expired: statuses.filter((status) => status === "Sertifikat Kedaluwarsa").length,
  };
}

function scheduleWindowSummary(alatRows, dateGetter) {
  const summary = { threeDays: 0, oneWeek: 0, oneMonth: 0, overdue: 0 };
  alatRows.forEach((item) => {
    const days = daysUntil(dateGetter(item));
    if (days === null) return;
    if (days < 0) summary.overdue += 1;
    else if (days <= 3) summary.threeDays += 1;
    else if (days <= 7) summary.oneWeek += 1;
    else if (days <= 30) summary.oneMonth += 1;
  });
  return summary;
}

function maintenanceScheduleSummary(alatRows = state.alat) {
  return scheduleWindowSummary(
    alatRows,
    (item) => item.preventive_berikutnya || item.maintenance_berikutnya,
  );
}

function calibrationScheduleSummary(alatRows = state.alat) {
  return scheduleWindowSummary(alatRows, (item) => {
    const latest = latestKalibrasiForAlat(item.id);
    return item.kalibrasi_berikutnya || latest?.berlaku_sampai;
  });
}

function scheduleSummaryHtml(summary) {
  return `
    <div class="condition-chip is-danger">
      <span>Terlambat</span>
      <strong>${summary.overdue}</strong>
    </div>
    <div class="condition-chip is-warning">
      <span>0-3 hari</span>
      <strong>${summary.threeDays}</strong>
    </div>
    <div class="condition-chip is-warning">
      <span>4-7 hari</span>
      <strong>${summary.oneWeek}</strong>
    </div>
    <div class="condition-chip">
      <span>8-30 hari</span>
      <strong>${summary.oneMonth}</strong>
    </div>
  `;
}

function renderStats() {
  const alatRows = overviewAlatRows();
  const maintenanceRows = overviewMaintenanceRows(alatRows);
  const kalibrasiRows = overviewKalibrasiRows(alatRows);
  const baik = alatRows.filter((item) => item.kondisi === "Baik").length;
  const rusak = alatRows.filter((item) => item.kondisi === "Rusak").length;
  const maintenanceCondition = alatRows.filter((item) => item.kondisi === "Maintenance").length;
  const preventiveSummary = preventiveSummaryForTools(alatRows);
  const calibrationSummary = calibrationSummaryForTools(alatRows);
  const maintenanceSchedule = maintenanceScheduleSummary(alatRows);
  const calibrationSchedule = calibrationScheduleSummary(alatRows);
  $("#stat-alat").textContent = alatRows.length;
  $("#stat-ruangan").textContent = state.user?.role === "Kepala Ruangan" ? (currentRoomId() ? 1 : 0) : new Set(alatRows.map((item) => item.ruangan_id).filter(Boolean)).size || state.ruangan.length;
  $("#stat-maintenance").textContent = maintenanceRows.length.toLocaleString("id-ID");
  $("#stat-preventive-summary").innerHTML = `
    <div class="condition-chip">
      <span>Sudah</span>
      <strong>${preventiveSummary.done}</strong>
    </div>
    <div class="condition-chip is-warning">
      <span>Akan</span>
      <strong>${preventiveSummary.upcoming}</strong>
    </div>
    <div class="condition-chip is-danger">
      <span>Belum</span>
      <strong>${preventiveSummary.notDone}</strong>
    </div>
  `;
  $("#stat-kalibrasi").textContent = kalibrasiRows.length.toLocaleString("id-ID");
  const kalibrasiSummary = $("#stat-kalibrasi-summary");
  if (kalibrasiSummary) {
    kalibrasiSummary.innerHTML = `
      <div class="condition-chip">
        <span>Sudah</span>
        <strong>${calibrationSummary.valid}</strong>
      </div>
      <div class="condition-chip is-warning">
        <span>Akan</span>
        <strong>${calibrationSummary.ongoing + calibrationSummary.upcoming + calibrationSummary.overdue + calibrationSummary.expired + calibrationSummary.failed}</strong>
      </div>
      <div class="condition-chip is-danger">
        <span>Belum</span>
        <strong>${calibrationSummary.notDone}</strong>
      </div>
    `;
  }
  $("#stat-mutasi").textContent = visibleMutasiRows().length;
  $("#stat-register").textContent = state.registerUsers.filter((item) => item.status === "Pending").length;
  $("#stat-alert").innerHTML = `
    <div class="condition-chip">
      <span>Baik</span>
      <strong>${baik}</strong>
    </div>
    <div class="condition-chip is-danger">
      <span>Rusak</span>
      <strong>${rusak}</strong>
    </div>
    <div class="condition-chip is-warning">
      <span>Maintenance</span>
      <strong>${maintenanceCondition}</strong>
    </div>
  `;
  const maintenanceScheduleNode = $("#stat-maintenance-schedule");
  if (maintenanceScheduleNode) maintenanceScheduleNode.innerHTML = scheduleSummaryHtml(maintenanceSchedule);
  const calibrationScheduleNode = $("#stat-calibration-schedule");
  if (calibrationScheduleNode) calibrationScheduleNode.innerHTML = scheduleSummaryHtml(calibrationSchedule);
  renderVendorOverview();
}

function renderKpiCards(target, cards) {
  const node = $(target);
  if (!node) return;
  node.innerHTML = cards
    .map(
      (card) => `
        <article class="stat supervisor-stat ${card.tone ? `is-${card.tone}` : ""}">
          <span>${escapeHtml(card.label)}</span>
          ${card.items
            ? `<div class="condition-summary supervisor-card-summary">
                ${card.items.map((item) => `
                  <div class="condition-chip ${item.tone ? `is-${item.tone}` : ""}">
                    <span>${escapeHtml(item.label)}</span>
                    <strong>${escapeHtml(item.value)}</strong>
                  </div>
                `).join("")}
              </div>`
            : `<strong>${escapeHtml(card.value)}</strong>`}
          ${card.note ? `<small>${escapeHtml(card.note)}</small>` : ""}
        </article>
      `,
    )
    .join("");
}

function renderMiniBars(target, groupedRows, options = {}) {
  const node = $(target);
  if (!node) return;
  const entries = Object.entries(groupedRows)
    .map(([key, value]) => [cleanLabel(key), Number(value || 0)])
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, options.limit || 8);
  const max = Math.max(...entries.map(([, value]) => value), 1);
  const labelFormatter = options.labelFormatter || ((value) => value);
  const valueFormatter = options.valueFormatter || ((value) => value);
  node.innerHTML =
    entries
      .map(([key, value]) => {
        const attrs = options.filterType
          ? ` data-insight-filter-type="${escapeHtml(options.filterType)}" data-insight-filter-value="${escapeHtml(key)}" data-insight-filter-label="${escapeHtml(labelFormatter(key))}"`
          : "";
        return `
          <div class="chart-row ${options.filterType ? "is-clickable" : ""}"${attrs} ${options.filterType ? 'role="button" tabindex="0"' : ""}>
            <span>${escapeHtml(labelFormatter(key))}</span>
            <div><i style="width:${Math.max(8, (value / max) * 100)}%"></i></div>
            <strong>${escapeHtml(valueFormatter(value))}</strong>
          </div>
        `;
      })
      .join("") || `<p class="empty-state">Belum ada data grafik.</p>`;
}

function chartIconLabel(label) {
  const source = cleanLabel(label, "AL");
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "AL";
}

function renderDonutChart(target, rows, options = {}) {
  const node = $(target);
  if (!node) return;
  const colors = ["#0d9f91", "#2f78c5", "#c9811d", "#e15b43", "#647086", "#55c5a2", "#b8872f"];
  const entries = Object.entries(rows).filter(([, value]) => Number(value) > 0).sort((a, b) => b[1] - a[1]).slice(0, 7);
  const total = entries.reduce((sum, [, value]) => sum + Number(value), 0);
  if (!total) {
    node.innerHTML = `<p class="empty-state">Belum ada data grafik.</p>`;
    return;
  }
  let cursor = 0;
  const gradient = entries
    .map(([, value], index) => {
      const start = cursor;
      cursor += (Number(value) / total) * 100;
      return `${colors[index % colors.length]} ${start}% ${cursor}%`;
    })
    .join(", ");
  cursor = 0;
  const labels = entries
    .map(([, value], index) => {
      const start = cursor;
      cursor += (Number(value) / total) * 100;
      const angle = ((start + cursor) / 2 / 100) * 360 - 90;
      const radius = 64;
      const x = 90 + Math.cos((angle * Math.PI) / 180) * radius;
      const y = 90 + Math.sin((angle * Math.PI) / 180) * radius;
      return `<i style="--label-color:${colors[index % colors.length]}; left:${x.toFixed(1)}px; top:${y.toFixed(1)}px">${Number(value)}</i>`;
    })
    .join("");
  node.innerHTML = `
    <div class="donut-chart" style="background: conic-gradient(${gradient})">
      <span><b>${total}</b><small>data</small></span>
      <div class="donut-segment-labels" aria-hidden="true">${labels}</div>
    </div>
    <div class="donut-legend">
      ${entries
        .map(([label, value], index) => {
          const attrs = options.filterType
            ? ` data-insight-filter-type="${escapeHtml(options.filterType)}" data-insight-filter-value="${escapeHtml(label)}" data-insight-filter-label="${escapeHtml(label)}"`
            : "";
          return `
            <div class="donut-legend-item ${options.filterType ? "is-clickable" : ""}"${attrs} ${options.filterType ? 'role="button" tabindex="0"' : ""}>
              <span class="equipment-icon donut-legend-icon" style="--item-color:${colors[index % colors.length]}">${escapeHtml(chartIconLabel(label))}</span>
              <span>${escapeHtml(label)}</span>
              <strong>${value}</strong>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function alatCategoryName(item) {
  return String(item.nama_alat || "-").trim().split(/\s+/).slice(0, 2).join(" ");
}

function topEntry(rows) {
  return Object.entries(rows).sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))[0] || ["-", 0];
}

function renderInventoryHeroInsights(categoryRows, roomRows, brandRows, valueByRoom) {
  const node = $("#inventory-hero-insights");
  if (!node) return;
  const [topCategory, topCategoryCount] = topEntry(categoryRows);
  const [topRoom, topRoomCount] = topEntry(roomRows);
  const [topBrand, topBrandCount] = topEntry(brandRows);
  const [topValueRoom, topValue] = topEntry(valueByRoom);
  node.innerHTML = [
    ["Kategori Dominan", topCategory, `${topCategoryCount} alat`, "AL"],
    ["Ruangan Terpadat", topRoom, `${topRoomCount} alat`, "RG"],
    ["Merek Terbanyak", topBrand, `${topBrandCount} alat`, "MK"],
    ["Nilai Aset Tertinggi", topValueRoom, money(topValue), "RP"],
  ]
    .map(
      ([label, value, note, icon]) => `
        <article class="analytics-insight-card">
          <span class="equipment-icon">${escapeHtml(icon)}</span>
          <div>
            <small>${escapeHtml(label)}</small>
            <strong>${escapeHtml(value)}</strong>
            <em>${escapeHtml(note)}</em>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderInventoryCategoryRank(rows) {
  const node = $("#inventory-category-rank");
  if (!node) return;
  const entries = Object.entries(rows).sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0)).slice(0, 8);
  const max = Math.max(...entries.map(([, value]) => Number(value || 0)), 1);
  node.innerHTML =
    entries
      .map(([label, value], index) => {
        const initials = cleanLabel(label)
          .split(/\s+/)
          .slice(0, 2)
          .map((item) => item[0])
          .join("")
          .toUpperCase();
        return `
          <article class="equipment-rank-item is-clickable" data-insight-filter-type="category" data-insight-filter-value="${escapeHtml(label)}" data-insight-filter-label="${escapeHtml(label)}">
            <span class="equipment-icon">${escapeHtml(initials || "AL")}</span>
            <div>
              <strong>${escapeHtml(label)}</strong>
              <span><i style="width:${Math.max(8, (Number(value) / max) * 100)}%"></i></span>
            </div>
            <b>${Number(value)}</b>
          </article>
        `;
      })
      .join("") || `<p class="empty-state">Belum ada data kategori alat.</p>`;
}

function latestKalibrasiForAlat(alatId) {
  return state.kalibrasi
    .filter((item) => item.alat_id === alatId)
    .sort((a, b) => String(b.tanggal_kalibrasi || b.created_at || "").localeCompare(String(a.tanggal_kalibrasi || a.created_at || "")))[0];
}

function latestKalibrasiRowsForTools(alatRows = state.alat) {
  const allowedIds = new Set(alatRows.map((item) => item.id));
  const latestMap = new Map();
  state.kalibrasi.forEach((row) => {
    if (!allowedIds.has(row.alat_id)) return;
    const current = latestMap.get(row.alat_id);
    const rowDate = String(row.tanggal_kalibrasi || row.created_at || "");
    const currentDate = String(current?.tanggal_kalibrasi || current?.created_at || "");
    if (!current || rowDate > currentDate) latestMap.set(row.alat_id, row);
  });
  return latestMap;
}

function latestMaintenanceForAlat(alatId) {
  return state.maintenance
    .filter((item) => item.alat_id === alatId)
    .sort((a, b) => String(b.tanggal || b.created_at || "").localeCompare(String(a.tanggal || a.created_at || "")))[0];
}

function calibrationStatusForAlat(item) {
  const latest = latestKalibrasiForAlat(item.id);
  if (!latest && !item.kalibrasi_terakhir && !item.kalibrasi_berikutnya) return "Belum Kalibrasi";
  const progress = String(latest?.status_progres || latest?.status || "").toLowerCase();
  if (/proses|berjalan|on progress|sedang/.test(progress)) return "Sedang Kalibrasi";
  if (/tidak lulus|gagal/i.test(String(latest?.hasil || ""))) return "Tidak Lulus";
  const certificateDays = daysUntil(latest?.berlaku_sampai);
  if (certificateDays !== null && certificateDays < 0) return "Sertifikat Kedaluwarsa";
  const days = daysUntil(item.kalibrasi_berikutnya);
  if (days !== null && days < 0) return "Terlambat";
  if (days !== null && days <= 30) return "Akan Jatuh Tempo";
  return "Valid";
}

function maintenanceStatusLabel(item) {
  const kind = `${item.jenis || ""} ${item.hasil || ""} ${item.keterangan || ""}`;
  if (/emergency|breakdown/i.test(kind)) return "Breakdown";
  if (/corrective berat/i.test(kind)) return "Corrective Berat";
  if (/corrective ringan/i.test(kind)) return "Corrective Ringan";
  if (/corrective/i.test(kind)) return "Corrective Ringan";
  return "Preventive Maintenance";
}

function matchesAlatInsightFilter(item, filter) {
  if (!filter) return true;
  const value = cleanLabel(filter.value);
  if (filter.type === "category") return alatCategoryName(item) === value;
  if (filter.type === "brand") return cleanLabel(item.merk) === value;
  if (filter.type === "room") return roomName(item.ruangan_id) === value;
  if (filter.type === "condition") {
    if (value === "Dalam Maintenance") return item.kondisi === "Maintenance";
    if (value === "Tidak Aktif") return item.status === "Tidak Aktif";
    return cleanLabel(item.kondisi) === value;
  }
  if (filter.type === "calibration") return calibrationStatusForAlat(item) === value;
  if (filter.type === "maintenance") return state.maintenance.some((row) => row.alat_id === item.id && maintenanceStatusLabel(row) === value);
  return true;
}

function renderSupervisorDashboard() {
  if (!isSupervisorRole()) return;
  const data = supervisorData();
  const preventiveSummary = preventiveSummaryForTools(data.alatRows);
  const calibrationSummary = calibrationSummaryForTools(data.alatRows);
  const maintenanceSchedule = maintenanceScheduleSummary(data.alatRows);
  const calibrationSchedule = calibrationScheduleSummary(data.alatRows);
  const conditionSummary = {
    baik: data.alatRows.filter((item) => item.kondisi === "Baik").length,
    rusak: data.alatRows.filter((item) => item.kondisi === "Rusak").length,
    maintenance: data.alatRows.filter((item) => item.kondisi === "Maintenance").length,
  };
  const [availabilityCategory, availabilityTone] = kpiCategory(data.availability);
  const [pmCategory, pmTone] = kpiCategory(data.pmCompliance);
  const [calCategory, calTone] = kpiCategory(data.calibrationCompliance);
  const [breakdownCategory, breakdownTone] = kpiCategory(data.breakdownRate, "lowGood");
  const [overduePmCategory, overduePmTone] = kpiCategory(data.overdueMaintenance, "lowGood");
  const [overdueCalCategory, overdueCalTone] = kpiCategory(data.overdueCalibration, "lowGood");

  $("#supervisor-main-grade").textContent = `Availability ${percent(data.availability)} - ${availabilityCategory}`;
  renderKpiCards("#supervisor-kpi-grid", [
    { label: "Total Alat", value: data.alatRows.length },
    { label: "Ruangan", value: state.ruangan.length },
    { label: "Maintenance", value: data.maintenanceRows.length.toLocaleString("id-ID") },
    {
      label: "Preventive Maintenance",
      items: [
        { label: "Sudah", value: preventiveSummary.done },
        { label: "Akan", value: preventiveSummary.upcoming, tone: "warning" },
        { label: "Belum", value: preventiveSummary.notDone, tone: "danger" },
      ],
    },
    { label: "Kalibrasi", value: data.kalibrasiRows.length.toLocaleString("id-ID") },
    {
      label: "Status Kalibrasi",
      items: [
        { label: "Sudah", value: calibrationSummary.valid },
        { label: "Akan", value: calibrationSummary.upcoming, tone: "warning" },
        {
          label: "Belum",
          value: calibrationSummary.notDone + calibrationSummary.failed,
          tone: "danger",
        },
      ],
    },
    { label: "Mutasi", value: state.mutasi.length },
    {
      label: "Kondisi Alat",
      items: [
        { label: "Baik", value: conditionSummary.baik },
        { label: "Rusak", value: conditionSummary.rusak, tone: "danger" },
        { label: "Maintenance", value: conditionSummary.maintenance, tone: "warning" },
      ],
    },
    {
      label: "Jadwal Maintenance",
      items: [
        { label: "Terlambat", value: maintenanceSchedule.overdue, tone: "danger" },
        { label: "0-3 hari", value: maintenanceSchedule.threeDays, tone: "warning" },
        { label: "4-7 hari", value: maintenanceSchedule.oneWeek, tone: "warning" },
        { label: "8-30 hari", value: maintenanceSchedule.oneMonth },
      ],
    },
    {
      label: "Jadwal Kalibrasi",
      items: [
        { label: "Terlambat", value: calibrationSchedule.overdue, tone: "danger" },
        { label: "0-3 hari", value: calibrationSchedule.threeDays, tone: "warning" },
        { label: "4-7 hari", value: calibrationSchedule.oneWeek, tone: "warning" },
        { label: "8-30 hari", value: calibrationSchedule.oneMonth },
      ],
    },
    {
      label: "Total Biaya Maintenance",
      value: moneyCompact(data.totalMaintenanceCost),
      note: money(data.totalMaintenanceCost),
    },
    {
      label: "Total Biaya Kalibrasi",
      value: moneyCompact(data.totalCalibrationCost),
      note: money(data.totalCalibrationCost),
    },
  ]);

  $("#supervisor-metric-list").innerHTML = [
    ["Availability Alat", data.availability, availabilityCategory, availabilityTone, `(${data.readyTools} alat aktif berkondisi Baik / ${data.total} total alat) x 100`],
    ["PM Compliance", data.pmCompliance, pmCategory, pmTone, "PM selesai dibanding PM terjadwal"],
    ["Calibration Compliance", data.calibrationCompliance, calCategory, calTone, "Alat terkalibrasi dibanding alat wajib kalibrasi"],
    ["Breakdown Rate", data.breakdownRate, breakdownCategory, breakdownTone, "Jumlah breakdown dibanding total alat"],
    ["Overdue Maintenance", data.overdueMaintenance, overduePmCategory, overduePmTone, "PM overdue dibanding PM terjadwal"],
    ["Overdue Kalibrasi", data.overdueCalibration, overdueCalCategory, overdueCalTone, "Kalibrasi overdue dibanding kalibrasi terjadwal"],
  ]
    .map(
      ([label, value, category, tone, formula]) => `
        <div class="supervisor-metric is-${tone}">
          <div>
            <strong>${escapeHtml(label)}</strong>
            <span>${escapeHtml(formula)}</span>
          </div>
          <b>${percent(value)}</b>
          <em>${escapeHtml(category)}</em>
        </div>
      `,
    )
    .join("");

  const breakdownCountByAlat = groupCount(
    data.maintenanceRows.filter((item) => String(item.jenis || "").includes("Corrective") || String(item.jenis || "").includes("Emergency") || String(item.jenis || "").includes("Breakdown")),
    (item) => item.alat_id,
  );
  const riskRows = data.alatRows
    .map((alat) => {
      const damage = breakdownCountByAlat[alat.id] || 0;
      const age = alat.tahun_pembelian ? Math.max(0, new Date().getFullYear() - Number(alat.tahun_pembelian)) : 0;
      const critical = ["ICU", "NICU", "PICU", "IGD", "OK"].includes(roomName(alat.ruangan_id)) ? 10 : 4;
      const score = Math.min(100, damage * 18 + (alat.kondisi === "Rusak" ? 28 : alat.kondisi === "Maintenance" ? 18 : 0) + Math.min(20, age * 2) + critical);
      return { alat, damage, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
  $("#supervisor-risk-table").innerHTML =
    riskRows
      .map(({ alat, score }) => {
        const category = score >= 80 ? "Risiko Tinggi" : score >= 60 ? "Risiko Sedang" : "Risiko Rendah";
        return `
          <tr>
            <td>${escapeHtml(alat.nama_alat || "-")}</td>
            <td>${escapeHtml(roomName(alat.ruangan_id))}</td>
            <td>${badge(alat.kondisi || "-")}</td>
            <td>${badge(`${Math.round(score)} - ${category}`)}</td>
            <td>${escapeHtml(score >= 80 ? "Prioritaskan tindakan dan evaluasi vendor." : score >= 60 ? "Pantau jadwal PM dan histori kerusakan." : "Monitoring rutin.")}</td>
          </tr>
        `;
      })
      .join("") || `<tr><td class="empty-state" colspan="5">Belum ada data risiko.</td></tr>`;

  const latestMaintenanceRows = data.alatRows
    .map((item) => latestMaintenanceForAlat(item.id))
    .filter(Boolean);
  const waitingSparepart = latestMaintenanceRows.filter((item) =>
    /spare\s*part|sparepart|suku cadang/i.test(
      `${item.status_progres || ""} ${item.hasil || ""} ${item.keterangan || ""}`,
    ),
  ).length;
  const maintenanceThisMonth = new Set(
    data.maintenanceRows
      .filter((item) => monthKey(item.tanggal) === data.currentMonth)
      .map((item) => item.alat_id)
      .filter(Boolean),
  ).size;
  const maintenanceOverdueCount = data.alatRows.filter((item) => {
    const days = daysUntil(item.preventive_berikutnya || item.maintenance_berikutnya);
    return days !== null && days < 0;
  }).length;
  const totalMaintenanceCost = sumBy(data.maintenanceRows, (item) => item.biaya_perbaikan);
  renderKpiCards("#supervisor-maintenance-cards", [
    { label: "Total Riwayat Maintenance", value: data.maintenanceRows.length.toLocaleString("id-ID") },
    {
      label: "Komposisi Maintenance",
      items: [
        { label: "Preventive", value: data.maintenanceRows.filter((item) => maintenanceStatusLabel(item) === "Preventive Maintenance").length },
        { label: "Corrective Ringan", value: data.maintenanceRows.filter((item) => maintenanceStatusLabel(item) === "Corrective Ringan").length, tone: "warning" },
        { label: "Corrective Berat", value: data.maintenanceRows.filter((item) => maintenanceStatusLabel(item) === "Corrective Berat").length, tone: "warning" },
        { label: "Breakdown", value: data.maintenanceRows.filter((item) => maintenanceStatusLabel(item) === "Breakdown").length, tone: "danger" },
      ],
    },
    { label: "Dikerjakan Bulan Ini", value: maintenanceThisMonth, note: "Jumlah alat unik" },
    { label: "Maintenance Overdue", value: maintenanceOverdueCount, tone: maintenanceOverdueCount ? "danger" : "good" },
    { label: "Menunggu Sparepart", value: waitingSparepart, tone: waitingSparepart ? "warning" : "good" },
    { label: "Alat Dalam Maintenance", value: conditionSummary.maintenance, tone: conditionSummary.maintenance ? "warning" : "good" },
    { label: "Breakdown Aktif", value: data.activeBreakdown, tone: data.activeBreakdown ? "danger" : "good" },
    { label: "Total Biaya Maintenance", value: moneyCompact(totalMaintenanceCost), note: money(totalMaintenanceCost) },
  ]);
  renderMiniBars("#supervisor-maintenance-chart", groupCount(data.maintenanceRows, (item) => monthKey(item.tanggal)), { labelFormatter: monthLabel, limit: 12 });
  const maintenanceByRoom = {};
  const maintenanceByVendor = {};
  const maintenanceTypeRows = {
    "Preventive Maintenance": 0,
    "Corrective Ringan": 0,
    "Corrective Berat": 0,
    Breakdown: 0,
  };
  data.maintenanceRows.forEach((item) => {
    const alat = state.alat.find((row) => row.id === item.alat_id) || {};
    const room = roomName(alat.ruangan_id);
    const vendor = item.vendor_pt || item.vendor || "Internal";
    const label = maintenanceStatusLabel(item);
    maintenanceByRoom[room] = (maintenanceByRoom[room] || 0) + 1;
    maintenanceByVendor[vendor] = (maintenanceByVendor[vendor] || 0) + 1;
    maintenanceTypeRows[label] = (maintenanceTypeRows[label] || 0) + 1;
  });
  renderDonutChart("#supervisor-maintenance-type-chart", maintenanceTypeRows, { filterType: "maintenance" });
  renderMiniBars("#supervisor-maintenance-room-chart", maintenanceByRoom, { filterType: "room", limit: Math.max(10, state.ruangan.length) });
  renderMiniBars("#supervisor-maintenance-vendor-chart", maintenanceByVendor, { limit: 10 });
  const maintenanceDone = data.maintenanceRows.filter((item) => ["Selesai", "Selesai Vendor", "Approved Teknisi"].includes(item.status_progres)).length;
  const maintenanceDueNow = data.alatRows.filter((item) => {
    const days = daysUntil(item.preventive_berikutnya || item.maintenance_berikutnya);
    return days !== null && days <= 30;
  }).length;
  const topMaintenanceRoom = topEntry(maintenanceByRoom);
  $("#supervisor-maintenance-insights").innerHTML = [
    ["Rasio selesai", percent(data.maintenanceRows.length ? (maintenanceDone / data.maintenanceRows.length) * 100 : 0), `${maintenanceDone} dari ${data.maintenanceRows.length} pekerjaan`],
    ["Alat mendekati jadwal", maintenanceDueNow, "Preventive jatuh tempo <= 30 hari"],
    ["Menunggu sparepart", waitingSparepart, "Status terakhir membutuhkan suku cadang"],
    ["Ruangan beban tertinggi", topMaintenanceRoom[0], `${topMaintenanceRoom[1]} pekerjaan`],
    ["Rata-rata biaya", moneyCompact(data.maintenanceRows.length ? totalMaintenanceCost / data.maintenanceRows.length : 0), "Biaya maintenance per pekerjaan"],
  ]
    .map(
      ([title, value, note]) => `
        <div class="supervisor-metric">
          <div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(note)}</span></div>
          <b>${escapeHtml(value)}</b>
          <em>Maintenance</em>
        </div>
      `,
    )
    .join("");
  $("#supervisor-breakdown-table").innerHTML =
    data.alatRows
      .map((alat) => ({ alat, damage: breakdownCountByAlat[alat.id] || 0 }))
      .filter((item) => item.damage || item.alat.kondisi === "Rusak")
      .sort((a, b) => b.damage - a.damage || String(a.alat.nama_alat || "").localeCompare(String(b.alat.nama_alat || "")))
      .slice(0, 40)
      .map(({ alat, damage }) => `
        <tr>
          <td>${escapeHtml(alat.nama_alat || "-")}</td>
          <td>${escapeHtml(roomName(alat.ruangan_id))}</td>
          <td>${damage}</td>
          <td>${badge(alat.kondisi || "-")}</td>
        </tr>
      `)
      .join("") || `<tr><td class="empty-state" colspan="4">Belum ada breakdown.</td></tr>`;

  const latestCalibrationMap = latestKalibrasiRowsForTools(data.alatRows);
  const latestCalibrationRows = Array.from(latestCalibrationMap.values());
  const calibrationStatusByTool = data.alatRows.map((alat) => ({
    alat,
    latest: latestCalibrationMap.get(alat.id),
    status: calibrationStatusForAlat(alat),
  }));
  const calibratedThisMonth = new Set(
    data.kalibrasiRows
      .filter((item) => monthKey(item.tanggal_kalibrasi) === data.currentMonth)
      .map((item) => item.alat_id)
      .filter(Boolean),
  ).size;
  const calibrationValid = calibrationStatusByTool.filter((item) => item.status === "Valid").length;
  const calibrationOngoingCount = calibrationStatusByTool.filter((item) => item.status === "Sedang Kalibrasi").length;
  const calibrationUpcomingCount = calibrationStatusByTool.filter((item) => item.status === "Akan Jatuh Tempo").length;
  const calibrationNotDoneCount = calibrationStatusByTool.filter((item) => item.status === "Belum Kalibrasi").length;
  const calibrationFailedCount = calibrationStatusByTool.filter((item) => item.status === "Tidak Lulus").length;
  const calibrationOverdueCount = calibrationStatusByTool.filter((item) => item.status === "Terlambat").length;
  const certificateExpiredCount = calibrationStatusByTool.filter((item) => item.status === "Sertifikat Kedaluwarsa").length;
  const totalCalibrationCost = sumBy(data.kalibrasiRows, (item) => item.biaya_kalibrasi || item.biaya);
  renderKpiCards("#supervisor-kalibrasi-cards", [
    { label: "Total Riwayat Kalibrasi", value: data.kalibrasiRows.length.toLocaleString("id-ID") },
    { label: "Kalibrasi Valid", value: calibrationValid, tone: calibrationValid ? "good" : "warning" },
    { label: "Sedang Kalibrasi", value: calibrationOngoingCount, tone: calibrationOngoingCount ? "warning" : "good" },
    { label: "Akan Jatuh Tempo", value: calibrationUpcomingCount, tone: calibrationUpcomingCount ? "warning" : "good" },
    { label: "Kalibrasi Overdue", value: calibrationOverdueCount, tone: calibrationOverdueCount ? "danger" : "good" },
    { label: "Sertifikat Expired", value: certificateExpiredCount, tone: certificateExpiredCount ? "danger" : "good" },
    {
      label: "Belum / Tidak Lulus",
      items: [
        { label: "Belum Kalibrasi", value: calibrationNotDoneCount, tone: calibrationNotDoneCount ? "danger" : "" },
        { label: "Tidak Lulus", value: calibrationFailedCount, tone: calibrationFailedCount ? "danger" : "" },
      ],
    },
    { label: "Dikalibrasi Bulan Ini", value: calibratedThisMonth, note: "Jumlah alat unik" },
    { label: "Total Biaya Kalibrasi", value: moneyCompact(totalCalibrationCost), note: money(totalCalibrationCost) },
  ]);
  renderMiniBars("#supervisor-kalibrasi-chart", groupCount(data.kalibrasiRows, (item) => monthKey(item.tanggal_kalibrasi)), { labelFormatter: monthLabel, limit: 12 });
  const calibrationStatusRows = {
    Valid: data.alatRows.filter((item) => calibrationStatusForAlat(item) === "Valid").length,
    "Sedang Kalibrasi": data.alatRows.filter((item) => calibrationStatusForAlat(item) === "Sedang Kalibrasi").length,
    "Akan Jatuh Tempo": data.alatRows.filter((item) => calibrationStatusForAlat(item) === "Akan Jatuh Tempo").length,
    Terlambat: data.alatRows.filter((item) => calibrationStatusForAlat(item) === "Terlambat").length,
    "Belum Kalibrasi": data.alatRows.filter((item) => calibrationStatusForAlat(item) === "Belum Kalibrasi").length,
    "Tidak Lulus": data.alatRows.filter((item) => calibrationStatusForAlat(item) === "Tidak Lulus").length,
    "Sertifikat Kedaluwarsa": data.alatRows.filter((item) => calibrationStatusForAlat(item) === "Sertifikat Kedaluwarsa").length,
  };
  const calibrationByRoom = {};
  const calibrationByVendor = {};
  data.kalibrasiRows.forEach((item) => {
    const alat = state.alat.find((row) => row.id === item.alat_id) || {};
    const room = roomName(alat.ruangan_id);
    const vendor = item.vendor_pt || item.vendor || "Internal";
    calibrationByRoom[room] = (calibrationByRoom[room] || 0) + 1;
    calibrationByVendor[vendor] = (calibrationByVendor[vendor] || 0) + Number(item.biaya_kalibrasi || item.biaya || 0);
  });
  renderDonutChart("#supervisor-kalibrasi-status-chart", calibrationStatusRows, { filterType: "calibration" });
  renderMiniBars("#supervisor-kalibrasi-room-chart", calibrationByRoom, { filterType: "room", limit: Math.max(10, state.ruangan.length) });
  renderMiniBars("#supervisor-kalibrasi-vendor-chart", calibrationByVendor, { valueFormatter: money, limit: 10 });
  const calibrationDone = data.kalibrasiRows.filter((item) => ["Selesai", "Sertifikat Terbit", "Approved"].includes(item.status_progres) || item.hasil).length;
  const topCalibrationRoom = topEntry(calibrationByRoom);
  const topCalibrationVendor = topEntry(calibrationByVendor);
  $("#supervisor-kalibrasi-insights").innerHTML = [
    ["Rasio selesai", percent(data.kalibrasiRows.length ? (calibrationDone / data.kalibrasiRows.length) * 100 : 0), `${calibrationDone} dari ${data.kalibrasiRows.length} record`],
    ["Sedang dikerjakan", calibrationOngoingCount, "Alat sedang dalam proses kalibrasi"],
    ["Mendekati jadwal", calibrationUpcomingCount, "Jatuh tempo dalam 30 hari"],
    ["Overdue / expired", calibrationOverdueCount + certificateExpiredCount, "Terlambat atau sertifikat kedaluwarsa"],
    ["Belum / tidak lulus", calibrationNotDoneCount + calibrationFailedCount, "Perlu tindak lanjut kalibrasi"],
    ["Ruangan beban tertinggi", topCalibrationRoom[0], `${topCalibrationRoom[1]} record`],
    ["Vendor biaya tertinggi", topCalibrationVendor[0], moneyCompact(topCalibrationVendor[1])],
    ["Rata-rata biaya", moneyCompact(data.kalibrasiRows.length ? totalCalibrationCost / data.kalibrasiRows.length : 0), "Biaya kalibrasi per record"],
  ]
    .map(
      ([title, value, note]) => `
        <div class="supervisor-metric">
          <div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(note)}</span></div>
          <b>${escapeHtml(value)}</b>
          <em>Kalibrasi</em>
        </div>
      `,
    )
    .join("");
  $("#supervisor-certificate-table").innerHTML =
    latestCalibrationRows
      .filter((item) => {
        const days = daysUntil(item.berlaku_sampai);
        return days !== null && days <= 60;
      })
      .sort((a, b) => String(a.berlaku_sampai || "").localeCompare(String(b.berlaku_sampai || "")))
      .slice(0, 60)
      .map((item) => {
        const alat = state.alat.find((row) => row.id === item.alat_id) || {};
        const days = daysUntil(item.berlaku_sampai);
        return `<tr><td>${escapeHtml(alatName(item.alat_id))}</td><td>${escapeHtml(roomName(alat.ruangan_id))}</td><td>${formatDate(item.berlaku_sampai)}</td><td>${badge(days < 0 ? "Expired" : `${days} hari`)}</td></tr>`;
      })
      .join("") || `<tr><td class="empty-state" colspan="4">Belum ada sertifikat jatuh tempo.</td></tr>`;

  renderSupervisorVendorFinanceReports(data);
}

function renderSupervisorVendorFinanceReports(data) {
  const workRows = [
    ...data.maintenanceRows.filter((item) => item.vendor_pt).map((item) => ({ vendor: item.vendor_pt, status: item.status_progres, date: item.tanggal })),
    ...data.kalibrasiRows.filter((item) => item.vendor_pt || item.vendor).map((item) => ({ vendor: item.vendor_pt || item.vendor, status: item.status_progres, date: item.tanggal_kalibrasi })),
  ];
  const vendorNames = [...new Set(workRows.map((item) => item.vendor).filter(Boolean))];
  const vendorStats = vendorNames.map((vendor) => {
    const rows = workRows.filter((item) => item.vendor === vendor);
    const done = rows.filter((item) => ["Selesai", "Approved Teknisi"].includes(item.status)).length;
    const sla = rows.length ? (done / rows.length) * 100 : 0;
    return { vendor, total: rows.length, done, sla, late: rows.length - done };
  });
  renderKpiCards("#supervisor-vendor-cards", [
    { label: "Pekerjaan Vendor", value: workRows.length },
    { label: "Vendor Aktif", value: vendorNames.length },
    { label: "Vendor Paling Aktif", value: vendorStats.sort((a, b) => b.total - a.total)[0]?.vendor || "-" },
    { label: "SLA Vendor", value: percent(vendorStats.length ? vendorStats.reduce((sum, item) => sum + item.sla, 0) / vendorStats.length : 0) },
  ]);
  $("#supervisor-vendor-table").innerHTML =
    vendorStats
      .sort((a, b) => b.total - a.total)
      .map((item) => {
        const [label, tone] = kpiCategory(item.sla);
        return `<tr><td>${escapeHtml(item.vendor)}</td><td>${item.total}</td><td>${percent(item.sla)}</td><td>${item.late}</td><td>${badge(label, tone === "danger" ? "danger" : tone === "warn" ? "warning" : "")}</td></tr>`;
      })
      .join("") || `<tr><td class="empty-state" colspan="5">Belum ada pekerjaan vendor.</td></tr>`;

  renderKpiCards("#supervisor-finance-cards", [
    { label: "Total Biaya Maintenance", value: moneyCompact(data.totalMaintenanceCost), note: money(data.totalMaintenanceCost) },
    { label: "Total Biaya Kalibrasi", value: moneyCompact(data.totalCalibrationCost), note: money(data.totalCalibrationCost) },
    { label: "Total Biaya Vendor", value: moneyCompact(data.totalMaintenanceCost + data.totalCalibrationCost), note: money(data.totalMaintenanceCost + data.totalCalibrationCost) },
    { label: "Biaya Bulan Ini", value: moneyCompact(data.monthlyCost), note: money(data.monthlyCost) },
  ]);
  const monthlyCosts = {};
  data.maintenanceRows.forEach((item) => {
    const key = monthKey(item.tanggal);
    monthlyCosts[key] = (monthlyCosts[key] || 0) + Number(item.biaya_perbaikan || 0);
  });
  data.kalibrasiRows.forEach((item) => {
    const key = monthKey(item.tanggal_kalibrasi);
    monthlyCosts[key] = (monthlyCosts[key] || 0) + Number(item.biaya || item.biaya_kalibrasi || 0);
  });
  renderMiniBars("#supervisor-finance-chart", monthlyCosts, { labelFormatter: monthLabel, valueFormatter: moneyCompact });
  const financeTypeCosts = {};
  data.maintenanceRows.forEach((item) => {
    const label = maintenanceStatusLabel(item);
    financeTypeCosts[label] = (financeTypeCosts[label] || 0) + Number(item.biaya_perbaikan || 0);
  });
  data.kalibrasiRows.forEach((item) => {
    financeTypeCosts.Kalibrasi = (financeTypeCosts.Kalibrasi || 0) + Number(item.biaya_kalibrasi || item.biaya || 0);
  });
  const financeVendorCosts = {};
  [...data.maintenanceRows, ...data.kalibrasiRows].forEach((item) => {
    const vendor = item.vendor_pt || item.vendor || "Internal";
    financeVendorCosts[vendor] = (financeVendorCosts[vendor] || 0) + Number(item.biaya_perbaikan || item.biaya_kalibrasi || item.biaya || 0);
  });
  renderDonutChart("#supervisor-finance-type-chart", financeTypeCosts);
  renderMiniBars("#supervisor-finance-vendor-chart", financeVendorCosts, { valueFormatter: moneyCompact, limit: 10 });

  const assetCostRows = state.alat
    .map((alat) => {
      const maintenanceCost = sumBy(data.maintenanceRows.filter((item) => item.alat_id === alat.id), (item) => item.biaya_perbaikan);
      const calibrationCost = sumBy(data.kalibrasiRows.filter((item) => item.alat_id === alat.id), (item) => item.biaya_kalibrasi || item.biaya);
      const total = maintenanceCost + calibrationCost;
      const note =
        total > 20000000
          ? "Prioritas evaluasi biaya dan vendor"
          : maintenanceCost > calibrationCost
            ? "Dominan maintenance"
            : "Dominan kalibrasi";
      return { alat, maintenanceCost, calibrationCost, total, note };
    })
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 12);

  $("#supervisor-finance-asset-table").innerHTML =
    assetCostRows
      .map(
        (item) => `<tr>
          <td>${escapeHtml(item.alat.nama_alat || "-")}</td>
          <td>${escapeHtml(item.alat.serial_number || "-")}</td>
          <td>${escapeHtml(roomName(item.alat.ruangan_id))}</td>
          <td>${money(item.maintenanceCost)}</td>
          <td>${money(item.calibrationCost)}</td>
          <td>${money(item.total)}</td>
          <td>${escapeHtml(item.note)}</td>
        </tr>`,
      )
      .join("") || `<tr><td class="empty-state" colspan="7">Belum ada biaya alat.</td></tr>`;

  const totalWork = data.maintenanceRows.length + data.kalibrasiRows.length;
  const totalCost = data.totalMaintenanceCost + data.totalCalibrationCost;
  const topVendor = topEntry(financeVendorCosts);
  const topType = topEntry(financeTypeCosts);
  const topAsset = assetCostRows[0];
  $("#supervisor-finance-insights").innerHTML = [
    ["Rata-rata biaya per pekerjaan", money(totalWork ? totalCost / totalWork : 0), `${totalWork} pekerjaan tercatat`],
    ["Vendor dengan biaya tertinggi", topVendor[0], money(topVendor[1])],
    ["Jenis biaya dominan", topType[0], money(topType[1])],
    ["Alat prioritas biaya", topAsset?.alat?.nama_alat || "-", topAsset ? `${escapeHtml(roomName(topAsset.alat.ruangan_id))} | ${money(topAsset.total)}` : "-"],
  ]
    .map(
      ([title, value, note]) => `
        <div class="supervisor-metric">
          <div>
            <strong>${escapeHtml(title)}</strong>
            <span>${escapeHtml(note)}</span>
          </div>
          <b>${escapeHtml(value)}</b>
          <em>Analisis</em>
        </div>
      `,
    )
    .join("");

  $("#supervisor-finance-room-table").innerHTML =
    state.ruangan
      .map((room) => {
        const alatIds = state.alat.filter((alat) => alat.ruangan_id === room.id).map((alat) => alat.id);
        const maintenanceCost = sumBy(data.maintenanceRows.filter((item) => alatIds.includes(item.alat_id)), (item) => item.biaya_perbaikan);
        const calibrationCost = sumBy(data.kalibrasiRows.filter((item) => alatIds.includes(item.alat_id)), (item) => item.biaya || item.biaya_kalibrasi);
        return { room, maintenanceCost, calibrationCost };
      })
      .filter((item) => item.maintenanceCost || item.calibrationCost)
      .map((item) => `<tr><td>${escapeHtml(item.room.nama_ruangan)}</td><td>${money(item.maintenanceCost)}</td><td>${money(item.calibrationCost)}</td><td>${money(item.maintenanceCost + item.calibrationCost)}</td></tr>`)
      .join("") || `<tr><td class="empty-state" colspan="4">Belum ada biaya tercatat.</td></tr>`;

  $("#supervisor-report-grid").innerHTML = [
    ["Laporan Maintenance", "maintenance", "Pekerjaan preventive, corrective, breakdown, vendor, ruangan, dan biaya."],
    ["Laporan Preventive", "preventive", "Hanya pekerjaan preventive maintenance dan jadwal terkait."],
    ["Laporan Corrective", "corrective", "Hanya pekerjaan corrective ringan dan corrective berat."],
    ["Laporan Kalibrasi", "kalibrasi", "Status kalibrasi, sertifikat, berlaku sampai, vendor, dan biaya per alat."],
    ["Laporan Vendor", "vendor", "Surat RS, pekerjaan vendor, progres, SLA, dan tindak lanjut."],
    ["Laporan Keuangan", "keuangan", "Nilai aset, biaya maintenance, biaya kalibrasi, ruangan, dan vendor."],
    ["Laporan Breakdown", "breakdown", "Alat rusak/breakdown, ruangan, risiko, dan rekomendasi pengawasan."],
    ["Laporan Eksekutif", "eksekutif", "KPI Supervisor, grafik ringkas, risiko, dan kesimpulan manajemen."],
  ]
    .map(([title, scope, description]) => `
      <div class="report-card">
        <strong>${title}</strong>
        <span>${description}</span>
        <button class="button button--small button--primary" type="button" data-supervisor-pdf="${scope}">Generate PDF</button>
      </div>
    `)
    .join("");
}

function supervisorReportData() {
  const data = supervisorData();
  const alatRows = data.alatRows || state.alat;
  const maintenanceRows = data.maintenanceRows || state.maintenance;
  const kalibrasiRows = data.kalibrasiRows || state.kalibrasi;
  const valueByRoom = {};
  const maintenanceByType = {};
  const kalibrasiByStatus = {};
  const conditionRows = {
    Baik: alatRows.filter((item) => item.kondisi === "Baik").length,
    Maintenance: alatRows.filter((item) => item.kondisi === "Maintenance").length,
    Rusak: alatRows.filter((item) => item.kondisi === "Rusak").length,
    "Tidak Aktif": alatRows.filter((item) => item.status === "Tidak Aktif").length,
  };

  alatRows.forEach((item) => {
    const room = roomName(item.ruangan_id);
    valueByRoom[room] = (valueByRoom[room] || 0) + Number(item.harga_pembelian || 0);
  });
  maintenanceRows.forEach((item) => {
    const label = maintenanceStatusLabel(item);
    maintenanceByType[label] = (maintenanceByType[label] || 0) + 1;
  });
  alatRows.forEach((item) => {
    const label = calibrationStatusForAlat(item);
    kalibrasiByStatus[label] = (kalibrasiByStatus[label] || 0) + 1;
  });

  return {
    ...data,
    alatRows,
    maintenanceRows,
    kalibrasiRows,
    categoryRows: groupCount(alatRows, alatCategoryName),
    roomRows: groupCount(alatRows, (item) => roomName(item.ruangan_id)),
    brandRows: groupCount(alatRows, (item) => item.merk || "-"),
    conditionRows,
    maintenanceByType,
    kalibrasiByStatus,
    valueByRoom,
    totalAssetValue: sumBy(alatRows, (item) => item.harga_pembelian),
    pendingRows: state.pengajuan.filter((item) => item.status === "Menunggu Supervisor" || item.status === "Disetujui Supervisor"),
  };
}

function reportBarRows(rows, formatter = (value) => value) {
  const entries = Array.isArray(rows)
    ? rows
    : Object.entries(rows || {}).map(([label, value]) => [label, value]);
  const max = Math.max(...entries.map(([, value]) => Number(value) || 0), 1);
  return entries
    .filter(([, value]) => Number(value) > 0)
    .slice(0, 12)
    .map(([label, value]) => `
      <div class="pdf-bar-row">
        <strong>${escapeHtml(cleanLabel(label))}</strong>
        <span><i style="width:${Math.max(4, (Number(value) / max) * 100)}%"></i></span>
        <b>${escapeHtml(formatter(value))}</b>
      </div>
    `)
    .join("") || `<p class="pdf-empty">Belum ada data.</p>`;
}

function reportTableRows(rows, columns, maxRows = 24) {
  return rows.slice(0, maxRows).map((row, index) => `
    <tr>
      ${columns.map((column) => `<td>${escapeHtml(column.get(row, index))}</td>`).join("")}
    </tr>
  `).join("") || `<tr><td colspan="${columns.length}">Belum ada data.</td></tr>`;
}

function supervisorReportMainTable(scope, data) {
  if (scope === "kalibrasi") {
    const columns = [
      { label: "No", get: (_, index) => index + 1 },
      { label: "Tanggal", get: (row) => formatDate(row.tanggal_kalibrasi) },
      { label: "Alat", get: (row) => alatName(row.alat_id) },
      { label: "Serial Number", get: (row) => state.alat.find((item) => item.id === row.alat_id)?.serial_number || "-" },
      { label: "Ruangan", get: (row) => roomName(state.alat.find((item) => item.id === row.alat_id)?.ruangan_id) },
      { label: "Hasil / Status", get: (row) => row.hasil || row.status_progres || "-" },
      { label: "Berlaku Sampai", get: (row) => formatDate(row.berlaku_sampai) },
      { label: "PT / Vendor", get: (row) => reportVendorName(row) },
      { label: "Biaya", get: (row) => money(row.biaya_kalibrasi || row.biaya || 0) },
    ];
    return { title: "Data Kalibrasi", columns, rows: data.kalibrasiRows };
  }
  if (scope === "vendor") {
    const rows = [
      ...state.suratVendor.map((row) => ({ ...row, source: "Surat RS" })),
      ...data.maintenanceRows.filter((row) => row.vendor_pt || row.vendor).map((row) => ({ ...row, source: "Maintenance" })),
      ...data.kalibrasiRows.filter((row) => row.vendor_pt || row.vendor).map((row) => ({ ...row, source: "Kalibrasi" })),
    ];
    const columns = [
      { label: "No", get: (_, index) => index + 1 },
      { label: "Tanggal", get: (row) => formatDate(row.created_at || row.tanggal || row.tanggal_kalibrasi) },
      { label: "Sumber", get: (row) => row.source || "-" },
      { label: "PT / Vendor", get: (row) => reportVendorName(row) },
      { label: "Layanan", get: (row) => row.jenis_layanan || row.jenis || row.jenis_pengajuan || "-" },
      { label: "Status", get: (row) => row.email_status || row.status_progres || row.status || "-" },
    ];
    return { title: "Data Vendor", columns, rows };
  }
  if (scope === "keuangan") {
    const rows = state.ruangan.map((room) => {
      const alatIds = data.alatRows.filter((alat) => alat.ruangan_id === room.id).map((alat) => alat.id);
      const asset = sumBy(data.alatRows.filter((alat) => alat.ruangan_id === room.id), (item) => item.harga_pembelian);
      const maintenanceCost = sumBy(data.maintenanceRows.filter((item) => alatIds.includes(item.alat_id)), (item) => item.biaya_perbaikan);
      const calibrationCost = sumBy(data.kalibrasiRows.filter((item) => alatIds.includes(item.alat_id)), (item) => item.biaya_kalibrasi || item.biaya);
      return { room: room.nama_ruangan, asset, maintenanceCost, calibrationCost };
    });
    const columns = [
      { label: "No", get: (_, index) => index + 1 },
      { label: "Ruangan", get: (row) => row.room },
      { label: "Nilai Aset", get: (row) => money(row.asset) },
      { label: "Maintenance", get: (row) => money(row.maintenanceCost) },
      { label: "Kalibrasi", get: (row) => money(row.calibrationCost) },
      { label: "Total Biaya", get: (row) => money(row.maintenanceCost + row.calibrationCost) },
    ];
    return { title: "Analisis Keuangan Per Ruangan", columns, rows };
  }
  if (scope === "breakdown") {
    const rows = data.alatRows.filter((row) => row.kondisi === "Rusak");
    const columns = [
      { label: "No", get: (_, index) => index + 1 },
      { label: "Alat", get: (row) => row.nama_alat || "-" },
      { label: "Serial Number", get: (row) => row.serial_number || "-" },
      { label: "Ruangan", get: (row) => roomName(row.ruangan_id) },
      { label: "Kondisi", get: (row) => row.kondisi || "-" },
      { label: "PT / Vendor", get: (row) => reportVendorName(row) },
      { label: "Rekomendasi", get: (row) => ["ICU", "NICU", "PICU", "IGD", "OK"].includes(roomName(row.ruangan_id)) ? "Prioritas tinggi" : "Pantau tindak lanjut" },
    ];
    return { title: "Daftar Alat Rusak / Breakdown Aktif", columns, rows };
  }
  const scopedMaintenanceRows =
    scope === "preventive"
      ? data.maintenanceRows.filter((row) => maintenanceStatusLabel(row) === "Preventive Maintenance")
      : scope === "corrective"
        ? data.maintenanceRows.filter((row) => maintenanceStatusLabel(row).startsWith("Corrective"))
        : data.maintenanceRows;
  const columns = [
    { label: "No", get: (_, index) => index + 1 },
    { label: "Tanggal", get: (row) => formatDate(row.tanggal) },
    { label: "Alat", get: (row) => alatName(row.alat_id) },
    { label: "Serial Number", get: (row) => state.alat.find((item) => item.id === row.alat_id)?.serial_number || "-" },
    { label: "Ruangan", get: (row) => roomName(state.alat.find((item) => item.id === row.alat_id)?.ruangan_id) },
    { label: "Jenis", get: (row) => row.jenis || "-" },
    { label: "PT / Vendor", get: (row) => reportVendorName(row) },
    { label: "Biaya", get: (row) => money(row.biaya_perbaikan || row.biaya || 0) },
  ];
  const title =
    scope === "preventive"
      ? "Data Preventive Maintenance"
      : scope === "corrective"
        ? "Data Corrective Maintenance"
        : "Data Maintenance";
  return { title, columns, rows: scopedMaintenanceRows };
}

function supervisorReportKpis(scope, data, main) {
  if (scope === "kalibrasi") {
    return [
      ["Total Kalibrasi", main.rows.length],
      ["Kalibrasi Due", reportCount(data.kalibrasiDue)],
      ["Biaya Kalibrasi", moneyCompact(sumBy(main.rows, (row) => row.biaya_kalibrasi || row.biaya))],
      ["Vendor Aktif", new Set(main.rows.map((row) => row.vendor_pt || row.vendor).filter(Boolean)).size],
    ];
  }
  if (["maintenance", "preventive", "corrective"].includes(scope)) {
    return [
      ["Total Pekerjaan", main.rows.length],
      ["Maintenance Due", reportCount(data.maintenanceDue)],
      ["Biaya Pekerjaan", moneyCompact(sumBy(main.rows, (row) => row.biaya_perbaikan))],
      ["Vendor Aktif", new Set(main.rows.map((row) => row.vendor_pt || row.vendor).filter(Boolean)).size],
    ];
  }
  if (scope === "breakdown") {
    const brokenToolIds = new Set(main.rows.map((row) => row.id));
    const breakdownRows = data.maintenanceRows.filter(
      (row) => brokenToolIds.has(row.alat_id) && maintenanceStatusLabel(row) === "Breakdown"
    );
    return [
      ["Alat Rusak", main.rows.length],
      ["Tidak Aktif", main.rows.filter((row) => row.status === "Tidak Aktif").length],
      ["Ruangan Terdampak", new Set(main.rows.map((row) => row.ruangan_id).filter(Boolean)).size],
      ["Biaya Breakdown", moneyCompact(sumBy(breakdownRows, (row) => row.biaya_perbaikan))],
    ];
  }
  if (scope === "vendor") {
    return [
      ["Aktivitas Vendor", main.rows.length],
      ["Vendor Aktif", new Set(main.rows.map((row) => row.vendor_pt || row.vendor).filter(Boolean)).size],
      ["Surat RS", state.suratVendor.length],
      ["Total Biaya Vendor", moneyCompact(data.totalMaintenanceCost + data.totalCalibrationCost)],
    ];
  }
  if (scope === "keuangan") {
    return [
      ["Nilai Aset", moneyCompact(data.totalAssetValue)],
      ["Biaya Maintenance", moneyCompact(data.totalMaintenanceCost)],
      ["Biaya Kalibrasi", moneyCompact(data.totalCalibrationCost)],
      ["Biaya Bulan Ini", moneyCompact(data.monthlyCost || 0)],
    ];
  }
  return [
    ["Total Alat", data.alatRows.length],
    ["Alat Aktif", data.active],
    ["Maintenance Due", reportCount(data.maintenanceDue)],
    ["Kalibrasi Due", reportCount(data.kalibrasiDue)],
    ["Persetujuan Pending", data.approvalPending || 0],
    ["Availability", percent(data.availability || 0)],
    ["Nilai Aset", moneyCompact(data.totalAssetValue)],
    ["Biaya Bulan Ini", moneyCompact(data.monthlyCost || 0)],
  ];
}

function openSupervisorPdfReport(scope = "eksekutif") {
  if (!isSupervisorRole()) return;
  const data = supervisorReportData();
  const titles = {
    maintenance: "Laporan Pemantauan Maintenance",
    preventive: "Laporan Preventive Maintenance",
    corrective: "Laporan Corrective Maintenance",
    kalibrasi: "Laporan Pemantauan Kalibrasi",
    vendor: "Laporan Evaluasi Vendor",
    keuangan: "Laporan Analisis Keuangan",
    breakdown: "Laporan Breakdown Alat",
    eksekutif: "Laporan Eksekutif Supervisor",
  };
  const main = supervisorReportMainTable(scope, data);
  const reportKpis = supervisorReportKpis(scope, data, main)
    .map(([label, value]) => [label, safeReportKpiValue(value)]);
  const popup = window.open("", "_blank");
  if (!popup) {
    alert("Popup diblokir browser. Izinkan popup untuk membuat PDF.");
    return;
  }

  const html = `
    <!doctype html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(titles[scope] || titles.eksekutif)}</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 28px; color: #111827; font-family: Arial, sans-serif; background: #fff; }
          .letter { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 18mm 16mm; border: 1px solid #d7e0eb; background: #fff; }
          .header { display: grid; grid-template-columns: 108px 1fr auto; align-items: center; gap: 14px; border-bottom: 4px solid #0f766e; padding-bottom: 12px; }
          .logo { width: 96px; height: 74px; border: 1px solid #d7e0eb; border-radius: 12px; padding: 4px; object-fit: contain; background: #ffffff; }
          .eyebrow { margin: 0 0 4px; color: #047857; font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: none; }
          h1 { margin: 0; font-size: 23px; line-height: 1.12; }
          h2 { margin: 22px 0 10px; font-size: 16px; }
          .meta { text-align: right; font-size: 11px; color: #475569; line-height: 1.6; }
          .subtitle { margin: 8px 0 0; color: #475569; font-size: 12px; line-height: 1.5; }
          .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 18px 0; }
          .kpi { border: 1px solid #d7e0eb; border-radius: 10px; padding: 11px; background: #f8fafc; }
          .kpi span { display: block; color: #64748b; font-weight: 700; font-size: 10px; }
          .kpi b { display: block; margin-top: 5px; font-size: 21px; }
          .kpi b.is-money { font-size: 14px; line-height: 1.25; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
          .box { border: 1px solid #d7e0eb; border-radius: 10px; padding: 13px; break-inside: avoid; }
          .pdf-bar-row { display: grid; grid-template-columns: 115px 1fr 72px; gap: 9px; align-items: center; margin: 7px 0; font-size: 11px; }
          .pdf-bar-row span { height: 8px; border-radius: 999px; background: #e2e8f0; overflow: hidden; }
          .pdf-bar-row i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #0f766e, #2f7dd1); }
          .pdf-bar-row b { text-align: right; color: #334155; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
          th { background: #eaf2fb; color: #334155; text-align: left; }
          th, td { border: 1px solid #cbd5e1; padding: 6px; vertical-align: top; }
          tr:nth-child(even) td { background: #f8fafc; }
          .note { border: 1px solid #b7e4de; background: #ecfdf5; border-radius: 10px; padding: 12px; margin-top: 16px; font-size: 12px; line-height: 1.55; }
          .footer { margin-top: 22px; border-top: 2px solid #d4af37; padding-top: 10px; font-size: 10px; color: #64748b; text-align: center; }
          @media print {
            body { padding: 0; }
            .letter { width: auto; min-height: auto; border: 0; margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="letter">
          <div class="header">
            <img class="logo" src="assets/images/rs-zezszeonsze-logo-full.png" alt="Logo Rumah Sakit ZezszeonSze" />
            <div>
              <p class="eyebrow">RUMAH SAKIT ZezszeonSze</p>
              <h1>${escapeHtml(titles[scope] || titles.eksekutif)}</h1>
              <p class="subtitle">Laporan Supervisor Elektromedis berdasarkan data dashboard inventaris alat kesehatan.</p>
            </div>
            <div class="meta">
              Tanggal: ${formatDate(new Date().toISOString())}<br />
              User: ${escapeHtml(state.user?.nama || state.user?.username || "Supervisor")}<br />
              Dashboard: inventarisalkes-7f32c.web.app
            </div>
          </div>

          <div class="kpis">
            ${reportKpis.map(([label, value]) => `<div class="kpi"><span>${escapeHtml(label)}</span><b class="${String(value).length > 12 ? "is-money" : ""}">${escapeHtml(value)}</b></div>`).join("")}
          </div>

          ${scope === "eksekutif" ? `<div class="grid">
            <div class="box"><h2>Kondisi Alat</h2>${reportBarRows(data.conditionRows)}</div>
            <div class="box"><h2>Alat per Ruangan</h2>${reportBarRows(data.roomRows)}</div>
            <div class="box"><h2>Kategori Dominan</h2>${reportBarRows(data.categoryRows)}</div>
            <div class="box"><h2>Status Kalibrasi</h2>${reportBarRows(data.kalibrasiByStatus)}</div>
          </div>` : ""}

          <h2>${escapeHtml(main.title)}</h2>
          <table>
            <thead><tr>${main.columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}</tr></thead>
            <tbody>${reportTableRows(main.rows, main.columns, scope === "eksekutif" ? 18 : 34)}</tbody>
          </table>

          <div class="note">
            <strong>Kesimpulan Supervisor:</strong>
            Laporan ${escapeHtml((titles[scope] || titles.eksekutif).toLowerCase())} ini dibuat otomatis dari data dashboard dan hanya memuat data yang sesuai dengan jenis laporan yang dipilih.
          </div>
          <div class="footer">Inventaris Alat Kesehatan RUMAH SAKIT ZezszeonSze</div>
        </div>
        <script>window.addEventListener("load", () => setTimeout(() => window.print(), 300));</script>
      </body>
    </html>
  `;

  popup.document.open();
  popup.document.write(html);
  popup.document.close();
}

function renderSupervisorInventoryAnalysis() {
  if (!isSupervisorRole()) return;
  const alatRows = state.alat;
  const totalAssetValue = sumBy(alatRows, (item) => item.harga_pembelian);
  const categoryRows = groupCount(alatRows, alatCategoryName);
  const roomRows = groupCount(alatRows, (item) => roomName(item.ruangan_id));
  const brandRows = groupCount(alatRows, (item) => item.merk || "-");
  const valueByRoom = {};
  alatRows.forEach((item) => {
    const room = roomName(item.ruangan_id);
    valueByRoom[room] = (valueByRoom[room] || 0) + Number(item.harga_pembelian || 0);
  });
  renderInventoryHeroInsights(categoryRows, roomRows, brandRows, valueByRoom);
  renderInventoryCategoryRank(categoryRows);
  renderKpiCards("#inventory-kpi-grid", [
    { label: "Total Alat", value: alatRows.length },
    { label: "Total Kategori Alat", value: new Set(alatRows.map(alatCategoryName)).size },
    { label: "Total Ruangan", value: state.ruangan.length },
    { label: "Total Vendor", value: new Set(alatRows.map((item) => item.vendor || item.perusahaan || item.nama_pt).filter(Boolean)).size || state.vendorUsers.length },
    { label: "Total Nilai Aset", value: money(totalAssetValue) },
  ]);

  renderDonutChart("#inventory-category-chart", categoryRows, { filterType: "category" });
  renderMiniBars("#inventory-room-chart", roomRows, { filterType: "room", limit: Math.max(10, state.ruangan.length) });
  renderDonutChart("#inventory-brand-chart", brandRows, { filterType: "brand" });
  renderDonutChart("#inventory-condition-chart", {
    Baik: alatRows.filter((item) => item.kondisi === "Baik").length,
    "Dalam Maintenance": alatRows.filter((item) => item.kondisi === "Maintenance").length,
    Rusak: alatRows.filter((item) => item.kondisi === "Rusak").length,
    "Tidak Aktif": alatRows.filter((item) => item.status === "Tidak Aktif").length,
  }, { filterType: "condition" });
  renderDonutChart("#inventory-calibration-chart", {
    Valid: alatRows.filter((item) => calibrationStatusForAlat(item) === "Valid").length,
    "Akan Jatuh Tempo": alatRows.filter((item) => calibrationStatusForAlat(item) === "Akan Jatuh Tempo").length,
    Terlambat: alatRows.filter((item) => calibrationStatusForAlat(item) === "Terlambat").length,
    "Sedang Kalibrasi": alatRows.filter((item) => calibrationStatusForAlat(item) === "Sedang Kalibrasi").length,
    "Belum Kalibrasi": alatRows.filter((item) => calibrationStatusForAlat(item) === "Belum Kalibrasi").length,
    "Sertifikat Kedaluwarsa": alatRows.filter((item) => calibrationStatusForAlat(item) === "Sertifikat Kedaluwarsa").length,
  }, { filterType: "calibration" });
  const pm = state.maintenance.filter((item) => maintenanceStatusLabel(item) === "Preventive Maintenance").length;
  const corrective = state.maintenance.filter((item) => maintenanceStatusLabel(item).includes("Corrective")).length;
  const breakdown = state.maintenance.filter((item) => maintenanceStatusLabel(item) === "Breakdown").length;
  renderDonutChart("#inventory-maintenance-chart", {
    "Preventive Maintenance": pm,
    "Corrective Ringan": state.maintenance.filter((item) => maintenanceStatusLabel(item) === "Corrective Ringan").length,
    "Corrective Berat": state.maintenance.filter((item) => maintenanceStatusLabel(item) === "Corrective Berat").length,
    Breakdown: breakdown,
  }, { filterType: "maintenance" });
  renderMiniBars("#inventory-value-room-chart", valueByRoom, { valueFormatter: money, filterType: "room", limit: Math.max(10, state.ruangan.length) });
  const goodMaintenance = pm >= corrective + breakdown;
  $("#inventory-maintenance-interpretation").innerHTML = `
    <div class="supervisor-metric ${goodMaintenance ? "is-good" : "is-warn"}">
      <div>
        <strong>${goodMaintenance ? "Program maintenance berjalan preventif" : "Preventive maintenance perlu evaluasi"}</strong>
        <span>Preventive: ${pm}, Corrective: ${corrective}, Breakdown: ${breakdown}</span>
      </div>
      <b>${goodMaintenance ? "Baik" : "Perlu Perhatian"}</b>
      <em>${goodMaintenance ? "Corrective dan breakdown terkendali" : "Corrective/breakdown tinggi dibanding preventive"}</em>
    </div>
  `;
}

function renderSupervisorDetailAlat() {
  if (!isSupervisorRole()) return;
  const select = $("#supervisor-detail-alat-select");
  const content = $("#supervisor-detail-alat-content");
  if (!select || !content) return;
  const selected = select.value || state.alat[0]?.id || "";
  select.innerHTML = state.alat.map((item) => `<option value="${item.id}">${escapeHtml(item.nama_alat)} | ${escapeHtml(roomName(item.ruangan_id))}</option>`).join("");
  select.value = selected && state.alat.some((item) => item.id === selected) ? selected : state.alat[0]?.id || "";
  const alat = state.alat.find((item) => item.id === select.value);
  if (!alat) {
    content.innerHTML = `<p class="empty-state">Belum ada alat untuk dianalisis.</p>`;
    return;
  }
  const maintenanceRows = state.maintenance.filter((item) => item.alat_id === alat.id);
  const kalibrasiRows = state.kalibrasi.filter((item) => item.alat_id === alat.id);
  const breakdownRows = maintenanceRows.filter((item) => String(item.jenis || "").includes("Emergency") || String(item.jenis || "").includes("Breakdown"));
  const maintenanceCost = sumBy(maintenanceRows, (item) => item.biaya_perbaikan);
  const calibrationCost = sumBy(kalibrasiRows, (item) => item.biaya || item.biaya_kalibrasi);
  const maintenanceLate = daysUntil(alat.preventive_berikutnya || alat.maintenance_berikutnya);
  const calibrationLate = daysUntil(alat.kalibrasi_berikutnya);
  const age = alat.tahun_pembelian ? Math.max(0, new Date().getFullYear() - Number(alat.tahun_pembelian)) : 0;
  const score = Math.min(100, breakdownRows.length * 18 + (alat.kondisi === "Rusak" ? 28 : alat.kondisi === "Maintenance" ? 18 : 0) + Math.min(20, age * 2));
  const riskCategory = score >= 80 ? "Risiko Tinggi" : score >= 60 ? "Risiko Sedang" : "Risiko Rendah";
  content.innerHTML = `
    <div class="stats-grid supervisor-kpi-grid">
      <article class="stat supervisor-stat"><span>Status Operasional</span><strong>${escapeHtml(alat.status || "-")}</strong><small>${escapeHtml(alat.kondisi || "-")}</small></article>
      <article class="stat supervisor-stat"><span>Status Maintenance</span><strong>${maintenanceLate !== null && maintenanceLate < 0 ? "Terlambat" : "Terkendali"}</strong><small>${maintenanceLate === null ? "-" : `${maintenanceLate} hari`}</small></article>
      <article class="stat supervisor-stat"><span>Status Kalibrasi</span><strong>${calibrationLate !== null && calibrationLate < 0 ? "Terlambat" : "Terkendali"}</strong><small>${calibrationLate === null ? "-" : `${calibrationLate} hari`}</small></article>
      <article class="stat supervisor-stat"><span>Risk Score</span><strong>${Math.round(score)}</strong><small>${riskCategory}</small></article>
      <article class="stat supervisor-stat"><span>Total Breakdown</span><strong>${breakdownRows.length}</strong></article>
      <article class="stat supervisor-stat"><span>Total Biaya Vendor</span><strong>${money(maintenanceCost + calibrationCost)}</strong></article>
    </div>
    <div class="history-grid">
      <div class="history-card"><span>Nama Alat</span><strong>${escapeHtml(alat.nama_alat || "-")}</strong></div>
      <div class="history-card"><span>Barcode</span><strong>${escapeHtml(alat.kode_barcode || "-")}</strong></div>
      <div class="history-card"><span>Serial Number</span><strong>${escapeHtml(alat.serial_number || "-")}</strong></div>
      <div class="history-card"><span>Merk / Tipe</span><strong>${escapeHtml(detailLine(alat.merk, alat.tipe))}</strong></div>
      <div class="history-card"><span>Ruangan</span><strong>${escapeHtml(roomName(alat.ruangan_id))}</strong></div>
      <div class="history-card"><span>Nilai Aset</span><strong>${money(alat.harga_pembelian)}</strong></div>
    </div>
    <div class="split supervisor-wide-split">
      <div class="panel">
        <div class="panel-header"><div><p class="eyebrow">Maintenance</p><h2>Riwayat maintenance</h2></div></div>
        <div class="supervisor-metric-list">${maintenanceRows.slice(0, 6).map((item) => `<div class="supervisor-metric"><div><strong>${formatDate(item.tanggal)} - ${escapeHtml(item.jenis || "-")}</strong><span>${escapeHtml(item.vendor_pt || item.vendor || "-")}</span></div><b>${money(item.biaya_perbaikan)}</b><em>${escapeHtml(item.status_progres || "-")}</em></div>`).join("") || `<p class="empty-state">Belum ada maintenance.</p>`}</div>
      </div>
      <div class="panel">
        <div class="panel-header"><div><p class="eyebrow">Kalibrasi</p><h2>Riwayat kalibrasi</h2></div></div>
        <div class="supervisor-metric-list">${kalibrasiRows.slice(0, 6).map((item) => `<div class="supervisor-metric"><div><strong>${formatDate(item.tanggal_kalibrasi)} - ${escapeHtml(item.hasil || "-")}</strong><span>Sertifikat: ${escapeHtml(item.nomor_sertifikat || "-")}</span></div><b>${money(item.biaya || item.biaya_kalibrasi)}</b><em>${escapeHtml(item.status_progres || "-")}</em></div>`).join("") || `<p class="empty-state">Belum ada kalibrasi.</p>`}</div>
      </div>
    </div>
  `;
}

function pengajuanForms() {
  return Array.from(document.querySelectorAll(".pengajuan-workflow-form"));
}

function pengajuanFormJenis(form) {
  return form?.dataset.fixedJenis || form?.elements.jenis_pengajuan?.value || "Maintenance";
}

function renderPengajuanFormAlatOptions(form) {
  if (!form?.elements.alat_id) return;
  const selected = form.elements.alat_id.value;
  const roomId = form.elements.ruangan_id?.value || "";
  const rows = alatRowsByRoom(roomId);
  renderAlatOptions(form.elements.alat_id, rows, "Belum ada alat");
  if (selected && rows.some((item) => item.id === selected)) {
    form.elements.alat_id.value = selected;
  }
}

function renderPengajuanFormRoomOptions() {
  const roomOptions = state.ruangan
    .map((room) => `<option value="${room.id}">${escapeHtml(room.kode_ruangan)} - ${escapeHtml(room.nama_ruangan)}</option>`)
    .join("");
  const roomOptionsWithAll = `<option value="">Semua ruangan</option>${roomOptions}`;

  pengajuanForms().forEach((form) => {
    const selectedRoom = form.elements.ruangan_id?.value || "";
    if (form.elements.ruangan_id) {
      form.elements.ruangan_id.innerHTML = roomOptionsWithAll;
      form.elements.ruangan_id.value = selectedRoom;
    }
    renderPengajuanFormAlatOptions(form);
    renderPengajuanFields(form);
  });
}

function renderVendorOverview() {
  const panel = $("#vendor-overview-panel");
  const grid = $("#vendor-overview-grid");
  if (!panel || !grid) return;
  const isVendor = state.user?.role === "Vendor";
  panel.classList.toggle("is-hidden", !isVendor);
  if (!isVendor) return;

  const works = vendorWorkRows();
  const letters = state.suratVendor.filter((item) => item.vendor_pt === currentVendorScope() && item.jenis_layanan === currentVendorService());
  const feedback = state.vendorFeedback.filter((item) => item.vendor_pt === currentVendorScope() && item.layanan === currentVendorService());
  grid.innerHTML = `
    <article class="stat"><span>Pekerjaan aktif</span><strong>${works.length}</strong></article>
    <article class="stat"><span>Surat masuk</span><strong>${letters.length}</strong></article>
    <article class="stat"><span>Feedback terkirim</span><strong>${feedback.length}</strong></article>
    <article class="stat"><span>Layanan</span><strong>${escapeHtml(currentVendorService() || "-")}</strong></article>
  `;
}

function renderRooms() {
  const selectedAlatLogRoom = elements.alatLogRuangan?.value || state.alatFilter.room;
  const selectedMaintenanceRoom = elements.maintenanceRuangan.value;
  const selectedMaintenanceLogRoom = elements.maintenanceLogRuangan.value || state.maintenanceFilter.room;
  const selectedKalibrasiRoom = elements.kalibrasiRuangan.value;
  const selectedKalibrasiLogRoom = elements.kalibrasiLogRuangan.value || state.kalibrasiFilter.room;
  const selectedPengajuanRoom = elements.pengajuanRuangan.value;

  const roomRows = state.user?.role === "Kepala Ruangan" ? state.ruangan.filter((room) => room.id === currentRoomId()) : state.ruangan;
  $("#room-grid").innerHTML = roomRows
    .map(
      (room) => {
        const roomAlat = state.alat.filter((item) => item.ruangan_id === room.id);
        const roomAlatIds = new Set(roomAlat.map((item) => item.id));
        const latestMaintenanceRows = roomAlat
          .map((item) => latestMaintenanceForAlat(item.id))
          .filter(Boolean);
        const preventive = latestMaintenanceRows.filter((item) => item.jenis === "Preventive").length;
        const corrective = latestMaintenanceRows.filter((item) => String(item.jenis || "").startsWith("Corrective")).length;
        const breakdown = latestMaintenanceRows.filter((item) => String(item.jenis || "").includes("Breakdown")).length;
        const calibrationDone = roomAlat.filter((item) => {
          const latest = latestKalibrasiForAlat(item.id);
          return Boolean(item.kalibrasi_terakhir || latest?.tanggal_kalibrasi);
        }).length;
        const calibrationUpcoming = roomAlat.filter((item) => {
          const days = daysUntil(item.kalibrasi_berikutnya);
          return days !== null && days >= 0 && days <= 30;
        }).length;
        const calibrationNotDone = roomAlat.filter((item) => {
          const latest = latestKalibrasiForAlat(item.id);
          return !item.kalibrasi_terakhir && !latest?.tanggal_kalibrasi;
        }).length;
        const activeWork = state.maintenance.filter(
          (item) =>
            roomAlatIds.has(item.alat_id) &&
            !/selesai|approved|disetujui/i.test(String(item.status_progres || "")),
        ).length;

        return `
        <article class="room ${state.roomFocusId === room.id ? "is-selected-room" : ""}">
          <div class="room__header">
            <div class="room__identity">
              <span class="room__icon">${escapeHtml(String(room.nama_ruangan || "R").slice(0, 2).toUpperCase())}</span>
              <div>
                <strong>${escapeHtml(room.nama_ruangan)}</strong>
                <span>${escapeHtml(room.kode_ruangan)}</span>
              </div>
            </div>
            ${activeWork ? `<span class="room__alert">${activeWork} proses</span>` : `<span class="room__ready">Terkendali</span>`}
          </div>
          <div class="room-stats">
            <div><span>Total alat</span><strong>${roomAlat.length}</strong></div>
            <div class="is-good"><span>Preventive</span><strong>${preventive}</strong></div>
            <div class="is-warning"><span>Corrective</span><strong>${corrective}</strong></div>
            <div class="is-danger"><span>Breakdown</span><strong>${breakdown}</strong></div>
          </div>
          <div class="room-calibration">
            <div><span>Kalibrasi sudah</span><strong>${calibrationDone}</strong></div>
            <div><span>Akan mendekati</span><strong>${calibrationUpcoming}</strong></div>
            <div><span>Belum</span><strong>${calibrationNotDone}</strong></div>
          </div>
          <button class="button button--small room__open" type="button" data-open-room="${room.id}">
            Buka data ruangan
          </button>
        </article>
      `;
      },
    )
    .join("");

  elements.alatRuangan.innerHTML = state.ruangan
    .map((room) => `<option value="${room.id}">${escapeHtml(room.kode_ruangan)} - ${escapeHtml(room.nama_ruangan)}</option>`)
    .join("");
  elements.registerRuangan.innerHTML =
    `<option value="">Pilih ruangan</option>` +
    state.ruangan
      .map((room) => `<option value="${room.id}">${escapeHtml(room.kode_ruangan)} - ${escapeHtml(room.nama_ruangan)}</option>`)
      .join("");

  const roomOptions = state.ruangan
    .map((room) => `<option value="${room.id}">${escapeHtml(room.kode_ruangan)} - ${escapeHtml(room.nama_ruangan)}</option>`)
    .join("");
  const roomOptionsWithAll = `<option value="">Semua ruangan</option>${roomOptions}`;

  elements.mutasiDariRuangan.innerHTML = `<option value="">-</option>${roomOptions}`;
  elements.mutasiKeRuangan.innerHTML = roomOptions;
  if (elements.alatLogRuangan) elements.alatLogRuangan.innerHTML = roomOptionsWithAll;
  elements.maintenanceRuangan.innerHTML = roomOptionsWithAll;
  elements.maintenanceLogRuangan.innerHTML = roomOptionsWithAll;
  elements.kalibrasiRuangan.innerHTML = roomOptionsWithAll;
  elements.kalibrasiLogRuangan.innerHTML = roomOptionsWithAll;
  elements.pengajuanRuangan.innerHTML = roomOptionsWithAll;
  if (elements.alatLogRuangan) elements.alatLogRuangan.value = selectedAlatLogRoom;
  elements.maintenanceRuangan.value = selectedMaintenanceRoom;
  elements.maintenanceLogRuangan.value = selectedMaintenanceLogRoom;
  elements.kalibrasiRuangan.value = selectedKalibrasiRoom;
  elements.kalibrasiLogRuangan.value = selectedKalibrasiLogRoom;
  elements.pengajuanRuangan.value = selectedPengajuanRoom;
  renderPengajuanFormRoomOptions();
}

function renderAlat() {
  const rows = visibleAlatRows();
  const activeRoom = state.roomFocusId ? state.ruangan.find((room) => room.id === state.roomFocusId) : null;
  const activeInsight = state.alatInsightFilter;
  elements.activeRoomFilter?.classList.toggle("is-hidden", !activeRoom && !activeInsight);
  if (elements.activeRoomFilterText) {
    elements.activeRoomFilterText.textContent = activeRoom
      ? `Filter aktif: ${activeRoom.kode_ruangan || "-"} - ${activeRoom.nama_ruangan || "-"} (${rows.length} alat)`
      : activeInsight
        ? alatInsightSummary(activeInsight, rows)
        : "";
  }
  elements.backRoomFilterButton?.classList.toggle("is-hidden", !activeRoom);
  renderAlatTableRows(rows);

  renderAlatOptions(elements.maintenanceAlat, alatRowsByRoom(elements.maintenanceRuangan.value), "Belum ada alat");
  renderAlatOptions(elements.kalibrasiAlat, alatRowsByRoom(elements.kalibrasiRuangan.value), "Belum ada alat");
  renderAlatOptions(elements.mutasiAlat, rows, "Belum ada alat");
  renderAlatOptions(elements.pengajuanAlat, alatRowsByRoom(elements.pengajuanRuangan.value), "Belum ada alat");
  pengajuanForms().forEach(renderPengajuanFormAlatOptions);

  const attention = rows
    .map((item) => ({
      ...item,
      preventiveDate: item.preventive_berikutnya || item.maintenance_berikutnya || "",
      preventiveLast: item.preventive_terakhir || item.maintenance_terakhir || "",
      riskLevel: preventiveRisk(item),
    }))
    .filter((item) => {
      const days = daysUntil(item.preventiveDate);
      return days === null || days <= 30;
    })
    .sort((a, b) => {
      const dayA = daysUntil(a.preventiveDate);
      const dayB = daysUntil(b.preventiveDate);
      if (dayA === null && dayB !== null) return 1;
      if (dayA !== null && dayB === null) return -1;
      return (dayA ?? 99999) - (dayB ?? 99999) || String(a.nama_alat || "").localeCompare(String(b.nama_alat || ""));
    });
  $("#attention-table").innerHTML =
    attention
      .map(
        (item) => {
          const status = scheduleStatus(item.preventiveDate);
          return `
          <tr>
            <td>${qrCodeImage(qrScanPayload(item), item.kode_barcode)}</td>
            <td>${escapeHtml(item.nama_alat)}</td>
            <td>${escapeHtml(roomName(item.ruangan_id))}</td>
            <td>${riskBadge(item.riskLevel)}</td>
            <td>${formatDate(item.preventiveLast)}</td>
            <td>${formatDate(item.preventiveDate)}</td>
            <td><span class="badge ${status.className}">${escapeHtml(status.label)}</span></td>
          </tr>
        `;
        },
      )
      .join("") || `<tr><td class="empty-state" colspan="7">Belum ada jadwal preventive yang mendekati jatuh tempo.</td></tr>`;

  renderSelectedAlatHistory();
}

function filterTypeLabel(type) {
  return (
    {
      category: "kategori",
      brand: "merek",
      room: "ruangan",
      condition: "kondisi",
      calibration: "kalibrasi",
      maintenance: "maintenance",
    }[type] || "data"
  );
}

function alatInsightSummary(filter, rows) {
  if (!filter) return "";
  const label = `${filterTypeLabel(filter.type)} ${filter.label || filter.value}`.trim();
  if (filter.type === "maintenance") {
    const alatIds = new Set(rows.map((item) => item.id));
    const count = state.maintenance.filter((item) => alatIds.has(item.alat_id) && maintenanceStatusLabel(item) === cleanLabel(filter.value)).length;
    return `Filter aktif: ${label} (${rows.length} alat terkait, ${count} record maintenance)`;
  }
  if (filter.type === "calibration") {
    const alatIds = new Set(rows.map((item) => item.id));
    const count = state.kalibrasi.filter((item) => alatIds.has(item.alat_id)).length;
    return `Filter aktif: ${label} (${rows.length} alat terkait, ${count} record kalibrasi)`;
  }
  return `Filter aktif: ${label} (${rows.length} alat)`;
}

function analysisToneClass(label) {
  const value = cleanLabel(label).toLowerCase();
  if (/baik|valid|preventive|aktif|lulus/.test(value)) return "is-good";
  if (/jatuh tempo|sedang|maintenance|corrective ringan|proses/.test(value)) return "is-warning";
  if (/rusak|terlambat|breakdown|kedaluwarsa|corrective berat|tidak/.test(value)) return "is-danger";
  return "is-info";
}

function alatFilterContextHtml(item) {
  const filter = state.alatInsightFilter;
  if (filter?.type === "maintenance") {
    const status = cleanLabel(filter.value);
    const rows = state.maintenance.filter((row) => row.alat_id === item.id && maintenanceStatusLabel(row) === cleanLabel(filter.value));
    const latest = rows
      .slice()
      .sort((a, b) => String(b.tanggal || b.created_at || "").localeCompare(String(a.tanggal || a.created_at || "")))[0];
    return `
      <div class="analysis-cell ${analysisToneClass(status)}">
        <strong>${escapeHtml(status)}</strong>
        <span>${rows.length} record maintenance</span>
        <span>Terakhir: ${formatDate(latest?.tanggal)}</span>
        <span>Biaya: ${money(sumBy(rows, (row) => row.biaya_perbaikan))}</span>
      </div>
    `;
  }
  if (filter?.type === "calibration") {
    const status = calibrationStatusForAlat(item);
    const rows = state.kalibrasi.filter((row) => row.alat_id === item.id);
    const latest = latestKalibrasiForAlat(item.id);
    return `
      <div class="analysis-cell ${analysisToneClass(status)}">
        <strong>${escapeHtml(status)}</strong>
        <span>${rows.length} record kalibrasi</span>
        <span>Berikutnya: ${formatDate(item.kalibrasi_berikutnya)}</span>
        <span>Biaya: ${money(sumBy(rows, (row) => row.biaya_kalibrasi || row.biaya))}</span>
        <span>Sertifikat: ${escapeHtml(latest?.nomor_sertifikat || "-")}</span>
      </div>
    `;
  }
  const latestMaintenance = latestMaintenanceForAlat(item.id);
  const latestCalibration = latestKalibrasiForAlat(item.id);
  return `
    <div class="analysis-cell ${analysisToneClass(calibrationStatusForAlat(item))}">
      <strong>${escapeHtml(calibrationStatusForAlat(item))}</strong>
      <span>Maintenance: ${escapeHtml(latestMaintenance ? maintenanceStatusLabel(latestMaintenance) : "-")}</span>
      <span>Kalibrasi: ${escapeHtml(latestCalibration?.hasil || "-")}</span>
    </div>
  `;
}

function renderAlatTableRows(rows = state.alat) {
  const table = $("#alat-table");
  if (!table) return;

  table.innerHTML =
    rows
      .map(
        (item) => `
          <tr>
            <td>${qrCodeImage(qrScanPayload(item), item.kode_barcode)}</td>
            <td>${escapeHtml(item.nama_alat)}</td>
            <td>${escapeHtml(item.serial_number || "-")}</td>
            <td>${escapeHtml(detailLine(item.merk, item.tipe))}</td>
            <td>${escapeHtml(item.vendor || "-")}</td>
            <td>${displayDateOrText(alatYearLabel(item))}</td>
            <td>${escapeHtml(roomName(item.ruangan_id))}</td>
            <td>${badge(item.kondisi)}</td>
            <td>${badge(item.status)}</td>
            <td>${alatFilterContextHtml(item)}</td>
            <td>
              <div class="table-actions">
                <button class="button button--small ${state.selectedAlatId === item.id ? "is-selected" : ""}" type="button" data-history="${
                  item.id
                }">Histori</button>
                ${
                  state.user?.role === "Admin" || state.user?.role === "Teknisi"
                    ? `<button class="button button--small" type="button" data-edit-alat="${item.id}">Edit</button>`
                    : ""
                }
                <button
                  class="button button--small"
                  type="button"
                  data-download-qr="${escapeHtml(qrScanPayload(item))}"
                  data-download-qr-name="${escapeHtml(item.nama_alat)}"
                  data-download-qr-merk="${escapeHtml(item.merk || "")}"
                >
                  Download QR
                </button>
                ${
                  state.user?.role === "Admin" || state.user?.role === "Teknisi"
                    ? `<button class="button button--small button--danger" type="button" data-delete-alat="${item.id}">Delete</button>`
                    : ""
                }
              </div>
            </td>
          </tr>
        `,
      )
      .join("") || `<tr><td class="empty-state" colspan="11">Belum ada data alat.</td></tr>`;
}

function renderHistoryList(title, items, emptyText) {
  return `
    <section class="history-list">
      <h3>${escapeHtml(title)}</h3>
      ${
        items.length
          ? items.join("")
          : `<div class="history-item"><span>${escapeHtml(emptyText)}</span></div>`
      }
    </section>
  `;
}

function buildAlatDetailHtml(alat) {
  const alatMaintenance = state.maintenance.filter((item) => item.alat_id === alat.id);
  const alatKalibrasi = state.kalibrasi.filter((item) => item.alat_id === alat.id);
  const totalMaintenanceCost = sumBy(alatMaintenance, (item) => item.biaya_perbaikan);
  const totalCalibrationCost = sumBy(alatKalibrasi, (item) => item.biaya_kalibrasi || item.biaya);
  const maintenanceItems = state.maintenance
    .filter((item) => item.alat_id === alat.id)
    .map(
      (item) => `
        <div class="history-item">
          <strong>${formatDate(item.tanggal)} - ${escapeHtml(item.jenis || "-")}</strong>
          <span>Teknisi: ${escapeHtml(item.teknisi || "-")}</span>
          <span>Vendor: ${escapeHtml(item.vendor_pt || "-")}</span>
          <span>Progres: ${escapeHtml(item.status_progres || "-")}</span>
          <span>Hasil: ${escapeHtml(item.hasil || "-")}</span>
          <span>Biaya pekerjaan: ${money(item.biaya_perbaikan)}</span>
          <span>${escapeHtml(item.keterangan || "-")}</span>
          <div class="history-media">
            ${item.foto_sebelum ? `<img src="${item.foto_sebelum}" alt="Foto sebelum" />` : ""}
            ${item.foto_sesudah ? `<img src="${item.foto_sesudah}" alt="Foto sesudah" />` : ""}
            ${item.foto_sparepart ? `<img src="${item.foto_sparepart}" alt="Foto sparepart" />` : ""}
            ${
              item.invoice
                ? `<a class="file-link" href="${item.invoice}" target="_blank" rel="noopener">Lihat invoice</a>`
                : ""
            }
          </div>
        </div>
      `,
    );

  const kalibrasiItems = state.kalibrasi
    .filter((item) => item.alat_id === alat.id)
    .map(
      (item) => `
        <div class="history-item">
          <strong>${formatDate(item.tanggal_kalibrasi)} - ${escapeHtml(item.hasil || "-")}</strong>
          <span>Berlaku sampai: ${formatDate(item.berlaku_sampai)}</span>
          <span>Vendor: ${escapeHtml(item.vendor_pt || item.vendor || "-")}</span>
          <span>Sertifikat: ${escapeHtml(item.nomor_sertifikat || "-")}</span>
          <span>Progres: ${escapeHtml(item.status_progres || "-")}</span>
          <span>Biaya kalibrasi: ${money(item.biaya_kalibrasi || item.biaya)}</span>
          <span>${escapeHtml(item.catatan || "-")}</span>
          <div class="history-media">
            ${item.foto_nilai_ukur ? `<img src="${item.foto_nilai_ukur}" alt="Foto nilai ukur" />` : ""}
            ${item.foto_sertifikat ? `<img src="${item.foto_sertifikat}" alt="Foto sertifikat" />` : ""}
          </div>
        </div>
      `,
    );

  const mutasiItems = state.mutasi
    .filter((item) => item.alat_id === alat.id)
    .map(
      (item) => `
        <div class="history-item">
          <strong>${formatDate(item.tanggal_mutasi)}</strong>
          <span>${escapeHtml(roomName(item.dari_ruangan_id))} -> ${escapeHtml(roomName(item.ke_ruangan_id))}</span>
          <span>Petugas: ${escapeHtml(item.petugas || "-")}</span>
          <span>Alasan: ${escapeHtml(item.alasan || "-")}</span>
        </div>
      `,
    );

  const perubahanItems = state.historiAlat
    .filter((item) => item.alat_id === alat.id)
    .map(
      (item) => `
        <div class="history-item">
          <strong>${formatDate(item.created_at)} - ${escapeHtml(item.aksi || "-")}</strong>
          <span>Petugas: ${escapeHtml(item.petugas || "-")}</span>
          <span>${escapeHtml(item.detail || "-")}</span>
        </div>
      `,
    );

  return `
    <div class="history-grid">
      <div class="history-card history-card--barcode">
        <span>QR Code</span>
        ${qrCodeImage(qrScanPayload(alat), alat.kode_barcode)}
        <button
          class="button button--small"
          type="button"
          data-download-qr="${escapeHtml(qrScanPayload(alat))}"
          data-download-qr-name="${escapeHtml(alat.nama_alat)}"
          data-download-qr-merk="${escapeHtml(alat.merk || "")}"
        >
          Download QR
        </button>
      </div>
      <div class="history-card">
        <span>Ruangan sekarang</span>
        <strong>${escapeHtml(roomName(alat.ruangan_id))}</strong>
      </div>
      <div class="history-card">
        <span>Serial number</span>
        <strong>${escapeHtml(alat.serial_number || "-")}</strong>
      </div>
      <div class="history-card">
        <span>Kondisi</span>
        <strong>${badge(alat.kondisi)}</strong>
      </div>
      <div class="history-card">
        <span>Status alat</span>
        <strong>${badge(alat.status)}</strong>
      </div>
      <div class="history-card">
        <span>Merk / Tipe</span>
        <strong>${escapeHtml(detailLine(alat.merk, alat.tipe))}</strong>
      </div>
      <div class="history-card">
        <span>Perusahaan</span>
        <strong>${escapeHtml(alat.vendor || "-")}</strong>
      </div>
      <div class="history-card">
        <span>${escapeHtml(alat.status_kepemilikan === "Sewa" ? "Tanggal sewa" : "Tanggal instalasi")}</span>
        <strong>${displayDateOrText(alatYearLabel(alat))}</strong>
      </div>
      <div class="history-card history-card--wide">
        <span>Foto alat</span>
        ${alat.foto_alat ? `<img class="history-preview" src="${alat.foto_alat}" alt="Foto alat" />` : "<strong>-</strong>"}
      </div>
      <div class="history-card">
        <span>Harga pembelian</span>
        <strong>${money(alat.harga_pembelian)}</strong>
      </div>
      <div class="history-card">
        <span>Total biaya maintenance</span>
        <strong>${money(totalMaintenanceCost)}</strong>
      </div>
      <div class="history-card">
        <span>Total biaya kalibrasi</span>
        <strong>${money(totalCalibrationCost)}</strong>
      </div>
      <div class="history-card">
        <span>Total biaya pekerjaan</span>
        <strong>${money(totalMaintenanceCost + totalCalibrationCost)}</strong>
      </div>
      <div class="history-card">
        <span>Status kepemilikan</span>
        <strong>${escapeHtml(alat.status_kepemilikan || "Milik RS")}</strong>
      </div>
      <div class="history-card history-card--wide">
        <span>Detail kontrak</span>
        <strong>${
          alat.status_kepemilikan === "KSO"
            ? escapeHtml(
                detailLine(
                  alat.kso_nama_partner,
                  alat.kso_tipe_kerja_sama === "Revenue sharing (%)"
                    ? `${alat.kso_persen_rs || "-"}% RS / ${alat.kso_persen_vendor || "-"}% vendor`
                    : alat.kso_fee_tetap || alat.kso_tipe_kerja_sama,
                ),
              )
            : alat.status_kepemilikan === "Sewa"
              ? escapeHtml(detailLine(alat.sewa_vendor_leasing, alat.sewa_durasi_kontrak))
              : "-"
        }</strong>
        ${
          alat.kso_file_kontrak || alat.sewa_file_kontrak
            ? `<a class="file-link" href="${alat.kso_file_kontrak || alat.sewa_file_kontrak}" target="_blank" rel="noopener">Lihat kontrak</a>`
            : ""
        }
      </div>
      <div class="history-card">
        <span>Kalibrasi awal</span>
        <strong>${formatDate(alat.kalibrasi_awal)}</strong>
      </div>
    </div>
    <div class="history-columns">
      ${renderHistoryList("Maintenance", maintenanceItems, "Belum ada histori maintenance.")}
      ${renderHistoryList("Kalibrasi", kalibrasiItems, "Belum ada histori kalibrasi.")}
      ${renderHistoryList("Mutasi Ruangan", mutasiItems, "Belum ada histori mutasi ruangan.")}
      ${renderHistoryList("Perubahan Data", perubahanItems, "Belum ada histori perubahan data.")}
    </div>
  `;
}

function renderSelectedAlatHistory() {
  const alat = state.alat.find((item) => item.id === state.selectedAlatId);

  if (!alat) {
    $("#history-title").textContent = "Pilih alat untuk melihat histori";
    $("#history-content").className = "history-empty";
    $("#history-content").innerHTML = "Klik tombol Histori pada daftar alat.";
    return;
  }

  if (!canSeeAlat(alat)) {
    $("#history-title").textContent = "Akses dibatasi";
    $("#history-content").className = "history-empty";
    $("#history-content").innerHTML = "Alat ini tidak tersedia untuk role Anda.";
    return;
  }
  $("#history-title").textContent = `${alat.nama_alat} - ${alat.kode_barcode} - ${alat.serial_number || "Tanpa serial"}`;
  $("#history-content").className = "";
  $("#history-content").innerHTML = buildAlatDetailHtml(alat);
}

function renderMaintenance() {
  const rows = visibleMaintenanceRows().filter((item) => {
    const alat = state.alat.find((row) => row.id === item.alat_id) || {};
    const search = state.maintenanceFilter.search.toLowerCase();
    const matchesRoom = !state.maintenanceFilter.room || alat.ruangan_id === state.maintenanceFilter.room;
    const matchesSearch =
      !search ||
      [alat.nama_alat, alat.kode_barcode, item.vendor_pt, item.vendor, item.jenis, item.hasil]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    return matchesRoom && matchesSearch;
  });
  $("#maintenance-table").innerHTML =
    rows
      .map(
        (item) => {
          const alat = state.alat.find((row) => row.id === item.alat_id) || {};
          const canEdit = ["Admin", "Teknisi", "Kepala Ruangan"].includes(state.user?.role) ||
            (state.user?.role === "Vendor" && (item.vendor_pt || item.vendor) === currentVendorScope());
          return `
          <tr>
            <td>${formatDate(item.tanggal)}</td>
            <td>${escapeHtml(alatName(item.alat_id))}</td>
            <td>${badge(item.jenis)}</td>
            <td>${riskBadge(preventiveRisk(alat))}</td>
            <td>${formatDate(alat.preventive_terakhir || alat.maintenance_terakhir)}</td>
            <td>${formatDate(alat.preventive_berikutnya || alat.maintenance_berikutnya)}</td>
            <td>${escapeHtml(item.teknisi || "-")}</td>
            <td>${escapeHtml(item.vendor_pt || item.vendor || "-")}</td>
            <td>${badge(item.status_progres || "Baru")}</td>
            <td>${escapeHtml(item.hasil || "-")}</td>
            <td>
              <div class="table-actions">
                <button class="button button--small" type="button" data-history-maintenance="${item.alat_id}">Histori</button>
                <button class="button button--small" type="button" data-download-qr="${escapeHtml(qrScanPayload(alat))}" data-download-qr-name="${escapeHtml(alat.nama_alat || "")}" data-download-qr-merk="${escapeHtml(alat.merk || "")}">Download QR</button>
                ${canEdit ? `<button class="button button--small" type="button" data-edit-maintenance="${item.id}">Edit</button>` : ""}
                ${canEdit ? `<button class="button button--small button--danger" type="button" data-delete-maintenance="${item.id}">Delete</button>` : ""}
              </div>
            </td>
          </tr>
        `;
        },
      )
      .join("") || `<tr><td class="empty-state" colspan="11">Belum ada riwayat maintenance.</td></tr>`;

  renderMaintenanceHistory();
}

function renderKalibrasi() {
  const rows = visibleKalibrasiRows().filter((item) => {
    const alat = state.alat.find((row) => row.id === item.alat_id) || {};
    const search = state.kalibrasiFilter.search.toLowerCase();
    const matchesRoom = !state.kalibrasiFilter.room || alat.ruangan_id === state.kalibrasiFilter.room;
    const matchesSearch =
      !search ||
      [alat.nama_alat, alat.kode_barcode, item.vendor_pt, item.vendor, item.nomor_sertifikat, item.hasil]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    return matchesRoom && matchesSearch;
  });
  $("#kalibrasi-table").innerHTML =
    rows
      .map(
        (item) => {
          const alat = state.alat.find((row) => row.id === item.alat_id) || {};
          const canEdit = ["Admin", "Teknisi", "Kepala Ruangan"].includes(state.user?.role) ||
            (state.user?.role === "Vendor" && (item.vendor_pt || item.vendor) === currentVendorScope());
          return `
          <tr>
            <td>${formatDate(item.tanggal_kalibrasi)}</td>
            <td>${escapeHtml(alatName(item.alat_id))}</td>
            <td>${formatDate(item.berlaku_sampai)}</td>
            <td>${escapeHtml(item.vendor_pt || item.vendor || "-")}</td>
            <td>${badge(item.status_progres || "Baru")}</td>
            <td>${badge(item.hasil)}</td>
            <td>${money(item.biaya_kalibrasi || item.biaya)}</td>
            <td>${escapeHtml(item.nomor_sertifikat || "-")}</td>
            <td>
              <div class="table-actions">
                <button class="button button--small" type="button" data-history-kalibrasi="${item.alat_id}">Histori</button>
                <button class="button button--small" type="button" data-download-qr="${escapeHtml(qrScanPayload(alat))}" data-download-qr-name="${escapeHtml(alat.nama_alat || "")}" data-download-qr-merk="${escapeHtml(alat.merk || "")}">Download QR</button>
                ${canEdit ? `<button class="button button--small" type="button" data-edit-kalibrasi="${item.id}">Edit</button>` : ""}
                ${canEdit ? `<button class="button button--small button--danger" type="button" data-delete-kalibrasi="${item.id}">Delete</button>` : ""}
              </div>
            </td>
          </tr>
        `;
        },
      )
      .join("") || `<tr><td class="empty-state" colspan="9">Belum ada riwayat kalibrasi.</td></tr>`;

  renderKalibrasiHistory();
}

function renderMaintenanceHistory() {
  const alat = state.alat.find((item) => item.id === state.selectedMaintenanceAlatId);
  const title = $("#maintenance-history-title");
  const content = $("#maintenance-history-content");

  if (!alat) {
    title.textContent = "Pilih alat untuk melihat histori maintenance";
    content.className = "history-empty";
    content.innerHTML = "Klik tombol Histori di log maintenance.";
    return;
  }

  const items = state.maintenance
    .filter((item) => item.alat_id === alat.id)
    .map(
      (item) => `
        <div class="history-item">
          <strong>${formatDate(item.tanggal)} - ${escapeHtml(item.jenis || "-")}</strong>
          <span>Vendor/PT: ${escapeHtml(item.vendor_pt || item.vendor || "-")}</span>
          <span>Biaya: ${escapeHtml(item.biaya_perbaikan || "-")}</span>
          <span>Progres: ${escapeHtml(item.status_progres || "-")}</span>
          <span>Hasil: ${escapeHtml(item.hasil || "-")}</span>
          <span>${escapeHtml(item.keterangan || "-")}</span>
        </div>
      `,
    )
    .join("");

  title.textContent = `${alat.nama_alat} - Maintenance`;
  content.className = "";
  content.innerHTML = items || `<div class="history-empty">Belum ada histori maintenance untuk alat ini.</div>`;
}

function renderKalibrasiHistory() {
  const alat = state.alat.find((item) => item.id === state.selectedKalibrasiAlatId);
  const title = $("#kalibrasi-history-title");
  const content = $("#kalibrasi-history-content");

  if (!alat) {
    title.textContent = "Pilih alat untuk melihat histori kalibrasi";
    content.className = "history-empty";
    content.innerHTML = "Klik tombol Histori di log kalibrasi.";
    return;
  }

  const items = state.kalibrasi
    .filter((item) => item.alat_id === alat.id)
    .map(
      (item) => `
        <div class="history-item">
          <strong>${formatDate(item.tanggal_kalibrasi)} - ${escapeHtml(item.hasil || "-")}</strong>
          <span>Vendor/PT: ${escapeHtml(item.vendor_pt || item.vendor || "-")}</span>
          <span>Berlaku sampai: ${formatDate(item.berlaku_sampai)}</span>
          <span>Sertifikat: ${escapeHtml(item.nomor_sertifikat || "-")}</span>
          <span>Progres: ${escapeHtml(item.status_progres || "-")}</span>
          <span>${escapeHtml(item.catatan || "-")}</span>
        </div>
      `,
    )
    .join("");

  title.textContent = `${alat.nama_alat} - Kalibrasi`;
  content.className = "";
  content.innerHTML = items || `<div class="history-empty">Belum ada histori kalibrasi untuk alat ini.</div>`;
}

function renderMutasi() {
  const rows = visibleMutasiRows();
  $("#mutasi-table").innerHTML =
    rows
      .map(
        (item) => `
          <tr>
            <td>${formatDate(item.tanggal_mutasi)}</td>
            <td>${escapeHtml(alatName(item.alat_id))}</td>
            <td>${escapeHtml(roomName(item.dari_ruangan_id))}</td>
            <td>${escapeHtml(roomName(item.ke_ruangan_id))}</td>
            <td>${escapeHtml(item.petugas || "-")}</td>
            <td>${escapeHtml(item.alasan || "-")}</td>
            <td>${badge(mutasiStatus(item))}</td>
            <td>
              <div class="table-actions">
                ${canApproveMutasi(item) ? `<button class="button button--small button--primary" type="button" data-approve-mutasi="${item.id}">Approve</button>` : ""}
              </div>
            </td>
          </tr>
        `,
      )
      .join("") || `<tr><td class="empty-state" colspan="8">Belum ada riwayat mutasi.</td></tr>`;
}

function renderPengajuan() {
  const formVisible = ["Admin", "Teknisi", "Kepala Ruangan"].includes(state.user?.role);
  const supervisor = isSupervisorRole();
  elements.pengajuanForm.classList.toggle("is-hidden", !formVisible);
  $$(".teknisi-split-board").forEach((panel) => panel.classList.toggle("is-hidden", state.user?.role !== "Teknisi"));
  $("#pengajuan-panel .approval-log-panel")?.classList.toggle("approval-log-panel--supervisor", supervisor);
  const approvalEyebrow = $("#pengajuan-approval-eyebrow");
  const approvalTitle = $("#pengajuan-approval-title");
  if (approvalEyebrow) approvalEyebrow.textContent = supervisor ? "Persetujuan Supervisor" : "Persetujuan";
  if (approvalTitle) approvalTitle.textContent = supervisor ? "Daftar pengajuan menunggu keputusan" : "Log pengajuan";

  const rows = visiblePengajuanRows();
  const rowHtml = (item) => {
    const alat = state.alat.find((row) => row.id === item.alat_id) || {};
    const needsVendor = needsVendorForPengajuan(item);
    const canApproveKepala =
      state.user?.role === "Kepala Ruangan" &&
      item.status === "Menunggu Kepala Ruangan" &&
      (item.ruangan_id === currentRoomId() || alat.ruangan_id === currentRoomId());
    const canApproveSupervisor = isSupervisorRole() && item.status === "Menunggu Supervisor";
    const canRejectSupervisor = isSupervisorRole() && item.status === "Menunggu Supervisor";
    const canSendToVendor = (state.user?.role === "Admin" || isSupervisorRole()) && item.status === "Disetujui Supervisor" && needsVendor;

    return `
      <tr>
        <td>${formatDate(item.created_at)}</td>
        <td>${escapeHtml(alatName(item.alat_id))}</td>
        <td>${escapeHtml(detailLine(item.jenis_pengajuan, item.kategori))}</td>
        <td>${escapeHtml(roomName(item.ruangan_id || alat.ruangan_id))}</td>
        <td>${escapeHtml(item.vendor_pt || "-")}</td>
        <td>${badge(item.status || "Draft")}</td>
        <td>
          <div class="table-actions">
            ${canApproveKepala ? `<button class="button button--small button--primary" type="button" data-approve-kepala="${item.id}">Setujui Kepala</button>` : ""}
            ${canApproveSupervisor ? `<button class="button button--small button--primary" type="button" data-approve-supervisor="${item.id}">Setujui Supervisor</button>` : ""}
            ${canRejectSupervisor ? `<button class="button button--small button--danger" type="button" data-reject-supervisor="${item.id}">Tolak</button>` : ""}
            ${canSendToVendor ? `<button class="button button--small button--primary" type="button" data-send-vendor="${item.id}">Teruskan Vendor</button>` : ""}
            ${["Admin", "Teknisi"].includes(state.user?.role) ? `<button class="button button--small button--danger" type="button" data-delete-pengajuan="${item.id}">Delete</button>` : ""}
          </div>
        </td>
      </tr>
    `;
  };

  $("#pengajuan-table").innerHTML =
    rows
      .map(rowHtml)
      .join("") || `<tr><td class="empty-state" colspan="7">Belum ada pengajuan.</td></tr>`;

  const maintenanceRows = rows.filter((item) => item.jenis_pengajuan !== "Kalibrasi");
  const kalibrasiRows = rows.filter((item) => item.jenis_pengajuan === "Kalibrasi");
  const compactRow = (item, includeKategori = true) => {
    const alat = state.alat.find((row) => row.id === item.alat_id) || {};
    return `
      <tr>
        <td>${formatDate(item.created_at)}</td>
        <td>${escapeHtml(alatName(item.alat_id))}</td>
        <td>${escapeHtml(roomName(item.ruangan_id || alat.ruangan_id))}</td>
        ${includeKategori ? `<td>${escapeHtml(item.kategori || "-")}</td>` : ""}
        <td>${escapeHtml(item.vendor_pt || "-")}</td>
        <td>${badge(item.status || "Draft")}</td>
      </tr>
    `;
  };

  const maintenanceTable = $("#pengajuan-maintenance-table");
  if (maintenanceTable) {
    maintenanceTable.innerHTML =
      maintenanceRows.map((item) => compactRow(item, true)).join("") ||
      `<tr><td class="empty-state" colspan="6">Belum ada pengajuan maintenance.</td></tr>`;
  }
  const kalibrasiTable = $("#pengajuan-kalibrasi-table");
  if (kalibrasiTable) {
    kalibrasiTable.innerHTML =
      kalibrasiRows.map((item) => compactRow(item, false)).join("") ||
      `<tr><td class="empty-state" colspan="5">Belum ada pengajuan kalibrasi.</td></tr>`;
  }
  const maintenanceDashboardTable = $("#pengajuan-maintenance-dashboard-table");
  if (maintenanceDashboardTable) {
    maintenanceDashboardTable.innerHTML =
      maintenanceRows
        .map((item) => {
          const alat = state.alat.find((row) => row.id === item.alat_id) || {};
          return `
            <tr>
              <td>${formatDate(item.created_at)}</td>
              <td>${escapeHtml(alatName(item.alat_id))}</td>
              <td>${escapeHtml(roomName(item.ruangan_id || alat.ruangan_id))}</td>
              <td>${escapeHtml(item.kategori || "-")}</td>
              <td>${escapeHtml(item.vendor_pt || "-")}</td>
              <td>${badge(item.status || "Draft")}</td>
              <td>${escapeHtml(item.catatan || "-")}</td>
            </tr>
          `;
        })
        .join("") || `<tr><td class="empty-state" colspan="7">Belum ada pengajuan maintenance.</td></tr>`;
  }
  const kalibrasiDashboardTable = $("#pengajuan-kalibrasi-dashboard-table");
  if (kalibrasiDashboardTable) {
    kalibrasiDashboardTable.innerHTML =
      kalibrasiRows
        .map((item) => {
          const alat = state.alat.find((row) => row.id === item.alat_id) || {};
          return `
            <tr>
              <td>${formatDate(item.created_at)}</td>
              <td>${escapeHtml(alatName(item.alat_id))}</td>
              <td>${escapeHtml(roomName(item.ruangan_id || alat.ruangan_id))}</td>
              <td>${escapeHtml(item.vendor_pt || "-")}</td>
              <td>${badge(item.status || "Draft")}</td>
              <td>${escapeHtml(item.catatan || "-")}</td>
            </tr>
          `;
        })
        .join("") || `<tr><td class="empty-state" colspan="6">Belum ada pengajuan kalibrasi.</td></tr>`;
  }
}

function renderRegisterUsers() {
  $("#register-table").innerHTML =
    state.registerUsers
      .map(
        (item) => `
          <tr>
            <td>${formatDate(item.created_at)}</td>
            <td>${escapeHtml(item.nama)}</td>
            <td>${escapeHtml(item.username)}</td>
            <td>${badge(item.role)}</td>
            <td>${escapeHtml(
              item.role === "Kepala Ruangan"
                ? roomName(item.ruangan_id)
                : item.role === "Vendor"
                  ? detailLine(item.nama_pt, item.vendor_layanan)
                  : "-",
            )}</td>
            <td>${escapeHtml(item.email || "-")}</td>
            <td>${escapeHtml(item.no_hp || "-")}</td>
            <td>${escapeHtml(item.telegram_id || "-")}</td>
            <td>${badge(item.status)}</td>
            <td>
              <div class="table-actions">
                <button class="button button--small button--primary" type="button" data-approve="${item.id}" ${
                  item.status === "Disetujui" ? "disabled" : ""
                }>Setujui</button>
                <button class="button button--small button--danger" type="button" data-reject="${item.id}" ${
                  item.status === "Ditolak" ? "disabled" : ""
                }>Tolak</button>
                <button class="button button--small" type="button" data-edit-register="${item.id}">Edit</button>
                <button class="button button--small button--danger" type="button" data-delete-register="${item.id}">Delete</button>
              </div>
            </td>
          </tr>
        `,
      )
      .join("") || `<tr><td class="empty-state" colspan="10">Belum ada pendaftaran user.</td></tr>`;
}

function renderRegisterRoleFields() {
  const role = elements.registerRole?.value || "Teknisi";
  elements.registerKepalaFields.classList.toggle("is-hidden", role !== "Kepala Ruangan");
  elements.registerVendorFields.classList.toggle("is-hidden", role !== "Vendor");
  elements.registerRuangan.required = role === "Kepala Ruangan";
  elements.registerVendorFields.querySelectorAll("input, select").forEach((field) => {
    field.required = role === "Vendor";
  });
}

function renderAlatOwnershipFields() {
  const value = elements.alatKepemilikan.value || "Milik RS";
  const ksoType = elements.alatKsoType?.value || "Revenue sharing (%)";
  const hargaField = elements.alatForm.elements.harga_pembelian.closest("label");
  elements.alatKsoFields.classList.toggle("is-hidden", value !== "KSO");
  elements.alatSewaFields.classList.toggle("is-hidden", value !== "Sewa");
  elements.alatKsoSplitFields?.classList.toggle("is-hidden", ksoType !== "Revenue sharing (%)");
  elements.alatKsoFeeWrap?.classList.toggle("is-hidden", ksoType !== "Fee tetap");
  hargaField.classList.toggle("is-hidden", value !== "Milik RS");
  elements.alatTanggalInstalasi?.closest("label")?.classList.toggle("is-hidden", value !== "Milik RS");
  elements.alatTanggalSewa?.closest("label")?.classList.toggle("is-hidden", value !== "Sewa");

  if (value !== "Milik RS") {
    elements.alatForm.elements.harga_pembelian.value = "";
    elements.alatTanggalInstalasi.value = "";
  }
  if (value !== "Sewa") {
    elements.alatTanggalSewa.value = "";
    elements.alatForm.elements.sewa_durasi_kontrak.value = "";
  }
  if (ksoType !== "Revenue sharing (%)") {
    elements.alatForm.elements.kso_persen_rs.value = "";
    elements.alatForm.elements.kso_persen_vendor.value = "";
  }
  if (ksoType !== "Fee tetap") {
    elements.alatForm.elements.kso_fee_tetap.value = "";
  }
  if (value === "Sewa" && elements.alatForm.elements.sewa_tanggal_mulai.value && elements.alatForm.elements.sewa_tanggal_akhir.value) {
    const duration = calculateSewaDuration();
    if (duration) elements.alatForm.elements.sewa_durasi_kontrak.value = duration;
  }
}

function calculateSewaDuration() {
  const start = elements.alatForm.elements.sewa_tanggal_mulai?.value;
  const end = elements.alatForm.elements.sewa_tanggal_akhir?.value;
  if (!start || !end) return "";
  const startDate = new Date(start);
  const endDate = new Date(end);
  const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
  const days = Math.max(0, Math.round((endDate - startDate) / 86400000));
  if (months > 0 && Math.abs(days) >= 28) return `${months} bulan`;
  return `${days} hari`;
}

function renderMaintenanceKindFields() {
  const form = elements.maintenanceForm;
  const jenis = form.elements.jenis.value;
  const isPreventive = jenis === "Preventive";
  const showVendorFields = jenis === "Corrective Berat" || jenis === "Emergency (Breakdown)";
  $$(".maintenance-vendor-field").forEach((field) => field.classList.toggle("is-hidden", !showVendorFields));
  $("#preventive-fields")?.classList.toggle("is-hidden", !isPreventive);
  const dateLabel = $("#maintenance-date-label");
  if (dateLabel) dateLabel.textContent = isPreventive ? "Tanggal preventive maintenance" : "Tanggal maintenance";
  if (!showVendorFields) {
    form.elements.vendor_pt.value = "";
    form.elements.status_progres.value = "Baru";
    form.elements.biaya_perbaikan.value = "";
  }
  if (isPreventive) {
    updatePreventiveSchedulePreview();
  }
}

function latestPreventiveDate(alatId) {
  return state.maintenance
    .filter((item) => item.alat_id === alatId && item.jenis === "Preventive" && item.tanggal)
    .map((item) => item.tanggal)
    .sort((a, b) => String(b).localeCompare(String(a)))[0] || "";
}

function syncPreventiveFormFromAlat() {
  const form = elements.maintenanceForm;
  const alat = state.alat.find((item) => item.id === form.elements.alat_id.value) || {};
  const risk = preventiveRisk(alat);
  form.elements.tingkat_risiko.value = risk;
  form.elements.preventive_terakhir.value =
    alat.preventive_terakhir ||
    latestPreventiveDate(alat.id) ||
    alat.maintenance_terakhir ||
    "";
  updatePreventiveSchedulePreview();
}

function updatePreventiveSchedulePreview() {
  const form = elements.maintenanceForm;
  if (!form?.elements.tingkat_risiko) return;
  const risk = form.elements.tingkat_risiko.value || "Sedang";
  const interval = PREVENTIVE_INTERVAL_MONTHS[risk] || 3;
  const sourceDate = form.elements.tanggal.value || form.elements.preventive_terakhir.value;
  form.elements.interval_preventive.value = `${interval} bulan`;
  form.elements.preventive_berikutnya.value = addMonthsToDate(sourceDate, interval);
}

function renderPengajuanFields(targetForm = null) {
  const forms = targetForm ? [targetForm] : pengajuanForms();
  forms.forEach((form) => {
    const jenis = pengajuanFormJenis(form);
    const kategoriField = form.elements.kategori;
    const vendorField = form.elements.vendor_pt;
    const kategori = kategoriField?.value || "Preventive";
    const showKategori = jenis === "Maintenance";
    const showVendor = jenis === "Kalibrasi" || kategori === "Corrective Berat" || kategori === "Emergency (Breakdown)";
    const vendorService = jenis === "Kalibrasi" ? "Kalibrasi" : "Maintenance";

    form.querySelector(".pengajuan-kategori-wrap")?.classList.toggle("is-hidden", !showKategori);
    form.querySelector(".pengajuan-vendor-wrap")?.classList.toggle("is-hidden", !showVendor);
    renderPengajuanVendorOptions(showVendor ? vendorService : "", form);

    if (showKategori && kategoriField && !["Preventive", "Corrective Ringan", "Corrective Berat", "Emergency (Breakdown)"].includes(kategoriField.value)) {
      kategoriField.value = "Preventive";
    }
    if (!showKategori && kategoriField) {
      kategoriField.value = "";
    }
    if (!showVendor && vendorField) {
      vendorField.value = "";
    }
  });
}

function renderPengajuanVendorOptions(service = "", form = elements.pengajuanForm) {
  const vendorSelect = form?.elements.vendor_pt || elements.pengajuanVendor;
  if (!vendorSelect) return;
  const selected = vendorSelect.value;
  const vendors = state.vendorUsers.filter((item) => {
    if (!service) return false;
    const vendorService = item.vendor_layanan || "";
    return vendorService === service;
  });

  vendorSelect.innerHTML =
    `<option value="">Pilih vendor/PT</option>` +
    vendors
      .map((item) => {
        const label = item.nama_pt || item.nama || item.username || "-";
        const suffix = item.vendor_layanan ? ` (${escapeHtml(item.vendor_layanan)})` : "";
        return `<option value="${escapeHtml(label)}">${escapeHtml(label)}${suffix}</option>`;
      })
      .join("");

  if (selected && vendors.some((item) => (item.nama_pt || item.nama || item.username || "-") === selected)) {
    vendorSelect.value = selected;
  }
}

function renderLegacyPengajuanFields() {
  const jenis = elements.pengajuanJenis?.value || "Maintenance";
  const kategori = elements.pengajuanKategori?.value || "Preventive";
  const showKategori = jenis === "Maintenance";
  const showVendor = jenis === "Kalibrasi" || kategori === "Corrective Berat" || kategori === "Emergency (Breakdown)";
  const vendorService = jenis === "Kalibrasi" ? "Kalibrasi" : "Maintenance";

  elements.pengajuanKategoriWrap?.classList.toggle("is-hidden", !showKategori);
  elements.pengajuanVendorWrap?.classList.toggle("is-hidden", !showVendor);
  renderPengajuanVendorOptions(showVendor ? vendorService : "");

  if (showKategori && elements.pengajuanKategori && !["Preventive", "Corrective Ringan", "Corrective Berat", "Emergency (Breakdown)"].includes(elements.pengajuanKategori.value)) {
    elements.pengajuanKategori.value = "Preventive";
  }
  if (!showKategori && elements.pengajuanKategori) {
    elements.pengajuanKategori.value = "";
  }
  if (!showVendor && elements.pengajuanVendor) {
    elements.pengajuanVendor.value = "";
  }
}

function renderLaporanKrFields() {
  const jenis = elements.laporanKrJenis?.value || "Maintenance";
  const kategori = elements.laporanKrKategori?.value || "Preventive";
  const showKategori = jenis === "Maintenance";

  elements.laporanKrKategoriWrap?.classList.toggle("is-hidden", !showKategori);
  elements.laporanKrVendorWrap?.classList.add("is-hidden");

  if (showKategori && elements.laporanKrKategori && !["Preventive", "Corrective Ringan", "Corrective Berat", "Emergency (Breakdown)"].includes(elements.laporanKrKategori.value)) {
    elements.laporanKrKategori.value = "Preventive";
  }
  if (!showKategori && elements.laporanKrKategori) {
    elements.laporanKrKategori.value = "";
  }
  if (elements.laporanKrVendor) {
    elements.laporanKrVendor.value = "";
  }
}

function applyRoleFormDefaults() {
  if (!state.user) return;

  const kepala = state.user.role === "Kepala Ruangan";
  const supervisor = isSupervisorRole();
  if (kepala || supervisor) {
    closeMaintenanceForm();
    closeKalibrasiForm();
    pengajuanForms().forEach(closePengajuanSideForm);
  }
  elements.maintenanceLogRoomWrap?.classList.toggle("is-hidden", kepala);
  elements.kalibrasiLogRoomWrap?.classList.toggle("is-hidden", kepala);
  $("#maintenance-panel > .split")?.classList.toggle("is-hidden", supervisor);
  $("#kalibrasi-panel > .split")?.classList.toggle("is-hidden", supervisor);
  $("#maintenance-panel .split")?.classList.toggle("is-log-only", kepala);
  $("#kalibrasi-panel .split")?.classList.toggle("is-log-only", kepala);
  $("#pengajuan-panel .split")?.classList.toggle("is-log-only", supervisor);
  $("#supervisor-maintenance-monitoring")?.classList.toggle("is-hidden", !supervisor);
  $("#supervisor-kalibrasi-monitoring")?.classList.toggle("is-hidden", !supervisor);
  $("#maintenance-history-panel")?.classList.toggle("is-hidden", supervisor);
  $("#kalibrasi-history-panel")?.classList.toggle("is-hidden", supervisor);

  if (kepala && elements.mutasiDariRuangan) {
    elements.mutasiDariRuangan.value = currentRoomId() || "";
    elements.mutasiDariRuangan.disabled = true;
  } else if (elements.mutasiDariRuangan) {
    elements.mutasiDariRuangan.disabled = false;
  }

  if (state.user.role === "Vendor") {
    const vendorName = currentVendorScope();
    const service = currentVendorService();
    if (service === "Maintenance" && elements.maintenanceForm?.elements.vendor_pt) {
      elements.maintenanceForm.elements.vendor_pt.value = vendorName;
    }
    if (service === "Kalibrasi" && elements.kalibrasiForm?.elements.vendor) {
      elements.kalibrasiForm.elements.vendor.value = vendorName;
    }
  }
}

function visibleNotifikasiRows() {
  if (state.user?.role !== "Teknisi") return [];
  return state.notifikasi.filter((item) => item.tujuan_role !== "Kepala Ruangan");
}

function visibleLaporanKrRows() {
  if (state.user?.role !== "Kepala Ruangan") return [];
  const roomId = currentRoomId();
  return state.notifikasi.filter((item) => {
    const fromKepala =
      item.dibuat_oleh_role === "Kepala Ruangan" ||
      String(item.dibuat_oleh || "").toLowerCase().includes("kepala ruangan");
    const toKepala = item.tujuan_role === "Kepala Ruangan";
    const isHistory =
      item.status_pengerjaan === "Sudah selesai dikerjakan" ||
      item.status === "Approved Kepala Ruangan" ||
      item.status === "Selesai Teknisi" ||
      item.status === "Dikirim ke Kepala Ruangan";
    return (fromKepala || toKepala) && (!roomId || item.ruangan_id === roomId) && !isHistory;
  });
}

function visibleLaporanKrHistoryRows() {
  if (state.user?.role !== "Kepala Ruangan") return [];
  const roomId = currentRoomId();
  return state.notifikasi.filter((item) => {
    const fromKepala =
      item.dibuat_oleh_role === "Kepala Ruangan" ||
      String(item.dibuat_oleh || "").toLowerCase().includes("kepala ruangan");
    const toKepala = item.tujuan_role === "Kepala Ruangan";
    const isHistory =
      item.status_pengerjaan === "Sudah selesai dikerjakan" ||
      item.status === "Approved Kepala Ruangan" ||
      item.status === "Selesai Teknisi" ||
      item.status === "Dikirim ke Kepala Ruangan";
    return (fromKepala || toKepala) && (!roomId || item.ruangan_id === roomId) && isHistory;
  });
}

function visibleTeknisiHistoryRows() {
  if (state.user?.role !== "Teknisi") return [];

  const notifRows = state.notifikasi
    .filter((item) => item.status_pengerjaan === "Sudah selesai dikerjakan" || item.status === "Approved Kepala Ruangan")
    .map((item) => ({
      date: item.created_at,
      source: "Laporan KR",
      alat_id: item.alat_id,
      ruangan_id: item.ruangan_id,
      status: item.status === "Approved Kepala Ruangan" ? "Approve" : "Selesai",
      detail: item.catatan_update || item.catatan || "-",
      progress: item.status_pengerjaan || item.status || "-",
    }));

  const maintenanceRows = state.maintenance
    .filter((item) => item.status_progres && ["Selesai", "Selesai Vendor", "Approved", "Done", "Selesai Teknisi"].includes(item.status_progres))
    .map((item) => ({
      date: item.tanggal,
      source: "Maintenance",
      alat_id: item.alat_id,
      ruangan_id: state.alat.find((alat) => alat.id === item.alat_id)?.ruangan_id || null,
      status: item.status_progres,
      detail: item.hasil || item.keterangan || "-",
      progress: item.vendor_pt || item.vendor || "-",
    }));

  const kalibrasiRows = state.kalibrasi
    .filter((item) => item.status_progres && ["Sertifikat Terbit", "Selesai", "Approved", "Done"].includes(item.status_progres))
    .map((item) => ({
      date: item.tanggal_kalibrasi,
      source: "Kalibrasi",
      alat_id: item.alat_id,
      ruangan_id: state.alat.find((alat) => alat.id === item.alat_id)?.ruangan_id || null,
      status: item.status_progres,
      detail: item.nomor_sertifikat || item.catatan || "-",
      progress: item.vendor_pt || item.vendor || "-",
    }));

  return [...notifRows, ...maintenanceRows, ...kalibrasiRows].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

function notifikasiPengerjaanLabel(item) {
  return item.status_pengerjaan || "Belum dikerjakan";
}

function laporanKrStatusLabel(item) {
  if (item.status_pengerjaan === "Sudah selesai dikerjakan" || item.status === "Dikirim ke Kepala Ruangan") {
    return "Approve";
  }
  return item.status || "Draft";
}

function canApproveLaporanKr(item) {
  if (state.user?.role !== "Kepala Ruangan") return false;
  const roomId = currentRoomId();
  if (!roomId) return false;
  const fromCurrentRoom = !roomId || item.ruangan_id === roomId;
  const readyToApprove =
    item.tujuan_role === "Kepala Ruangan" ||
    item.status === "Dikirim ke Kepala Ruangan" ||
    item.status_pengerjaan === "Sudah selesai dikerjakan";
  return fromCurrentRoom && readyToApprove;
}

function isQuickEditNotifikasi(item) {
  const jenis = item.jenis_laporan || item.jenis_pengajuan || "";
  const kategori = item.kategori || "";
  return jenis === "Maintenance" && ["Preventive", "Corrective Ringan"].includes(kategori);
}

function setNotifikasiEditMode(item = null) {
  state.editingNotifikasiId = item?.id || null;
  elements.notifikasiForm?.classList.toggle("is-hidden", !item);
  elements.notifikasiCancelButton?.classList.toggle("is-hidden", !item);

  if (!item) {
    elements.notifikasiForm?.reset();
    setMessage(elements.notifikasiEditMessage, "");
    return;
  }

  if (elements.notifikasiFormTitle) {
    elements.notifikasiFormTitle.textContent = `Update ${alatName(item.alat_id)}`;
  }
  if (elements.notifikasiStatus) {
    elements.notifikasiStatus.value = item.status_pengerjaan || "Belum dikerjakan";
  }
  if (elements.notifikasiCatatanUpdate) {
    elements.notifikasiCatatanUpdate.value = item.catatan_update || item.catatan || "";
  }
  if (elements.notifikasiFotoUpdate) {
    elements.notifikasiFotoUpdate.value = "";
  }
  setMessage(
    elements.notifikasiEditMessage,
    isQuickEditNotifikasi(item)
      ? "Tambahkan foto update atau ubah status lalu simpan."
      : "Kategori ini perlu pengajuan dulu. Saya akan arahkan ke form Pengajuan.",
  );
}

function prefillPengajuanFromNotifikasi(item) {
  if (!elements.pengajuanForm) return;
  const jenis = item.jenis_laporan || item.jenis_pengajuan || "Maintenance";
  const kategori = item.kategori || (jenis === "Kalibrasi" ? "" : "Preventive");
  const service = jenis === "Kalibrasi" ? "Kalibrasi" : "Maintenance";

  elements.pengajuanJenis.value = jenis;
  elements.pengajuanRuangan.value = item.ruangan_id || "";
  renderPengajuanFields();
  renderAlatOptions(elements.pengajuanAlat, alatRowsByRoom(elements.pengajuanRuangan.value), "Belum ada alat");
  elements.pengajuanAlat.value = item.alat_id || "";

  if (jenis === "Maintenance") {
    elements.pengajuanKategori.value = kategori || "Preventive";
    const needsVendor = ["Corrective Berat", "Emergency (Breakdown)"].includes(elements.pengajuanKategori.value);
    renderPengajuanVendorOptions(needsVendor ? service : "");
    if (needsVendor && !elements.pengajuanVendor.value) {
      const vendor = state.vendorUsers.find((row) => row.vendor_layanan === "Maintenance");
      elements.pengajuanVendor.value = vendor ? (vendor.nama_pt || vendor.nama || vendor.username || "") : "";
    }
  } else {
    renderPengajuanVendorOptions(service);
    if (!elements.pengajuanVendor.value) {
      const vendor = state.vendorUsers.find((row) => row.vendor_layanan === "Kalibrasi");
      elements.pengajuanVendor.value = vendor ? (vendor.nama_pt || vendor.nama || vendor.username || "") : "";
    }
  }

  if (item.vendor_pt) {
    elements.pengajuanVendor.value = item.vendor_pt;
  }
  elements.pengajuanForm.elements.catatan.value = item.catatan || "";
  state.pendingPengajuanSourceId = item.id;
}

function renderNotifikasi() {
  const rows = visibleNotifikasiRows().sort((a, b) => {
    const doneA = a.status_pengerjaan === "Sudah selesai dikerjakan";
    const doneB = b.status_pengerjaan === "Sudah selesai dikerjakan";
    return Number(doneA) - Number(doneB) || new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  elements.notifikasiTable.innerHTML =
    rows
      .map((item) => {
        const done = item.status_pengerjaan === "Sudah selesai dikerjakan";
        return `
          <tr>
            <td>${formatDate(item.created_at)}</td>
            <td>${escapeHtml(alatName(item.alat_id))}</td>
            <td>${escapeHtml(item.jenis_laporan || item.jenis_pengajuan || "-")}</td>
            <td>${escapeHtml(item.kategori || "-")}</td>
            <td>${escapeHtml(roomName(item.ruangan_id) || "-")}</td>
            <td>${badge(notifikasiPengerjaanLabel(item))}</td>
            <td>${badge(item.status || "-")}</td>
            <td>${escapeHtml(item.catatan || "-")}</td>
            <td class="row-actions">
              <button class="button button--small" type="button" data-edit-notifikasi="${item.id}">${done ? "Histori" : "Edit"}</button>
              ${!done ? `<button class="button button--small" type="button" data-notifikasi-belum="${item.id}">Belum Selesai</button>` : ""}
              ${!done ? `<button class="button button--small button--success" type="button" data-notifikasi-selesai="${item.id}">Sudah Selesai</button>` : ""}
            </td>
          </tr>
        `;
      })
      .join("") || `<tr><td class="empty-state" colspan="9">Belum ada notifikasi dari Kepala Ruangan.</td></tr>`;
}

function renderLaporanKr() {
  const formVisible = state.user?.role === "Kepala Ruangan";
  elements.laporanKrForm.classList.toggle("is-hidden", !formVisible);
  const roomId = currentRoomId();
  const roomAlat = roomId ? alatRowsByRoom(roomId) : visibleAlatRows();
  renderAlatOptions(elements.laporanKrAlat, roomAlat, "Belum ada alat di ruangan ini");

  const rows = visibleLaporanKrRows();
  elements.laporanKrTable.innerHTML =
    rows
      .map(
        (item) => `
          <tr>
            <td>${formatDate(item.created_at)}</td>
            <td>${escapeHtml(alatName(item.alat_id))}</td>
            <td>${escapeHtml(item.jenis_laporan || item.jenis_pengajuan || "-")}</td>
            <td>${escapeHtml(item.kategori || "-")}</td>
            <td>${badge(laporanKrStatusLabel(item))}</td>
            <td>${escapeHtml(item.catatan || "-")}</td>
            <td>
              <div class="row-actions">
                ${canApproveLaporanKr(item) ? `<button class="button button--small button--primary" type="button" data-approve-laporan-kr="${item.id}">Approve</button>` : ""}
              </div>
            </td>
          </tr>
        `,
      )
      .join("") || `<tr><td class="empty-state" colspan="7">Belum ada laporan dari ruangan ini.</td></tr>`;
}

function renderLaporanKrHistory() {
  if (state.user?.role !== "Kepala Ruangan") {
    if (elements.laporanKrHistoryTable) elements.laporanKrHistoryTable.innerHTML = "";
    return;
  }

  const rows = visibleLaporanKrHistoryRows();
  elements.laporanKrHistoryTable.innerHTML =
    rows
      .map(
        (item) => `
          <tr>
            <td>${formatDate(item.created_at)}</td>
            <td>${escapeHtml(alatName(item.alat_id))}</td>
            <td>${escapeHtml(item.jenis_laporan || item.jenis_pengajuan || "-")}</td>
            <td>${escapeHtml(item.kategori || "-")}</td>
            <td>${badge(laporanKrStatusLabel(item))}</td>
            <td>${escapeHtml(item.catatan_update || item.catatan || "-")}</td>
          </tr>
        `,
      )
      .join("") || `<tr><td class="empty-state" colspan="6">Belum ada histori laporan selesai.</td></tr>`;
}

function renderTeknisiHistory() {
  if (!elements.historyTeknisiTable) return;
  if (state.user?.role !== "Teknisi") {
    elements.historyTeknisiTable.innerHTML = "";
    return;
  }

  const rows = visibleTeknisiHistoryRows();
  elements.historyTeknisiTable.innerHTML =
    rows
      .map(
        (item) => `
          <tr>
            <td>${formatDate(item.date)}</td>
            <td>${escapeHtml(item.source)}</td>
            <td>${escapeHtml(alatName(item.alat_id))}</td>
            <td>${escapeHtml(roomName(item.ruangan_id) || "-")}</td>
            <td>${badge(item.status)}</td>
            <td>${escapeHtml(item.detail || "-")}</td>
            <td>${escapeHtml(item.progress || "-")}</td>
          </tr>
        `,
      )
      .join("") || `<tr><td class="empty-state" colspan="7">Belum ada histori teknisi.</td></tr>`;
}

function vendorWorkRows() {
  const vendorName = currentVendorScope();
  const service = currentVendorService();
  if (state.user?.role !== "Vendor" || !vendorName) return [];
  const rows = service === "Kalibrasi"
    ? visibleKalibrasiRows().map((item) => ({ ...item, layanan: "Kalibrasi", record_key: `kalibrasi:${item.id}`, tanggal_ref: item.tanggal_kalibrasi }))
    : visibleMaintenanceRows().map((item) => ({ ...item, layanan: "Maintenance", record_key: `maintenance:${item.id}`, tanggal_ref: item.tanggal }));
  return rows.filter((item) => (item.vendor_pt || item.vendor) === vendorName);
}

function renderVendorFeedback() {
  const isVendor = state.user?.role === "Vendor";
  const isTeknisi = state.user?.role === "Teknisi";
  elements.vendorFeedbackLayout?.classList.toggle("is-vendor", isVendor);
  elements.vendorFeedbackForm?.classList.toggle("is-hidden", !isVendor);

  if (elements.vendorFeedbackRecord) {
    const rows = vendorWorkRows();
    elements.vendorFeedbackRecord.innerHTML =
      rows
        .map((item) => `<option value="${escapeHtml(item.record_key)}">${escapeHtml(item.layanan)} - ${escapeHtml(alatName(item.alat_id))} - ${escapeHtml(item.status_progres || "Baru")}</option>`)
        .join("") || `<option value="">Belum ada pekerjaan vendor</option>`;
  }

  const visibleFeedback = state.vendorFeedback.filter((item) => {
    if (isTeknisi) return true;
    if (isVendor) return item.vendor_pt === currentVendorScope() && item.layanan === currentVendorService();
    return false;
  });

  if (elements.vendorFeedbackTable) {
    elements.vendorFeedbackTable.innerHTML =
      visibleFeedback
        .map((item) => {
          const readyToApprove = isTeknisi && item.status === "Selesai";
          return `
            <tr>
              <td>${formatDate(item.created_at)}</td>
              <td>${escapeHtml(item.vendor_pt || "-")}</td>
              <td>${escapeHtml(item.layanan || "-")}</td>
              <td>${escapeHtml(alatName(item.alat_id))}</td>
              <td>${badge(item.status || "-")}</td>
              <td>${escapeHtml(item.catatan || "-")}</td>
              <td>
                <div class="table-actions">
                  ${
                    readyToApprove
                      ? `<button class="button button--small button--primary" type="button" data-approve-feedback="${item.id}">Approve Teknisi</button>`
                      : item.status === "Approved Teknisi"
                        ? badge("Approved Teknisi")
                        : "-"
                  }
                </div>
              </td>
            </tr>
          `;
        })
        .join("") || `<tr><td class="empty-state" colspan="7">Belum ada feedback vendor.</td></tr>`;
  }

  renderVendorLetters();
}

function visibleVendorLetters() {
  if (state.user?.role === "Vendor") {
    return state.suratVendor.filter((item) => item.vendor_pt === currentVendorScope() && item.jenis_layanan === currentVendorService());
  }
  if (["Teknisi", "Admin"].includes(state.user?.role) || isSupervisorRole()) {
    return state.suratVendor;
  }
  return [];
}

function vendorLetterRowsHtml(letters) {
  return (
    letters
      .map(
        (item) => `
          <tr>
            <td>${formatDate(item.created_at)}</td>
            <td>${escapeHtml(item.nomor_surat || "-")}</td>
            <td>${escapeHtml(item.vendor_pt || "-")}</td>
            <td>${escapeHtml(item.jenis_layanan || "-")}</td>
            <td>${badge(item.email_status || "Queued")}</td>
            <td>
              ${item.html_surat ? `<button class="button button--small" type="button" data-preview-letter="${item.id}">Preview</button>` : "-"}
            </td>
          </tr>
        `,
      )
      .join("") || `<tr><td class="empty-state" colspan="6">Belum ada surat dari RS.</td></tr>`
  );
}

function renderVendorLetters() {
  const letters = visibleVendorLetters();
  const html = vendorLetterRowsHtml(letters);
  if (elements.vendorLetterTable) elements.vendorLetterTable.innerHTML = html;
  if (elements.vendorSuratTable) elements.vendorSuratTable.innerHTML = html;
}

function mutasiStatus(item) {
  if (item.status) return item.status;
  if (item.approve_dari_status === "Approved" && item.approve_ke_status === "Approved") return "Disetujui";
  if (item.approve_dari_status === "Rejected" || item.approve_ke_status === "Rejected") return "Ditolak";
  return "Pending";
}

function canApproveMutasi(item) {
  if (state.user?.role !== "Kepala Ruangan") return false;
  const roomId = currentRoomId();
  if (!roomId) return false;
  if (item.dari_ruangan_id === roomId) return item.approve_dari_status !== "Approved" && mutasiStatus(item) !== "Disetujui";
  if (item.ke_ruangan_id === roomId) return item.approve_ke_status !== "Approved" && mutasiStatus(item) !== "Disetujui";
  return false;
}

function renderAll() {
  const steps = [
    renderShell,
    renderStats,
    renderSupervisorDashboard,
    renderSupervisorInventoryAnalysis,
    renderSupervisorDetailAlat,
    renderAlat,
    renderRooms,
    renderMaintenance,
    renderKalibrasi,
    renderMutasi,
    renderPengajuan,
    renderNotifikasi,
    renderTeknisiHistory,
    renderVendorFeedback,
    renderLaporanKr,
    renderLaporanKrHistory,
    renderRegisterUsers,
    renderRegisterRoleFields,
    renderAlatOwnershipFields,
    renderMaintenanceKindFields,
    renderPengajuanFields,
    renderLaporanKrFields,
  ];

  steps.forEach((step) => {
    try {
      step();
    } catch (error) {
      console.error(`Render gagal di ${step.name}:`, error);
    }
  });

  if (state.editingNotifikasiId) {
    const current = state.notifikasi.find((item) => item.id === state.editingNotifikasiId) || null;
    if (current) {
      setNotifikasiEditMode(current);
    } else {
      setNotifikasiEditMode(null);
    }
  }
  applyRoleFormDefaults();
}

async function performLoadData(options = {}) {
  const requestItems = [
    ["ruangan", supabase("ruangan?select=*&order=kode_ruangan.asc"), state.ruangan],
    ["alat", supabaseAll("alat_kesehatan?select=*&order=created_at.desc"), state.alat],
    ["maintenance", supabaseAll("maintenance?select=*&order=tanggal.desc"), state.maintenance],
    ["kalibrasi", supabaseAll("kalibrasi?select=*&order=tanggal_kalibrasi.desc"), state.kalibrasi],
    ["mutasi", supabaseAll("mutasi_alat?select=*&order=tanggal_mutasi.desc"), state.mutasi],
    ["pengajuan", supabaseAll("pengajuan?select=*&order=created_at.desc"), state.pengajuan],
    [
      "vendorUsers",
      supabase("user_petugas?select=id,nama,username,nama_pt,vendor_layanan,role,status,email,no_hp,telegram_id&role=eq.Vendor&status=eq.Aktif&order=nama_pt.asc"),
      state.vendorUsers,
    ],
    ["notifikasi", supabaseAll("notifikasi_teknisi?select=*&order=created_at.desc"), state.notifikasi],
    ["historiAlat", supabaseAll("histori_alat?select=*&order=created_at.desc"), state.historiAlat],
    ["vendorFeedback", supabaseAll("feedback_vendor?select=*&order=created_at.desc"), state.vendorFeedback],
    ["suratVendor", supabaseAll("surat_vendor?select=*&order=created_at.desc"), state.suratVendor],
    ["emailQueue", supabaseAll("email_queue?select=*&order=created_at.desc"), state.emailQueue],
  ];

  if (state.user?.role === "Admin") {
    requestItems.push(["registerUsers", supabaseAll("register_user?select=*&order=created_at.desc"), state.registerUsers]);
  }

  const results = await Promise.allSettled(requestItems.map((item) => item[1]));
  const data = {};
  const failed = [];

  results.forEach((result, index) => {
    const [key, , fallback] = requestItems[index];
    if (result.status === "fulfilled") {
      data[key] = result.value;
      return;
    }
    data[key] = fallback;
    failed.push(key);
  });

  state.ruangan = data.ruangan || [];
  state.alat = data.alat || [];
  state.maintenance = data.maintenance || [];
  state.kalibrasi = data.kalibrasi || [];
  state.mutasi = data.mutasi || [];
  state.pengajuan = data.pengajuan || [];
  state.vendorUsers = data.vendorUsers || [];
  state.notifikasi = data.notifikasi || [];
  state.historiAlat = data.historiAlat || [];
  state.registerUsers = data.registerUsers || [];
  state.vendorFeedback = data.vendorFeedback || [];
  state.suratVendor = data.suratVendor || [];
  state.emailQueue = data.emailQueue || [];
  renderAlatTableRows(state.alat);
  renderAll();

  if (failed.length && !options.silent) {
    const target = document.querySelector(".tab-panel:not(.is-hidden) .message") || elements.loginMessage;
    setMessage(target, `Sinkronisasi sebagian data tertunda: ${failed.join(", ")}. Angka terakhir yang berhasil dibaca tetap ditampilkan.`, "error");
  }
}

let activeLoadDataPromise = null;

async function loadData(options = {}) {
  if (activeLoadDataPromise) return activeLoadDataPromise;
  activeLoadDataPromise = performLoadData(options);
  try {
    return await activeLoadDataPromise;
  } finally {
    activeLoadDataPromise = null;
  }
}

async function loadPublicData() {
  if (state.scanCode || state.scanId) {
    await loadScanData();
    return;
  }
  state.ruangan = await supabase("ruangan?select=*&order=kode_ruangan.asc");
  renderShell();
  renderRooms();
  renderRegisterRoleFields();
}

async function loadScanData() {
  const code = String(state.scanCode || "").trim();
  const scanId = String(state.scanId || "").trim();
  if (!code && !scanId) {
    renderScanView();
    return;
  }

  const [ruangan, alatRows] = await Promise.all([
    supabase("ruangan?select=*&order=kode_ruangan.asc"),
    scanId
      ? supabase(`alat_kesehatan?select=*&id=eq.${encodeURIComponent(scanId)}&limit=1`)
      : supabase(`alat_kesehatan?select=*&kode_barcode=eq.${encodeURIComponent(code)}&limit=1`),
  ]);

  state.ruangan = ruangan;
  state.alat = alatRows;

  if (alatRows[0]) {
    const alatId = alatRows[0].id;
    const [maintenance, kalibrasi, mutasi, histori] = await Promise.all([
      supabase(`maintenance?select=*&alat_id=eq.${encodeURIComponent(alatId)}&order=tanggal.desc`),
      supabase(`kalibrasi?select=*&alat_id=eq.${encodeURIComponent(alatId)}&order=tanggal_kalibrasi.desc`),
      supabase(`mutasi_alat?select=*&alat_id=eq.${encodeURIComponent(alatId)}&order=tanggal_mutasi.desc`),
      supabaseOptional(`histori_alat?select=*&alat_id=eq.${encodeURIComponent(alatId)}&order=created_at.desc`),
    ]);
    state.maintenance = maintenance;
    state.kalibrasi = kalibrasi;
    state.mutasi = mutasi;
    state.historiAlat = histori;
  } else {
    state.maintenance = [];
    state.kalibrasi = [];
    state.mutasi = [];
    state.historiAlat = [];
  }

  renderShell();
  renderScanView();
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function emptyToNull(value) {
  return value === "" ? null : value;
}

async function formDataWithFiles(form, fileFields = []) {
  const payload = formData(form);
  await Promise.all(
    fileFields.map(async (field) => {
      const file = form.elements[field]?.files?.[0];
      payload[field] = file ? await fileToDataUrl(file) : null;
    }),
  );
  return payload;
}

function dbValue(value) {
  return encodeURIComponent(String(value).trim());
}

function barcodePart(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 24);
}

function generateBarcode(payload) {
  const parts = [payload.nama_alat, payload.merk, payload.tipe, payload.serial_number].map(barcodePart).filter(Boolean);
  return parts.join("-");
}

function alatYearLabel(alat) {
  return alat.status_kepemilikan === "Sewa"
    ? alat.tanggal_sewa || alat.tahun_pembelian || "-"
    : alat.tanggal_instalasi || alat.tahun_pembelian || "-";
}

function displayDateOrText(value) {
  if (!value || value === "-") return "-";
  return String(value).includes("-") ? formatDate(value) : String(value);
}

function suratSequenceNumber() {
  const next = state.suratVendor.length + 1;
  return `${String(next).padStart(3, "0")}/RSZS/IPRS/V/${new Date().getFullYear()}`;
}

function buildVendorLetterHtml(item, recordId = "") {
  const alat = state.alat.find((row) => row.id === item.alat_id) || {};
  const jenis = serviceForPengajuan(item);
  const vendor = state.vendorUsers.find((row) => (row.nama_pt || row.nama || row.username) === item.vendor_pt) || {};
  const nomor = suratSequenceNumber();
  const pic = item.dibuat_oleh || state.user?.nama || state.user?.username || "-";
  const picUser = [state.user, ...state.vendorUsers].find((row) => row?.username === item.dibuat_oleh || row?.nama === item.dibuat_oleh) || {};
  const tindakan = jenis === "Kalibrasi" ? "Kalibrasi" : item.kategori || "Maintenance";
  return {
    nomor,
    subject: `Pengajuan ${jenis} Alat Kesehatan - ${alat.nama_alat || "-"}`,
    to: vendor.email || "",
    html: `
      <article style="font-family:Arial,sans-serif;color:#172033;line-height:1.55;max-width:860px;margin:auto">
        <header style="border-bottom:5px solid #0b55ad;padding:20px 0 14px;margin-bottom:24px">
          <h1 style="margin:0;color:#0b55ad;font-size:34px">Rumah Sakit Zeonsze</h1>
          <p style="margin:4px 0 0;color:#667085">Melayani dengan Hati, Menjaga Kesehatan Anda</p>
        </header>
        <p style="text-align:right">Tanggal, ${formatDate(new Date().toISOString())}</p>
        <table style="margin:18px 0 28px">
          <tr><td>Nomor</td><td style="padding:0 12px">:</td><td>${escapeHtml(nomor)}</td></tr>
          <tr><td>Lampiran</td><td style="padding:0 12px">:</td><td>1 (satu) lembar</td></tr>
          <tr><td>Perihal</td><td style="padding:0 12px">:</td><td><strong>Pengajuan ${escapeHtml(jenis)} Alat Kesehatan</strong></td></tr>
        </table>
        <p>Kepada Yth.<br><strong>Pimpinan / Tim Teknisi</strong><br>${escapeHtml(item.vendor_pt || "Vendor terkait")}<br>di Tempat</p>
        <p>Dengan hormat,</p>
        <p>Sehubungan dengan kebutuhan menjaga kualitas, keamanan, dan kelayakan operasional alat kesehatan di lingkungan Rumah Sakit Zeonsze, bersama ini kami mengajukan permohonan pelaksanaan ${escapeHtml(jenis.toLowerCase())} alat kesehatan dengan rincian sebagai berikut:</p>
        <table style="border-collapse:collapse;width:100%;margin:20px 0">
          <thead>
            <tr style="background:#0b55ad;color:white">
              <th style="border:1px solid #9aa4b2;padding:8px">No.</th>
              <th style="border:1px solid #9aa4b2;padding:8px">Nama Alat</th>
              <th style="border:1px solid #9aa4b2;padding:8px">Merk / Tipe</th>
              <th style="border:1px solid #9aa4b2;padding:8px">Serial Number</th>
              <th style="border:1px solid #9aa4b2;padding:8px">Ruang / Lokasi</th>
              <th style="border:1px solid #9aa4b2;padding:8px">Jenis Tindakan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border:1px solid #9aa4b2;padding:8px;text-align:center">1</td>
              <td style="border:1px solid #9aa4b2;padding:8px">${escapeHtml(alat.nama_alat || "-")}</td>
              <td style="border:1px solid #9aa4b2;padding:8px">${escapeHtml(detailLine(alat.merk, alat.tipe))}</td>
              <td style="border:1px solid #9aa4b2;padding:8px">${escapeHtml(alat.serial_number || "-")}</td>
              <td style="border:1px solid #9aa4b2;padding:8px">${escapeHtml(roomName(item.ruangan_id || alat.ruangan_id))}</td>
              <td style="border:1px solid #9aa4b2;padding:8px">${escapeHtml(tindakan)}</td>
            </tr>
          </tbody>
        </table>
        <p>Pelaksanaan kegiatan tersebut kami harapkan dapat dilakukan pada:</p>
        <table>
          <tr><td>Hari/Tanggal</td><td style="padding:0 12px">:</td><td>${formatDate(new Date().toISOString())}</td></tr>
          <tr><td>Lokasi</td><td style="padding:0 12px">:</td><td>Rumah Sakit Zeonsze</td></tr>
          <tr><td>PIC Rumah Sakit</td><td style="padding:0 12px">:</td><td>${escapeHtml(pic)}</td></tr>
          <tr><td>Nomor HP</td><td style="padding:0 12px">:</td><td>${escapeHtml(item.dibuat_oleh_hp || picUser.no_hp || state.user?.no_hp || "-")}</td></tr>
        </table>
        <p>Demikian surat pengajuan ini kami sampaikan. Atas perhatian dan kerja sama yang baik, kami ucapkan terima kasih.</p>
        <p style="text-align:right;margin-top:42px">Hormat kami,<br><strong>Rumah Sakit Zeonsze</strong><br><br><br><u>dr. Andika Pratama</u><br>Direktur Utama</p>
        <footer style="border-top:4px solid #1c9a45;margin-top:28px;padding-top:10px;text-align:center;color:#0b55ad;font-weight:700">Melayani dengan Hati, Menjaga Kesehatan Anda</footer>
      </article>
    `,
    recordId,
  };
}

async function queueVendorLetter(item, recordId = "") {
  const letter = buildVendorLetterHtml(item, recordId);
  const service = serviceForPengajuan(item);
  const suratRows = await supabase("surat_vendor", {
    method: "POST",
    body: JSON.stringify({
      pengajuan_id: item.id,
      record_ref: recordId,
      nomor_surat: letter.nomor,
      vendor_pt: item.vendor_pt || null,
      jenis_layanan: service,
      subject: letter.subject,
      to_email: letter.to || null,
      html_surat: letter.html,
      email_status: letter.to ? "Queued" : "No Email",
      dibuat_oleh: state.user?.username || state.user?.nama || null,
    }),
  });

  if (letter.to) {
    await supabase("email_queue", {
      method: "POST",
      body: JSON.stringify({
        surat_id: suratRows?.[0]?.id || null,
        to_email: letter.to,
        subject: letter.subject,
        html_body: letter.html,
        status: "Queued",
      }),
    });
  }
}

function setAlatEditMode(alat = null) {
  state.editingAlatId = alat?.id || null;
  elements.alatForm.classList.remove("is-hidden");
  elements.alatForm.closest(".alat-workspace")?.classList.add("is-editor-open");
  elements.alatSubmitButton.textContent = alat ? "Update Alat" : "Simpan Alat";
  elements.alatCancelButton.classList.remove("is-hidden");
  elements.alatCancelButton.textContent = alat ? "Batal Edit" : "Kembali ke daftar alat";
  elements.openAlatFormButton?.classList.add("is-active");
  if (elements.openAlatFormButton) elements.openAlatFormButton.textContent = alat ? "Tutup Form Edit" : "Tutup Form";

  if (!alat) {
    elements.alatForm.reset();
    $("#barcode-preview").textContent = "Akan dibuat saat disimpan";
    renderAlatOwnershipFields();
    setMessage(elements.alatMessage, "");
    return;
  }

  const fields = elements.alatForm.elements;
  fields.nama_alat.value = alat.nama_alat || "";
  fields.foto_alat.value = "";
  fields.merk.value = alat.merk || "";
  fields.tipe.value = alat.tipe || "";
  fields.serial_number.value = alat.serial_number || "";
  fields.vendor.value = alat.vendor || "";
  fields.tanggal_instalasi.value = alat.tanggal_instalasi || "";
  fields.tanggal_sewa.value = alat.tanggal_sewa || "";
  fields.harga_pembelian.value = alat.harga_pembelian || "";
  fields.kalibrasi_awal.value = alat.kalibrasi_awal || "";
  fields.status_kepemilikan.value = alat.status_kepemilikan || "Milik RS";
  fields.kso_nama_partner.value = alat.kso_nama_partner || "";
  fields.kso_tipe_kerja_sama.value = alat.kso_tipe_kerja_sama || "Revenue sharing (%)";
  fields.kso_persen_rs.value = alat.kso_persen_rs || "";
  fields.kso_persen_vendor.value = alat.kso_persen_vendor || "";
  fields.kso_fee_tetap.value = alat.kso_fee_tetap || "";
  fields.kso_tanggal_mulai.value = alat.kso_tanggal_mulai || "";
  fields.kso_tanggal_akhir.value = alat.kso_tanggal_akhir || "";
  fields.sewa_vendor_leasing.value = alat.sewa_vendor_leasing || "";
  fields.sewa_biaya_per_bulan.value = alat.sewa_biaya_per_bulan || "";
  fields.sewa_durasi_kontrak.value = alat.sewa_durasi_kontrak || "";
  fields.sewa_tanggal_mulai.value = alat.sewa_tanggal_mulai || "";
  fields.sewa_tanggal_akhir.value = alat.sewa_tanggal_akhir || "";
  fields.sewa_buyback.value = alat.sewa_buyback || "Tidak ada buyback";
  fields.ruangan_id.value = alat.ruangan_id || "";
  fields.kondisi.value = alat.kondisi || "Baik";
  fields.status.value = alat.status || "Aktif";
  renderAlatOwnershipFields();
  $("#barcode-preview").textContent = alat.kode_barcode || generateBarcode(formData(elements.alatForm));
  setMessage(elements.alatMessage, "Mode edit aktif. Ubah data lalu klik Update Alat.");
}

function closeAlatForm() {
  setAlatEditMode(null);
  elements.alatForm.classList.add("is-hidden");
  elements.alatForm.closest(".alat-workspace")?.classList.remove("is-editor-open");
  elements.openAlatFormButton?.classList.remove("is-active");
  if (elements.openAlatFormButton) elements.openAlatFormButton.textContent = "Tambah Alat";
  elements.openAlatFormButton?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function openAlatForm() {
  if (!elements.alatForm.classList.contains("is-hidden")) {
    closeAlatForm();
    return;
  }
  setAlatEditMode(null);
  elements.alatForm.classList.remove("is-hidden");
  elements.alatForm.closest(".alat-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function normalizeAlatStatusByCondition(formOrPayload) {
  const condition = formOrPayload?.kondisi || formOrPayload?.elements?.kondisi?.value;
  if (condition !== "Rusak") return formOrPayload?.status || formOrPayload?.elements?.status?.value || "Aktif";
  if (formOrPayload?.elements?.status) formOrPayload.elements.status.value = "Tidak Aktif";
  return "Tidak Aktif";
}

function sideFormWorkspace(form) {
  return form?.closest(".side-form-workspace");
}

function setSideFormOpen(form, button, open, openLabel, closeLabel) {
  if (!form) return;
  form.classList.toggle("is-hidden", !open);
  sideFormWorkspace(form)?.classList.toggle("is-editor-open", open);
  button?.classList.toggle("is-active", open);
  if (button) button.textContent = open ? closeLabel : openLabel;
}

function openSideForm(form, button, openLabel, closeLabel) {
  setSideFormOpen(form, button, true, openLabel, closeLabel);
  sideFormWorkspace(form)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeSideForm(form, button, openLabel, closeLabel) {
  setSideFormOpen(form, button, false, openLabel, closeLabel);
}

function toggleSideForm(form, button, openLabel, closeLabel, resetHandler = null) {
  if (!form) return;
  if (!form.classList.contains("is-hidden")) {
    closeSideForm(form, button, openLabel, closeLabel);
    return;
  }
  resetHandler?.();
  openSideForm(form, button, openLabel, closeLabel);
}

function openMaintenanceFormForCreate() {
  if (!elements.maintenanceForm?.classList.contains("is-hidden")) {
    setMaintenanceEditMode(null);
    closeMaintenanceForm();
    return;
  }
  setMaintenanceEditMode(null);
  openSideForm(elements.maintenanceForm, elements.openMaintenanceFormButton, "Tambah Maintenance", "Tutup Form");
}

function closeMaintenanceForm() {
  closeSideForm(elements.maintenanceForm, elements.openMaintenanceFormButton, "Tambah Maintenance", "Tutup Form");
}

function openMaintenanceFormForEdit(item) {
  setMaintenanceEditMode(item);
  openSideForm(elements.maintenanceForm, elements.openMaintenanceFormButton, "Tambah Maintenance", "Tutup Form Edit");
}

function openKalibrasiFormForCreate() {
  if (!elements.kalibrasiForm?.classList.contains("is-hidden")) {
    setKalibrasiEditMode(null);
    closeKalibrasiForm();
    return;
  }
  setKalibrasiEditMode(null);
  openSideForm(elements.kalibrasiForm, elements.openKalibrasiFormButton, "Tambah Kalibrasi", "Tutup Form");
}

function closeKalibrasiForm() {
  closeSideForm(elements.kalibrasiForm, elements.openKalibrasiFormButton, "Tambah Kalibrasi", "Tutup Form");
}

function openKalibrasiFormForEdit(item) {
  setKalibrasiEditMode(item);
  openSideForm(elements.kalibrasiForm, elements.openKalibrasiFormButton, "Tambah Kalibrasi", "Tutup Form Edit");
}

function pengajuanFormButton(form) {
  return pengajuanFormJenis(form) === "Kalibrasi"
    ? elements.openPengajuanKalibrasiFormButton
    : elements.openPengajuanMaintenanceFormButton;
}

function closePengajuanSideForm(form) {
  closeSideForm(form, pengajuanFormButton(form), "Buat Pengajuan", "Tutup Form");
}

function openPengajuanSideForm(jenis) {
  const form = pengajuanForms().find((item) => pengajuanFormJenis(item) === jenis);
  if (!form) return;
  toggleSideForm(form, pengajuanFormButton(form), "Buat Pengajuan", "Tutup Form", () => {
    form.reset();
    renderPengajuanFields(form);
    renderPengajuanFormAlatOptions(form);
    setMessage(form.querySelector(".pengajuan-form-message"), "");
  });
}

function setMaintenanceEditMode(item = null) {
  state.editingMaintenanceId = item?.id || null;
  if (!item) {
    elements.maintenanceForm.reset();
    syncPreventiveFormFromAlat();
    renderMaintenanceKindFields();
    setMessage(elements.maintenanceMessage, "");
    return;
  }

  const fields = elements.maintenanceForm.elements;
  fields.alat_id.value = item.alat_id || "";
  fields.jenis.value = item.jenis || "Preventive";
  fields.tanggal.value = item.tanggal || "";
  fields.teknisi.value = item.teknisi || "";
  fields.vendor_pt.value = item.vendor_pt || "";
  fields.status_progres.value = item.status_progres || "Baru";
  fields.biaya_perbaikan.value = item.biaya_perbaikan || "";
  fields.hasil.value = item.hasil || "";
  fields.keterangan.value = item.keterangan || "";
  syncPreventiveFormFromAlat();
  renderMaintenanceKindFields();
  setMessage(elements.maintenanceMessage, "Mode edit maintenance aktif. Ubah data lalu simpan.");
}

function setKalibrasiEditMode(item = null) {
  state.editingKalibrasiId = item?.id || null;
  if (!item) {
    elements.kalibrasiForm.reset();
    setMessage(elements.kalibrasiMessage, "");
    return;
  }

  const fields = elements.kalibrasiForm.elements;
  fields.alat_id.value = item.alat_id || "";
  fields.tanggal_kalibrasi.value = item.tanggal_kalibrasi || "";
  fields.berlaku_sampai.value = item.berlaku_sampai || "";
  fields.vendor.value = item.vendor || "";
  fields.status_progres.value = item.status_progres || "Baru";
  if (fields.biaya_kalibrasi) fields.biaya_kalibrasi.value = item.biaya_kalibrasi || item.biaya || "";
  fields.hasil.value = item.hasil || "Lulus";
  fields.nomor_sertifikat.value = item.nomor_sertifikat || "";
  fields.catatan.value = item.catatan || "";
  setMessage(elements.kalibrasiMessage, "Mode edit kalibrasi aktif. Ubah data lalu simpan.");
}

async function ensureRegisterIsAvailable(payload) {
  const username = dbValue(payload.username);
  const checks = [
    supabase(`register_user?select=id,status&username=eq.${username}&limit=1`),
    supabase(`user_petugas?select=id&username=eq.${username}&limit=1`),
  ];

  if (payload.email) {
    const email = dbValue(payload.email);
    checks.push(supabase(`register_user?select=id,status&email=eq.${email}&limit=1`));
    checks.push(supabase(`user_petugas?select=id&email=eq.${email}&limit=1`));
  }

  const [registeredUsername, activeUsername, registeredEmail = [], activeEmail = []] = await Promise.all(checks);

  if (activeUsername.length > 0) {
    throw new Error("Username sudah dipakai oleh user aktif. Pilih username lain.");
  }

  if (registeredUsername.length > 0) {
    const status = registeredUsername[0].status || "terdaftar";
    throw new Error(`Username sudah ada di pendaftaran dengan status ${status}.`);
  }

  if (activeEmail.length > 0) {
    throw new Error("Email sudah dipakai oleh user aktif. Gunakan email lain.");
  }

  if (registeredEmail.length > 0) {
    const status = registeredEmail[0].status || "terdaftar";
    throw new Error(`Email sudah ada di pendaftaran dengan status ${status}.`);
  }

  if (payload.role === "Kepala Ruangan" && !payload.ruangan_id) {
    throw new Error("Pilih ruangan untuk Kepala Ruangan.");
  }

  if (payload.role === "Kepala Supervisor") {
    return;
  }

  if (payload.role === "Vendor") {
    if (!payload.nama_pt) throw new Error("Isi nama PT untuk Vendor.");
    if (!payload.vendor_layanan) throw new Error("Pilih layanan Vendor.");
  }
}

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const { username, password } = formData(form);
  setMessage(elements.loginMessage, "Memeriksa akun...");

  try {
    const users = await supabase(
      `user_petugas?select=*&username=eq.${encodeURIComponent(username)}&limit=1`,
    );
    const user = users[0];

    if (!user || user.password !== password) {
      throw new Error("Username atau password salah.");
    }

    if (user.status !== "Aktif") {
      throw new Error("Akun petugas nonaktif.");
    }

    state.user = {
      id: user.id,
      nama: user.nama,
      username: user.username,
      role: user.role,
      ruangan_id: user.ruangan_id || null,
      nama_pt: user.nama_pt || null,
      vendor_layanan: user.vendor_layanan || null,
      no_hp: user.no_hp || null,
      email: user.email || null,
      telegram_id: user.telegram_id || null,
    };
    localStorage.setItem("petugas-session", JSON.stringify(state.user));
    setMessage(elements.loginMessage, "Berhasil masuk.", "success");
    await loadData();
    startDashboardAutoRefresh();
  } catch (error) {
    setMessage(elements.loginMessage, error.message, "error");
  }
});

elements.registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = formData(form);
  setMessage(elements.registerMessage, "Mengirim pendaftaran...");

  try {
    await ensureRegisterIsAvailable(payload);
    await supabase("register_user", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        ruangan_id: payload.role === "Kepala Ruangan" ? payload.ruangan_id || null : null,
        nama_pt: payload.role === "Vendor" ? payload.nama_pt || null : null,
        vendor_layanan: payload.role === "Vendor" ? payload.vendor_layanan || null : null,
        telegram_id: payload.telegram_id || null,
        no_hp: payload.no_hp || null,
        email: payload.email || null,
        status: "Pending",
      }),
    });
    form.reset();
    renderRegisterRoleFields();
    setMessage(elements.registerMessage, "Pendaftaran terkirim. Tunggu persetujuan Admin.", "success");
  } catch (error) {
    setMessage(elements.registerMessage, error.message, "error");
  }
});

async function approveRegisterUser(id) {
  const candidate = state.registerUsers.find((item) => item.id === id);

  if (!candidate) {
    throw new Error("Data pendaftar tidak ditemukan.");
  }

  await supabase("user_petugas", {
    method: "POST",
    body: JSON.stringify({
      nama: candidate.nama,
      username: candidate.username,
      password: candidate.password,
      telegram_id: candidate.telegram_id || null,
      role: candidate.role || "Teknisi",
      no_hp: candidate.no_hp || null,
      email: candidate.email || null,
      ruangan_id: candidate.ruangan_id || null,
      nama_pt: candidate.nama_pt || null,
      vendor_layanan: candidate.vendor_layanan || null,
      status: "Aktif",
    }),
  });

  await supabase(`register_user?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "Disetujui" }),
  });
}

async function rejectRegisterUser(id) {
  await supabase(`register_user?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "Ditolak" }),
  });
}

const DASHBOARD_AUTO_REFRESH_MS = 30000;
let dashboardAutoRefreshTimer = null;

function refreshDashboardSilently() {
  if (!state.user || state.scanCode || state.scanId || document.hidden) return;
  const overviewIsVisible =
    !$("#overview-panel")?.classList.contains("is-hidden") ||
    !$("#supervisor-overview-panel")?.classList.contains("is-hidden");
  if (!overviewIsVisible) return;
  loadData({ silent: true }).catch((error) => console.warn("Sinkronisasi dashboard tertunda:", error));
}

function startDashboardAutoRefresh() {
  if (dashboardAutoRefreshTimer) clearInterval(dashboardAutoRefreshTimer);
  if (!state.user || state.scanCode || state.scanId) return;
  dashboardAutoRefreshTimer = setInterval(refreshDashboardSilently, DASHBOARD_AUTO_REFRESH_MS);
}

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refreshDashboardSilently();
});

window.addEventListener("focus", refreshDashboardSilently);

elements.logoutButton.addEventListener("click", () => {
  if (dashboardAutoRefreshTimer) {
    clearInterval(dashboardAutoRefreshTimer);
    dashboardAutoRefreshTimer = null;
  }
  state.user = null;
  state.registerUsers = [];
  state.selectedAlatId = null;
  state.roomFocusId = null;
  state.selectedMaintenanceAlatId = null;
  state.selectedKalibrasiAlatId = null;
  state.editingAlatId = null;
  state.editingMaintenanceId = null;
  state.editingKalibrasiId = null;
  localStorage.removeItem("petugas-session");
  activateTab("overview");
  renderShell();
});

elements.refreshButton.addEventListener("click", () => {
  loadData().catch((error) => alert(error.message));
});

elements.sidebarToggle?.addEventListener("click", () => {
  const isOpen = elements.dashboard.classList.toggle("is-sidebar-open");
  elements.sidebarToggle.setAttribute("aria-expanded", String(isOpen));
});

$("#supervisor-detail-alat-select")?.addEventListener("change", renderSupervisorDetailAlat);
elements.openAlatFormButton?.addEventListener("click", openAlatForm);
elements.openMaintenanceFormButton?.addEventListener("click", openMaintenanceFormForCreate);
elements.openKalibrasiFormButton?.addEventListener("click", openKalibrasiFormForCreate);
elements.openPengajuanMaintenanceFormButton?.addEventListener("click", () => openPengajuanSideForm("Maintenance"));
elements.openPengajuanKalibrasiFormButton?.addEventListener("click", () => openPengajuanSideForm("Kalibrasi"));

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-insight-filter-type]");
  if (!target) return;
  openInsightFilter(target.dataset.insightFilterType, target.dataset.insightFilterValue, target.dataset.insightFilterLabel);
});

document.addEventListener("keydown", (event) => {
  if (!["Enter", " "].includes(event.key)) return;
  const target = event.target.closest("[data-insight-filter-type]");
  if (!target) return;
  event.preventDefault();
  openInsightFilter(target.dataset.insightFilterType, target.dataset.insightFilterValue, target.dataset.insightFilterLabel);
});

elements.clearRoomFilterButton?.addEventListener("click", () => clearRoomFocus());
elements.backRoomFilterButton?.addEventListener("click", () => clearRoomFocus({ backToRooms: true }));

$("#register-table").addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  const approveId = button?.dataset.approve;
  const rejectId = button?.dataset.reject;
  const editId = button?.dataset.editRegister;
  const deleteId = button?.dataset.deleteRegister;

  if (!approveId && !rejectId && !editId && !deleteId) return;

  setMessage(
    elements.approvalMessage,
    approveId ? "Menyetujui user..." : rejectId ? "Menolak user..." : editId ? "Mengedit pendaftaran..." : "Menghapus pendaftaran...",
  );

  try {
    if (approveId) {
      await approveRegisterUser(approveId);
      setMessage(elements.approvalMessage, "User berhasil disetujui dan masuk ke petugas.", "success");
    } else if (rejectId) {
      await rejectRegisterUser(rejectId);
      setMessage(elements.approvalMessage, "Pendaftaran user ditolak.", "success");
    } else if (editId) {
      const item = state.registerUsers.find((row) => row.id === editId);
      const role = prompt("Role baru: Admin, Teknisi, Kepala Ruangan, Kepala Supervisor, Vendor", item?.role || "Teknisi");
      if (!role) return;
      const status = prompt("Status: Pending, Disetujui, Ditolak", item?.status || "Pending");
      if (!status) return;
      await supabase(`register_user?id=eq.${editId}`, {
        method: "PATCH",
        body: JSON.stringify({ role, status }),
      });
      setMessage(elements.approvalMessage, "Pendaftaran berhasil diedit.", "success");
    } else if (deleteId) {
      if (!confirm("Hapus data pendaftaran ini?")) return;
      await supabase(`register_user?id=eq.${deleteId}`, { method: "DELETE" });
      setMessage(elements.approvalMessage, "Pendaftaran berhasil dihapus.", "success");
    }

    await loadData();
  } catch (error) {
    setMessage(elements.approvalMessage, error.message, "error");
  }
});

elements.registerRole.addEventListener("change", renderRegisterRoleFields);

elements.showRegisterButton?.addEventListener("click", () => showAuthMode("register"));
elements.showLoginButton?.addEventListener("click", () => showAuthMode("login"));
$$("[data-close-qr-modal]").forEach((button) => button.addEventListener("click", closeQrModal));
elements.qrOpenButton?.addEventListener("click", openCurrentQrImage);
elements.qrPrintButton?.addEventListener("click", printCurrentQrDownload);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeQrModal();
});

elements.alatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = await formDataWithFiles(form, ["foto_alat", "kso_file_kontrak", "sewa_file_kontrak"]);
  payload.status = normalizeAlatStatusByCondition(payload);
  const kodeBarcode = generateBarcode(payload);
  setMessage(elements.alatMessage, "Menyimpan data alat...");

  try {
    const isEditing = Boolean(state.editingAlatId);
    const current = state.alat.find((item) => item.id === state.editingAlatId) || {};
    const saved = await supabase(isEditing ? `alat_kesehatan?id=eq.${state.editingAlatId}` : "alat_kesehatan", {
      method: isEditing ? "PATCH" : "POST",
      body: JSON.stringify({
        ...payload,
        kode_barcode: kodeBarcode,
        merk: payload.merk || null,
        tipe: payload.tipe || null,
        serial_number: payload.serial_number,
        ruangan_id: emptyToNull(payload.ruangan_id),
        vendor: payload.vendor || null,
        tanggal_instalasi: payload.status_kepemilikan === "Milik RS" ? payload.tanggal_instalasi || null : null,
        tanggal_sewa: payload.status_kepemilikan === "Sewa" ? payload.tanggal_sewa || null : null,
        tahun_pembelian: null,
        harga_pembelian: payload.status_kepemilikan === "Milik RS" && payload.harga_pembelian ? Number(payload.harga_pembelian) : null,
        kalibrasi_awal: payload.kalibrasi_awal || null,
        foto_alat: payload.foto_alat || current.foto_alat || null,
        status: payload.status,
        status_kepemilikan: payload.status_kepemilikan || "Milik RS",
        kso_nama_partner: payload.status_kepemilikan === "KSO" ? payload.kso_nama_partner || null : null,
        kso_tipe_kerja_sama: payload.status_kepemilikan === "KSO" ? payload.kso_tipe_kerja_sama || null : null,
        kso_persen_rs: payload.status_kepemilikan === "KSO" && payload.kso_tipe_kerja_sama === "Revenue sharing (%)" ? payload.kso_persen_rs || null : null,
        kso_persen_vendor: payload.status_kepemilikan === "KSO" && payload.kso_tipe_kerja_sama === "Revenue sharing (%)" ? payload.kso_persen_vendor || null : null,
        kso_fee_tetap: payload.status_kepemilikan === "KSO" && payload.kso_fee_tetap ? Number(payload.kso_fee_tetap) : null,
        kso_tanggal_mulai: payload.status_kepemilikan === "KSO" ? payload.kso_tanggal_mulai || null : null,
        kso_tanggal_akhir: payload.status_kepemilikan === "KSO" ? payload.kso_tanggal_akhir || null : null,
        kso_file_kontrak: payload.status_kepemilikan === "KSO" ? payload.kso_file_kontrak || current.kso_file_kontrak || null : null,
        sewa_vendor_leasing: payload.status_kepemilikan === "Sewa" ? payload.sewa_vendor_leasing || null : null,
        sewa_biaya_per_bulan: payload.status_kepemilikan === "Sewa" && payload.sewa_biaya_per_bulan ? Number(payload.sewa_biaya_per_bulan) : null,
        sewa_durasi_kontrak:
          payload.status_kepemilikan === "Sewa"
            ? payload.sewa_durasi_kontrak || calculateSewaDuration() || null
            : null,
        sewa_tanggal_mulai: payload.status_kepemilikan === "Sewa" ? payload.sewa_tanggal_mulai || null : null,
        sewa_tanggal_akhir: payload.status_kepemilikan === "Sewa" ? payload.sewa_tanggal_akhir || null : null,
        sewa_buyback: payload.status_kepemilikan === "Sewa" ? payload.sewa_buyback || null : null,
        sewa_file_kontrak: payload.status_kepemilikan === "Sewa" ? payload.sewa_file_kontrak || current.sewa_file_kontrak || null : null,
      }),
    });
    const savedAlatId = state.editingAlatId || saved?.[0]?.id;
    if (savedAlatId) {
      const ownershipDetail =
        payload.status_kepemilikan === "KSO"
          ? `Partner ${payload.kso_nama_partner || "-"}; ${payload.kso_tipe_kerja_sama || "-"}; RS ${payload.kso_persen_rs || "-"}%; vendor ${payload.kso_persen_vendor || "-"}%; fee ${payload.kso_fee_tetap || "-"}`
          : payload.status_kepemilikan === "Sewa"
            ? `Leasing ${payload.sewa_vendor_leasing || "-"}; biaya bulanan ${payload.sewa_biaya_per_bulan || "-"}; durasi ${payload.sewa_durasi_kontrak || "-"}`
            : `Harga pembelian ${payload.harga_pembelian || "-"}; instalasi ${payload.tanggal_instalasi || "-"}`;
      await supabase("histori_alat", {
        method: "POST",
        body: JSON.stringify({
          alat_id: savedAlatId,
          aksi: isEditing ? "Edit alat" : "Tambah alat",
          petugas: state.user?.nama || state.user?.username || null,
          detail: `${payload.nama_alat || "-"} | ${payload.status_kepemilikan || "Milik RS"} | ${payload.kondisi || "-"} | ${ownershipDetail}`,
        }),
      }).catch(() => {});
    }
    setAlatEditMode(null);
    elements.alatForm.classList.add("is-hidden");
    setMessage(elements.alatMessage, isEditing ? "Data alat berhasil diupdate." : "Data alat berhasil disimpan.", "success");
    await loadData();
  } catch (error) {
    setMessage(elements.alatMessage, error.message, "error");
  }
});

elements.alatForm.addEventListener("input", () => {
  normalizeAlatStatusByCondition(elements.alatForm);
  const payload = formData(elements.alatForm);
  const preview = generateBarcode(payload);
  $("#barcode-preview").textContent = preview || "Akan dibuat saat disimpan";
  renderAlatOwnershipFields();
  if (elements.alatForm.elements.sewa_durasi_kontrak) {
    const duration = calculateSewaDuration();
    if (duration) elements.alatForm.elements.sewa_durasi_kontrak.value = duration;
  }
});

elements.alatKepemilikan.addEventListener("change", renderAlatOwnershipFields);
elements.alatKsoType?.addEventListener("change", renderAlatOwnershipFields);
elements.alatForm.elements.sewa_tanggal_mulai.addEventListener("change", renderAlatOwnershipFields);
elements.alatForm.elements.sewa_tanggal_akhir.addEventListener("change", renderAlatOwnershipFields);
elements.alatForm.elements.tanggal_instalasi.addEventListener("change", renderAlatOwnershipFields);
elements.alatForm.elements.tanggal_sewa.addEventListener("change", renderAlatOwnershipFields);

elements.pengajuanJenis?.addEventListener("change", () => renderPengajuanFields(elements.pengajuanForm));
elements.pengajuanKategori?.addEventListener("change", () => renderPengajuanFields(elements.pengajuanForm));
pengajuanForms().forEach((form) => {
  form.addEventListener("change", (event) => {
    if (event.target.name === "ruangan_id") {
      renderPengajuanFormAlatOptions(form);
    }
    if (["jenis_pengajuan", "kategori", "ruangan_id"].includes(event.target.name)) {
      renderPengajuanFields(form);
    }
  });
});
elements.laporanKrJenis?.addEventListener("change", renderLaporanKrFields);
elements.laporanKrKategori?.addEventListener("change", renderLaporanKrFields);

$("#supervisor-report-grid")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-supervisor-pdf]");
  if (!button) return;
  openSupervisorPdfReport(button.dataset.supervisorPdf || "eksekutif");
});

$("#alat-table").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  const alatId = button?.dataset.history;
  const editId = button?.dataset.editAlat;
  const deleteId = button?.dataset.deleteAlat;
  const qrValue = button?.dataset.downloadQr;
  const qrName = button?.dataset.downloadQrName;
  const qrMerk = button?.dataset.downloadQrMerk;

  if (alatId) {
    state.selectedAlatId = alatId;
    renderAlat();
    $("#alat-history-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  if (qrValue) {
    downloadQr(qrValue, qrName, qrMerk, true);
    return;
  }

  if (editId) {
    const alat = state.alat.find((item) => item.id === editId);
    setAlatEditMode(alat);
    elements.alatForm.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  if (deleteId) {
    const alat = state.alat.find((item) => item.id === deleteId);
    const ok = confirm(`Hapus alat ${alat?.nama_alat || ""}? Histori maintenance, kalibrasi, dan mutasi ikut terhapus.`);

    if (!ok) return;

    supabase(`alat_kesehatan?id=eq.${deleteId}`, { method: "DELETE" })
      .then(async () => {
        if (state.selectedAlatId === deleteId) state.selectedAlatId = null;
        if (state.editingAlatId === deleteId) setAlatEditMode(null);
        setMessage(elements.alatMessage, "Data alat berhasil dihapus.", "success");
        await loadData();
      })
      .catch((error) => setMessage(elements.alatMessage, error.message, "error"));
  }
});

$("#room-grid").addEventListener("click", (event) => {
  const button = event.target.closest("[data-open-room]");
  if (!button) return;
  const roomId = button.dataset.openRoom || null;
  openRoomFocus(roomId);
});

$("#alat-history-panel").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  const qrValue = button?.dataset.downloadQr;
  const qrName = button?.dataset.downloadQrName;
  const qrMerk = button?.dataset.downloadQrMerk;

  if (qrValue) {
    downloadQr(`${qrValue}`, qrName, qrMerk, true);
  }
});

elements.alatCancelButton.addEventListener("click", () => {
  closeAlatForm();
});

elements.alatLogRuangan?.addEventListener("change", () => {
  state.alatFilter.room = elements.alatLogRuangan.value;
  renderAlat();
});

elements.alatLogSearch?.addEventListener("input", () => {
  state.alatFilter.search = elements.alatLogSearch.value;
  renderAlat();
});

elements.alatSearchButton?.addEventListener("click", () => {
  state.alatFilter.search = elements.alatLogSearch.value;
  renderAlat();
});

elements.alatLogSearch?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  state.alatFilter.search = elements.alatLogSearch.value;
  renderAlat();
});

elements.maintenanceRuangan.addEventListener("change", () => {
  renderAlatOptions(elements.maintenanceAlat, alatRowsByRoom(elements.maintenanceRuangan.value), "Belum ada alat");
  syncPreventiveFormFromAlat();
});

elements.kalibrasiRuangan.addEventListener("change", () => {
  renderAlatOptions(elements.kalibrasiAlat, alatRowsByRoom(elements.kalibrasiRuangan.value), "Belum ada alat");
});

elements.pengajuanRuangan.addEventListener("change", () => {
  renderAlatOptions(elements.pengajuanAlat, alatRowsByRoom(elements.pengajuanRuangan.value), "Belum ada alat");
});

elements.maintenanceLogRuangan.addEventListener("change", () => {
  state.maintenanceFilter.room = elements.maintenanceLogRuangan.value;
  renderMaintenance();
});

elements.maintenanceLogSearch.addEventListener("input", () => {
  state.maintenanceFilter.search = elements.maintenanceLogSearch.value;
  renderMaintenance();
});

elements.maintenanceSearchButton.addEventListener("click", () => {
  state.maintenanceFilter.search = elements.maintenanceLogSearch.value;
  renderMaintenance();
});

elements.kalibrasiLogRuangan.addEventListener("change", () => {
  state.kalibrasiFilter.room = elements.kalibrasiLogRuangan.value;
  renderKalibrasi();
});

elements.kalibrasiLogSearch.addEventListener("input", () => {
  state.kalibrasiFilter.search = elements.kalibrasiLogSearch.value;
  renderKalibrasi();
});

elements.kalibrasiSearchButton.addEventListener("click", () => {
  state.kalibrasiFilter.search = elements.kalibrasiLogSearch.value;
  renderKalibrasi();
});

elements.maintenanceForm.elements.jenis.addEventListener("change", renderMaintenanceKindFields);
elements.maintenanceForm.elements.alat_id.addEventListener("change", syncPreventiveFormFromAlat);
elements.maintenanceForm.elements.tanggal.addEventListener("change", updatePreventiveSchedulePreview);
elements.maintenanceForm.elements.tingkat_risiko.addEventListener("change", updatePreventiveSchedulePreview);

elements.maintenanceForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = await formDataWithFiles(form, ["foto_sebelum", "foto_sesudah", "foto_sparepart", "invoice"]);
  delete payload.ruangan_filter;
  setMessage(elements.maintenanceMessage, "Menyimpan riwayat maintenance...");

  try {
    if (!payload.alat_id) throw new Error("Pilih alat untuk maintenance.");
    const isEditing = Boolean(state.editingMaintenanceId);
    const current = state.maintenance.find((item) => item.id === state.editingMaintenanceId) || {};
    const isPreventive = payload.jenis === "Preventive";
    const riskLevel = payload.tingkat_risiko || "Sedang";
    const preventiveNext = isPreventive
      ? addMonthsToDate(payload.tanggal, PREVENTIVE_INTERVAL_MONTHS[riskLevel] || 3)
      : "";
    delete payload.tingkat_risiko;
    delete payload.interval_preventive;
    delete payload.preventive_terakhir;
    delete payload.preventive_berikutnya;
    const body = {
      ...payload,
      teknisi: payload.teknisi || state.user?.nama || null,
      vendor_pt: payload.vendor_pt || null,
      status_progres: payload.status_progres || "Baru",
      service_type: "Maintenance",
      biaya_perbaikan: payload.biaya_perbaikan ? Number(payload.biaya_perbaikan) : null,
      hasil: payload.hasil || null,
      keterangan: payload.keterangan || null,
      foto_sebelum: payload.foto_sebelum || current.foto_sebelum || null,
      foto_sesudah: payload.foto_sesudah || current.foto_sesudah || null,
      foto_sparepart: payload.foto_sparepart || current.foto_sparepart || null,
      invoice: payload.invoice || current.invoice || null,
    };

    await supabase(isEditing ? `maintenance?id=eq.${state.editingMaintenanceId}` : "maintenance", {
      method: isEditing ? "PATCH" : "POST",
      body: JSON.stringify(body),
    });
    await supabase(`alat_kesehatan?id=eq.${payload.alat_id}`, {
      method: "PATCH",
      body: JSON.stringify({
        maintenance_terakhir: payload.tanggal,
        ...(isPreventive
          ? {
              tingkat_risiko: riskLevel,
              preventive_terakhir: payload.tanggal,
              preventive_berikutnya: preventiveNext,
              maintenance_berikutnya: preventiveNext,
            }
          : {}),
      }),
    });
    form.reset();
    setMaintenanceEditMode(null);
    setMessage(elements.maintenanceMessage, "Riwayat maintenance berhasil disimpan.", "success");
    closeMaintenanceForm();
    await loadData();
  } catch (error) {
    setMessage(elements.maintenanceMessage, error.message, "error");
  }
});

$("#maintenance-table").addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  const editId = button?.dataset.editMaintenance;
  const deleteId = button?.dataset.deleteMaintenance;
  const historyId = button?.dataset.historyMaintenance;
  const qrValue = button?.dataset.downloadQr;
  const qrName = button?.dataset.downloadQrName;
  const qrMerk = button?.dataset.downloadQrMerk;

  if (historyId) {
    state.selectedMaintenanceAlatId = historyId;
    renderMaintenanceHistory();
    $("#maintenance-history-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  if (qrValue) {
    downloadQr(qrValue, qrName, qrMerk, true);
    return;
  }

  if (editId) {
    openMaintenanceFormForEdit(state.maintenance.find((item) => item.id === editId));
    return;
  }

  if (deleteId) {
    const item = state.maintenance.find((row) => row.id === deleteId);
    if (!confirm(`Hapus maintenance ${alatName(item?.alat_id)}?`)) return;
    try {
      await supabase(`maintenance?id=eq.${deleteId}`, { method: "DELETE" });
      if (state.editingMaintenanceId === deleteId) setMaintenanceEditMode(null);
      setMessage(elements.maintenanceMessage, "Maintenance berhasil dihapus.", "success");
      await loadData();
    } catch (error) {
      setMessage(elements.maintenanceMessage, error.message, "error");
    }
  }
});

elements.kalibrasiForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = await formDataWithFiles(form, ["foto_nilai_ukur", "foto_sertifikat"]);
  delete payload.ruangan_filter;
  setMessage(elements.kalibrasiMessage, "Menyimpan data kalibrasi...");

  try {
    if (!payload.alat_id) throw new Error("Pilih alat untuk kalibrasi.");
    const isEditing = Boolean(state.editingKalibrasiId);
  const current = state.kalibrasi.find((item) => item.id === state.editingKalibrasiId) || {};
  const body = {
    ...payload,
    berlaku_sampai: payload.berlaku_sampai || null,
    vendor: payload.vendor || null,
    vendor_pt: payload.vendor || null,
    status_progres: payload.status_progres || "Baru",
    service_type: "Kalibrasi",
    biaya_kalibrasi: payload.biaya_kalibrasi ? Number(payload.biaya_kalibrasi) : null,
    nomor_sertifikat: payload.nomor_sertifikat || null,
      catatan: payload.catatan || null,
      foto_nilai_ukur: payload.foto_nilai_ukur || current.foto_nilai_ukur || null,
      foto_sertifikat: payload.foto_sertifikat || current.foto_sertifikat || null,
    };

    await supabase(isEditing ? `kalibrasi?id=eq.${state.editingKalibrasiId}` : "kalibrasi", {
      method: isEditing ? "PATCH" : "POST",
      body: JSON.stringify(body),
    });
    await supabase(`alat_kesehatan?id=eq.${payload.alat_id}`, {
      method: "PATCH",
      body: JSON.stringify({
        kalibrasi_terakhir: payload.tanggal_kalibrasi,
        kalibrasi_berikutnya: payload.berlaku_sampai || null,
      }),
    });
    form.reset();
    setKalibrasiEditMode(null);
    setMessage(elements.kalibrasiMessage, "Data kalibrasi berhasil disimpan.", "success");
    closeKalibrasiForm();
    await loadData();
  } catch (error) {
    setMessage(elements.kalibrasiMessage, error.message, "error");
  }
});

elements.notifikasiForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = await formDataWithFiles(form, ["foto_update"]);
  const current = state.notifikasi.find((item) => item.id === state.editingNotifikasiId);
  if (!current) return;

  try {
    if (!isQuickEditNotifikasi(current)) {
      setMessage(elements.notifikasiEditMessage, "Kategori ini perlu pengajuan dulu. Saya pindahkan ke Pengajuan.", "error");
      prefillPengajuanFromNotifikasi(current);
      activateTab("pengajuan");
      setNotifikasiEditMode(null);
      return;
    }

    const nextStatus = payload.status_pengerjaan || "Belum dikerjakan";
    await supabase(`notifikasi_teknisi?id=eq.${current.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status_pengerjaan: nextStatus,
        status: nextStatus === "Sudah selesai dikerjakan" ? "Selesai Teknisi" : "Dalam Pengerjaan",
        catatan_update: payload.catatan_update || null,
        foto_update: payload.foto_update || current.foto_update || null,
      }),
    });

    if (nextStatus === "Sudah selesai dikerjakan") {
      await supabase("notifikasi_teknisi", {
        method: "POST",
        body: JSON.stringify({
          jenis_laporan: current.jenis_laporan || current.jenis_pengajuan || "Maintenance",
          kategori: current.kategori || null,
          alat_id: current.alat_id,
          ruangan_id: current.ruangan_id,
          catatan: `Sudah selesai dikerjakan oleh teknisi. ${payload.catatan_update || current.catatan || ""}`.trim(),
          catatan_update: payload.catatan_update || current.catatan_update || null,
          foto_update: payload.foto_update || current.foto_update || null,
          dibuat_oleh: state.user?.username || state.user?.nama || null,
          dibuat_oleh_role: state.user?.role || null,
          tujuan_role: "Kepala Ruangan",
          status: "Dikirim ke Kepala Ruangan",
          status_pengerjaan: "Sudah selesai dikerjakan",
          parent_id: current.id,
        }),
      });
    }

    setMessage(elements.notifikasiEditMessage, "Notifikasi berhasil diperbarui.", "success");
    form.reset();
    setNotifikasiEditMode(null);
    await loadData();
  } catch (error) {
    setMessage(elements.notifikasiEditMessage, error.message, "error");
  }
});

elements.notifikasiCancelButton?.addEventListener("click", () => {
  setNotifikasiEditMode(null);
});

$("#kalibrasi-table").addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  const editId = button?.dataset.editKalibrasi;
  const deleteId = button?.dataset.deleteKalibrasi;
  const historyId = button?.dataset.historyKalibrasi;
  const qrValue = button?.dataset.downloadQr;
  const qrName = button?.dataset.downloadQrName;
  const qrMerk = button?.dataset.downloadQrMerk;

  if (historyId) {
    state.selectedKalibrasiAlatId = historyId;
    renderKalibrasiHistory();
    $("#kalibrasi-history-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  if (qrValue) {
    downloadQr(qrValue, qrName, qrMerk, true);
    return;
  }

  if (editId) {
    openKalibrasiFormForEdit(state.kalibrasi.find((item) => item.id === editId));
    return;
  }

  if (deleteId) {
    const item = state.kalibrasi.find((row) => row.id === deleteId);
    if (!confirm(`Hapus kalibrasi ${alatName(item?.alat_id)}?`)) return;
    try {
      await supabase(`kalibrasi?id=eq.${deleteId}`, { method: "DELETE" });
      if (state.editingKalibrasiId === deleteId) setKalibrasiEditMode(null);
      setMessage(elements.kalibrasiMessage, "Kalibrasi berhasil dihapus.", "success");
      await loadData();
    } catch (error) {
      setMessage(elements.kalibrasiMessage, error.message, "error");
    }
  }
});

elements.mutasiForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = formData(form);
  setMessage(elements.mutasiMessage, "Menyimpan mutasi alat...");

  try {
    if (!payload.alat_id || !payload.ke_ruangan_id) {
      throw new Error("Pilih alat dan ruangan tujuan untuk mutasi.");
    }
    const fromRoom = payload.dari_ruangan_id || (state.user?.role === "Kepala Ruangan" ? currentRoomId() : null);
    await supabase("mutasi_alat", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        dari_ruangan_id: fromRoom || null,
        ke_ruangan_id: emptyToNull(payload.ke_ruangan_id),
        petugas: payload.petugas || state.user?.nama || null,
        alasan: payload.alasan || null,
        approve_dari_status: "Pending",
        approve_ke_status: "Pending",
        status: "Pending",
      }),
    });
    form.reset();
    setMessage(elements.mutasiMessage, "Mutasi alat berhasil disimpan.", "success");
    await loadData();
  } catch (error) {
    setMessage(elements.mutasiMessage, error.message, "error");
  }
});

$("#mutasi-table").addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  const approveId = button?.dataset.approveMutasi;

  if (!approveId) return;

  const item = state.mutasi.find((row) => row.id === approveId);
  if (!item) return;

  const roomId = currentRoomId();
  const side = item.dari_ruangan_id === roomId ? "approve_dari_status" : item.ke_ruangan_id === roomId ? "approve_ke_status" : null;
  if (!side) return;

  try {
    const next = {
      ...item,
      [side]: "Approved",
    };
    const approvedBoth = next.approve_dari_status === "Approved" && next.approve_ke_status === "Approved";

    await supabase(`mutasi_alat?id=eq.${approveId}`, {
      method: "PATCH",
      body: JSON.stringify({
        [side]: "Approved",
        status: approvedBoth ? "Disetujui" : "Pending",
      }),
    });

    if (approvedBoth) {
      await supabase(`alat_kesehatan?id=eq.${item.alat_id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ruangan_id: item.ke_ruangan_id,
        }),
      });
    }

    setMessage(elements.mutasiMessage, approvedBoth ? "Mutasi disetujui dan alat berpindah ruangan." : "Satu sisi mutasi sudah di-approve.", "success");
    await loadData();
  } catch (error) {
    setMessage(elements.mutasiMessage, error.message, "error");
  }
});

async function handlePengajuanSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = formData(form);
  const jenis = form.dataset.fixedJenis || payload.jenis_pengajuan || "Maintenance";
  const kategori = jenis === "Maintenance" ? payload.kategori || "Preventive" : null;
  const needsVendor = jenis === "Kalibrasi" || kategori === "Corrective Berat" || kategori === "Emergency (Breakdown)";
  const status = "Menunggu Kepala Ruangan";
  const message = form.querySelector(".pengajuan-form-message") || elements.pengajuanMessage;

  setMessage(message, "Mengirim pengajuan...");

  try {
    if (!payload.alat_id) throw new Error("Pilih alat untuk pengajuan.");
    if (needsVendor && !payload.vendor_pt) throw new Error("Pilih vendor/PT yang terdaftar.");
    await supabase("pengajuan", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        jenis_pengajuan: jenis,
        alat_id: emptyToNull(payload.alat_id),
        ruangan_id: emptyToNull(payload.ruangan_id),
        kategori,
        vendor_pt: needsVendor ? emptyToNull(payload.vendor_pt) : null,
        catatan: payload.catatan || null,
        dibuat_oleh: state.user?.username || state.user?.nama || null,
        dibuat_oleh_role: state.user?.role || null,
        dibuat_oleh_hp: state.user?.no_hp || null,
        tujuan_role: "Kepala Ruangan",
        status,
      }),
    });
    form.reset();
    renderPengajuanFields(form);
    setMessage(message, "Pengajuan berhasil dikirim.", "success");
    closePengajuanSideForm(form);
    await loadData();
  } catch (error) {
    setMessage(message, error.message, "error");
  }
}

pengajuanForms().forEach((form) => form.addEventListener("submit", handlePengajuanSubmit));

elements.laporanKrForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = formData(form);
  const jenis = payload.jenis_pengajuan || "Maintenance";
  const kategori = jenis === "Maintenance" ? payload.kategori || "Preventive" : null;
  const roomId = currentRoomId();

  if (!roomId) {
    setMessage(elements.laporanKrMessage, "Ruangan kepala ruangan belum diset.", "error");
    return;
  }

  setMessage(elements.laporanKrMessage, "Mengirim laporan...");

  try {
    if (!payload.alat_id) throw new Error("Pilih alat untuk laporan.");
    await supabase("notifikasi_teknisi", {
      method: "POST",
      body: JSON.stringify({
        jenis_laporan: jenis,
        kategori,
        alat_id: payload.alat_id,
        ruangan_id: roomId,
        catatan: payload.catatan || null,
        dibuat_oleh: state.user?.username || state.user?.nama || null,
        dibuat_oleh_role: state.user?.role || null,
        tujuan_role: "Teknisi",
        status: "Baru",
        status_pengerjaan: "Belum dikerjakan",
      }),
    });
    form.reset();
    renderLaporanKrFields();
    setMessage(elements.laporanKrMessage, "Laporan terkirim ke teknisi.", "success");
    await loadData();
  } catch (error) {
    setMessage(elements.laporanKrMessage, error.message, "error");
  }
});

elements.vendorFeedbackForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = formData(event.currentTarget);
  const [layananRaw, recordId] = String(payload.record_key || "").split(":");
  const layanan = layananRaw === "kalibrasi" ? "Kalibrasi" : "Maintenance";
  const rows = layanan === "Kalibrasi" ? state.kalibrasi : state.maintenance;
  const record = rows.find((item) => item.id === recordId);

  setMessage(elements.vendorFeedbackMessage, "Mengirim feedback...");

  try {
    if (!record) throw new Error("Pilih pekerjaan vendor yang valid.");
    await supabase("feedback_vendor", {
      method: "POST",
      body: JSON.stringify({
        layanan,
        record_id: recordId,
        alat_id: record.alat_id,
        vendor_pt: currentVendorScope(),
        status: payload.status || "Proses",
        catatan: payload.catatan || null,
        dibuat_oleh: state.user?.username || state.user?.nama || null,
      }),
    });

    const table = layanan === "Kalibrasi" ? "kalibrasi" : "maintenance";
    await supabase(`${table}?id=eq.${recordId}`, {
      method: "PATCH",
      body: JSON.stringify({ status_progres: payload.status || "Proses" }),
    });

    event.currentTarget.reset();
    setMessage(elements.vendorFeedbackMessage, "Feedback terkirim ke Teknisi.", "success");
    await loadData();
  } catch (error) {
    setMessage(elements.vendorFeedbackMessage, error.message, "error");
  }
});

$("#pengajuan-table").addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  const approveKepala = button?.dataset.approveKepala;
  const approveSupervisor = button?.dataset.approveSupervisor;
  const rejectSupervisor = button?.dataset.rejectSupervisor;
  const sendVendor = button?.dataset.sendVendor;
  const deleteId = button?.dataset.deletePengajuan;
  const id = approveKepala || approveSupervisor || rejectSupervisor || sendVendor || deleteId;

  if (!id) return;

  const item = state.pengajuan.find((row) => row.id === id);
  if (!item) return;

  try {
    if (approveKepala) {
      await supabase(`pengajuan?id=eq.${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "Menunggu Supervisor", tujuan_role: "Kepala Supervisor" }),
      });
      setMessage(elements.pengajuanMessage, "Pengajuan diteruskan ke Kepala Supervisor.", "success");
    } else if (approveSupervisor) {
      const needsVendor = needsVendorForPengajuan(item);
      let recordRef = "";
      if (needsVendor) {
        const targetTable = item.jenis_pengajuan === "Kalibrasi" ? "kalibrasi" : "maintenance";
        const today = new Date().toISOString().slice(0, 10);
        const body =
          targetTable === "kalibrasi"
            ? {
                alat_id: item.alat_id,
                tanggal_kalibrasi: today,
                vendor: item.vendor_pt || null,
                vendor_pt: item.vendor_pt || null,
                status_progres: "Baru",
                service_type: "Kalibrasi",
                catatan: item.catatan || null,
              }
            : {
                alat_id: item.alat_id,
                jenis: item.kategori || "Corrective Ringan",
                tanggal: today,
                vendor_pt: item.vendor_pt || null,
                status_progres: "Baru",
                service_type: "Maintenance",
                keterangan: item.catatan || null,
              };
        const created = await supabase(targetTable, { method: "POST", body: JSON.stringify(body) });
        recordRef = `${targetTable}:${created?.[0]?.id || ""}`;
      }
      await supabase(`pengajuan?id=eq.${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: needsVendor ? "Diteruskan Vendor" : "Selesai Supervisor",
          tujuan_role: needsVendor ? "Vendor" : "Teknisi",
        }),
      });
      if (needsVendor) {
        await queueVendorLetter(item, recordRef).catch((error) => console.warn("Surat vendor belum dibuat:", error));
      }
      setMessage(elements.pengajuanMessage, needsVendor ? "Pengajuan disetujui supervisor, diteruskan ke vendor, dan surat masuk antrean email." : "Pengajuan disetujui supervisor.", "success");
    } else if (rejectSupervisor) {
      const alasan = prompt("Alasan penolakan pengajuan:");
      if (alasan === null) return;
      await supabase(`pengajuan?id=eq.${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "Ditolak Supervisor",
          tujuan_role: "Teknisi",
          catatan: `${item.catatan || ""} [Ditolak Supervisor: ${alasan || "-"}]`.trim(),
        }),
      });
      setMessage(elements.pengajuanMessage, "Pengajuan ditolak supervisor.", "success");
    } else if (sendVendor) {
      const targetTable = item.jenis_pengajuan === "Kalibrasi" ? "kalibrasi" : "maintenance";
      const today = new Date().toISOString().slice(0, 10);
      const body =
        targetTable === "kalibrasi"
          ? {
              alat_id: item.alat_id,
              tanggal_kalibrasi: today,
              vendor: item.vendor_pt || null,
              vendor_pt: item.vendor_pt || null,
              status_progres: "Baru",
              service_type: "Kalibrasi",
              catatan: item.catatan || null,
            }
            : {
              alat_id: item.alat_id,
              jenis: item.kategori || "Corrective Ringan",
              tanggal: today,
              vendor_pt: item.vendor_pt || null,
              status_progres: "Baru",
              service_type: "Maintenance",
              keterangan: item.catatan || null,
            };
      await supabase(targetTable, { method: "POST", body: JSON.stringify(body) });
      await supabase(`pengajuan?id=eq.${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "Diteruskan Vendor" }),
      });
      setMessage(elements.pengajuanMessage, "Pengajuan diteruskan ke vendor/PT.", "success");
    } else if (deleteId) {
      if (!confirm("Hapus pengajuan ini?")) return;
      await supabase(`pengajuan?id=eq.${id}`, { method: "DELETE" });
      setMessage(elements.pengajuanMessage, "Pengajuan berhasil dihapus.", "success");
    }

    await loadData();
  } catch (error) {
    setMessage(elements.pengajuanMessage, error.message, "error");
  }
});

function previewVendorLetter(letterId) {
  const item = state.suratVendor.find((row) => row.id === letterId);
  if (!item?.html_surat) return;
  const popup = window.open("", "_blank", "width=900,height=1100");
  if (!popup) {
    alert("Popup diblokir browser. Izinkan popup untuk melihat surat.");
    return;
  }
  popup.document.open();
  popup.document.write(`<!doctype html><html><head><title>${escapeHtml(item.nomor_surat || "Surat Vendor")}</title></head><body>${item.html_surat}</body></html>`);
  popup.document.close();
  popup.focus();
}

function handleVendorLetterPreview(event) {
  const previewButton = event.target.closest("button[data-preview-letter]");
  if (previewButton) {
    previewVendorLetter(previewButton.dataset.previewLetter);
    return true;
  }
  return false;
}

$("#feedback-vendor-panel")?.addEventListener("click", (event) => {
  if (handleVendorLetterPreview(event)) return;

  const approveButton = event.target.closest("button[data-approve-feedback]");
  if (!approveButton) return;

  const item = state.vendorFeedback.find((row) => row.id === approveButton.dataset.approveFeedback);
  if (!item || state.user?.role !== "Teknisi") return;

  setMessage(elements.vendorFeedbackActionMessage, "Menyimpan approval feedback vendor...");
  const table = item.layanan === "Kalibrasi" ? "kalibrasi" : "maintenance";

  supabase(`feedback_vendor?id=eq.${item.id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "Approved Teknisi" }),
  })
    .then(() =>
      item.record_id
        ? supabase(`${table}?id=eq.${item.record_id}`, {
            method: "PATCH",
            body: JSON.stringify({ status_progres: "Approved Teknisi" }),
          })
        : null,
    )
    .then(async () => {
      setMessage(elements.vendorFeedbackActionMessage, "Feedback vendor sudah di-approve teknisi.", "success");
      await loadData();
    })
    .catch((error) => setMessage(elements.vendorFeedbackActionMessage, error.message, "error"));
});

$("#vendor-surat-panel")?.addEventListener("click", handleVendorLetterPreview);

$("#notifikasi-table").addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  const editId = button?.dataset.editNotifikasi;
  const belumId = button?.dataset.notifikasiBelum;
  const selesaiId = button?.dataset.notifikasiSelesai;
  const id = editId || belumId || selesaiId;

  if (!id) return;

  const item = state.notifikasi.find((row) => row.id === id);
  if (!item) return;

  try {
    if (editId) {
      if (isQuickEditNotifikasi(item)) {
        setNotifikasiEditMode(item);
        elements.notifikasiForm?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      prefillPengajuanFromNotifikasi(item);
      setMessage(
        elements.notifikasiMessage,
        "Kategori ini perlu pengajuan dulu. Data dasarnya sudah saya pindahkan ke form Pengajuan.",
        "success",
      );
      setNotifikasiEditMode(null);
      activateTab("pengajuan");
      elements.pengajuanForm?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (belumId) {
      await supabase(`notifikasi_teknisi?id=eq.${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "Dalam Pengerjaan",
          status_pengerjaan: "Belum dikerjakan",
        }),
      });
      setMessage(elements.notifikasiMessage, "Status notifikasi ditandai belum selesai.", "success");
    } else if (selesaiId) {
      await supabase(`notifikasi_teknisi?id=eq.${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "Selesai Teknisi",
          status_pengerjaan: "Sudah selesai dikerjakan",
        }),
      });
      await supabase("notifikasi_teknisi", {
        method: "POST",
        body: JSON.stringify({
          jenis_laporan: item.jenis_laporan || item.jenis_pengajuan || "Maintenance",
          kategori: item.kategori || null,
          alat_id: item.alat_id,
          ruangan_id: item.ruangan_id,
          catatan: `Sudah selesai dikerjakan oleh teknisi. ${item.catatan || ""}`.trim(),
          dibuat_oleh: state.user?.username || state.user?.nama || null,
          dibuat_oleh_role: state.user?.role || null,
          tujuan_role: "Kepala Ruangan",
          status: "Dikirim ke Kepala Ruangan",
          status_pengerjaan: "Sudah selesai dikerjakan",
          parent_id: item.id,
        }),
      });
      setMessage(elements.notifikasiMessage, "Selesai dikerjakan. Notifikasi dikirim ke Kepala Ruangan.", "success");
    }
    await loadData();
  } catch (error) {
    setMessage(elements.notifikasiMessage, error.message, "error");
  }
});

$("#laporan-kr-table").addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  const approveId = button?.dataset.approveLaporanKr;
  if (!approveId) return;

  const item = state.notifikasi.find((row) => row.id === approveId);
  if (!item) return;

  try {
    await supabase(`notifikasi_teknisi?id=eq.${approveId}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "Approved Kepala Ruangan",
        status_pengerjaan: item.status_pengerjaan || "Sudah selesai dikerjakan",
        catatan: `${item.catatan || ""} [Approved oleh Kepala Ruangan]`.trim(),
      }),
    });
    setMessage(elements.laporanKrMessage, "Laporan disetujui Kepala Ruangan.", "success");
    await loadData();
  } catch (error) {
    setMessage(elements.laporanKrMessage, error.message, "error");
  }
});

$$(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    if (!tab.dataset.tab) return;

    if (tab.dataset.tab === "alat" && state.user?.role !== "Kepala Ruangan") {
      state.roomFocusId = null;
      renderRooms();
      renderAlat();
      renderStats();
    }
    activateTab(tab.dataset.tab);
    if (tab.dataset.tab === "overview" || tab.dataset.tab === "supervisor-overview") {
      refreshDashboardSilently();
    }
  });
});

elements.aiFloatButton?.addEventListener("click", () => {
  elements.aiFloatPanel?.classList.toggle("is-hidden");
  renderAiWidgetIntro();
});

elements.aiFloatClose?.addEventListener("click", () => {
  elements.aiFloatPanel?.classList.add("is-hidden");
  aiSpeechRunId += 1;
  window.speechSynthesis?.cancel();
});

elements.aiChatPrompts?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-ai-prompt]");
  if (!button) return;
  elements.aiChatInput.value = button.dataset.aiPrompt || "";
  elements.aiChatInput.focus();
});

elements.aiChatForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = elements.aiChatInput.value.trim();
  if (!question) return;
  elements.aiChatInput.value = "";
  await sendDashboardAiQuestion(question);
});

elements.aiMicButton?.addEventListener("click", startAiVoiceInput);

elements.aiSpeechToggle?.addEventListener("click", () => {
  aiSpeechEnabled = !aiSpeechEnabled;
  localStorage.setItem("ai-speech-enabled", String(aiSpeechEnabled));
  if (!aiSpeechEnabled) {
    aiSpeechRunId += 1;
    window.speechSynthesis?.cancel();
  }
  updateAiVoiceControls();
});

updateAiVoiceControls();

renderShell();
renderRegisterRoleFields();

loadPublicData().catch(() => {});

if (state.user && !state.scanCode && !state.scanId) {
  loadData().catch((error) => {
    alert(error.message);
    state.user = null;
    localStorage.removeItem("petugas-session");
    renderShell();
  });
  startDashboardAutoRefresh();
}
