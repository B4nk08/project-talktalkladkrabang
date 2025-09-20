const express = require("express");
const router = express.Router();
const password_resetsControllers = require("../controllers/password_resetsControllers");


router.post("/addtablepassreset", password_resetsControllers.createpassresettableHandel);

// Forgot Password Step 1: ส่ง OTP ไปที่ email
router.post("/forgot-password",password_resetsControllers.requestForgotPassword );

// Forgot Password Step 2: ยืนยัน OTP
router.post("/verify-forgot-otp", password_resetsControllers.verifyForgotOtp);

// Forgot Password Step 3: รีเซ็ตรหัสผ่านใหม่
router.post("/reset-password", password_resetsControllers.resetPassword);

module.exports = router;