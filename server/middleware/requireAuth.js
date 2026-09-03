const jwt = require("jsonwebtoken");
const authService = require("../services/authService");
const { sendError } = require("../utils/response");

async function requireAuth(request, response, next) {
  const authorization = request.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return sendError(response, 401, "Sign in is required to use this API.");
  }

  try {
    const payload = jwt.verify(token, authService.getJwtSecret());

    // Stage 14.13 uses a separate signing secret for refresh tokens. This
    // explicit check makes the protected API accept only short-lived access
    // tokens, even if token handling is changed later.
    if (payload.type !== "access" || !payload.sub) {
      return sendError(response, 401, "Your session is invalid or has expired. Please sign in again.");
    }

    const user = await authService.getUserById(payload.sub);

    if (!user) {
      return sendError(response, 401, "Your account no longer exists. Please sign in again.");
    }

    request.user = user;
    next();
  } catch (error) {
    return sendError(response, 401, "Your session is invalid or has expired. Please sign in again.");
  }
}

module.exports = { requireAuth };
