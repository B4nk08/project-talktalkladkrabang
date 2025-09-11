const pool = require("../config/db");

async function creatmoderlogtable() {
  await pool.execute(`CREATE TABLE IF NOT EXISTS moderation_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  admin_user_id BIGINT NOT NULL,
  target_type ENUM('post','comment') NOT NULL,
  target_id BIGINT NOT NULL,
  action ENUM('delete','restore','edit','ban_user','unban_user') NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_user_id) REFERENCES users(id)
        );
    `);
}

module.exports = { creatmoderlogtable };