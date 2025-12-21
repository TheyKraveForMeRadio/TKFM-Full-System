exports.handler = async (event) => {
  const token = event.headers.authorization;

  if (token !== process.env.ADMIN_TOKEN) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ status: "admin-ok" })
  };
};
