const pool = require("../config/db");

async function likePost(post_id, user_id) {
  await pool.execute(
    `INSERT IGNORE INTO post_likes (post_id, user_id) VALUES (?, ?)`,
    [post_id, user_id]
  );
  return getPostLikesCount(post_id);
}

async function unlikePost(post_id, user_id) {
  await pool.execute(
    `DELETE FROM post_likes WHERE post_id = ? AND user_id = ?`,
    [post_id, user_id]
  );
  return getPostLikesCount(post_id);
}

async function getPostLikesCount(post_id) {
  const [count] = await pool.execute(
    `SELECT COUNT(*) AS totalLikes FROM post_likes WHERE post_id = ?`,
    [post_id]
  );
  return count[0].totalLikes;
}

module.exports = { likePost, unlikePost, getPostLikesCount };
