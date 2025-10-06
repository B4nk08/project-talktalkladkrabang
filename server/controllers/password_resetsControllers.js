const bcrypt = require("bcrypt");
const password_resetsModels = require("../models/password_resetsModels");
const otpModels = require("../models/otpModels");
const usersModels = require("../models/usersModels");
const { sendMail } = require("../utils/mailer");
const { signAccessToken, verifyAccessToken } = require("../utils/jwt");

function generateOtpCode(length = 6) {
  const digits = "0123456789";
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}
const OTP_EXPIRY_SECONDS = 300; // 5 นาที

async function createpassresettableHandel(req, res) {
  try {
    await creatpassresettable();
    res.json({ message: "createtable success" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// POST /password_reset/request
async function requestForgotPassword(req, res) {
  try {
    const { email } = req.body;
    const user = await usersModels.findUserByEmail(email);
    if (!user) return res.status(400).json({ message: "ไม่พบบัญชีนี้ในระบบ" });

    // สร้าง OTP
    const otpCode = generateOtpCode(6);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);

    // บันทึก OTP ลง DB
    await otpModels.createOtp({
      user_id: user.id,
      otp_code: otpCode,
      purpose: "forgot_password",
      expires_at: expiresAt,
      meta: null,
    });

    // ส่ง OTP ทางอีเมล
    await sendMail({
      to: user.email,
      subject: "OTP สำหรับรีเซ็ตรหัสผ่าน",
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
  `
    });

    // สร้าง tempToken สำหรับ verify OTP
    const tempToken = signAccessToken(
      { sub: user.id, otp_purpose: "forgot_password", tmp: true },
      "10m"
    );

    return res.json({
      status: "success",
      message: "ส่ง OTP ไปยังอีเมลแล้ว",
      tempToken,
    });
  } catch (err) {
    console.error("ForgotPassword error:", err);
    return res.status(500).json({ message: "server error" });
  }
}

// POST /password_reset/verify
async function verifyForgotOtp(req, res) {
  try {
    const { otp, otpCode } = req.body;
    const codeToUse = otpCode || otp;
    if (!codeToUse) return res.status(400).json({ message: "OTP ไม่ถูกต้อง" });

    // ดึง tempToken จาก header
    const token = (req.header("authorization") || "").replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "temp token required" });

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (e) {
      return res.status(401).json({ message: "temp token invalid or expired" });
    }

    if (decoded.otp_purpose !== "forgot_password") {
      return res.status(400).json({ message: "invalid token purpose" });
    }

    const userId = decoded.sub;

    // ตรวจสอบ OTP
    const otpRow = await otpModels.findValidOtp({
      user_id: userId,
      otpCode: codeToUse,
      purpose: "forgot_password",
    });

    if (!otpRow) {
      return res.status(400).json({ message: "OTP ไม่ถูกต้องหรือหมดอายุ" });
    }

    await otpModels.markOtpUsed(otpRow.id);

    // สร้าง resetToken สำหรับเปลี่ยนรหัสผ่าน
    const resetToken = signAccessToken(
      { sub: userId, otp_purpose: "reset_password", tmp: true },
      "15m"
    );

    return res.json({
      status: "success",
      message: "ยืนยัน OTP สำเร็จ",
      resetToken,
    });
  } catch (err) {
    console.error("VerifyForgotOtp error:", err);
    return res.status(500).json({ message: "server error" });
  }
}

// POST /password_reset/reset
async function resetPassword(req, res) {
  try {
    const { newPassword } = req.body;

    // ดึง resetToken จาก header
    const token = (req.header("authorization") || "").replace("Bearer ", "");
    if (!token)
      return res.status(401).json({ message: "reset token required" });

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (e) {
      return res
        .status(401)
        .json({ message: "reset token invalid or expired" });
    }

    if (decoded.otp_purpose !== "reset_password") {
      return res.status(400).json({ message: "invalid token purpose" });
    }

    const userId = decoded.sub;

    const hash = await bcrypt.hash(newPassword, 10);
    await password_resetsModels.setPassWordHash(userId, hash);

    return res.json({ status: "success", message: "เปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (err) {
    console.error("ResetPassword error:", err);
    return res.status(500).json({ message: "server error" });
  }
}

module.exports = {
  createpassresettableHandel,
  requestForgotPassword,
  verifyForgotOtp,
  resetPassword,
};
