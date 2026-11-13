const crypto = require("crypto");
const {
  createRemoteJWKSet,
  jwtVerify,
} = require("jose");

const cognito = require("../config/cognito");

// Cognito public signing keys
const JWKS = createRemoteJWKSet(
  new URL(cognito.jwksUrl)
);

// Generate cryptographically secure random values
function randomString() {
  return crypto.randomBytes(32).toString("hex");
}

// PKCE SHA256 challenge
function createCodeChallenge(verifier) {
  return crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
}

// Save the session before redirecting
function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Verify Cognito ID token
async function verifyIdToken(idToken, expectedNonce) {
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: cognito.issuer,
    audience: cognito.clientId,
  });

  if (payload.token_use !== "id") {
    throw new Error("Invalid token type");
  }

  if (payload.nonce !== expectedNonce) {
    throw new Error("Invalid nonce");
  }

  return payload;
}

// Exchange authorization code for tokens
async function exchangeCodeForTokens(code, codeVerifier) {
  const credentials = Buffer.from(
    `${cognito.clientId}:${cognito.clientSecret}`
  ).toString("base64");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: cognito.clientId,
    code,
    redirect_uri: cognito.callbackUrl,
    code_verifier: codeVerifier,
  });

  const response = await fetch(cognito.tokenUrl, {
    method: "POST",

    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },

    body,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Cognito token exchange failed:", data);
    throw new Error("Unable to exchange authorization code");
  }

  return data;
}

// 1. Initiate login
exports.login = async (req, res, next) => {
  try {
    const state = randomString();
    const nonce = randomString();
    const codeVerifier = randomString();

    const codeChallenge = createCodeChallenge(codeVerifier);

    req.session.oauth = {
      state,
      nonce,
      codeVerifier,
    };

    await saveSession(req);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: cognito.clientId,
      redirect_uri: cognito.callbackUrl,
      scope: "openid email profile",
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    res.redirect(
      `${cognito.authorizationUrl}?${params.toString()}`
    );

  } catch (error) {
    next(error);
  }
};

// 2. Cognito redirects here after login
exports.callback = async (req, res, next) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=authentication_failed`
      );
    }

    const oauth = req.session.oauth;

    if (
      !code ||
      !state ||
      !oauth ||
      state !== oauth.state
    ) {
      return res.status(400).send("Invalid OAuth state or callback");
    }

    // Exchange authorization code
    const tokens = await exchangeCodeForTokens(
      code,
      oauth.codeVerifier
    );

    // Validate ID token
    const user = await verifyIdToken(
      tokens.id_token,
      oauth.nonce
    );

    // Regenerate session to prevent session fixation
    await new Promise((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Save authenticated user and tokens in server-side session
    req.session.user = {
      sub: user.sub,
      email: user.email,
      emailVerified: user.email_verified,
      name: user.name || user.email,
    };

    req.session.tokens = {
      accessToken: tokens.access_token,
      idToken: tokens.id_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
    };

    await saveSession(req);

    // Redirect to React dashboard
    res.redirect(
      `${process.env.CLIENT_URL}/dashboard`
    );

  } catch (error) {
    console.error("OAuth callback error:", error.message);

    next(error);
  }
};

// 3. Return authenticated user
exports.me = (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
      authenticated: false,
      message: "Not authenticated",
    });
  }

  res.json({
    authenticated: true,
    user: req.session.user,
  });
};

// 4. Logout
exports.logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }

    res.clearCookie("ri.sid", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.COOKIE_SAME_SITE || "lax",
    });

    const params = new URLSearchParams({
      client_id: cognito.clientId,
      logout_uri: `${process.env.CLIENT_URL}/`,
    });

    res.redirect(
      `${cognito.logoutUrl}?${params.toString()}`
    );
  });
};