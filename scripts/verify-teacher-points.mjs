/**
 * Lightweight integration check for teacher dashboard point totals.
 *
 * This script calls the Supabase RPC `teacher_get_student_points()` using a TEACHER access token
 * (so auth.uid() is set correctly), and prints the returned totals.
 *
 * Usage (PowerShell):
 *   $env:SUPABASE_URL="https://...supabase.co"
 *   $env:SUPABASE_ANON_KEY="eyJ..."
 *   $env:TEACHER_ACCESS_TOKEN="eyJ..."   # from browser localStorage (Supabase session)
 *   node scripts/verify-teacher-points.mjs
 *
 * Expected:
 * - Returns an array of rows with { student_id, total_points, gameplay_points, achievement_points }
 * - If you have connected students and this returns empty, check teacher_student_connections/status and RLS.
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const accessToken = process.env.TEACHER_ACCESS_TOKEN;

if (!url || !anonKey || !accessToken) {
  console.error("Missing env vars. Required: SUPABASE_URL, SUPABASE_ANON_KEY, TEACHER_ACCESS_TOKEN");
  process.exit(2);
}

const supabase = createClient(url, anonKey, {
  global: {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

const { data, error } = await supabase.rpc("teacher_get_student_points");

if (error) {
  console.error("RPC failed:", error);
  process.exit(1);
}

console.log("teacher_get_student_points rows:", data);
process.exit(0);






