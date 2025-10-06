const cloudinary = require("../config/cloudinary");
const { updateUserAvatar } = require("../models/usersModels");

async function ProfilePicture(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "กรุณาเลือกไฟล์" });
    }

    // อัปโหลดไป Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "profile_pictures" },
      async (err, uploaded) => {
        if (err) return res.status(500).json({ message: "Upload fail", error: err });

        // อัปเดต URL ลง DB
        await updateUserAvatar(req.user.id, uploaded.secure_url);

        res.json({
          profilePicUrl: uploaded.secure_url,
          message: "อัพโหลดสำเร็จ",
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}


module.exports = { ProfilePicture };
