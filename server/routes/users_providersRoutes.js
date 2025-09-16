const express = require("express");
const router = express.Router();
const users_providersController = require("../controllers/users_providersControllers");

// // สร้าง table
// router.post("/addtableusers_provider", usersProvidersController.createUserProvidersTableHandler);

// // เพิ่ม provider mapping (admin)
// router.post("/", usersProvidersController.addUserProviderHandler);

// Login ด้วย Google OAuth
router.post("/google-login", users_providersController.loginWithGoogle);

module.exports = router;
