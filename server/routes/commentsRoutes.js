const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const commentsControllers = require("../controllers/commentsControllers");
const { requireAuth, authMiddleware } = require("../middleware/authMiddleware");

// สร้าง table comments
router.post("/addtablecomment", commentsControllers.createcommenttableHandel);

// สร้าง comment
router.post("/createcomment", authMiddleware, commentsControllers.createComment);


// ดึงคอมเมนต์ของโพสต์
router.get("/commentbypostid/:post_id", commentsControllers.getCommentsByPostId);

// อัปเดต comment
router.put("/:id", requireAuth, commentsControllers.updateComment);

// ลบ comment (soft delete)
router.delete("/:id", requireAuth, commentsControllers.deleteComment);

module.exports = router;
