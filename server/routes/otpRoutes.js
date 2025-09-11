const express = require("express");
const router = express.Router();
const { createotptableHandel } = require("../controllers/otpController");

router.post("/addtable", createotptableHandel);

module.exports = router;
