const { getAllowedOrigins } = require("../../../lib/config");
const { handleCors, sendError, sendJson } = require("../../../lib/http");
const { requireRole } = require("../../../lib/session");
const { deleteOrder } = require("../../../lib/store");

module.exports = async function handler(req, res) {
  if (handleCors(req, res, getAllowedOrigins())) {
    return;
  }

  if (req.method !== "DELETE") {
    sendError(res, 405, "DELETE 요청만 허용됩니다.", "METHOD_NOT_ALLOWED");
    return;
  }

  const access = requireRole(req, ["super_admin"]);
  if (!access.ok) {
    sendError(res, 401, "슈퍼 관리자 권한이 필요합니다.", access.reason);
    return;
  }

  try {
    await deleteOrder(req.query.id);
    sendJson(res, 200, {
      success: true
    });
  } catch (error) {
    sendError(res, 400, error.message, "DELETE_ORDER_FAILED");
  }
};
