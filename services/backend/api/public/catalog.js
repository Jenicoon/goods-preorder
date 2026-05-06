const { getAllowedOrigins } = require("../../lib/config");
const { handleCors, sendJson } = require("../../lib/http");
const { getProducts } = require("../../lib/store");

module.exports = async function handler(req, res) {
  if (handleCors(req, res, getAllowedOrigins())) {
    return;
  }

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

  const products = await getProducts();
  sendJson(res, 200, {
    success: true,
    products: products
  });
};
