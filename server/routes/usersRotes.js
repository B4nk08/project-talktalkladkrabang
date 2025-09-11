const express = require("express");
const router = express.Router();
const { createUsersTableHandler, registerUserHandler } = require("../controllers/usersControllers");

router.post("/addtable", createUsersTableHandler);
router.post("/register", registerUserHandler)


module.exports = router;