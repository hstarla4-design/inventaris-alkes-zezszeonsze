import { env } from "../../config/index.js";
import { createSupabaseRestClient } from "./rest-client.js";

export const supabaseAdmin = createSupabaseRestClient(env.supabase.serviceRoleKey || env.supabase.anonKey);
