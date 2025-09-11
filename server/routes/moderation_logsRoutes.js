const express = require("express");
const router = express.Router();
const { createmoderlogtableHandel } = require("../controllers/moderation_logsControllers");


router.post("/addtablemoderlog", createmoderlogtableHandel);

module.exports = router;