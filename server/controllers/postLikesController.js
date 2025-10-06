const { likePost, unlikePost, getPostLikesCount } = require("../models/postLikesModel");

async function handleLike(req, res) {
  try {
    const post_id = req.params.id;
    const user_id = req.user.id;
    const totalLikes = await likePost(post_id, user_id);
    res.json({ message: "Liked", totalLikes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

async function handleUnlike(req, res) {
  try {
    const post_id = req.params.id;
    const user_id = req.user.id;
    const totalLikes = await unlikePost(post_id, user_id);
    res.json({ message: "Unliked", totalLikes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

async function handleGetLikes(req, res) {
  try {
    const post_id = req.params.id;
    const totalLikes = await getPostLikesCount(post_id);
    res.json({ totalLikes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { handleLike, handleUnlike, handleGetLikes };
