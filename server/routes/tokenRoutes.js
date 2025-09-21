const express = require("express");
const router = express.Router();
const { refreshAccessToken } = require("../controllers/tokenControllers");

// Refresh access token
router.post("/refresh", refreshAccessToken);

module.exports = router;
