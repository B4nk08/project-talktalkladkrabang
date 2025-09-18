require("dotenv").config();
const { OAuth2Client } = require("google-auth-library");
const usersModels = require("../models/usersModels");
const users_providersModels = require("../models/users_providersModels");
const {
  signAccessToken,
  generationRefreshToken,
  hashToken,
} = require("../utils/jwt");
const { createRefreshToken } = require("../models/refresh_tokensModels");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function googleSignIn(req, res) {
  try {
    const { idToken, credential } = req.body;
    const token = idToken || credential;

    if (!token) {
      return res.status(400).json({ message: "idToken required" });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    // หา provider ว่ามีอยู่แล้วหรือไม่
    let provider = await users_providersModels.findProviderByUserId(
      "google",
      sub
    );

    let user;
    if (provider) {
      // ถ้ามี provider -> ดึง user
      user = await usersModels.findUserById(provider.user_id);
    } else {
      // ถ้ายังไม่มี provider
      let existingUser = await usersModels.findUserByEmail(email);

      if (!existingUser) {
        // สร้าง user ใหม่
        const userId = await usersModels.createUser({
          email,
          username: name,
          password_hash: null,
          is_email_verified: true,
          avatar_url: picture,
        });
        existingUser = await usersModels.findUserById(userId);
      }

      user = existingUser;

      // ตรวจสอบอีกทีว่ามี provider หรือยัง (เพื่อหลีกเลี่ยง duplicate)
      const providerExists = await users_providersModels.findProviderByUserId(
        "google",
        sub
      );

      if (!providerExists) {
        await users_providersModels.createProvider({
          user_id: user.id,
          provider: "google",
          provider_user_id: sub,
        });
      }
    }

    // สร้าง access token
    const accessToken = signAccessToken({ sub: user.id, role: user.role });

    // สร้าง refresh token
    const refreshToken = generationRefreshToken();
    const hashedToken = hashToken(refreshToken);

    // บันทึก refresh token ลงฐานข้อมูล
    await createRefreshToken({
      user_id: user.id,
      token_hash: hashedToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 วัน
      user_agent: req.headers["user-agent"] || "",
      ip_address: req.ip || "",
    });

    res.json({ accessToken, refreshToken, user });
  } catch (err) {
    console.error("Google OAuth error:", err);
    res.status(500).json({ message: "Google OAuth failed" });
  }
}

module.exports = { googleSignIn };
