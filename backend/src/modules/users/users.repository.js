import { supabaseAdmin } from "../../integrations/supabase/admin-client.js";
import { BaseRepository } from "../../repositories/base.repository.js";

export class UsersRepository extends BaseRepository {
  constructor(client = supabaseAdmin) {
    super(client, "user_petugas");
  }

  listActive() {
    return this.list("select=id,nama,username,role,status,email,no_hp,telegram_id&status=eq.Aktif&order=nama.asc");
  }
}
