const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const pool = require("../config/db");
const usersModels = require("../models/usersModels");
const otpModels = require("../models/otpModels"); // ✅ ตัวนี้ใช้ทุกที่
const { signAccessToken, verifyAccessToken } = require("../utils/jwt");
const { sendMail } = require("../utils/mailer");

const OTP_EXPIRY_SECONDS = parseInt(process.env.OTP_EXPIRY_SECONDS || "300");

function generateOtpCode(length = 6) {
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < length; i++)
    code += digits[Math.floor(Math.random() * digits.length)];
  return code;
}

// async function register(req, res) {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty())
//       return res.status(400).json({ errors: errors.array() });

//     const { email, username, password, passwordConfirm } = req.body;
//     if (password !== passwordConfirm) {
//       return res
//         .status(400)
//         .json({ message: "password และ passwordConfirm ไม่ตรงกัน" });
//     }

//     const existing = await usersModels.findUserByEmail(email);
//     if (existing)
//       return res.status(400).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });

//     const password_hash = await bcrypt.hash(password, 12);
//     const { id } = await usersModels.createUser({
//       username,
//       email,
//       password_hash,
//     });

//     return res
//       .status(201)
//       .json({ message: "สร้างผู้ใช้เรียบร้อย", userId: id });
//   } catch (err) {
//     console.error("❌ Register error:", err);
//     return res.status(500).json({ message: "server error" });
//   }
// }

async function register(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, username, password, passwordConfirm } = req.body;
    if (password !== passwordConfirm) {
      return res
        .status(400)
        .json({ message: "password และ passwordConfirm ไม่ตรงกัน" });
    }

    const existing = await usersModels.findUserByEmail(email);
    if (existing)
      return res.status(400).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });

    const password_hash = await bcrypt.hash(password, 12);
    const { id } = await usersModels.createUser({
      username,
      email,
      password_hash,
      is_verified: false, // ยังไม่ verified
    });

    // ✅ สร้าง OTP สำหรับ verify email
    const otpCode = generateOtpCode(6);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);
    await otpModels.createOtp({
      user_id: id,
      otp_code: otpCode,
      purpose: "verify_email",
      expires_at: expiresAt,
    });

    // ✅ ส่ง OTP ไป email
    await sendMail({
      to: email,
      subject: "ยืนยันอีเมลของคุณ",
      html: `
        <h2>ยืนยันอีเมล</h2>
        <p>รหัส OTP ของคุณคือ:</p>
        <div style="font-size: 28px; font-weight: bold; color: #e53935;">${otpCode}</div>
        <p>รหัสนี้จะหมดอายุใน <b>${Math.floor(
          OTP_EXPIRY_SECONDS / 60
        )} นาที</b></p>
      `,
    });

    // ✅ ส่ง tempToken กลับ
    const tempToken = signAccessToken({
      sub: id,
      otp_purpose: "verify_email",
      tmp: true,
    });

    return res.status(201).json({
      message: "สมัครสมาชิกสำเร็จ กรุณายืนยันอีเมลด้วย OTP",
      tempToken,
    });
  } catch (err) {
    console.error("❌ Register error:", err);
    return res.status(500).json({ message: "server error" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await usersModels.findUserByEmail(email);
    if (!user) return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });

    if (!user.password_hash) {
      return res
        .status(400)
        .json({ message: "บัญชีนี้สมัครผ่าน OAuth. ใช้วิธีล็อกอินอื่น" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ message: "ข้อมูลไม่ถูกต้อง" });

    // ✅ สร้าง OTP
    const otpCode = generateOtpCode(6);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);
    await otpModels.createOtp({
      user_id: user.id,
      otp_code: otpCode,
      purpose: "login",
      expires_at: expiresAt,
    });

    // ✅ ส่ง OTP ไปที่ email ของ user จริง ๆ
    await sendMail({
      to: user.email,
      subject: "Your login OTP",
      html: `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f9f9f9;">
      <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        
        <h2 style="color: #4CAF50;">เข้าสู่ระบบด้วย OTP</h2>
        
        <p style="font-size: 16px; color: #333;">รหัส OTP ของคุณคือ</p>
        
        <div style="font-size: 32px; font-weight: bold; color: #e53935; margin: 20px 0;">
          ${otpCode}
        </div>
        
        <p style="font-size: 14px; color: #777; margin-bottom: 30px;">
          ใช้งานได้ภายใน <b>${Math.floor(OTP_EXPIRY_SECONDS / 60)} นาที</b>
        </p>
        
        <a href="https://your-frontend-login-page.com/verify-otp?email=${
          user.email
        }" 
           style="display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; font-size: 16px; border-radius: 5px;">
          กดที่นี่เพื่อยืนยัน OTP
        </a>
        
        <p style="font-size: 12px; color: #aaa; margin-top: 30px;">
          หากคุณไม่ได้ร้องขอรหัสนี้ โปรดเพิกเฉยต่ออีเมลนี้
        </p>
      </div>
    </div>
  `,
    });

    // ✅ ส่ง tempToken กลับไป
    const tempToken = signAccessToken({
      sub: user.id,
      otp_purpose: "login",
      tmp: true,
    });

    return res.json({ message: "OTP ถูกส่งไปยังอีเมลแล้ว", tempToken });
  } catch (err) {
    console.error("❌ Login error:", err);
    return res.status(500).json({ message: "server error" });
  }
}

async function verifyOtp(req, res) {
  try {
    const { otpCode } = req.body;
    const authHeader = req.header("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "temp token required" });

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (e) {
      return res.status(401).json({ message: "temp token invalid or expired" });
    }

    if (!decoded.tmp || decoded.otp_purpose !== "login") {
      return res.status(401).json({ message: "temp token invalid" });
    }

    const userId = decoded.sub;
    const otpRow = await otpModels.findValidOtp({
      user_id: userId,
      otp_code: otpCode,
      purpose: "login",
    });

    if (!otpRow)
      return res.status(400).json({ message: "OTP ไม่ถูกต้องหรือหมดอายุ" });

    // ✅ mark OTP ว่าใช้แล้ว
    await otpModels.markOtpUsed(otpRow.id);
    await usersModels.updateLastLogin(userId);

    // ✅ สร้าง accessToken จริง
    const accessToken = signAccessToken({
      sub: userId,
      role: decoded.role || "user",
    });

    return res.json({ message: "ยืนยัน OTP สำเร็จ", accessToken });
  } catch (err) {
    console.error("❌ Verify OTP error:", err);
    return res.status(500).json({ message: "server error" });
  }
}

module.exports = { register, login, verifyOtp };
