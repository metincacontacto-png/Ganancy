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

async function getOpenApi() {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'Accept': 'application/openapi+json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    const schema = await response.json();
    console.log("Full response:", schema);
    if (schema.definitions) {
      console.log("Definitions:", Object.keys(schema.definitions));
    }
  } catch (err) {
    console.error("Error fetching OpenAPI schema:", err);
  }
}

getOpenApi();
