const { sendError } = require("../utils/response");

function notFound(request, response) {
  return sendError(response, 404, `Route not found: ${request.method} ${request.originalUrl}`);
}

module.exports = notFound;
