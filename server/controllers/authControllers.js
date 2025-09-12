const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const usersModels = require("../models/usersModels");
const otpModels = require("../models/otpModels");
const { signAccessToken, verifyAccessToken } = require("../utils/jwt");
const { sendMail } = require("../utils/mailer");
require("dotenv").config();

const OTP_EXPIRY_SECONDS = parseInt(process.env.OTP_EXPIRY_SECONDS || "300");

function generateOtpCode(length = 6) {
  const digits = "0123456789";
  return Array.from({ length }, () => digits[Math.floor(Math.random() * digits.length)]).join("");
}

async function register(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, username, password, passwordConfirm } = req.body;
    if (password !== passwordConfirm) {
      return res.status(400).json({ message: "password และ passwordConfirm ไม่ตรงกัน" });
    }

    const existing = await usersModels.findUserByEmail(email);
    if (existing) return res.status(400).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });

    const password_hash = await bcrypt.hash(password, 12);
    const { id } = await usersModels.createUser({
      username,
      email,
      password_hash,
      is_verified: false,
    });

    // สร้าง OTP
    const otpCode = generateOtpCode(6);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);
    await otpModels.createOtp({ user_id: id, otp_code: otpCode, purpose: "verify_email", expires_at: expiresAt });

    // ส่ง OTP ไป Email
    await sendMail({
      to: email,
      subject: "ยืนยันอีเมลของคุณ",
      html: `<h2>รหัส OTP</h2><p>${otpCode}</p><p>หมดอายุใน ${Math.floor(OTP_EXPIRY_SECONDS / 60)} นาที</p>`,
    });

    // ส่ง tempToken กลับ
    const tempToken = signAccessToken({ sub: id, otp_purpose: "verify_email", tmp: true }, "10m");

    return res.status(201).json({ message: "สมัครสมาชิกสำเร็จ กรุณายืนยันอีเมลด้วย OTP", tempToken });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "server error" });
  }
}

// Login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await usersModels.findUserByEmail(email);
    if (!user) return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });

    if (!user.password_hash) {
      return res.status(400).json({ message: "บัญชีนี้สมัครผ่าน OAuth" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });

    // สร้าง OTP
    const otpCode = generateOtpCode(6);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);
    await otpModels.createOtp({ user_id: user.id, otp_code: otpCode, purpose: "login", expires_at: expiresAt });

    // ส่ง OTP ไป Email
    await sendMail({
      to: user.email,
      subject: "OTP Login",
      html: `<h2>รหัส OTP</h2><p>${otpCode}</p>`,
    });

    // ส่ง tempToken กลับ
    const tempToken = signAccessToken({ sub: user.id, otp_purpose: "login", tmp: true }, "10m");

    return res.json({ message: "OTP ถูกส่งไปยังอีเมลแล้ว", tempToken });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "server error" });
  }
}

// Verify OTP
async function verifyOtp(req, res) {
  try {
    const { otpCode } = req.body;
    const token = (req.header("authorization") || "").replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "temp token required" });

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch {
      return res.status(401).json({ message: "temp token invalid" });
    }

    const userId = decoded.sub;
    const otpRow = await otpModels.findValidOtp({
      user_id: userId,
      otp_code: otpCode,
      purpose: decoded.otp_purpose,
    });

    if (!otpRow) return res.status(400).json({ message: "OTP ไม่ถูกต้องหรือหมดอายุ" });

    // ใช้แล้ว
    await otpModels.markOtpUsed(otpRow.id);
    await usersModels.updateLastLogin(userId);

    // สร้าง Access Token จริง
    const accessToken = signAccessToken({ sub: userId, role: "user" }, "1h");

    return res.json({ message: "ยืนยัน OTP สำเร็จ", accessToken });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ message: "server error" });
  }
}

module.exports = { register, login, verifyOtp };
