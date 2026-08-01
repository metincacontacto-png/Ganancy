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

async function checkSchema() {
  try {
    // We try to select a non-existent column to see if Supabase returns an error with the list of valid columns.
    const { data, error } = await supabase.from('activos').select('non_existent_column').limit(1);
    if (error) {
      console.log("Error message (should contain valid columns):", error.message);
      console.log("Error details:", error);
    } else {
      console.log("Data:", data);
    }
  } catch (err) {
    console.error(err);
  }
}

checkSchema();
