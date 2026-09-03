const crypto = require("crypto");
const authService = require("../services/authService");
const { sendJson } = require("../utils/response");

function redirectToOAuthResult(response, fragment) {
    return response.redirect(`${authService.getClientOrigin()}/oauth/callback#${fragment}`);
}

function getOAuthFailureMessage(error) {
    if (error?.code === "P2002") {
        return "This GitHub account or email is already linked to another ReviewFlow account.";
    }

    if (error?.status === 409 || error?.status === 502) {
        return error.message;
    }

    return "GitHub sign-in could not be completed. Check the backend terminal for the detailed error.";
}

async function startGitHubLogin(request, response) {
    const state = crypto.randomBytes(32).toString("hex");
    response.cookie("reviewflow_github_oauth_state", state, { httpOnly: true, sameSite: "lax", maxAge: 10 * 60 * 1000, path: "/api/auth/github" });
    return response.redirect(authService.createGitHubAuthorizationUrl(state));
}

async function completeGitHubLogin(request, response) {
    const state = typeof request.query.state === "string" ? request.query.state : "";
    const savedState = request.cookies.reviewflow_github_oauth_state || "";
    response.clearCookie("reviewflow_github_oauth_state", { path: "/api/auth/github" });

    if (!state || !savedState || state.length !== savedState.length || !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(savedState))) {
        return redirectToOAuthResult(response, "error=github_state_validation_failed");
    }

    if (typeof request.query.code !== "string") {
        return redirectToOAuthResult(response, "error=github_authorization_cancelled");
    }

    try {
        const result = await authService.loginWithGitHubCode(request.query.code);
        response.cookie(
            authService.REFRESH_COOKIE_NAME,
            result.refreshToken,
            refreshCookieOptions()
        );
        return redirectToOAuthResult(
            response,
            `accessToken=${encodeURIComponent(result.accessToken)}`
        );
    } catch (error) {
        // OAuth completes in a browser redirect. JSON here strands the user on
        // the backend URL instead of returning them to the React application.
        console.error("GitHub OAuth callback failed:", error);
        return redirectToOAuthResult(
            response,
            `error=${encodeURIComponent(getOAuthFailureMessage(error))}`
        );
    }

}

async function register(request, response) {
    const result = await authService.register(request.body);
    return sendSession(response, 201, result);
}

async function login(request, response) {
    const result = await authService.login(request.body);
    return sendSession(response, 200, result);
}

async function getCurrentUser(request, response) {
    return sendJson(response, 200, { user: request.user });
}
async function connectGitHub(request, response) {
    const user = await authService.connectGitHubToken(
        request.user.id,
        request.body.token
    );

    return sendJson(response, 200, {
        user,
        message: "GitHub is connected. You can now view your accessible repositories.",
    });
}
function refreshCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === "true",
        sameSite: "lax",
        path: "/api/auth",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    };
}

function sendSession(response, status, result) {
    response.cookie(
        authService.REFRESH_COOKIE_NAME,
        result.refreshToken,
        refreshCookieOptions()
    );

    return sendJson(response, status, {
        user: result.user,
        accessToken: result.accessToken,
    });
}
async function refresh(request, response) {
    const result = await authService.rotateRefreshToken(
        request.cookies[authService.REFRESH_COOKIE_NAME]
    );

    return sendSession(response, 200, result);
}

async function logout(request, response) {
    await authService.revokeRefreshToken(
        request.cookies[authService.REFRESH_COOKIE_NAME]
    );

    response.clearCookie(authService.REFRESH_COOKIE_NAME, refreshCookieOptions());
    return response.status(204).send();
}

module.exports = { completeGitHubLogin, getCurrentUser, login, register, startGitHubLogin, connectGitHub, refresh, logout };
