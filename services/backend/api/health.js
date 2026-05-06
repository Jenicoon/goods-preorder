const { getPublicOrigin } = require("../lib/config");
const { handleCors, sendJson } = require("../lib/http");

module.exports = function handler(req, res) {
  if (handleCors(req, res, getPublicOrigin())) {
    return;
  }

  sendJson(res, 200, {
    success: true,
    service: "goods-backend",
    timestamp: new Date().toISOString()
  });
};
