const { createClient } = require('/Users/dekgiovannirepetto/Documents/DEVELOPER/FINANCY GAME/node_modules/@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync('/Users/dekgiovannirepetto/Documents/DEVELOPER/FINANCY GAME/.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkActivos() {
  try {
    const { data, error } = await supabase.from('activos').select('*').limit(1);
    if (error) {
      console.error("Error fetching activos:", error);
    } else {
      console.log("Activo columns:", data.length > 0 ? Object.keys(data[0]) : "No rows found");
      console.log("Row data:", data);
    }
  } catch (err) {
    console.error(err);
  }
}

checkActivos();
