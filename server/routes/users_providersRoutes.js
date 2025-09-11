const express = require("express");
const router = express.Router();
const {
  createUsers_providersTableHandler,
} = require("../controllers/users_providersControllers");

router.post("/addtableusers_provider", createUsers_providersTableHandler);

module.exports = router;
