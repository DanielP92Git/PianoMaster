
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://hdltcvgqrtxuxgjdvzzu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkbHRjdmdxcnR4dXhnamR2enp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzODY3OTMsImV4cCI6MjA1NDk2Mjc5M30.fduDwMUVy_Mdju2I6800gI0viPNurs5qUrLbHEA_GOA'
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase