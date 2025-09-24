const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const commentsControllers = require("../controllers/commentsControllers");
const { requireAuth } = require("../middleware/authMiddleware");

// สร้าง table comments
router.post("/addtablecomment", commentsControllers.createcommenttableHandel);

// สร้าง comment
router.post(
  "/createcomment",
  requireAuth,
  [body("content").notEmpty().withMessage("content จำเป็น")],
  commentsControllers.createComment
);

// ดึงคอมเมนต์ของโพสต์
router.get("/post/:post_id", commentsControllers.getCommentsByPost);

// อัปเดต comment
router.put("/:id", requireAuth, commentsControllers.updateComment);

// ลบ comment (soft delete)
router.delete("/:id", requireAuth, commentsControllers.deleteComment);

module.exports = router;
