import { supabaseAdmin } from "../integrations/supabase/admin-client.js";
import { sendHtmlEmail } from "../integrations/gmail/gmail.service.js";
import { logger } from "../utils/logger.js";

export async function runVendorEmailJob() {
  const rows = await supabaseAdmin.get("email_queue?select=*&status=eq.Queued&order=created_at.asc&limit=10");
  for (const row of rows) {
    try {
      await sendHtmlEmail({ to: row.to_email, subject: row.subject, html: row.html_body });
      await supabaseAdmin.patch(`email_queue?id=eq.${encodeURIComponent(row.id)}`, {
        status: "Sent",
        sent_at: new Date().toISOString(),
        error_message: null,
      });
      if (row.surat_id) {
        await supabaseAdmin.patch(`surat_vendor?id=eq.${encodeURIComponent(row.surat_id)}`, { email_status: "Sent" });
      }
      logger.info("Vendor email sent", { to: row.to_email, subject: row.subject });
    } catch (error) {
      await supabaseAdmin.patch(`email_queue?id=eq.${encodeURIComponent(row.id)}`, {
        status: "Error",
        error_message: error.message,
      });
      logger.error("Vendor email failed", { to: row.to_email, error: error.message });
    }
  }
}
