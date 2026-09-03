const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

const ACCESS_TOKEN_EXPIRY = "30m";
const REFRESH_TOKEN_EXPIRY = "7d";
const REFRESH_COOKIE_NAME = "reviewflow_refresh";
const GITHUB_SCOPE = "read:user user:email repo";

function createConfigurationError(message) {
  const error = new Error(message);
  error.status = 500;
  return error;
}

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw createConfigurationError(
      "JWT_SECRET is missing. Add it to server/.env."
    );
  }

  return process.env.JWT_SECRET;
}

function getRefreshSecret() {
  if (!process.env.JWT_REFRESH_SECRET) {
    const error = new Error(
      "JWT_REFRESH_SECRET is missing. Add it to server/.env."
    );
    error.status = 500;
    throw error;
  }

  return process.env.JWT_REFRESH_SECRET;
}

function createAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, type: "access" },
    getJwtSecret(),
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

function createRefreshToken(userId, sessionId) {
  return jwt.sign(
    { sub: userId, sid: sessionId, type: "refresh" },
    getRefreshSecret(),
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

function getRefreshExpiryDate() {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

async function createSessionTokens(user) {
  const session = await prisma.refreshSession.create({
    data: {
      userId: user.id,
      expiresAt: getRefreshExpiryDate(),
    },
  });

  return {
    user: publicUser(user),
    accessToken: createAccessToken(user),
    refreshToken: createRefreshToken(user.id, session.id),
  };
}

async function rotateRefreshToken(refreshToken) {
  let payload;

  try {
    payload = jwt.verify(refreshToken, getRefreshSecret());
  } catch {
    const error = new Error(
      "Your session has expired. Please sign in again."
    );
    error.status = 401;
    throw error;
  }

  if (payload.type !== "refresh" || !payload.sub || !payload.sid) {
    const error = new Error(
      "Your refresh token is invalid. Please sign in again."
    );
    error.status = 401;
    throw error;
  }

  const session = await prisma.refreshSession.findUnique({
    where: { id: payload.sid },
    include: { user: true },
  });

  if (
    !session ||
    session.userId !== payload.sub ||
    session.expiresAt <= new Date()
  ) {
    const error = new Error(
      "Your session has expired. Please sign in again."
    );
    error.status = 401;
    throw error;
  }

  await prisma.refreshSession.delete({
    where: { id: session.id },
  });

  return createSessionTokens(session.user);
}

async function revokeRefreshToken(refreshToken) {
  if (!refreshToken) return;

  try {
    const payload = jwt.verify(refreshToken, getRefreshSecret());

    if (payload.type === "refresh" && payload.sid) {
      await prisma.refreshSession.deleteMany({
        where: { id: payload.sid },
      });
    }
  } catch {
    // Logout should still clear an expired/tampered cookie.
  }
}

function getClientOrigin() {
  if (!process.env.CLIENT_ORIGIN) {
    throw createConfigurationError(
      "CLIENT_ORIGIN is missing. Add it to server/.env."
    );
  }

  return process.env.CLIENT_ORIGIN;
}

function getGitHubOAuthConfig() {
  const {
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_OAUTH_REDIRECT_URI,
  } = process.env;

  if (
    !GITHUB_CLIENT_ID ||
    !GITHUB_CLIENT_SECRET ||
    !GITHUB_OAUTH_REDIRECT_URI
  ) {
    throw createConfigurationError(
      "GitHub OAuth configuration is missing in server/.env."
    );
  }

  return {
    clientId: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    redirectUri: GITHUB_OAUTH_REDIRECT_URI,
  };
}

function getEncryptionKey() {
  if (!process.env.TOKEN_ENCRYPTION_KEY) {
    throw createConfigurationError(
      "TOKEN_ENCRYPTION_KEY is missing. Add it to server/.env."
    );
  }

  const key = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY, "base64");

  if (key.length !== 32) {
    throw createConfigurationError(
      "TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key."
    );
  }

  return key;
}

function encryptGitHubToken(token) {
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    iv
  );

  const ciphertext = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [iv, ciphertext, authTag]
    .map((part) => part.toString("base64"))
    .join(".");
}

function decryptGitHubToken(encryptedValue) {
  const [ivText, ciphertextText, tagText] =
    encryptedValue.split(".");

  if (!ivText || !ciphertextText || !tagText) {
    const error = new Error(
      "The stored GitHub connection is invalid. Reconnect GitHub."
    );
    error.status = 500;
    throw error;
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivText, "base64")
  );

  decipher.setAuthTag(Buffer.from(tagText, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextText, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

async function getGitHubAccessToken(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { githubTokenEncrypted: true },
  });

  if (!user?.githubTokenEncrypted) {
    const error = new Error(
      "Connect your GitHub account before viewing repositories."
    );
    error.status = 409;
    throw error;
  }

  return decryptGitHubToken(user.githubTokenEncrypted);
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    githubLogin: user.githubLogin || null,
  };
}

