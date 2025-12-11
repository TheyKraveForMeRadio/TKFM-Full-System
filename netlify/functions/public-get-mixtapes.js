// netlify/functions/public-get-mixtapes.js
exports.handler = async () => {
  try {
    const knex = require("knex")({
      client: "sqlite3",
      connection: { filename: "./sql/tkfm.db" },
      useNullAsDefault: true
    });

    const mixtapes = await knex("mixtapes")
      .select("*")
      .orderBy("created_at", "desc")
      .limit(50);

    return {
      statusCode: 200,
      body: JSON.stringify(mixtapes)
    };

  } catch (err) {
    console.error("Error fetching mixtapes:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
