import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async () => {
  const { data, error } = await supabase
    .from("mixtapes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, mixtapes: data }),
  };
};
