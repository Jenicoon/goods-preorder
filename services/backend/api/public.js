const { getAllowedOrigins } = require("../lib/config");
const { handleCors, readJsonBody, sendError, sendJson } = require("../lib/http");
const { confirmPendingOrder, createPendingOrder, deletePendingOrder, getProducts } = require("../lib/store");

module.exports = async function handler(req, res) {
  if (handleCors(req, res, getAllowedOrigins())) {
    return;
  }

  const action = req.query && req.query.action;

  try {
    if (action === "products") {
      if (req.method !== "GET") {
        sendError(res, 405, "GET 요청만 허용됩니다.", "METHOD_NOT_ALLOWED");
        return;
      }

      const products = await getProducts();
      sendJson(res, 200, {
        success: true,
        products: products
      });
      return;
    }

    if (action === "create-pending") {
      if (req.method !== "POST") {
        sendError(res, 405, "POST 요청만 허용됩니다.", "METHOD_NOT_ALLOWED");
        return;
      }

      const result = await createPendingOrder(readJsonBody(req));
      sendJson(res, 200, {
        success: true,
        pendingOrder: result.pendingOrder,
        products: result.products
      });
      return;
    }

    if (action === "confirm-pending") {
      if (req.method !== "POST") {
        sendError(res, 405, "POST 요청만 허용됩니다.", "METHOD_NOT_ALLOWED");
        return;
      }

      const body = readJsonBody(req);
      const result = await confirmPendingOrder(body.pendingOrderId, body.adminCode);
      sendJson(res, 200, {
        success: true,
        order: result.order,
        products: result.products
      });
      return;
    }

    if (action === "delete-pending") {
      if (req.method !== "DELETE") {
        sendError(res, 405, "DELETE 요청만 허용됩니다.", "METHOD_NOT_ALLOWED");
        return;
      }

      const result = await deletePendingOrder(req.query.id);
      sendJson(res, 200, {
        success: true,
        products: result.products
      });
      return;
    }
  } catch (error) {
    sendError(res, 400, error.message, "PUBLIC_ROUTE_FAILED");
    return;
  }

  sendError(res, 404, "요청한 공개 API 경로를 찾을 수 없습니다.", "NOT_FOUND");
};
