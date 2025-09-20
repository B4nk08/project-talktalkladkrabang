const bcrypt = require("bcrypt");
const password_resetsModels = require("../models/password_resetsModels");
const otpModels = require("../models/otpModels");
const { generateOtpCode } = require("../utils/jwt");
const { sendMail } = require("../utils/mailer");
const { signAccessToken } = require("../utils/jwt");

const OTP_EXPIRY_SECONDS = 300; // 5 นาที

async function createpassresettableHandel(req, res) {
  try {
    await creatpassresettable();
    res.json({ message: "createtable success" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// -------------------- Forgot Password: Request --------------------
async function requestForgotPassword(req, res) {
  try {
    const { email } = req.body;
    const user = await usersModels.findUserByEmail(email);
    if (!user) return res.status(400).json({ message: "ไม่พบบัญชีนี้ในระบบ" });

    const otpCode = generateOtpCode(6);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);
    await otpModels.createOtp({
      user_id: user.id,
      otp_code: otpCode,
      purpose: "forgot_password",
      expires_at: expiresAt,
    });

    await sendMail({
      to: user.email,
      subject: "OTP Reset Password",
      html: `<h2>OTP สำหรับรีเซ็ตรหัสผ่าน: ${otpCode}</h2>`,
    });

    const tempToken = signAccessToken(
      { sub: user.id, otp_purpose: "forgot_password", tmp: true },
      "10m"
    );

    return res.json({ message: "ส่ง OTP ไปยังอีเมลแล้ว", tempToken });
  } catch (err) {
    console.error("ForgotPassword error:", err);
    return res.status(500).json({ message: "server error" });
  }
}

// -------------------- Forgot Password: Verify OTP --------------------
async function verifyForgotOtp(req, res) {
  try {
    const { otpCode } = req.body;
    const token = (req.header("authorization") || "").replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "temp token required" });

    let decoded;
    try {
      decoded = require("../utils/jwt").verifyAccessToken(token);
    } catch (e) {
      return res.status(401).json({ message: "temp token invalid or expired" });
    }

    const { sub: userId, otp_purpose } = decoded;
    if (otp_purpose !== "forgot_password") {
      return res.status(400).json({ message: "invalid token purpose" });
    }

    const otpRow = await otpModels.findValidOtp({
      user_id: userId,
      otp_code: otpCode,
      purpose: "forgot_password",
    });
    if (!otpRow)
      return res.status(400).json({ message: "OTP ไม่ถูกต้องหรือหมดอายุ" });

    await otpModels.markOtpUsed(otpRow.id);

    const resetToken = signAccessToken(
      { sub: userId, otp_purpose: "reset_password", tmp: true },
      "15m"
    );

    return res.json({ message: "ยืนยัน OTP สำเร็จ", resetToken });
  } catch (err) {
    console.error("VerifyForgotOtp error:", err);
    return res.status(500).json({ message: "server error" });
  }
}

// -------------------- Forgot Password: Reset Password --------------------
async function resetPassword(req, res) {
  try {
    const { newPassword } = req.body;
    const token = (req.header("authorization") || "").replace("Bearer ", "");
    if (!token)
      return res.status(401).json({ message: "reset token required" });

    let decoded;
    try {
      decoded = require("../utils/jwt").verifyAccessToken(token);
    } catch (e) {
      return res
        .status(401)
        .json({ message: "reset token invalid or expired" });
    }

    const { sub: userId, otp_purpose } = decoded;
    if (otp_purpose !== "reset_password") {
      return res.status(400).json({ message: "invalid token purpose" });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await password_resetsModels.setPassWordHash(userId, hash);

    return res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
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
