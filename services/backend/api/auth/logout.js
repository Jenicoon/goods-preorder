const { getAllowedOrigins } = require("../../lib/config");
const { handleCors, sendJson } = require("../../lib/http");
const { clearSessionCookie } = require("../../lib/session");

module.exports = function handler(req, res) {
  if (handleCors(req, res, getAllowedOrigins())) {
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({
      success: false,
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "POST 요청만 허용됩니다."
      }
    });
    return;
  }

  clearSessionCookie(res);

  sendJson(res, 200, {
    success: true
  });
};
