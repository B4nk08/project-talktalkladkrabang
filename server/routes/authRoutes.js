// routes/auth.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authControllers = require('../controllers/authControllers');

router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('username อย่างน้อย 3 ตัว'),
  body('email').isEmail().withMessage('email ไม่ถูกต้อง'),
  body('password').isLength({ min: 6 }).withMessage('password อย่างน้อย 6 ตัว'),
  body('passwordConfirm').exists()
], authControllers.register);

router.post('/login', [
  body('email').isEmail(),
  body('password').exists()
], authControllers.login);

router.post('/verify-otp', [
  body('otpCode').isLength({ min: 4 })
], authControllers.verifyOtp);

// Protected route (ต้องมี JWT จริง)
router.get("/me", requireAuth, (req, res) => {
  res.json({ message: "โปรไฟล์ของคุณ", user: req.user });
});

module.exports = router;
