// Password hashing + JWT token helpers.
"use strict";
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("./config");

function hashPassword(pw) {
  return bcrypt.hashSync(pw, 10);
}

function verifyPassword(pw, hashed) {
  return bcrypt.compareSync(pw, hashed);
}

function createAccessToken(userId, email, role) {
  return jwt.sign(
    { sub: userId, email, role, type: "access" },
    config.JWT_SECRET,
    { algorithm: config.JWT_ALGORITHM, expiresIn: config.ACCESS_TTL_SECONDS },
  );
}

function createRefreshToken(userId) {
  return jwt.sign(
    { sub: userId, type: "refresh" },
    config.JWT_SECRET,
    { algorithm: config.JWT_ALGORITHM, expiresIn: config.REFRESH_TTL_SECONDS },
  );
}

function decodeToken(token) {
  return jwt.verify(token, config.JWT_SECRET, { algorithms: [config.JWT_ALGORITHM] });
}

function setAuthCookies(res, access, refresh) {
  const sameSite = config.COOKIE_SECURE ? "none" : "lax";
  res.cookie("access_token", access, {
    httpOnly: true, secure: config.COOKIE_SECURE, sameSite,
    maxAge: config.ACCESS_TTL_SECONDS * 1000, path: "/",
  });
  res.cookie("refresh_token", refresh, {
    httpOnly: true, secure: config.COOKIE_SECURE, sameSite,
    maxAge: config.REFRESH_TTL_SECONDS * 1000, path: "/",
  });
}

function clearAuthCookies(res) {
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/" });
}

module.exports = {
  hashPassword, verifyPassword,
  createAccessToken, createRefreshToken, decodeToken,
  setAuthCookies, clearAuthCookies,
};
