import { supabaseAdmin } from "../../integrations/supabase/admin-client.js";
import { BaseRepository } from "../../repositories/base.repository.js";

export class InventoryRepository extends BaseRepository {
  constructor(client = supabaseAdmin) {
    super(client, "alat_kesehatan");
  }

  listWithRooms() {
    return this.list("select=*&order=nama_alat.asc");
  }

  listByRoom(roomId) {
    return this.list(`select=*&ruangan_id=eq.${encodeURIComponent(roomId)}&order=nama_alat.asc`);
  }
}
