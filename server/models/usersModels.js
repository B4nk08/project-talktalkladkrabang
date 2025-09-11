const pool = require("../config/db");

async function createUsersTable() {
  await pool.execute(`CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) COMMENT 'NULL ถ้าลงทะเบียนด้วย Google',
    role ENUM('user','admin') DEFAULT 'user',
    is_email_verified BOOLEAN DEFAULT FALSE,
    avatar_url VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    last_login_at DATETIME
    );
`);
}

async function createUser({ username, email, password_hash }) {
  const [result] = await pool.execute(
    `INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`,
    [username, email, password_hash]
  );
  return { id: result.insertId };
}

async function findUserByEmail(email) {
  const [rows] = await pool.execute(`SELECT * FROM users WHERE email = ?`, [email]);
  return rows[0];
}

async function findUserById(id) {
  const [rows] = await pool.execute(`SELECT * FROM users WHERE id = ?`, [id]);
  return rows[0];
}

async function updateLastLogin(userId) {
  await pool.execute(`UPDATE users SET last_login_at = NOW() WHERE id = ?`, [userId]);
}

async function markVerified(userId) {
  const [rows] = await pool.query(
    "UPDATE users SET is_email_verified = TRUE WHERE id = ?",
    [userId]
  );
  return rows;
}



module.exports = { createUsersTable, findUserByEmail, createUser, findUserById, updateLastLogin, markVerified };
   