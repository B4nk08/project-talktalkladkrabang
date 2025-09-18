const pool = require("../config/db");

async function createretokentable() {
  await pool.execute(`CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  user_agent VARCHAR(255),
  ip_address VARCHAR(255),
  revoked_at DATETIME NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
        );
    `);
}
async function createRefreshToken({ user_id, token_hash, user_agent = null, ip_address = null, expires_at }) {
  const [result] = await pool.execute(
    `INSERT INTO refresh_tokens (user_id, token_hash, user_agent, ip_address, expires_at, created_at) VALUES (?, ?, ?, ?, ?, NOW())`,
    [user_id, token_hash, user_agent, ip_address, expires_at]
  );
  return result.insertId;
}

async function revokeRefreshTokenByHash(token_hash) {
  await pool.execute(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?`, [token_hash]);
}

async function findRefreshTokenByHash(token_hash) {
  const [rows] = await pool.execute(`SELECT * FROM refresh_tokens WHERE token_hash = ? LIMIT 1`, [token_hash]);
  return rows[0] || null;
}

module.exports = {
  createretokentable,
  createRefreshToken,
  revokeRefreshTokenByHash,
  findRefreshTokenByHash,
};
