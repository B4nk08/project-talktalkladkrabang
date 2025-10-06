const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const postsControllers = require("../controllers/postsControllers");
const { requireAuth, authMiddleware } = require("../middleware/authMiddleware");

// สร้าง table posts
router.post("/addtablepost", postsControllers.createposttableHandel);

// สร้าง post
router.post("/createpost", authMiddleware, postsControllers.createPost);

// ดึงโพสต์ทั้งหมด
router.get("/allpost", postsControllers.getPosts);

// ดึงโพสต์เดี่ยว
router.get("/:id", postsControllers.getPost);

// อัปเดตโพสต์
router.put("/:id", requireAuth, postsControllers.updatePost);

// ลบโพสต์ (soft delete)
router.delete("/:id", requireAuth, postsControllers.deletePost);

module.exports = router;
