const {
  verifyAccessToken,
  signAccessToken,
  hashToken,
} = require("../utils/jwt");
const { findRefreshTokenByHash } = require("../models/refresh_tokensModels");
require("dotenv").config();
const jwt = require("jsonwebtoken");

async function requireAuth(req, res, next) {
  let token = (req.header("authorization") || "").replace("Bearer ", "");

  if (!token) return res.status(401).json({ message: "No access token" });

  try {
    // ตรวจสอบ access token
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    return next();
  } catch (err) {
    // ถ้า access token หมดอายุ
    if (err.name === "TokenExpiredError") {
      const refreshToken = req.body.refreshToken;
      if (!refreshToken)
        return res
          .status(401)
          .json({ message: "Access token expired. Refresh token required." });

      // hash refresh token แล้วหาใน DB
      const refreshHash = hashToken(refreshToken);
      const tokenRow = await findRefreshTokenByHash(refreshHash);
      if (!tokenRow || tokenRow.revoked_at)
        return res.status(401).json({ message: "Invalid refresh token" });

      // สร้าง access token ใหม่
      const newAccessToken = signAccessToken(
        { sub: tokenRow.user_id, role: "user" },
        "1h"
      );
      req.user = { sub: tokenRow.user_id, role: "user" };

      // ส่ง access token ใหม่ใน header
      res.setHeader("x-access-token", newAccessToken);
      return next();
    } else {
      return res.status(401).json({ message: "Invalid token" });
    }
  }
}
function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // แยก Bearer ออกมา

  if (!token) return res.status(401).json({ message: "token required" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "invalid token" });
    req.user = user;
    next();
  });
}

function requireAut111(req, res, next) {
   try {
    const token = (req.header("authorization") || "").replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "Token required" });

    const decoded = verifyAccessToken(token);
    if (!decoded.sub) return res.status(401).json({ message: "Invalid token payload" });

    req.user = {
      id: decoded.sub,  // ใช้ sub เป็น id
      role: decoded.role || "user",
    };

    next();
  } catch (err) {
    console.error("requireAuth error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
}



module.exports = { requireAuth, authMiddleware, requireAut111 };
