import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl)
  throw new Error("Missing VITE_SUPABASE_URL environment variable");
if (!supabaseKey)
  throw new Error("Missing VITE_SUPABASE_ANON_KEY environment variable");

const siteUrl = import.meta.env.VITE_SITE_URL || "http://localhost:5174";

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
    redirectTo: siteUrl,
  },
  global: {
    headers: {
      "X-Client-Info": "piano-app@1.0.0",
    },
  },
  db: {
    schema: "public",
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export default supabase;
