const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authControllers = require("../controllers/authControllers");
const { requireAuth } = require("../middleware/authMiddleware");

// Register
router.post("/register/request-otp", [
  body("username").isLength({ min: 3 }),
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  body("passwordConfirm").exists()
], authControllers.requestRegisterOtp);

router.post("/register/verify-otp", [
  body("otpCode").isLength({ min: 4 })
], authControllers.verifyRegisterOtp);

// Login
router.post("/login/request-otp", [
  body("identifier").notEmpty()
], authControllers.requestOtpLogin);

router.post("/login/verify-otp", [
  body("otpCode").isLength({ min: 4 })
], authControllers.verifyOtpLogin);

// Logout
router.post("/logout", requireAuth, authControllers.logout);
router.post("/logout-all", requireAuth, authControllers.logoutAll);

// Protected
router.get("/me", requireAuth, (req, res) => {
  res.json({ message: "โปรไฟล์ของคุณ", user: req.user });
});

module.exports = router;
