
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
export const handler = async function(event) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { title, excerpt, body: content, author } = body;
    if(!title || !content) return { statusCode:400, body: JSON.stringify({ error:'Missing fields' }) };
    const { data, error } = await supabase.from('news_posts').insert([{ title, excerpt, body: content, author, created_at: new Date().toISOString() }]).select();
    if(error) throw error;
    return { statusCode:200, body: JSON.stringify({ post: data[0] }) };
  } catch (err) { console.error(err); return { statusCode:500, body: JSON.stringify({ error: err.message }) }; }
};
