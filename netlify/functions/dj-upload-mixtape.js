import knex from "knex";

const db = knex({
  client: "pg",
  connection: process.env.SUPABASE_URL + "/postgres",
});

export async function handler(event, context) {
  try {
    const { title, artist, file_url } = JSON.parse(event.body);

    await db("mixtapes").insert({
      title,
      artist,
      file_url,
      created_at: new Date(),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: e.message }),
    };
  }
}
