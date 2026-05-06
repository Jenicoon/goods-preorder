const DEFAULT_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

function sendJson(res, statusCode, payload, extraHeaders = {}) {
  const headers = { ...DEFAULT_HEADERS, ...extraHeaders };

  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  res.status(statusCode).json(payload);
}

function sendError(res, statusCode, message, code = "REQUEST_FAILED") {
  sendJson(res, statusCode, {
    success: false,
    error: {
      code,
      message
    }
  });
}

function readJsonBody(req) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      return {};
    }
  }

  return req.body || {};
}

function handleCors(req, res, allowedOrigins) {
  const origin = req.headers.origin;
  const normalizedOrigins = Array.isArray(allowedOrigins)
    ? allowedOrigins.filter(Boolean)
    : [allowedOrigins].filter(Boolean);

  if (!normalizedOrigins.length && !origin) {
    return false;
  }

  // For browser requests, prefer reflecting the actual Origin so separate
  // Vercel projects can communicate without brittle exact-domain matching.
  const matchedOrigin = origin || normalizedOrigins[0];

  res.setHeader("Access-Control-Allow-Origin", matchedOrigin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }

  return false;
}

module.exports = {
  handleCors,
  readJsonBody,
  sendError,
  sendJson
};
