const bcrypt = require("bcrypt");
const {
  createUsers_providersTable,
} = require("../models/users_providersModels");

async function createUsers_providersTableHandler(req, res) {
  try {
    await createUsers_providersTable();
    res.json({ message: "create table success" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {createUsers_providersTableHandler}