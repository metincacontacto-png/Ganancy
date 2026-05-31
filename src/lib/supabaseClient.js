import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are empty, placeholders, or undefined
const isMissingCredentials = 
  !supabaseUrl || 
  !supabaseAnonKey || 
  supabaseUrl.includes('YOUR_SUPABASE_URL') || 
  supabaseAnonKey.includes('YOUR_SUPABASE_ANON_KEY');

if (isMissingCredentials) {
  console.warn(
    "⚠️ [Supabase] Faltan las credenciales reales en tu archivo `.env`. " +
    "Por favor edita el archivo `/Users/dekgiovannirepetto/Documents/DEVELOPER/FINANCY GAME/.env` " +
    "con tu URL y anon key de la consola de Supabase."
  );
}

// Fallback to placeholder values to prevent hard-crash on initial load before .env is configured
export const supabase = createClient(
  isMissingCredentials ? 'https://placeholder-url.supabase.co' : supabaseUrl,
  isMissingCredentials ? 'placeholder-anon-key' : supabaseAnonKey
);
