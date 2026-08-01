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

async function testLength() {
  try {
    const longName = "A".repeat(10000); // 10KB string
    console.log("Attempting to insert a row with a 10KB name...");
    const { data, error } = await supabase.from('activos').insert({
      category_id: 'equipos',
      category_name: 'Equipos',
      name: longName,
      value: 100
    }).select();
    
    if (error) {
      console.log("Insertion failed:", error.message);
      console.log("Error code:", error.code);
    } else {
      console.log("Insertion succeeded! Data:", data);
      // Clean up the test row
      if (data && data[0]) {
        await supabase.from('activos').delete().eq('id', data[0].id);
        console.log("Cleaned up test row.");
      }
    }
  } catch (err) {
    console.error(err);
  }
}

testLength();
