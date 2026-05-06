const { getAllowedOrigins } = require("../lib/config");
const { handleCors, sendJson } = require("../lib/http");

module.exports = function handler(req, res) {
  if (handleCors(req, res, getAllowedOrigins())) {
    return;
  }

  sendJson(res, 200, {
    success: true,
    service: "goods-backend",
    timestamp: new Date().toISOString()
  });
};
