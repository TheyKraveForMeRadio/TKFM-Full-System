export function corsHeaders(extra = {}) {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization,x-tkfm-owner-key",
    "access-control-max-age": "86400",
    ...extra
  };
}

export function json(statusCode, obj, extraHeaders = {}) {
  return {
    statusCode,
    headers: corsHeaders({ "content-type": "application/json", ...extraHeaders }),
    body: JSON.stringify(obj),
  };
}

export function bad(statusCode, message, extra = {}) {
  return json(statusCode, { ok:false, error: message, ...extra });
}

export function ok(obj, extraHeaders = {}) {
  return json(200, { ok:true, ...obj }, extraHeaders);
}

export function isOptions(event){
  return (event.httpMethod || "").toUpperCase() === "OPTIONS";
}
