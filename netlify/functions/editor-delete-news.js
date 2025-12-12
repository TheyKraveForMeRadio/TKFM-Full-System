import { createClient } from "@supabase/supabase-js";
import { verifyAdmin } from "./_helpers.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async (event) => {
  const admin = verifyAdmin(event);
  if (!admin.id) return admin;

  const body = JSON.parse(event.body || "{}");

  const { id } = body;

  const { error } = await supabase
    .from("news")
    .delete()
    .eq("id", id);

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, deleted: id }),
  };
};
