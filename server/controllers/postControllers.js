const bcrypt = require("bcrypt");
const { createposttable } = require("../models/postsModels");

async function createposttableHandel(req, res) {
  try {
    await createposttable();
    res.json({ message: "createtable success" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
module.exports = { createposttableHandel };