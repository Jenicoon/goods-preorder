const { getAllowedOrigins, getShopAccessPassword } = require("../../lib/config");
const { handleCors, readJsonBody, sendError, sendJson } = require("../../lib/http");

module.exports = function handler(req, res) {
  if (handleCors(req, res, getAllowedOrigins())) {
    return;
  }

  if (req.method !== "POST") {
    sendError(res, 405, "POST 요청만 허용됩니다.", "METHOD_NOT_ALLOWED");
    return;
  }

  const { password } = readJsonBody(req);

  if (!password || password !== getShopAccessPassword()) {
    sendError(res, 401, "판매 페이지 입장 비밀번호가 올바르지 않습니다.", "INVALID_PASSWORD");
    return;
  }

  sendJson(res, 200, {
    success: true
  });
};
