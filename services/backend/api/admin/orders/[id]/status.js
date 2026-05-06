const { getAllowedOrigins } = require("../../../../lib/config");
const { handleCors, readJsonBody, sendError, sendJson } = require("../../../../lib/http");
const { requireRole } = require("../../../../lib/session");
const { updateOrderStatus } = require("../../../../lib/store");

module.exports = async function handler(req, res) {
  if (handleCors(req, res, getAllowedOrigins())) {
    return;
  }

  if (req.method !== "PATCH") {
    sendError(res, 405, "PATCH 요청만 허용됩니다.", "METHOD_NOT_ALLOWED");
    return;
  }

  const access = requireRole(req, ["admin", "super_admin"]);
  if (!access.ok) {
    sendError(res, 401, "로그인이 필요합니다.", access.reason);
    return;
  }

  try {
    const body = readJsonBody(req);
    const order = await updateOrderStatus(req.query.id, body.status);
    sendJson(res, 200, {
      success: true,
      order: order
    });
  } catch (error) {
    sendError(res, 400, error.message, "UPDATE_ORDER_STATUS_FAILED");
  }
};
