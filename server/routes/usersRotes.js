const express = require("express");
const router = express.Router();
const { createUsersTableHandler, changeUsername } = require("../controllers/usersControllers");
const { verifyAccessTokenMiddleware } = require("../utils/jwt");


//สร้าง table
router.post("/addtable", createUsersTableHandler);
router.put("/change-username", verifyAccessTokenMiddleware, changeUsername); // ต้องมี JWT ก่อน


module.exports = router;