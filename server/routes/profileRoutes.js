const express = require("express");
const upload = require("../middleware/upload"); // import ตัวนี้
const { updateUserAvatar } = require("../models/usersModels");
const { requireAuth, requireAut111 } = require("../middleware/authMiddleware");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

router.put("/avatar", requireAut111, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // Upload ไป Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "avatars",
      public_id: `${req.user.id}_${Date.now()}`,
      overwrite: true,
    });

    // result.secure_url คือ URL ของรูป
    const avatarUrl = result.secure_url;

    // อัปเดต database
    await updateUserAvatar(req.user.id, avatarUrl);

    res.json({ message: "Avatar updated", avatar_url: avatarUrl });
  } catch (err) {
    console.error("❌ update avatar error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



module.exports = router;
