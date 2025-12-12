import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "./_helpers.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async (event) => {
  const user = requireAuth(event);
  if (!user.id) return user;

  const body = JSON.parse(event.body || "{}");

  const { title, artist, file_url } = body;

  const { data, error } = await supabase
    .from("mixtapes")
    .insert([{ title, artist, file_url }])
    .select();

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, mixtape: data[0] }),
  };
};
