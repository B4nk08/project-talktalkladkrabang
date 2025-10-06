const express = require("express");
const router = express.Router();
const { createUsersTableHandler, } = require("../controllers/usersControllers");
const { requireAut111 } = require("../middleware/authMiddleware");
const {updateUsername} = require("../models/usersModels")


//สร้าง table
router.post("/addtable", createUsersTableHandler);
router.put("/changusername", requireAut111, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: "Username is required" });

    await updateUsername(req.user.id, username);

    res.json({ message: "Username updated", username });
  } catch (err) {
    console.error("❌ update username error:", err);
    res.status(500).json({ message: "Server error" });
  }
});





module.exports = router;