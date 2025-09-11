const bcrypt = require("bcrypt");
const { createotptable } = require("../models/otpModels");

async function createotptableHandel(req, res) {
  try {
    await createotptable();
    res.json({ message: "createtable success" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
module.exports = { createotptableHandel };
