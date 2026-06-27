import { supabaseAdmin } from "../../integrations/supabase/admin-client.js";
import { BaseRepository } from "../../repositories/base.repository.js";

export class VendorFeedbackRepository extends BaseRepository {
  constructor(client = supabaseAdmin) {
    super(client, "feedback_vendor");
  }
}
