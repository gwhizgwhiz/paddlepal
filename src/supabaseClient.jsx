// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      // keep session in localStorage & cookies
      persistSession: true,
      // automatically refresh JWTs
      autoRefreshToken: true,
      // if you ever use magic-link redirects, this helps Supabase pick up the URL fragment
      detectSessionInUrl: true
    }
  }
)

// optional: for quick debugging in the console
window.supabase = supabase

export default supabase
