const express = require("express");
const router = express.Router();
const { createmoderlogtableHandel, moderate } = require("../controllers/moderation_logsControllers");
const {requireAuth} = require("../middleware/authMiddleware")

router.post("/addtablemoderlog", createmoderlogtableHandel);
router.post("/", requireAuth, async (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  return moderate(req, res, next);
});

module.exports = router;