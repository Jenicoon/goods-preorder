const { getAllowedOrigins } = require("../../lib/config");
const { handleCors, sendError, sendJson } = require("../../lib/http");
const { requireRole } = require("../../lib/session");
const { resetOrders } = require("../../lib/store");

module.exports = async function handler(req, res) {
  if (handleCors(req, res, getAllowedOrigins())) {
    return;
  }

  if (req.method !== "POST") {
    sendError(res, 405, "POST 요청만 허용됩니다.", "METHOD_NOT_ALLOWED");
    return;
  }

  const access = requireRole(req, ["super_admin"]);
  if (!access.ok) {
    sendError(res, 401, "슈퍼 관리자 권한이 필요합니다.", access.reason);
    return;
  }

  await resetOrders();
  sendJson(res, 200, {
    success: true
  });
};
