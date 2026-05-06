const { getAllowedOrigins } = require("../../lib/config");
const { handleCors, readJsonBody, sendError, sendJson } = require("../../lib/http");
const { matchesAdminPassword } = require("../../lib/passwords");
const { attachSessionCookie } = require("../../lib/session");

module.exports = function handler(req, res) {
  if (handleCors(req, res, getAllowedOrigins())) {
    return;
  }

  if (req.method !== "POST") {
    sendError(res, 405, "POST 요청만 허용됩니다.", "METHOD_NOT_ALLOWED");
    return;
  }

  const { password } = readJsonBody(req);

  if (!matchesAdminPassword(password)) {
    sendError(res, 401, "관리자 비밀번호가 올바르지 않습니다.", "INVALID_PASSWORD");
    return;
  }

  const session = attachSessionCookie(res, "admin");

  sendJson(res, 200, {
    success: true,
    role: session.role,
    expiresAt: session.expiresAt
  });
};
