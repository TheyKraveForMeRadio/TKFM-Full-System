import { createSupabaseClient, verifyAdmin } from './_helpers.js';

export const handler = async (event) => {
  try {
    verifyAdmin(event);

    const { id } = JSON.parse(event.body || "{}");
    if (!id) return { statusCode: 400, body: JSON.stringify({ error: "Missing id" }) };

    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('news_posts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { statusCode: 200, body: JSON.stringify({ deleted: true, data }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 401, body: JSON.stringify({ error: err.message }) };
  }
};
