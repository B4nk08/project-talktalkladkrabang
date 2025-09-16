const { OAuth2Client } = require("google-auth-library");
const usersprovidersModels = require("../models/users_providersModels");
const usersModels = require("../models/usersModels");
const { signAccessToken } = require("../utils/jwt");
require("dotenv").config()

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function loginWithGoogle(req, res) {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: "Missing credential" });

    console.log("log in with google")

    // Verify token กับ Google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const googleId = payload.sub;
    const username = payload.name;

    // ตรวจสอบ mapping ใน user_providers
    let providerRow = await usersprovidersModels.findByProvider("google", googleId);
    let userId;

    if (providerRow) {
      userId = providerRow.user_id;
    } else {
      // ถ้ายังไม่มี user → check email ก่อน
      let existingUser = await usersModels.findUserByEmail(email);
      if (!existingUser) {
        const newUser = await usersModels.createUser({
          username,
          email,
          password_hash: null,
          is_verified: true,
        });
        userId = newUser.id;
      } else {
        userId = existingUser.id;
      }

      // สร้าง mapping
      await usersprovidersModels.addUserProvider(userId, "google", googleId);
    }

    // สร้าง JWT
    const accessToken = signAccessToken({ sub: userId, role: "user" }, "1h");

    return res.json({ message: "Login with Google สำเร็จ", accessToken, userId });
  } catch (err) {
    console.error("Google Login error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
}

module.exports = { loginWithGoogle };
