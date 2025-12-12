import knex from "knex";

const db = knex({
  client: "pg",
  connection: process.env.SUPABASE_URL + "/postgres",
});

export async function handler(event, context) {
  try {
    const mixtapes = await db("mixtapes")
      .select("*")
      .orderBy("created_at", "desc");

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, mixtapes }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
}
