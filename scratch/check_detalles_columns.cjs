const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('/Users/dekgiovannirepetto/Documents/DEVELOPER/GANANCY/.env', 'utf8');
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

async function checkColumns() {
  try {
    const { data, error } = await supabase.from('detalles_mensuales').select('id, user_id, month, type, name, value, paid, is_variable, due_date, reminder_enabled, reminder_email, reminder_time, receipt_url').limit(1);
    if (error) {
      console.log("Error details:", error.message);
    } else {
      console.log("All columns exist! Data:", data);
    }
  } catch (err) {
    console.error(err);
  }
}

checkColumns();
