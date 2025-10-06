// utils/jwt.js
const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET || "secret";
const expiresIn = process.env.JWT_EXPIRES_IN || "1h";
const crypto = require("crypto");
require("dotenv").config();

function signAccessToken(payload, expiresIn = "1") {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function generationRefreshToken() {
  return crypto.randomBytes(48).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function verifyAccessTokenMiddleware(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ message: "Authorization header missing" });
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // แนบข้อมูล user (sub, role ฯลฯ) ไปใน req
    next();
  } catch (err) {
    console.error("JWT verify error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  generationRefreshToken,
  hashToken,
  verifyAccessTokenMiddleware,
};
