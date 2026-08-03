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

async function checkCategoryColumn() {
  try {
    const { data: catCol, error: err1 } = await supabase.from('detalles_mensuales').select('category').limit(1);
    if (err1) {
      console.log("Error selecting category:", err1.message);
      const { data: categoriaCol, error: err2 } = await supabase.from('detalles_mensuales').select('categoria').limit(1);
      if (err2) {
        console.log("Error selecting categoria:", err2.message);
      } else {
        console.log("Column 'categoria' exists!");
      }
    } else {
      console.log("Column 'category' exists!");
    }
  } catch (err) {
    console.error(err);
  }
}

checkCategoryColumn();
