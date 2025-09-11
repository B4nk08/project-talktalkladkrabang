const bcrypt = require("bcrypt");
const { creatpassresettable } = require("../models/password_resetsModels");

async function createpassresettableHandel(req, res) {
  try {
    await creatpassresettable();
    res.json({ message: "createtable success" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
module.exports = { createpassresettableHandel };