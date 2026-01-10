function json(statusCode, obj) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(obj),
  };
}

export async function handler(event) {
  try {
    const envKey =
      process.env.TKFM_OWNER_KEY ||
      process.env.OWNER_KEY ||
      process.env.INTERNAL_CRON_KEY ||
      "";

    const hdr =
      (event.headers && (event.headers["x-tkfm-owner-key"] || event.headers["X-Tkfm-Owner-Key"])) || "";
    const q =
      (event.queryStringParameters && event.queryStringParameters.key) || "";

    const provided = (hdr || q || "").trim();

    if (!envKey) return json(500, { ok: false, error: "Owner key not set in env (TKFM_OWNER_KEY)" });
    if (!provided) return json(401, { ok: false, error: "Missing owner key" });

    if (provided === envKey) return json(200, { ok: true });
    return json(401, { ok: false, error: "Invalid owner key" });
  } catch (e) {
    return json(500, { ok: false, error: "server_error" });
  }
}
