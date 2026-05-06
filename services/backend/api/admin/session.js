const { getAllowedOrigins } = require("../../lib/config");
const { handleCors, sendError, sendJson } = require("../../lib/http");
const { requireRole } = require("../../lib/session");

module.exports = function handler(req, res) {
  if (handleCors(req, res, getAllowedOrigins())) {
    return;
  }

  if (req.method !== "GET") {
    sendError(res, 405, "GET 요청만 허용됩니다.", "METHOD_NOT_ALLOWED");
    return;
  }

  const access = requireRole(req, ["admin", "super_admin"]);

  if (!access.ok) {
    sendError(res, 401, "로그인이 필요합니다.", access.reason);
    return;
  }

  sendJson(res, 200, {
    success: true,
    role: access.session.role,
    expiresAt: access.session.expiresAt
  });
};
