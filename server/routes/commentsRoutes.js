const express = require("express");
const router = express.Router();
const { createcommenttableHandel } = require("../controllers/commentsControllers");


router.post("/addtablecomment", createcommenttableHandel);

module.exports = router;