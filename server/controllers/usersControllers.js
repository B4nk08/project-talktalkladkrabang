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


module.exports = { createUsersTableHandler };
