const bcrypt = require("bcrypt");
const { creatmoderlogtable } = require("../models/moderation_logsModels");

async function createmoderlogtableHandel(req, res) {
  try {
    await creatmoderlogtable();
    res.json({ message: "createtable success" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
module.exports = { createmoderlogtableHandel };