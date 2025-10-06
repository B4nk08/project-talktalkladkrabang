const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authControllers = require("../controllers/authControllers");
const { requireAut111, requireAuth } = require("../middleware/authMiddleware");
const {findUserByIdprofile} = require("../models/usersModels")

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
router.get("/me", requireAut111, async (req, res) => {
  try {
    const user = await findUserByIdprofile(req.user.id); // <-- req.user.id ต้องมี
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        avatar_url: user.avatar_url || null,
      },
    });
  } catch (err) {
    console.error("❌ /me error:", err);
    res.status(500).json({ message: "Server error" });
  }
});






module.exports = router;
