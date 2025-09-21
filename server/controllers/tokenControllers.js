const { signAccessToken, hashToken } = require("../utils/jwt");
const { findRefreshTokenByHash } = require("../models/refresh_tokensModels");

async function refreshAccessToken(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: "refreshToken required" });

    const hashed = hashToken(refreshToken);
    const tokenRow = await findRefreshTokenByHash(hashed);
    if (!tokenRow) return res.status(401).json({ message: "Invalid refresh token" });
    if (tokenRow.revoked_at || new Date(tokenRow.expires_at) < new Date())
      return res.status(401).json({ message: "Refresh token expired or revoked" });

    const accessToken = signAccessToken({ sub: tokenRow.user_id }, "1h");
    res.json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
}

module.exports = { refreshAccessToken };
