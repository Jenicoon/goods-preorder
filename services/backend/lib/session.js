const crypto = require("crypto");
const {
  getCookieDomain,
  getSessionSecret
} = require("./config");

const COOKIE_NAME = "goods_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

function toBase64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, "base64").toString("utf8");
}

function sign(value) {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(value)
    .digest("hex");
}

function createSessionValue(role) {
  const payload = {
    role,
    issuedAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function verifySessionValue(cookieValue) {
  if (!cookieValue || !cookieValue.includes(".")) {
    return null;
  }

  const [encodedPayload, signature] = cookieValue.split(".");
  const expectedSignature = sign(encodedPayload);

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload));

    if (!payload.expiresAt || payload.expiresAt < Date.now()) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

function parseCookies(req) {
  const cookieHeader = req.headers.cookie || "";

  return cookieHeader.split(";").reduce((accumulator, chunk) => {
    const [rawName, ...rawValue] = chunk.trim().split("=");

    if (!rawName) {
      return accumulator;
    }

    accumulator[rawName] = decodeURIComponent(rawValue.join("="));
    return accumulator;
  }, {});
}

function buildCookie(value, expiresAt) {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Expires=${new Date(expiresAt).toUTCString()}`
  ];

  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }

  const cookieDomain = getCookieDomain();

  if (cookieDomain) {
    parts.push(`Domain=${cookieDomain}`);
  }

  return parts.join("; ");
}

function attachSessionCookie(res, role) {
  const sessionValue = createSessionValue(role);
  const payload = verifySessionValue(sessionValue);

  res.setHeader("Set-Cookie", buildCookie(sessionValue, payload.expiresAt));

  return payload;
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", buildCookie("", 0));
}

function getSessionFromRequest(req) {
  const cookies = parseCookies(req);
  return verifySessionValue(cookies[COOKIE_NAME]);
}

function requireRole(req, allowedRoles) {
  const session = getSessionFromRequest(req);

  if (!session) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }

  if (!allowedRoles.includes(session.role)) {
    return { ok: false, reason: "FORBIDDEN", session };
  }

  return { ok: true, session };
}

module.exports = {
  attachSessionCookie,
  clearSessionCookie,
  getSessionFromRequest,
  requireRole
};
