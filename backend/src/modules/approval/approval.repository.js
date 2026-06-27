import { supabaseAdmin } from "../../integrations/supabase/admin-client.js";
import { BaseRepository } from "../../repositories/base.repository.js";

export class ApprovalRepository extends BaseRepository {
  constructor(client = supabaseAdmin) {
    super(client, "pengajuan");
  }

  listPendingSupervisor() {
    return this.list("select=*&status=eq.Menunggu%20Supervisor&order=created_at.desc");
  }
}
