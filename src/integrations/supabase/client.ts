import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qryqcsnbcftcasjovtdj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyeXFjc25iY2Z0Y2Fzam92dGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MDE1MTYsImV4cCI6MjA5NjM3NzUxNn0.H8ch2ubGa1NMzdyYimMqaXVreJbd5NNGzwkVIk6KHzc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
