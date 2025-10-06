const express = require("express");
const router = express.Router();
const {
  createretokentableHandel, refreshAccessToken
} = require("../controllers/refresh_tokensController");

router.post("/addtableretoken", createretokentableHandel);

router.post("/ A",refreshAccessToken)

module.exports = router;
