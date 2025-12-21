import { createSupabaseClient, verifyAdmin } from './_helpers.js';

export const handler = async (event) => {
  try {
    // require admin/editor token
    verifyAdmin(event);

    const payload = JSON.parse(event.body || "{}");
    if (!payload.id) return { statusCode: 400, body: JSON.stringify({ error: "Missing id" }) };

    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('news_posts')
      .update({
        title: payload.title,
        body: payload.body,
        tags: payload.tags || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', payload.id);

    if (error) throw error;
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    console.error(err);
    return { statusCode: 401, body: JSON.stringify({ error: err.message }) };
  }
};
