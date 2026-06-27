import { supabaseAdmin } from "../../integrations/supabase/admin-client.js";
import { BaseRepository } from "../../repositories/base.repository.js";

export class NotificationRepository extends BaseRepository {
  constructor(client = supabaseAdmin) {
    super(client, "notifikasi_teknisi");
  }
}
