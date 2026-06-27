import { supabaseAdmin } from "../../integrations/supabase/admin-client.js";
import { BaseRepository } from "../../repositories/base.repository.js";

export class MaintenanceRepository extends BaseRepository {
  constructor(client = supabaseAdmin) {
    super(client, "maintenance");
  }

  listLatest() {
    return this.list("select=*&order=tanggal.desc");
  }
}
