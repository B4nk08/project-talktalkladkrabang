const express = require("express");
const router = express.Router();
const { createposttableHandel } = require("../controllers/postControllers");

//สร้างtable
router.post("/addtablepost", createposttableHandel);

//สร้างpostในกระทู้
router.post(
  "/",
  requireAuth,
  [body("content").notEmpty().withMessage("content จำเป็น")],
  postsControllers.createPost
);

// ดึงโพสต์ทั้งหมด
router.get("/", postsControllers.getPosts);

// ดึงโพสต์เดี่ยว
router.get("/:id", postsControllers.getPost);

// อัปเดตโพสต์
router.put("/:id", requireAuth, postsControllers.updatePost);

// ลบโพสต์ (soft delete)
router.delete("/:id", requireAuth, postsControllers.deletePost);


module.exports = router;
