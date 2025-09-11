const express = require("express");
const router = express.Router();
const { createposttableHandel } = require("../controllers/postControllers");


router.post("/addtablepost", createposttableHandel);

module.exports = router;
