const bcrypt = require("bcrypt");
const commentsModels = require("../models/commentsModels");

// helper แปลงเวลาเป็น ISO string
function formatComment(comment) {
  return {
    ...comment,
    created_at: comment.created_at ? comment.created_at.toISOString() : null,
    updated_at: comment.updated_at ? comment.updated_at.toISOString() : null,
    deleted_at: comment.deleted_at ? comment.deleted_at.toISOString() : null,
  };
}

// สร้าง table (ใช้ครั้งเดียว)
async function createcommenttableHandel(req, res) {
  try {
    await commentsModels.creatcommenttable();
    res.json({ message: "create comments table success" });
  } catch (err) {
    console.error("Create table error:", err);
    res.status(500).json({ message: "server error" });
  }
}

// --- GET comments by post_id ---
async function getCommentsByPostId(req, res){
  try {
    const { post_id } = req.params;
    if (!post_id) return res.status(400).json({ message: "post_id required" });

    const comments = await commentsModels.getCommentsByPostId(post_id);

    return res.json({ status: "success", comments });
  } catch (err) {
    console.error("getCommentsByPostId error:", err);
    return res.status(500).json({ message: "server error" });
  }
};

async function createComment(req, res){
  try {
    const { post_id, content } = req.body;
    const userId = req.user?.sub; // ✅ ใช้ sub ไม่ใช่ id

    if (!post_id || !content || !userId) {
      return res.status(400).json({ message: "post_id, content และ userId จำเป็น" });
    }

    await commentsModels.createComment({ post_id, user_id: userId, content });

    return res.json({ status: "success", message: "เพิ่มคอมเมนต์เรียบร้อย" });
  } catch (err) {
    console.error("createComment error:", err);
    return res.status(500).json({ message: "server error" });
  }
};


// อัปเดต comment
async function updateComment(req, res) {
  try {
    const { id } = req.params;
    const { content } = req.body;

    await commentsModels.updateComment(id, { content });
    const updatedComment = await commentsModels.getCommentById(id);

    res.json({
      message: "อัปเดต comment สำเร็จ",
      comment: formatComment(updatedComment),
    });
  } catch (err) {
    console.error("Update comment error:", err);
    res.status(500).json({ message: "server error" });
  }
}

// ลบ comment (soft delete)
async function deleteComment(req, res) {
  try {
    const { id } = req.params;
    const deleted_by = req.user.sub;

    await commentsModels.softDeleteComment(id, deleted_by);
    const deletedComment = await commentsModels.getCommentById(id);

    res.json({
      message: "ลบ comment สำเร็จ",
      comment: deletedComment ? formatComment(deletedComment) : null,
    });
  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(500).json({ message: "server error" });
  }
}

module.exports = {
  createcommenttableHandel,
  createComment,
  getCommentsByPostId,
  updateComment,
  deleteComment,
};
