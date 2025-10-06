const express = require("express");
const router = express.Router();
const { requireAut111 } = require("../middleware/authMiddleware");
const { handleLike, handleUnlike, handleGetLikes } = require("../controllers/postLikesController");

// กดไลค์
router.post("/:id/like", requireAut111, handleLike);

// ยกเลิกไลค์
router.delete("/:id/unlike", requireAut111, handleUnlike);

// จำนวนไลค์
router.get("/:id/likes", handleGetLikes);

module.exports = router;
