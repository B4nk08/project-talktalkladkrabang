const pool = require("../config/db");

async function createUsers_providersTable() {
  await pool.execute(`CREATE TABLE IF NOT EXISTS user_providers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  provider ENUM('google') NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_provider_user (provider, provider_user_id),
  UNIQUE KEY uq_user_provider (user_id, provider),
  FOREIGN KEY (user_id) REFERENCES users(id)
    );
`);
}
module.exports = { createUsers_providersTable };
