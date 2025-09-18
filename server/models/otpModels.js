const pool = require("../config/db");

async function createotptable() {
  await pool.execute(` CREATE TABLE otp_tokens (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  purpose ENUM('login','verify_email') DEFAULT 'login', 
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

    `);
}

async function createOtp({ user_id, otp_code, purpose, expires_at }) {
  const [result] = await pool.execute(
    `INSERT INTO otp_tokens (user_id, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)`,
    [user_id, otp_code, purpose, expires_at]
  );
  return { id: result.insertId };
}

async function findValidOtp({ user_id, otp_code, purpose }) {
  const [rows] = await pool.execute(
    `SELECT * FROM otp_tokens WHERE user_id = ? AND otp_code = ? AND purpose = ? AND used = 0 AND expires_at > NOW() ORDER BY id DESC LIMIT 1`,
    [user_id, otp_code, purpose]
  );
  return rows[0];
}

async function markOtpUsed(id) {
  await pool.execute(`UPDATE otp_tokens SET used = 1 WHERE id = ?`, [id]);
}

async function createPasswordReset({ user_id, otp_code, expires_at }) {
  const [result] = await pool.execute(
    `INSERT INTO password_resets (user_id, otp_code, expires_at, purpose, created_at) VALUES (?, ?, ?, 'password_reset', NOW())`,
    [user_id, otp_code, expires_at]
  );
  return result.insertId;
}

module.exports = {
  createotptable,
  createOtp,
  findValidOtp,
  markOtpUsed,
  createPasswordReset
};
