const pool = require("../config/db");
const path = require("path"); // ต้อง import path
require("dotenv").config()
const DEFAULT_AVATAR = "Profile.png"; 


async function createposttable() {
  await pool.execute(`CREATE TABLE IF NOT EXISTS posts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
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

async function createPost({ user_id, content }) {
  const [result] = await pool.execute(
    `INSERT INTO posts (user_id, content) VALUES (?, ?)`,
    [user_id, content]
  );
  return result.insertId;
}
 
async function getPostById(id) {
  const [rows] = await pool.execute(
    `SELECT p.id, p.content, p.is_deleted, p.deleted_at, p.deleted_by, 
            p.created_at, p.updated_at, u.username, u.avatar_url  
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.id = ? AND p.is_deleted = FALSE`,
    [id]
  );
  return rows.map(post => {
    // ส่งตรง avatar_url ที่มีอยู่ใน DB
    // NULL หรือ '' จะเป็น undefined ใน frontend
    return post;
  });
}

async function getAllPosts() {
  const [rows] = await pool.execute(
    `SELECT p.id, p.content, p.is_deleted, p.deleted_at, p.deleted_by, 
            p.created_at, p.updated_at, u.username, u.avatar_url
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.is_deleted = FALSE
     ORDER BY p.created_at DESC`
  );

  return rows.map(post => {
    // ส่งตรง avatar_url ที่มีอยู่ใน DB
    // NULL หรือ '' จะเป็น undefined ใน frontend
    return post;
  });
}



async function updatePost(id, { title, content }) {
  await pool.execute(
    `UPDATE posts SET content = ? WHERE id = ? AND is_deleted = FALSE`,
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

// ตรวจสอบ userId มีอยู่จริงหรือไม่
async function checkUserExists(userId) {
  const [rows] = await pool.execute(`SELECT id FROM users WHERE id = ?`, [userId]);
  return rows.length > 0;
}

module.exports = {
  createposttable,
  createPost,
  getPostById,
  getAllPosts,
  updatePost,
  softDeletePost,
  checkUserExists
};
