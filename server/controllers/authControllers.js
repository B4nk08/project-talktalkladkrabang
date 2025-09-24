const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const usersModels = require("../models/usersModels");
const otpModels = require("../models/otpModels");
const {
  signAccessToken,
  verifyAccessToken,
  generationRefreshToken,
  hashToken,
} = require("../utils/jwt");
const { sendMail } = require("../utils/mailer");
const { createRefreshToken } = require("../models/refresh_tokensModels");

require("dotenv").config();
const OTP_EXPIRY_SECONDS = parseInt(process.env.OTP_EXPIRY_SECONDS || "300");

// สร้าง OTP 6 หลัก
function generateOtpCode(length = 6) {
  const digits = "0123456789";
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

/* ---------- Request Register OTP ---------- */
async function requestRegisterOtp(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, username, password, passwordConfirm } = req.body;

    if (password !== passwordConfirm)
      return res
        .status(400)
        .json({ message: "password และ passwordConfirm ไม่ตรงกัน" });

    const existingEmail = await usersModels.findUserByEmail(email);
    if (existingEmail)
      return res.status(400).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });

    const existingUsername = await usersModels.findUserByEmailOrUsername(
      username
    );
    if (existingUsername && existingUsername.username === username)
      return res.status(400).json({ message: "username นี้ถูกใช้งานแล้ว" });

    // สร้าง OTP
    const otpCode = generateOtpCode(6);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);

    // สร้าง tempToken เก็บข้อมูล user ชั่วคราว (email, username, password)
    const tempTokenPayload = {
      otp_purpose: "register",
      user_data: { email, username, password },
    };
    const tempToken = signAccessToken(tempTokenPayload, "10m");

    // สร้าง OTP โดยใส่ user_id = 0 เพราะยังไม่มี user
    await otpModels.createOtp({
      user_id: null, // จะ validate later ด้วย tempToken
      otp_code: otpCode,
      purpose: "verify_email",
      expires_at: expiresAt,
      meta: JSON.stringify({ email, username, password }),
    });

    await sendMail({
      to: email,
      subject: "OTP สำหรับสมัครสมาชิก",
      html: `<div style="font-family:'Segoe UI',Tahoma,Arial,sans-serif;background:#fdf2f8;padding:20px;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:10px;padding:24px;box-shadow:0 2px 6px rgba(0,0,0,0.08);">
      
      <h2 style="margin:0 0 12px 0;color:#db2777;text-align:center;">รหัส OTP</h2>
      <p style="margin:0 0 16px 0;color:#444;font-size:14px;text-align:center;">
        ใช้รหัสนี้เพื่อยืนยันอีเมลของคุณ รหัสจะหมดอายุใน <strong>${Math.floor(
          OTP_EXPIRY_SECONDS / 60
        )} นาที</strong>
      </p>
      
      <div style="margin:20px auto;padding:16px;border:1px solid #fbcfe8;border-radius:8px;background:#fdf2f8;max-width:240px;text-align:center;">
        <span style="font-size:26px;letter-spacing:6px;font-weight:bold;color:#be185d;">
          ${otpCode}
        </span>
      </div>
      
      <p style="margin:20px 0 0 0;font-size:12px;color:#a1a1aa;text-align:center;">
        หากคุณไม่ได้ขอรหัสนี้ กรุณาเพิกเฉยอีเมลนี้
      </p>
    </div>
  </div>
  `,
    });
    return res.json({
      status: "success",
      message: "OTP ถูกส่งไปยังอีเมล",
      tempToken,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
}

/* ---------- Verify Register OTP ---------- */
async function verifyRegisterOtp(req, res) {
  try {
    const { otpCode } = req.body;
    const token = (req.header("authorization") || "").replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "temp token required" });

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (e) {
      return res.status(401).json({ message: "temp token invalid or expired" });
    }

    if (decoded.otp_purpose !== "register")
      return res.status(400).json({ message: "invalid temp token" });

    // ดึงข้อมูล user ชั่วคราวจาก meta ของ OTP
    const otpRow = await otpModels.findValidOtp({
      user_id: 0,
      otp_code: otpCode,
      purpose: "verify_email",
    });
    if (!otpRow)
      return res.status(400).json({ message: "OTP ไม่ถูกต้องหรือหมดอายุ" });

    const { email, username, password } = JSON.parse(otpRow.meta);

    // hash password
    const password_hash = await bcrypt.hash(password, 12);

    // สร้าง user จริง
    const { id: userId } = await usersModels.createUser({
      username,
      email,
      password_hash,
      is_email_verified: true, // เพราะ OTP ยืนยันแล้ว
      avatar_url: null,
    });

    // mark OTP ใช้แล้ว
    await otpModels.markOtpUsed(otpRow.id);

    // สร้าง access + refresh token
    const accessToken = signAccessToken({ sub: userId, role: "user" }, "1h");
    const refreshTokenPlain = generationRefreshToken();
    const refreshHash = hashToken(refreshTokenPlain);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 วัน
    await createRefreshToken({
      user_id: userId,
      token_hash: refreshHash,
      user_agent: req.headers["user-agent"] || null,
      ip_address: req.ip,
      expires_at: expiresAt,
    });

    return res.json({
      message: "สมัครสมาชิกสำเร็จ",
      accessToken,
      refreshToken: refreshTokenPlain,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
}

/* ---------- LOGIN ---------- */
async function requestOtpLogin(req, res) {
  try {
    const { identifier, email, username, password } = req.body;

    const userIdentifier = identifier || email || username;
    if (!userIdentifier) {
      return res.status(400).json({ message: "กรุณากรอก email หรือ username" });
    }

    if (!password) {
      return res.status(400).json({ message: "กรุณากรอก password" });
    }

    const user = await usersModels.findUserByEmailOrUsername(userIdentifier);
    if (!user) return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });

    if (!user.password_hash) {
      return res.status(400).json({ message: "บัญชีนี้สมัครผ่าน OAuth" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });

    // สร้าง tempToken สำหรับ login OTP
    const tempTokenPayload = {
      otp_purpose: "login",
      sub: user.id, // ระบุ user.id
    };
    const tempToken = signAccessToken(tempTokenPayload, "10m");

    const otpCode = generateOtpCode(6);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);

    // บันทึก OTP ลง DB
    await otpModels.createOtp({
      user_id: user.id,
      otp_code: otpCode,
      purpose: "login",
      expires_at: expiresAt,
    });

    await sendMail({
      to: user.email,
      subject: "OTP สำหรับเข้าสู่ระบบ",
      html: `
        <div style="font-family:'Segoe UI',Tahoma,Arial,sans-serif;background:#fdf2f8;padding:20px;">
          <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:10px;padding:24px;box-shadow:0 2px 6px rgba(0,0,0,0.08);">
            <h2 style="margin:0 0 12px 0;color:#db2777;text-align:center;">รหัส OTP สำหรับเข้าสู่ระบบ</h2>
            <p style="margin:0 0 16px 0;color:#444;font-size:14px;text-align:center;">
              กรุณาใช้รหัสด้านล่างเพื่อล็อกอินเข้าสู่ระบบ
            </p>
            <div style="margin:20px auto;padding:16px;border:1px solid #fbcfe8;border-radius:8px;background:#fdf2f8;max-width:240px;text-align:center;">
              <span style="font-size:26px;letter-spacing:6px;font-weight:bold;color:#be185d;">
                ${otpCode}
              </span>
            </div>
            <p style="margin:20px 0 0 0;font-size:12px;color:#a1a1aa;text-align:center;">
              หากคุณไม่ได้ทำการเข้าสู่ระบบ กรุณาเพิกเฉยอีเมลนี้
            </p>
          </div>
        </div>
      `,
    });

    return res.json({
      status: "success",
      message: "OTP ถูกส่งไปยังอีเมล",
      tempToken,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
}

async function verifyOtpLogin(req, res) {
  try {
    const { otpCode } = req.body;
    const token = (req.header("authorization") || "").replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "temp token required" });

    const decoded = verifyAccessToken(token);
    if (decoded.otp_purpose !== "login")
      return res.status(400).json({ message: "invalid temp token" });

    const otpRow = await otpModels.findValidOtp({
      otp_code: otpCode,
      purpose: "login",
      user_id: decoded.sub,
    });
    if (!otpRow)
      return res.status(400).json({ message: "OTP ไม่ถูกต้องหรือหมดอายุ" });

    await otpModels.markOtpUsed(otpRow.id);
    await usersModels.updateLastLogin(decoded.sub);

    const accessToken = signAccessToken(
      { sub: decoded.sub, role: "user" },
      "1h"
    );
    const refreshTokenPlain = generationRefreshToken();
    const refreshHash = hashToken(refreshTokenPlain);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await createRefreshToken({
      user_id: decoded.sub,
      token_hash: refreshHash,
      user_agent: req.headers["user-agent"] || null,
      ip_address: req.ip,
      expires_at: expiresAt,
    });

    return res.json({
      message: "เข้าสู่ระบบสำเร็จ",
      accessToken,
      refreshToken: refreshTokenPlain,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
}

/* ---------- LOGOUT ---------- */
async function logout(req, res) {
  try {
    const token = req.header("authorization")?.replace("Bearer ", "");
    if (!token)
      return res.status(401).json({ message: "access token required" });

    const decoded = verifyAccessToken(token);
    const refreshToken = req.body.refreshToken;
    if (!refreshToken)
      return res.status(400).json({ message: "refresh token required" });

    const refreshHash = hashToken(refreshToken);
    await revokeRefreshTokenByHash(refreshHash);

    return res.json({ message: "ออกจากระบบเรียบร้อย" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
}

/* ---------- LOGOUT ALL ---------- */
async function logoutAll(req, res) {
  try {
    const token = req.header("authorization")?.replace("Bearer ", "");
    if (!token)
      return res.status(401).json({ message: "access token required" });

    const decoded = verifyAccessToken(token);
    await pool.execute(
      "UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ?",
      [decoded.sub]
    );

    return res.json({ message: "ออกจากระบบทุกเครื่องเรียบร้อย" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
}

module.exports = {
  requestRegisterOtp,
  verifyRegisterOtp,
  requestOtpLogin,
  verifyOtpLogin,
  logout,
  logoutAll,
};
