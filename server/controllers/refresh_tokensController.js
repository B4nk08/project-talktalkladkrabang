const jwt = require("jsonwebtoken");
const { hashToken } = require("../utils/jwt");
const pool = require("../config/db");

const bcrypt = require("bcrypt");
const { createretokentable } = require("../models/refresh_tokensModels");
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

async function createretokentableHandel(req, res) {
  try {
    await createretokentable();
    res.json({ message: "createtable success" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function refreshAccessToken(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    // hash token ที่ client ส่งมา
    const tokenHash = hashToken(refreshToken);

    // หา refresh token ใน DB
    const [rows] = await pool.execute(
      "SELECT * FROM refresh_tokens WHERE token_hash = ?",
      [tokenHash]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const tokenRecord = rows[0];

    // เช็คหมดอายุ
    if (new Date(tokenRecord.expires_at) < new Date()) {
      return res.status(401).json({ message: "Refresh token expired" });
    }

    // เช็ค revoke
    if (tokenRecord.revoked_at) {
      return res.status(401).json({ message: "Refresh token revoked" });
    }

    // -------- ออก accessToken ใหม่ --------
    const accessToken = jwt.sign({ userId: tokenRecord.user_id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // -------- ทำ refreshToken ใหม่ (rotate) --------
    const newRefreshToken = require("crypto").randomBytes(64).toString("hex");
    const newTokenHash = hashToken(newRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // refreshToken อยู่ได้ 7 วัน

    // revoke refresh token เก่า
    await pool.execute(
      "UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ?",
      [tokenRecord.id]
    );

    // insert refresh token ใหม่
    await pool.execute(
      `INSERT INTO refresh_tokens (user_id, token_hash, user_agent, ip_address, expires_at, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        tokenRecord.user_id,
        newTokenHash,
        req.headers["user-agent"] || null,
        req.ip || null,
        expiresAt,
      ]
    );

    // ส่งกลับทั้งคู่
    return res.json({
      accessToken,
      refreshToken: newRefreshToken, // ส่ง plain token กลับให้ client
    });
  } catch (err) {
    console.error("Error refreshing token:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { createretokentableHandel, refreshAccessToken };
