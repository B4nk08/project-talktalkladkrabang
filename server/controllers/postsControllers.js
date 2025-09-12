const postsModels = require("../models/postsModels");

// helper แปลงเวลาเป็น ISO string
function formatPost(post) {
  return {
    ...post,
    created_at: post.created_at ? post.created_at.toISOString() : null,
    updated_at: post.updated_at ? post.updated_at.toISOString() : null,
    deleted_at: post.deleted_at ? post.deleted_at.toISOString() : null,
  };
}

// สร้าง table posts (ใช้ครั้งเดียว)
async function createposttableHandel(req, res) {
  try {
    await postsModels.createposttable();
    res.json({ message: "create table success" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// สร้าง post
async function createPost(req, res) {
  try {
    const { title, content } = req.body;
    const userId = req.user.sub;

    if (!content) return res.status(400).json({ message: "content จำเป็น" });

    const postId = await postsModels.createPost({
      user_id: userId,
      title,
      content,
    });
    const newPost = await postsModels.getPostById(postId);

    res
      .status(201)
      .json({ message: "สร้างโพสต์สำเร็จ", post: formatPost(newPost) });
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ message: "server error" });
  }
}

// ดึงโพสต์ทั้งหมด
async function getPosts(req, res) {
  try {
    const posts = await postsModels.getAllPosts();
    res.json({ posts: posts.map(formatPost) });
  } catch (err) {
    console.error("Get posts error:", err);
    res.status(500).json({ message: "server error" });
  }
}

// ดึงโพสต์เดี่ยว
async function getPost(req, res) {
  try {
    const { id } = req.params;
    const post = await postsModels.getPostById(id);
    if (!post) return res.status(404).json({ message: "ไม่พบโพสต์" });

    res.json({ post: formatPost(post) });
  } catch (err) {
    console.error("Get post error:", err);
    res.status(500).json({ message: "server error" });
  }
}

// อัปเดตโพสต์
async function updatePost(req, res) {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    await postsModels.updatePost(id, { title, content });
    const updatedPost = await postsModels.getPostById(id);

    res.json({ message: "อัปเดตโพสต์สำเร็จ", post: formatPost(updatedPost) });
  } catch (err) {
    console.error("Update post error:", err);
    res.status(500).json({ message: "server error" });
  }
}

// ลบโพสต์ (soft delete)
async function deletePost(req, res) {
  try {
    const { id } = req.params;
    const deleted_by = req.user.sub;

    await postsModels.softDeletePost(id, deleted_by);
    const deletedPost = await postsModels.getPostById(id);

    res.json({
      message: "ลบโพสต์สำเร็จ",
      post: deletedPost ? formatPost(deletedPost) : null,
    });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ message: "server error" });
  }
}

module.exports = {
  createposttableHandel,
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost
};

