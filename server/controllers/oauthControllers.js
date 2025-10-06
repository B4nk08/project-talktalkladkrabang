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
      return res
        .status(400)
        .json({ message: "idToken (or credential) required" });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    // หาว่ามี provider mapping อยู่หรือยัง
    let provider = await users_providersModels.findByProvider("google", sub);

    let user;
    if (provider && provider.user_id) {
      // เคส: provider เจอแล้ว → หาผู้ใช้
      user = await usersModels.findUserById(provider.user_id);
    } else {
      // เคส: ยังไม่มี provider → เช็คว่ามี user ในระบบด้วย email ไหม
      let existingUser = await usersModels.findUserByEmail(email);

      if (existingUser) {
        const existingProvider = await users_providersModels.findByUserId(existingUser.id);
        const hasProvider = existingProvider && existingProvider.length > 0;
        if (!hasProvider) {
          return res.status(403).json({
            message : "คุณlogin ด้วย username/password ไม่สามารถlogin ด้วย google ได้"
          })
        }
      }

      if (!existingUser) {
        const { id: userId } = await usersModels.createUser({
          email,
          username: name,
          password_hash: null,
          is_email_verified: true,
          avatar_url: picture,
        });
        existingUser = await usersModels.findUserById(userId);
      }

      user = existingUser;

      // ผูก provider กับ user
      await users_providersModels.createProvider({
        user_id: user.id,
        provider: "google",
        provider_user_id: sub,
      });
    }

    if (!user || !user.id) {
      return res
        .status(500)
        .json({ message: "ไม่สามารถสร้างหรือดึงข้อมูลผู้ใช้ได้" });
    }

    // สร้าง access + refresh token
    const accessToken = signAccessToken({ sub: user.id, role: "user" }, "1h");

    const refreshToken = generationRefreshToken();
    const hashedToken = hashToken(refreshToken);

    await createRefreshToken({
      user_id: user.id,
      token_hash: hashedToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 วัน
      user_agent: req.headers["user-agent"] || "",
      ip_address: req.ip || "",
      revoked_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    res.json({ accessToken, refreshToken, user });
  } catch (err) {
    console.error("Google OAuth error:", err);
    res.status(500).json({ message: "Google OAuth failed" });
  }
}

module.exports = { googleSignIn };
