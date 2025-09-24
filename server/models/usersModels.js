const pool = require("../config/db");

async function createUsersTable() {
  await pool.execute(`
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) DEFAULT NULL COMMENT 'NULL ถ้าลงทะเบียนด้วย Google',
  role ENUM('user','admin') DEFAULT 'user',
  is_email_verified TINYINT(1) DEFAULT 0,
  avatar_url VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at DATETIME DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

  `);
}

// ใช้สำหรับสมัครสมาชิกใหม่
async function createUser({
  email,
  username,
  password_hash,
  is_email_verified = false,
  avatar_url = null,
}) {
  const [result] = await pool.execute(
    `INSERT INTO users (email, username, password_hash, is_email_verified, avatar_url)
     VALUES (?, ?, ?, ?, ?)`,
    [
      email ?? null,
      username ?? null,
      password_hash ?? null,
      is_email_verified ? 1 : 0,
      avatar_url ?? null,
    ]
  );
  return { id: result.insertId }; // ✅ return เป็น object
}

// หา user ด้วย email and username
async function findUserByEmailOrUsername(identifier) {
  if (!identifier) throw new Error("identifier is required");
  const [rows] = await pool.execute(
    `SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1`,
    [identifier, identifier]
  );
  return rows[0];
}

async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT * FROM users WHERE email = ? LIMIT 1`,
    [email]
  );
  return rows[0];
}

// หา user ด้วย id
async function findUserById(id) {
  const [rows] = await pool.execute(`SELECT * FROM users WHERE id = ?`, [id]);
  return rows[0];
}

// อัปเดต last login
async function updateLastLogin(userId) {
  await pool.execute(`UPDATE users SET last_login_at = NOW() WHERE id = ?`, [
    userId,
  ]);
}

// ยืนยัน email
async function markVerified(userId) {
  await pool.execute(`UPDATE users SET is_email_verified = TRUE WHERE id = ?`, [
    userId,
  ]);
}

// หา user จาก username
async function findUserByUsername(username) {
  const [rows] = await pool.query(`SELECT * FROM users WHERE username = ?`, [
    username,
  ]);
  return rows[0];
}

// อัปเดต username + updated_at
async function updateUsername(userId, newUsername) {
  const [result] = await pool.query(
    `UPDATE users SET username = ? WHERE id = ?`,
    [newUsername, userId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  createUsersTable,
  createUser,
  findUserByEmail,
  findUserByEmailOrUsername,
  findUserById,
  updateLastLogin,
  markVerified,
  findUserByEmail,
  updateUsername,
  findUserByUsername,
};
