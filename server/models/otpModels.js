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

async function createOtp({
  user_id = null,
  otp_code,
  purpose,
  expires_at,
  meta = null,
}) {
  const [result] = await pool.execute(
    `INSERT INTO otp_tokens (user_id, otp_code, purpose, expires_at, meta) VALUES (?, ?, ?, ?, ?)`,
    [user_id, otp_code, purpose, expires_at, meta ? JSON.stringify(meta) : null]
  );
  return { id: result.insertId };
}

async function findValidOtp({ user_id = null, otpCode, purpose }) {
  const query = user_id
    ? `SELECT * FROM otp_tokens 
       WHERE user_id = ? 
         AND otp_code = ? 
         AND purpose = ? 
         AND used = 0 
         AND expires_at > UTC_TIMESTAMP()
       ORDER BY id DESC 
       LIMIT 1`
    : `SELECT * FROM otp_tokens 
       WHERE user_id IS NULL 
         AND otp_code = ? 
         AND purpose = ? 
         AND used = 0 
         AND expires_at > UTC_TIMESTAMP()
       ORDER BY id DESC 
       LIMIT 1`;

  const params = user_id ? [user_id, otpCode, purpose] : [otpCode, purpose];
  console.log("Params:", params);
  const [rows] = await pool.execute(query, params);
  return rows[0];
}
async function findValidOtpreset({ user_id = null, otpCode, purpose }) {
  if (otpCode == null || purpose == null) {
    throw new Error("otpCode and purpose are required");
  }

  const query =
    user_id !== null
      ? `SELECT * FROM otp_tokens 
       WHERE user_id = ? 
         AND otp_code = ? 
         AND purpose = ? 
         AND used = 0 
         AND expires_at > UTC_TIMESTAMP()
       ORDER BY id DESC 
       LIMIT 1`
      : `SELECT * FROM otp_tokens 
       WHERE user_id IS NULL 
         AND otp_code = ? 
         AND purpose = ? 
         AND used = 0 
         AND expires_at > UTC_TIMESTAMP()
       ORDER BY id DESC 
       LIMIT 1`;

  const params =
    user_id !== null ? [user_id, otpCode, purpose] : [otpCode, purpose];

  // แปลง undefined → null ป้องกัน error
  const safeParams = params.map((v) => (v === undefined ? null : v));

  const [rows] = await pool.execute(query, safeParams);
  return rows[0] || null;
}

async function markOtpUsed(id) {
  await pool.execute(`UPDATE otp_tokens SET used = 1 WHERE id = ?`, [id]);
}

async function markOtpUsedreset(id) {
  const [result] = await pool.execute(
    `UPDATE otp_tokens SET used = 1, used_at = UTC_TIMESTAMP() WHERE id = ?`,
    [id]
  );
  return result;
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
  createPasswordReset,
  findValidOtpreset,
  markOtpUsedreset
};
