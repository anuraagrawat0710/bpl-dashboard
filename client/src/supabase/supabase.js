import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ltjkjwabwgywwijilsrj.supabase.co";

const supabaseAnonKey = "sb_publishable_QPvNVJufbdj4rnQv7mJaKA_ATULoKkP";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
