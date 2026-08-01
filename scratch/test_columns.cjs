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

async function testColumns() {
  const cols = ['description', 'details', 'documents', 'documentos', 'metadata', 'created_at', 'updated_at'];
  for (const col of cols) {
    const { error } = await supabase.from('activos').select(col).limit(1);
    if (error && error.message.includes('does not exist')) {
      console.log(`Column '${col}': DOES NOT EXIST`);
    } else {
      console.log(`Column '${col}': EXISTS (or another error: ${error ? error.message : 'None'})`);
    }
  }
}

testColumns();
