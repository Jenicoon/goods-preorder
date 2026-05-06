const { getAllowedOrigins } = require("../lib/config");
const { handleCors, sendJson } = require("../lib/http");
const { getProducts } = require("../lib/store");

module.exports = async function handler(req, res) {
  if (handleCors(req, res, getAllowedOrigins())) {
    return;
  }

  if (req.query && req.query.route === "products") {
    if (req.method !== "GET") {
      res.status(405).json({
        success: false,
        error: {
          code: "METHOD_NOT_ALLOWED",
          message: "GET 요청만 허용됩니다."
        }
      });
      return;
    }

    try {
      const products = await getProducts();
      sendJson(res, 200, {
        success: true,
        products: products
      });
    } catch (error) {
      sendJson(res, 500, {
        success: false,
        error: {
          code: "PRODUCTS_ROUTE_FAILED",
          message: error.message
        }
      });
    }
    return;
  }

  sendJson(res, 200, {
    success: true,
    service: "goods-backend",
    timestamp: new Date().toISOString()
  });
};
