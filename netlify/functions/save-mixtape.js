
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
exports.handler = async function(event) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { title, description, cover_path, audio_path, price_id, published } = body;
    const { data, error } = await supabase.from('mixtapes').insert([{
      title, description, cover_path, audio_path, price_id, published, created_at: new Date().toISOString()
    }]).select();
    if(error) throw error;
    return { statusCode:200, body: JSON.stringify({ mixtape: data[0] }) };
  } catch (err) { console.error(err); return { statusCode:500, body: JSON.stringify({ error: err.message }) }; }
};
