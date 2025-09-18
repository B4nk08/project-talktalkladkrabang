const bcrypt = require("bcrypt")
const users_providersModels = require("../models/users_providersModels")

async function getProviderByUser(req, res) {
  try {
    const { user_id } = req.params;
    const provider = await users_providersModels.findProviderByUserId(user_id);
    if (!provider) return res.status(404).json({ message: "Provider not found" });
    res.json(provider);
  } catch (err) {
    console.error("getProviderByUser error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function createProvider(req, res) {
  try {
    const { user_id, provider, provider_user_id } = req.body;
    const id = await users_providersModels.createProvider({ user_id, provider, provider_user_id });
    res.status(201).json({ message: "Provider created", id });
  } catch (err) {
    console.error("createProvider error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = { getProviderByUser, createProvider };
