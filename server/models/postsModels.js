const pool = require("../config/db");

async function createposttable() {
  await pool.execute(`CREATE TABLE IF NOT EXISTS posts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  title VARCHAR(255),
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at DATETIME NULL,
  deleted_by BIGINT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (deleted_by) REFERENCES users(id)
        );
    `);
}

async function createPost({ user_id, title, content }) {
  const [result] = await pool.execute(
    `INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)`,
    [user_id, title, content]
  );
  return result.insertId;
}

async function getPostById(id) {
  const [rows] = await pool.execute(
    `SELECT * FROM posts WHERE id = ? AND is_deleted = FALSE`,
    [id]
  );
  return rows[0] || null;
}

async function getAllPosts() {
  const [rows] = await pool.execute(
    `SELECT * FROM posts WHERE is_deleted = FALSE ORDER BY created_at DESC`
  );
  return rows;
}

async function updatePost(id, { title, content }) {
  await pool.execute(
    `UPDATE posts SET title = ?, content = ? WHERE id = ? AND is_deleted = FALSE`,
    [title, content, id]
  );
}

async function softDeletePost(id, deleted_by) {
  await pool.execute(
    `UPDATE posts 
     SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = ? 
     WHERE id = ?`,
    [deleted_by, id]
  );
}

module.exports = { createposttable, createPost, getPostById, getAllPosts, updatePost, softDeletePost };