async function register({ name, email, password }) {
  const normalizedEmail = email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    const error = new Error(
      "An account already exists for this email address."
    );
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name: name || null,
      email: normalizedEmail,
      passwordHash,
    },
  });

  return createSessionTokens(user);
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  const passwordMatches =
    user?.passwordHash &&
    await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    const error = new Error(
      "Email or password is incorrect."
    );
    error.status = 401;
    throw error;
  }

  return createSessionTokens(user);
}

function createGitHubAuthorizationUrl(state) {
  const { clientId, redirectUri } = getGitHubOAuthConfig();

  const url = new URL(
    "https://github.com/login/oauth/authorize"
  );

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", GITHUB_SCOPE);
  url.searchParams.set("state", state);

  return url.toString();
}

async function getGitHubProfile(accessToken) {
  const profileResponse = await fetch(
    "https://api.github.com/user",
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!profileResponse.ok) {
    const error = new Error("GitHub could not verify the signed-in account. Try GitHub sign-in again.");
    error.status = 502;
    throw error;
  }

  const profile = await profileResponse.json();

  let email = profile.email;

  if (!email) {
    const emailResponse = await fetch(
      "https://api.github.com/user/emails",
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const emails = emailResponse.ok
      ? await emailResponse.json()
      : [];

    email =
      emails.find(
        (item) => item.primary && item.verified
      )?.email ||
      emails.find((item) => item.verified)?.email;
  }

  return {
    id: String(profile.id),
    login: profile.login,
    name: profile.name || profile.login,
    email:
      email ||
      `github-${profile.id}@users.noreply.github.com`,
  };
}

async function loginWithGitHubCode(code) {
  const {
    clientId,
    clientSecret,
    redirectUri,
  } = getGitHubOAuthConfig();

  const tokenResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    }
  );

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || !tokenData.access_token) {
    const error = new Error(
      "GitHub could not exchange the sign-in code. Start GitHub sign-in again."
    );
    error.status = 502;
    throw error;
  }

  const profile = await getGitHubProfile(
    tokenData.access_token
  );

  let user = await prisma.user.findUnique({
    where: { githubId: profile.id },
  });

  if (!user) {
    user = await prisma.user.findUnique({
      where: { email: profile.email.toLowerCase() },
    });
  }

  if (user?.githubId && user.githubId !== profile.id) {
    const error = new Error(
      "This email account is already linked to a different GitHub account. Sign in using the originally linked GitHub account or use email/password login."
    );
    error.status = 409;
    throw error;
  }

  const connectionData = {
    githubId: profile.id,
    githubLogin: profile.login,
    githubTokenEncrypted: encryptGitHubToken(
      tokenData.access_token
    ),
    githubTokenScopes: tokenData.scope || "",
    name: profile.name,
  };

  user = user
    ? await prisma.user.update({
        where: { id: user.id },
        data: connectionData,
      })
    : await prisma.user.create({
        data: {
          ...connectionData,
          email: profile.email.toLowerCase(),
        },
      });

  return createSessionTokens(user);
}

async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return user ? publicUser(user) : null;
}

async function connectGitHubToken(userId, token) {
  const profile = await getGitHubProfile(token);

  const existingConnection =
    await prisma.user.findUnique({
      where: { githubId: String(profile.id) },
    });

  if (
    existingConnection &&
    existingConnection.id !== userId
  ) {
    const error = new Error(
      "This GitHub account is already connected to another ReviewFlow account."
    );
    error.status = 409;
    throw error;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      githubId: String(profile.id),
      githubLogin: profile.login,
      githubTokenEncrypted: encryptGitHubToken(token),
      githubTokenScopes: "manual-token",
    },
  });

  return publicUser(user);
}

module.exports = {
  createGitHubAuthorizationUrl,
  getClientOrigin,
  getJwtSecret,
  getUserById,
  login,
  loginWithGitHubCode,
  register,
  getGitHubAccessToken,
  connectGitHubToken,
  REFRESH_COOKIE_NAME,
  createSessionTokens,
  rotateRefreshToken,
  revokeRefreshToken,
};
