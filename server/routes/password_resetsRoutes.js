const express = require("express");
const router = express.Router();
const { createpassresettableHandel } = require("../controllers/password_resetsControllers");


router.post("/addtablepassreset", createpassresettableHandel);

module.exports = router;