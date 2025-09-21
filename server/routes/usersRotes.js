const express = require("express");
const router = express.Router();
const { createUsersTableHandler, registerUserHandler } = require("../controllers/usersControllers");

//สร้าง table
router.post("/addtable", createUsersTableHandler);


module.exports = router;