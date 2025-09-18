const bcrypt = require("bcrypt");
const { creatmoderlogtable, createModerationLog } = require("../models/moderation_logsModels");
const postsModels = require("../models/postsModels")
const commentsModels = require("../models/commentsModels")

async function createmoderlogtableHandel(req, res) {
  try {
    await creatmoderlogtable();
    res.json({ message: "createtable success" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
async function moderate(req, res) {
  try {
    const admin_user_id = req.user.sub;
    const { target_type, target_id, action, reason } = req.body;

    // example: perform action (e.g., delete post/comment)
    if (target_type === "post" && action === "delete") {
      await postsModels.softDeletePost(target_id, admin_user_id);
    } else if (target_type === "comment" && action === "delete") {
      await commentsModels.softDeleteComment(target_id, admin_user_id);
    }
    // save log
    await createModerationLog({ admin_user_id, target_type, target_id, action, reason });
    res.json({ message: "action performed and logged" });
  } catch (err) {
    console.error("moderate error:", err);
    res.status(500).json({ message: "server error" });
  }
}


module.exports = { createmoderlogtableHandel, moderate };