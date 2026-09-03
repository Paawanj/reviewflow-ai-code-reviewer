const { sendError } = require("../utils/response");

function errorHandler(error, request, response, next) {
  console.error(error);

  const errorDetails = [
    error?.status,
    error?.code,
    error?.message,
    error?.response?.status,
    error?.response?.data?.error?.status,
  ].join(" ");

  if (response.headersSent) {
    return next(error);
  }

  if (error.code === "P2002") {
    return sendError(response, 409, "That GitHub account or email is already linked to another ReviewFlow account.");
  }

  if (error.status === 400) {
    return sendError(response, 400, error.message || "The review request is invalid.");
  }

  if (error.status === 401) {
    return sendError(
      response,
      401,
      "GitHub rejected this account's saved connection. Reconnect GitHub to access private repositories."
    );
  }

  if (error.status === 403) {
    return sendError(response, 403, error.message || "GitHub denied this request. Check repository permissions or rate limits.");
  }

  if (error.status === 409) {
    return sendError(response, 409, error.message || "This request conflicts with the current account state.");
  }

  if (error.status === 404) {
    return sendError(response, 404, error.message || "The requested resource was not found.");
  }

  if (error.status === 429 || /(^|\D)429(\D|$)|resource_exhausted|rate.?limit|quota/i.test(errorDetails)) {
    return sendError(response, 429, "The AI service rate limit was reached. Wait and try again.");
  }

  if (/api.?key|authentication failed|unauthenticated/i.test(errorDetails)) {
    return sendError(response, 502, "Gemini rejected the configured API key. Check GEMINI_API_KEY in server/.env and restart the backend.");
  }

  if (error.status === 502) {
    return sendError(response, 502, error.message || "The AI service returned an invalid response. Please try again.");
  }

  if (error.code === "EACCES" || error.code === "ENETUNREACH" || error.code === "ECONNREFUSED" || /connect\s+eacces|\beacces\b/i.test(errorDetails)) {
    return sendError(response, 503, "The backend could not reach GitHub. Restart the server from the VS Code terminal, then try again.");
  }

  return sendError(response, error.status || 500, "Something went wrong on the server.");
}

module.exports = errorHandler;
