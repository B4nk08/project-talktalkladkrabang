const express = require("express");
const router = express.Router();
const { createUsersTableHandler, registerUserHandler } = require("../controllers/usersControllers");

//สร้าง table
router.post("/addtable", createUsersTableHandler);
//สร้าง register
router.post("/register", registerUserHandler)


module.exports = router;