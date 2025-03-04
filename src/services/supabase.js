import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl)
  throw new Error("Missing VITE_SUPABASE_URL environment variable");
if (!supabaseKey)
  throw new Error("Missing VITE_SUPABASE_ANON_KEY environment variable");

const isDevelopment = process.env.NODE_ENV === "development";
const siteUrl = isDevelopment
  ? "http://localhost:5174"
  : "https://piano-master-nine.vercel.app";

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
    redirectTo: siteUrl,
  },
});

export default supabase;
