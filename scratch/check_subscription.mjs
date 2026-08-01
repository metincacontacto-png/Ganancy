import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const { data, error } = await supabase
  .from('profiles')
  .select('id, subscription_status, paddle_customer_id, paddle_subscription_id, updated_at')
  .eq('id', '2f2654ba-d458-40c5-a789-fbb9b4c74c25')
  .maybeSingle();

if (error) console.log('Error:', error.message);
else console.log('Profile:', JSON.stringify(data, null, 2));
