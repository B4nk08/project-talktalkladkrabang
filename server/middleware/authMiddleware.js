// middleware/authMiddleware.js
const { verifyAccessToken } = require('../utils/jwt');

function requireAuth(req, res, next) {
  const token = (req.header("authorization") || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded; // เก็บ payload ไว้ใช้งาน
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = { requireAuth };
