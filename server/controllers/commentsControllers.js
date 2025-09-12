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

// สร้าง comment
async function createComment(req, res) {
  try {
    const { post_id, content, parent_comment_id } = req.body;
    const user_id = req.user.sub;

    if (!content) return res.status(400).json({ message: "content จำเป็น" });

    const commentId = await commentsModels.createComment({
      post_id,
      user_id,
      parent_comment_id: parent_comment_id || null,
      content,
    });

    const newComment = await commentsModels.getCommentById(commentId);

    res.status(201).json({ message: "สร้าง comment สำเร็จ", comment: formatComment(newComment) });
  } catch (err) {
    console.error("Create comment error:", err);
    res.status(500).json({ message: "server error" });
  }
}

// ดึงคอมเมนต์ของโพสต์
async function getCommentsByPost(req, res) {
  try {
    const { post_id } = req.params;
    const comments = await commentsModels.getCommentsByPost(post_id);
    res.json({ comments: comments.map(formatComment) });
  } catch (err) {
    console.error("Get comments error:", err);
    res.status(500).json({ message: "server error" });
  }
}

// อัปเดต comment
async function updateComment(req, res) {
  try {
    const { id } = req.params;
    const { content } = req.body;

    await commentsModels.updateComment(id, { content });
    const updatedComment = await commentsModels.getCommentById(id);

    res.json({ message: "อัปเดต comment สำเร็จ", comment: formatComment(updatedComment) });
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

    res.json({ message: "ลบ comment สำเร็จ", comment: deletedComment ? formatComment(deletedComment) : null });
  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(500).json({ message: "server error" });
  }
}

module.exports = {
  createcommenttableHandel,
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
};