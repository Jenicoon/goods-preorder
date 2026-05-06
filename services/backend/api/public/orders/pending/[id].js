const { getAllowedOrigins } = require("../../../../lib/config");
const { handleCors, sendError, sendJson } = require("../../../../lib/http");
const { deletePendingOrder } = require("../../../../lib/store");

module.exports = async function handler(req, res) {
  if (handleCors(req, res, getAllowedOrigins())) {
    return;
  }

  if (req.method !== "DELETE") {
    sendError(res, 405, "DELETE 요청만 허용됩니다.", "METHOD_NOT_ALLOWED");
    return;
  }

  try {
    const result = await deletePendingOrder(req.query.id);
    sendJson(res, 200, {
      success: true,
      products: result.products
    });
  } catch (error) {
    sendError(res, 400, error.message, "DELETE_PENDING_ORDER_FAILED");
  }
};
