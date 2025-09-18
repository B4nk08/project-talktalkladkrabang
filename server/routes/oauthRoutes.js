const express = require("express");
const router = express.Router();
const { googleSignIn } = require("../controllers/oauthControllers")


router.post("/google", googleSignIn);

module.exports = router;
