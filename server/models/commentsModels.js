const pool = require("../config/db");

async function creatcommenttable() {
  await pool.execute(`CREATE TABLE IF NOT EXISTS comments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    parent_comment_id BIGINT NULL,
    content TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at DATETIME NULL,
    deleted_by BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (parent_comment_id) REFERENCES comments(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
  );`);
}

// --- ดึงคอมเมนต์ทั้งหมดของโพสต์ ---
async function getCommentsByPostId(post_id) {
  const [rows] = await pool.execute(
    `SELECT 
        c.id, 
        c.content, 
        c.created_at, 
        u.username,
        u.avatar_url
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.post_id = ?
     ORDER BY c.created_at ASC`,
    [post_id]
  );
  return rows;
}


// --- เพิ่มคอมเมนต์ใหม่ ---
async function createComment({ post_id, user_id, content }) {
  await pool.execute(
    `INSERT INTO comments (post_id, user_id, content, created_at)
     VALUES (?, ?, ?, NOW())`,
    [post_id, user_id, content]
  );
}

async function getCommentsByPost(post_id) {
  const [rows] = await pool.execute(
    `SELECT * FROM comments WHERE post_id = ? AND is_deleted = FALSE ORDER BY created_at ASC`,
    [post_id]
  );
  return rows;
}

async function updateComment(id, { content }) {
  await pool.execute(
    `UPDATE comments SET content = ? WHERE id = ? AND is_deleted = FALSE`,
    [content, id]
  );
}

async function softDeleteComment(id, deleted_by) {
  await pool.execute(
    `UPDATE comments SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = ? WHERE id = ?`,
    [deleted_by, id]
  );
}

module.exports = {
  creatcommenttable,
  createComment,
  getCommentsByPostId,
  getCommentsByPost,
  updateComment,
  softDeleteComment,
};
