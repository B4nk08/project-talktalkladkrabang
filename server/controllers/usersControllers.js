const bcrypt = require("bcrypt");
const { createUsersTable, findUserByEmail, createUser
 } = require("../models/usersModels");


async function createUsersTableHandler(req, res) {
  try {
    await createUsersTable();
    res.json({ message: "create table success" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createUsersTableHandler(req, res) {
  try {
    await createUsersTable();
    res.json({ message: "create table success" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function registerUserHandler(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "กรุณากรอก email, username, password" });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await createUser(username, email, passwordHash);

    return res.status(201).json({ message: "สมัครสมาชิกสำเร็จ" });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = { createUsersTableHandler, registerUserHandler };
