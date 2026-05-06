const {
  getAdminPassword,
  getSuperAdminPassword
} = require("./config");

function matchesAdminPassword(password) {
  return typeof password === "string" && password === getAdminPassword();
}

function matchesSuperAdminPassword(password) {
  return typeof password === "string" && password === getSuperAdminPassword();
}

module.exports = {
  matchesAdminPassword,
  matchesSuperAdminPassword
};
