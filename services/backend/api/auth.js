const { getAllowedOrigins, getShopAccessPassword } = require("../lib/config");
const { handleCors, readJsonBody, sendError, sendJson } = require("../lib/http");
const { matchesAdminPassword, matchesSuperAdminPassword } = require("../lib/passwords");
const { attachSessionCookie, clearSessionCookie, requireRole } = require("../lib/session");

module.exports = async function handler(req, res) {
  if (handleCors(req, res, getAllowedOrigins())) {
    return;
  }

  const action = req.query && req.query.action;

  if (action === "shop-access") {
    if (req.method !== "POST") {
      sendError(res, 405, "POST 요청만 허용됩니다.", "METHOD_NOT_ALLOWED");
      return;
    }

    const body = readJsonBody(req);
    if (!body.password || body.password !== getShopAccessPassword()) {
      sendError(res, 401, "판매 페이지 입장 비밀번호가 올바르지 않습니다.", "INVALID_PASSWORD");
      return;
    }

    sendJson(res, 200, { success: true });
    return;
  }

  if (action === "admin-login") {
    if (req.method !== "POST") {
      sendError(res, 405, "POST 요청만 허용됩니다.", "METHOD_NOT_ALLOWED");
      return;
    }

    const body = readJsonBody(req);
    if (!matchesAdminPassword(body.password)) {
      sendError(res, 401, "관리자 비밀번호가 올바르지 않습니다.", "INVALID_PASSWORD");
      return;
    }

    const session = attachSessionCookie(res, "admin");
    sendJson(res, 200, {
      success: true,
      role: session.role,
      expiresAt: session.expiresAt
    });
    return;
  }

  if (action === "super-admin-login") {
    if (req.method !== "POST") {
      sendError(res, 405, "POST 요청만 허용됩니다.", "METHOD_NOT_ALLOWED");
      return;
    }

    const body = readJsonBody(req);
    if (!matchesSuperAdminPassword(body.password)) {
      sendError(res, 401, "슈퍼 관리자 비밀번호가 올바르지 않습니다.", "INVALID_PASSWORD");
      return;
    }

    const session = attachSessionCookie(res, "super_admin");
    sendJson(res, 200, {
      success: true,
      role: session.role,
      expiresAt: session.expiresAt
    });
    return;
  }

  if (action === "admin-session") {
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
    return;
  }

  if (action === "logout") {
    if (req.method !== "POST") {
      sendError(res, 405, "POST 요청만 허용됩니다.", "METHOD_NOT_ALLOWED");
      return;
    }

    clearSessionCookie(res);
    sendJson(res, 200, { success: true });
    return;
  }

  sendError(res, 404, "요청한 인증 경로를 찾을 수 없습니다.", "NOT_FOUND");
};
