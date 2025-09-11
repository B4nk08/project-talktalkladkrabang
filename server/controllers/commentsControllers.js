const bcrypt = require("bcrypt");
const { creatcommenttable } = require("../models/commentsModels");

async function createcommenttableHandel(req, res) {
  try {
    await creatcommenttable();
    res.json({ message: "createtable success" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
module.exports = { createcommenttableHandel }