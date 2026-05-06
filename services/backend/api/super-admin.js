const { getAllowedOrigins } = require("../lib/config");
const { handleCors, readJsonBody, sendError, sendJson } = require("../lib/http");
const { requireRole } = require("../lib/session");
const {
  deleteOrder,
  deletePendingOrder,
  resetAllData,
  resetInventory,
  resetOrders,
  resetProducts,
  restoreDeletedOrder,
  setProductStock,
  updateAuthSettings
} = require("../lib/store");

module.exports = async function handler(req, res) {
  if (handleCors(req, res, getAllowedOrigins())) {
    return;
  }

  const access = requireRole(req, ["super_admin"]);
  if (!access.ok) {
    sendError(res, 401, "슈퍼 관리자 권한이 필요합니다.", access.reason);
    return;
  }

  const action = req.query && req.query.action;

  try {
    if (action === "delete-order") {
      if (req.method !== "DELETE") {
        sendError(res, 405, "DELETE 요청만 허용됩니다.", "METHOD_NOT_ALLOWED");
        return;
      }

      await deleteOrder(req.query.id);
      sendJson(res, 200, { success: true });
      return;
    }

    if (action === "restore-order") {
      if (req.method !== "POST") {
        sendError(res, 405, "POST 요청만 허용됩니다.", "METHOD_NOT_ALLOWED");
        return;
      }

      await restoreDeletedOrder(req.query.id);
      sendJson(res, 200, { success: true });
      return;
    }

    if (action === "delete-pending") {
      if (req.method !== "DELETE") {
        sendError(res, 405, "DELETE 요청만 허용됩니다.", "METHOD_NOT_ALLOWED");
        return;
      }

      await deletePendingOrder(req.query.id);
      sendJson(res, 200, { success: true });
      return;
    }

    if (action === "set-stock") {
      if (req.method !== "PATCH") {
        sendError(res, 405, "PATCH 요청만 허용됩니다.", "METHOD_NOT_ALLOWED");
        return;
      }

      const body = readJsonBody(req);
      const product = await setProductStock(req.query.id, body.size, body.remainingStock);
      sendJson(res, 200, {
        success: true,
        product: product
      });
      return;
    }

    if (action === "update-passwords") {
      if (req.method !== "PATCH") {
        sendError(res, 405, "PATCH ?붿껌留??덉슜?⑸땲??", "METHOD_NOT_ALLOWED");
        return;
      }

      const body = readJsonBody(req);
      const authSettings = await updateAuthSettings({
        adminPassword: body.adminPassword,
        superAdminPassword: body.superAdminPassword,
        shopAccessPassword: body.shopAccessPassword
      });

      sendJson(res, 200, {
        success: true,
        authSettings: authSettings
      });
      return;
    }

    if (action === "reset-orders") {
      if (req.method !== "POST") {
        sendError(res, 405, "POST 요청만 허용됩니다.", "METHOD_NOT_ALLOWED");
        return;
      }

      await resetOrders();
      sendJson(res, 200, { success: true });
      return;
    }

    if (action === "reset-inventory") {
      if (req.method !== "POST") {
        sendError(res, 405, "POST 요청만 허용됩니다.", "METHOD_NOT_ALLOWED");
        return;
      }

      const products = await resetInventory();
      sendJson(res, 200, {
        success: true,
        products: products
      });
      return;
    }

    if (action === "reset-products") {
      if (req.method !== "POST") {
        sendError(res, 405, "POST 요청만 허용됩니다.", "METHOD_NOT_ALLOWED");
        return;
      }

      const products = await resetProducts();
      sendJson(res, 200, {
        success: true,
        products: products
      });
      return;
    }

    if (action === "reset-all-data") {
      if (req.method !== "POST") {
        sendError(res, 405, "POST 요청만 허용됩니다.", "METHOD_NOT_ALLOWED");
        return;
      }

      await resetAllData();
      sendJson(res, 200, { success: true });
      return;
    }
  } catch (error) {
    sendError(res, 400, error.message, "SUPER_ADMIN_ROUTE_FAILED");
    return;
  }

  sendError(res, 404, "요청한 슈퍼 관리자 API 경로를 찾을 수 없습니다.", "NOT_FOUND");
};
