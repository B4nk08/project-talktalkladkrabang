const pool = require("../config/db");

async function creatpassresettable() {
  await pool.execute(`CREATE TABLE IF NOT EXISTS password_resets (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  otp_code VARCHAR(255) NOT NULL,
  attempts INT DEFAULT 0,
  is_used BOOLEAN DEFAULT FALSE,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
        );
    `);
}

// อัปเดตรหัสผ่าน
async function setPassWordHash(userId, hash) {
  const sql = `UPDATE users SET password_hash = ? WHERE id = ?`;
  await pool.execute(sql, [hash, userId]);
  return true;
}


async function setEmailVerified(userId, is_verified = true) {
  await pool.execute(
    `UPDATE users SET is_email_verified = ?, updated_at = NOW() WHERE id = ?`,
    [is_verified ? 1 : 0, userId]
  );
}

module.exports = { creatpassresettable, setPassWordHash, setEmailVerified };
