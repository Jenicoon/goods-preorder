function required(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function optional(name, fallback = "") {
  return process.env[name] || fallback;
}

function getPublicOrigin() {
  return optional("PUBLIC_APP_ORIGIN");
}

function getAdminConsoleOrigin() {
  return optional("ADMIN_CONSOLE_ORIGIN");
}

function getAllowedOrigins() {
  return [
    getPublicOrigin(),
    getAdminConsoleOrigin()
  ].filter(Boolean);
}

function getCookieDomain() {
  return optional("COOKIE_DOMAIN");
}

function getSessionSecret() {
  return required("ADMIN_SESSION_SECRET");
}

function getAdminPassword() {
  return required("ADMIN_ACCESS_PASSWORD");
}

function getSuperAdminPassword() {
  return required("SUPER_ADMIN_ACCESS_PASSWORD");
}

function getShopAccessPassword() {
  return optional("SHOP_ACCESS_PASSWORD");
}

module.exports = {
  getAdminConsoleOrigin,
  getAdminPassword,
  getAllowedOrigins,
  getCookieDomain,
  getPublicOrigin,
  getSessionSecret,
  getShopAccessPassword,
  getSuperAdminPassword,
  required
};
