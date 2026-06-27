import { env } from "../../config/index.js";
import { createSupabaseRestClient } from "./rest-client.js";

export const supabasePublic = createSupabaseRestClient(env.supabase.anonKey);
