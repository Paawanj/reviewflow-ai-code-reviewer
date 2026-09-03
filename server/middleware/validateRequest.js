const { sendError } = require("../utils/response");

function formatIssues(issues) {
  return issues
    .map((issue) => `${issue.path.join(".") || "request"}: ${issue.message}`)
    .join(" ");
}

function validateRequest(schema, location) {
  return (request, response, next) => {
    const result = schema.safeParse(request[location]);

    if (!result.success) {
      return sendError(response, 400, formatIssues(result.error.issues));
    }

    next();
  };
}

module.exports = { validateRequest };
