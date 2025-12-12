import { createSupabaseClient, verifyAdmin } from './_helpers.js';
import { v4 as uuidv4 } from 'uuid';

export const handler = async (event) => {
  try {
    // require staff/admin
    verifyAdmin(event);

    const body = JSON.parse(event.body || "{}");
    if (!body.title || !body.file_url) {
      return { statusCode: 400, body: JSON.stringify({ error: "title and file_url required" }) };
    }

    const supabase = createSupabaseClient();
    const record = {
      id: uuidv4(),
      title: body.title,
      description: body.description || null,
      file_url: body.file_url,
      dj_name: body.dj_name || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('mixtapes').insert([record]).select();

    if (error) throw error;
    return { statusCode: 201, body: JSON.stringify(data[0]) };
  } catch (err) {
    console.error(err);
    return { statusCode: 401, body: JSON.stringify({ error: err.message }) };
  }
};
