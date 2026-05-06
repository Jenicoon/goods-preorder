const { getAllowedOrigins } = require("../lib/config");
const { handleCors, readJsonBody, sendError, sendJson } = require("../lib/http");
const { requireRole } = require("../lib/session");
const { getDashboardData, updateOrderStatus } = require("../lib/store");

module.exports = async function handler(req, res) {
  if (handleCors(req, res, getAllowedOrigins())) {
    return;
  }

  const access = requireRole(req, ["admin", "super_admin"]);
  if (!access.ok) {
    sendError(res, 401, "로그인이 필요합니다.", access.reason);
    return;
  }

  const action = req.query && req.query.action;

  try {
    if (action === "dashboard") {
      if (req.method !== "GET") {
        sendError(res, 405, "GET 요청만 허용됩니다.", "METHOD_NOT_ALLOWED");
        return;
      }

      const dashboard = await getDashboardData();
      sendJson(res, 200, {
        success: true,
        products: dashboard.products,
        pendingOrders: dashboard.pendingOrders,
        orders: dashboard.orders,
        deletedOrders: dashboard.deletedOrders
      });
      return;
    }

    if (action === "update-status") {
      if (req.method !== "PATCH") {
        sendError(res, 405, "PATCH 요청만 허용됩니다.", "METHOD_NOT_ALLOWED");
        return;
      }

      const body = readJsonBody(req);
      const order = await updateOrderStatus(req.query.id, body.status);
      sendJson(res, 200, {
        success: true,
        order: order
      });
      return;
    }
  } catch (error) {
    sendError(res, 400, error.message, "ADMIN_ROUTE_FAILED");
    return;
  }

  sendError(res, 404, "요청한 관리자 API 경로를 찾을 수 없습니다.", "NOT_FOUND");
};
