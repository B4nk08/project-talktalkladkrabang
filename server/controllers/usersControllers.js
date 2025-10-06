const bcrypt = require("bcrypt");
const { createUsersTable} = require("../models/usersModels");


async function createUsersTableHandler(req, res) {
  try {
    await createUsersTable();
    res.json({ message: "create table success" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function changeUsername(req, res) {
  try {
    console.log("req.body = ", req.body);
    const userId = req.user.sub; // ได้จาก JWT payload
    const { newUsername } = req.body;

    if (!newUsername || newUsername.length < 3) {
      return res
        .status(400)
        .json({ message: "username ต้องมีอย่างน้อย 3 ตัว" });
    }

    // ตรวจสอบ username ซ้ำ
    const existingUser = await usersModels.findUserByUsername(newUsername);
    if (existingUser) {
      return res.status(400).json({ message: "username นี้ถูกใช้แล้ว" });
    }

    const success = await usersModels.updateUsername(userId, newUsername);
    if (!success) {
      return res.status(400).json({ message: "ไม่สามารถเปลี่ยน username ได้" });
    }

    return res.json({
      status : "success",
      message: "เปลี่ยน username สำเร็จ",
      newUsername,
    });
  } catch (err) {
    console.error("Change username error:", err);
    return res.status(500).json({ message: "server error" });
  }
}

module.exports = { createUsersTableHandler, changeUsername };
