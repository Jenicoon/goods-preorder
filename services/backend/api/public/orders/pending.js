const { getAllowedOrigins } = require("../../../lib/config");
const { handleCors, readJsonBody, sendError, sendJson } = require("../../../lib/http");
const { createPendingOrder } = require("../../../lib/store");

module.exports = async function handler(req, res) {
  if (handleCors(req, res, getAllowedOrigins())) {
    return;
  }

  if (req.method !== "POST") {
    sendError(res, 405, "POST 요청만 허용됩니다.", "METHOD_NOT_ALLOWED");
    return;
  }

  try {
    const body = readJsonBody(req);
    const result = await createPendingOrder(body);
    sendJson(res, 200, {
      success: true,
      pendingOrder: result.pendingOrder,
      products: result.products
    });
  } catch (error) {
    sendError(res, 400, error.message, "CREATE_PENDING_ORDER_FAILED");
  }
};
