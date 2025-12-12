import { createSupabaseClient } from './_helpers.js';

export const handler = async () => {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('mixtapes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
