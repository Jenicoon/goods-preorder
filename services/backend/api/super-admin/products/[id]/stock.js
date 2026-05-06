const { getAllowedOrigins } = require("../../../../lib/config");
const { handleCors, readJsonBody, sendError, sendJson } = require("../../../../lib/http");
const { requireRole } = require("../../../../lib/session");
const { setProductStock } = require("../../../../lib/store");

module.exports = async function handler(req, res) {
  if (handleCors(req, res, getAllowedOrigins())) {
    return;
  }

  if (req.method !== "PATCH") {
    sendError(res, 405, "PATCH 요청만 허용됩니다.", "METHOD_NOT_ALLOWED");
    return;
  }

  const access = requireRole(req, ["super_admin"]);
  if (!access.ok) {
    sendError(res, 401, "슈퍼 관리자 권한이 필요합니다.", access.reason);
    return;
  }

  try {
    const body = readJsonBody(req);
    const product = await setProductStock(req.query.id, body.size, body.remainingStock);
    sendJson(res, 200, {
      success: true,
      product: product
    });
  } catch (error) {
    sendError(res, 400, error.message, "SET_PRODUCT_STOCK_FAILED");
  }
};
