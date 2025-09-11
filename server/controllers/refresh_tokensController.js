const bcrypt = require("bcrypt");
const { createretokentable } = require("../models/refresh_tokensModels");

async function createretokentableHandel(req, res) {
  try {
    await createretokentable();
    res.json({ message: "createtable success" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
module.exports = { createretokentableHandel };
