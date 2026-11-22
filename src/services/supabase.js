import { createClient } from "@supabase/supabase-js";

// Credentials can be overridden via .env (VITE_SUPABASE_URL /
// VITE_SUPABASE_PUBLISHABLE_KEY). The publishable key is safe to expose —
// it only grants the access level allowed by Row Level Security.
export const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ??
  "https://kpzyizrurondyiorukqx.supabase.co";
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_EMAXqhKPQwx9J06RBOIBVw_MEl2yN0T";

export const supabase = createClient(supabaseUrl, supabaseKey);
