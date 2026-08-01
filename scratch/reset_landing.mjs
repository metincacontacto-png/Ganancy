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

const { LANDING_PAGE_DEFAULTS } = await import(path.join(__dirname, '..', 'src', 'data', 'landingPageDefaults.js'));

console.log('Plans to write:', LANDING_PAGE_DEFAULTS.plans.map(p => p.id));

const { data: before, error: beforeErr } = await supabase.from('landing_config').select('data').eq('id', 'default').maybeSingle();
if (beforeErr) console.log('Read before error:', beforeErr.message);
else console.log('Current plans in DB:', before?.data?.plans?.map(p => p.id));

const { error } = await supabase.from('landing_config').upsert({ id: 'default', data: LANDING_PAGE_DEFAULTS });
if (error) {
  console.error('UPSERT FAILED:', error.message, error.details, error.hint);
  process.exit(1);
}

const { data: after, error: afterErr } = await supabase.from('landing_config').select('data').eq('id', 'default').maybeSingle();
if (afterErr) console.log('Read after error:', afterErr.message);
else console.log('New plans in DB:', after?.data?.plans?.map(p => p.id));
