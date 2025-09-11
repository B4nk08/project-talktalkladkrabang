const express = require("express");
const router = express.Router();
const {
  createretokentableHandel,
} = require("../controllers/refresh_tokensController");

router.post("/addtableretoken", createretokentableHandel);

module.exports = router;
