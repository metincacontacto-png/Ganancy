const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://afkdpkttgpdcyudcfbfp.supabase.co';
const supabaseAnonKey = 'sb_publishable_Q8chRQIYu5nTyg5K7oZFHg_aBgZ7ZNx';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
  try {
    // We can't query information_schema directly via postgrest easily unless we do an RPC or it is exposed.
    // But we can try to fetch a single row from 'deudas' (even if empty or we get RLS) or check if we can query it.
    // Alternatively, let's see if we can get a description of the table.
    // Let's just fetch the deudas for the user if any are authenticated.
    // Wait! Let's see if we can select from deudas where we don't filter, or see if we get any schema information.
    const { data, error } = await supabase.from('deudas').select('*').limit(1);
    console.log("Error:", error);
    console.log("Data:", data);
  } catch (err) {
    console.error(err);
  }
}

checkColumns();
