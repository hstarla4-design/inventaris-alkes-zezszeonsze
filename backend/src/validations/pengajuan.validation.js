import { z } from "zod";

export const pengajuanSchema = z.object({
  jenis_pengajuan: z.enum(["Maintenance", "Kalibrasi"]),
  kategori: z.string().nullable().optional(),
  alat_id: z.string().uuid(),
  ruangan_id: z.string().uuid().nullable().optional(),
  vendor_pt: z.string().nullable().optional(),
  catatan: z.string().nullable().optional(),
});
