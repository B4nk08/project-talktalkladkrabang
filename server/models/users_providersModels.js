const pool = require("../config/db");

// สร้าง table
async function createUserProvidersTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_providers (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT NOT NULL,
      provider ENUM('google') NOT NULL,
      provider_user_id VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_provider_user (provider, provider_user_id),
      UNIQUE KEY uq_user_provider (user_id, provider),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}

// เพิ่ม provider mapping
async function addUserProvider(userId, provider, providerUserId) {
  const [result] = await pool.execute(
    `INSERT INTO user_providers (user_id, provider, provider_user_id)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE provider_user_id = VALUES(provider_user_id)`,
    [userId, provider, providerUserId]
  );
  return result;
}

// หา user จาก provider + provider_user_id
async function findByProvider(provider, providerUserId) {
  const [rows] = await pool.execute(
    `SELECT * FROM user_providers WHERE provider = ? AND provider_user_id = ?`,
    [provider, providerUserId]
  );
  return rows.length > 0 ? rows[0] : null;
}

// หา provider ทั้งหมดของ user
async function findByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT * FROM user_providers WHERE user_id = ?`,
    [userId]
  );
  return rows;
}

async function findProvider(provider, provider_user_id) {
  const [row] = await pool.execute(
    `SELECT * FROM user_providers WHERE provider = ? AND provider_user_id = ? LIMIT 1`,
    [provider, provider_user_id]
  );
  return row[0] || null;
}

async function findProviderByUserId(user_id) {
  const [rows] = await pool.execute(
    `SELECT * FROM user_providers WHERE user_id = ? LIMIT 1`,
    [user_id]
  );
  return rows[0] || null;
}

async function createProvider({ user_id, provider, provider_user_id }) {
  const [result] = await pool.execute(
    `INSERT INTO user_providers (user_id, provider, provider_user_id, created_at)
     VALUES (?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE user_id = user_id`,
    [user_id, provider, provider_user_id]
  );
  return result;
}

module.exports = {
  createUserProvidersTable,
  addUserProvider,
  findByProvider,
  findByUserId,
  findProvider,
  findProviderByUserId,
  createProvider,
};
