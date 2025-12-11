
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
exports.handler = async function() {
  try {
    const { data, error } = await supabase.from('news_posts').select('*').order('created_at', { ascending:false }).limit(20);
    if(error) throw error;
    return { statusCode:200, body: JSON.stringify(data) };
  } catch (err) { console.error(err); return { statusCode:500, body: JSON.stringify({ error: err.message }) }; }
};
