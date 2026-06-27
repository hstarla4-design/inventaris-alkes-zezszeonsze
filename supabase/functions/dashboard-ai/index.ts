const allowedOrigins = new Set([
  "https://inventarisalkes-7f32c.web.app",
  "https://inventarisalkes-7f32c.firebaseapp.com",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
]);

const allowedRoles = new Set(["Teknisi", "Kepala Ruangan", "Supervisor", "Kepala Supervisor"]);

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && allowedOrigins.has(origin) ? origin : "https://inventarisalkes-7f32c.web.app",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Origin",
  };
}

function clean(value: unknown, max = 220) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function compact(rows: unknown, fields: string[], limit: number) {
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, limit).map((row) => {
    const source = row && typeof row === "object" ? row as Record<string, unknown> : {};
    return Object.fromEntries(
      fields
        .filter((field) => source[field] !== undefined && source[field] !== null && source[field] !== "")
        .map((field) => [field, clean(source[field], 160)]),
    );
  });
}

function extractText(data: Record<string, any>) {
  const message = data?.choices?.[0]?.message || {};
  if (Array.isArray(message.content)) {
    const joined = message.content
      .map((part: Record<string, unknown>) => part?.text || part?.content || part?.value || "")
      .filter(Boolean)
      .join("\n")
      .trim();
    if (joined) return joined;
  }

  const candidates = [
    message.content,
    message.reasoning_content,
    message.reasoning,
    data?.choices?.[0]?.text,
    data?.output_text,
    data?.output?.[0]?.content?.[0]?.text,
    data?.output?.[0]?.text,
    data?.message?.content,
    data?.response,
    data?.text,
    data?.content,
  ];
  return candidates.find((item) => typeof item === "string" && item.trim())?.trim() || "";
}

function systemPrompt(role: string) {
  return [
    "Kamu adalah AI Asisten Inventaris Alat Kesehatan RUMAH SAKIT ZezszeonSze.",
    "Jawab dalam Bahasa Indonesia yang profesional, jelas, dan mudah dipakai petugas rumah sakit.",
    "Gunakan hanya DATA_DASHBOARD. Jangan mengarang alat, serial number, vendor, biaya, status, tanggal, atau jumlah.",
    "Jika data tidak tersedia, nyatakan singkat bahwa data belum terbaca.",
    "Jangan memberi troubleshooting teknis. Fokus pada inventaris, risiko pelayanan, jadwal, histori, vendor, biaya, dan tindak lanjut administratif.",
    `Role pengguna: ${role}. Sesuaikan analisis dengan kewenangan role.`,
    "Gunakan format laporan kerja premium dan mudah dipindai: pembuka satu kalimat, Ringkasan, Prioritas, Temuan, Tindak Lanjut, lalu Kesimpulan bila relevan.",
    "Judul bagian ditulis sebagai teks biasa tanpa simbol. Gunakan daftar bernomor untuk prioritas dan tanda hubung untuk rincian.",
    "DILARANG memakai Markdown: jangan gunakan **, *, #, ###, garis pemisah ---, tabel Markdown, atau backtick.",
    "Hindari pengulangan, kalimat pembuka yang terlalu panjang, dan bahasa percakapan berlebihan.",
    "Setiap angka, tanggal, biaya, serial number, vendor, kondisi, dan status harus berasal dari DATA_DASHBOARD.",
  ].join("\n");
}

function userContent(question: string, user: Record<string, unknown>, snapshot: Record<string, any>) {
  const safeData = {
    pengguna: {
      nama: clean(user?.nama),
      role: clean(user?.role),
      ruangan: clean(user?.ruangan),
    },
    ringkasan: snapshot?.summary || {},
    alat: compact(snapshot?.alat, [
      "nama_alat", "kode_barcode", "serial_number", "merk", "tipe", "ruangan",
      "kondisi", "status", "vendor", "tanggal_instalasi", "maintenance_berikutnya",
      "kalibrasi_berikutnya", "harga_pembelian",
    ], 35),
    maintenance: compact(snapshot?.maintenance, [
      "alat", "ruangan", "jenis", "tanggal", "teknisi", "vendor",
      "status_progres", "hasil", "biaya",
    ], 25),
    kalibrasi: compact(snapshot?.kalibrasi, [
      "alat", "ruangan", "tanggal_kalibrasi", "berlaku_sampai", "vendor",
      "hasil", "status_progres", "nomor_sertifikat", "biaya",
    ], 25),
    pengajuan: compact(snapshot?.pengajuan, [
      "alat", "ruangan", "jenis_pengajuan", "kategori", "vendor_pt",
      "status", "tanggal", "catatan",
    ], 20),
  };
  return `PERTANYAAN:\n${clean(question, 1200)}\n\nDATA_DASHBOARD:\n${JSON.stringify(safeData)}`;
}

async function callProvider(messages: Array<Record<string, string>>, maxTokens: number) {
  const baseUrl = (Deno.env.get("DEEPSEEK_BASE_URL") || "https://ai.sumopod.com/v1").replace(/\/+$/, "");
  const apiKey = Deno.env.get("DEEPSEEK_API_KEY") || "";
  const model = Deno.env.get("DEEPSEEK_MODEL") || "deepseek-v4-pro";
  if (!apiKey) throw new Error("Konfigurasi DeepSeek belum tersedia di server.");

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0.18, max_tokens: maxTokens }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || data?.message || `DeepSeek HTTP ${response.status}`);
  }
  return {
    answer: extractText(data),
    finishReason: data?.choices?.[0]?.finish_reason || "",
  };
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method tidak didukung." }), { status: 405, headers });
  }
  if (origin && !allowedOrigins.has(origin)) {
    return new Response(JSON.stringify({ message: "Origin tidak diizinkan." }), { status: 403, headers });
  }

  try {
    const body = await request.json();
    const question = clean(body?.question, 1200);
    const user = body?.user && typeof body.user === "object" ? body.user : {};
    const role = clean(user?.role);
    if (!allowedRoles.has(role)) {
      return new Response(JSON.stringify({ message: "Role tidak memiliki akses AI dashboard." }), { status: 403, headers });
    }
    if (!question) {
      return new Response(JSON.stringify({ message: "Pertanyaan tidak boleh kosong." }), { status: 400, headers });
    }

    const prompt = systemPrompt(role);
    const first = await callProvider([
      { role: "system", content: prompt },
      { role: "user", content: userContent(question, user, body?.snapshot || {}) },
    ], 1800);
    if (first.answer) {
      return new Response(JSON.stringify({ answer: first.answer }), { status: 200, headers });
    }

    const retry = await callProvider([
      { role: "system", content: prompt },
      {
        role: "user",
        content: `${userContent(question, user, {
          summary: body?.snapshot?.summary || {},
          alat: (body?.snapshot?.alat || []).slice(0, 20),
          maintenance: (body?.snapshot?.maintenance || []).slice(0, 12),
          kalibrasi: (body?.snapshot?.kalibrasi || []).slice(0, 12),
          pengajuan: (body?.snapshot?.pengajuan || []).slice(0, 8),
        })}\n\nJawab langsung. Jangan mengosongkan content.`,
      },
    ], 2200);
    if (!retry.answer) throw new Error(`DeepSeek tidak menghasilkan teks (${retry.finishReason || "respons kosong"}).`);
    return new Response(JSON.stringify({ answer: retry.answer }), { status: 200, headers });
  } catch (error) {
    return new Response(
      JSON.stringify({ message: error instanceof Error ? error.message : "AI gagal memproses permintaan." }),
      { status: 502, headers },
    );
  }
});
