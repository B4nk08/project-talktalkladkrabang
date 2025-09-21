// utils/jwt.js
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'secret';
const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
const crypto = require("crypto")
require("dotenv").config()



function signAccessToken(payload, expiresIn = "15m") {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function generationRefreshToken(){
  return crypto.randomBytes(48).toString("hex")
}

function hashToken(token){
  return crypto.createHash("sha256").update(token).digest("hex");
}


module.exports = { signAccessToken, verifyAccessToken, generationRefreshToken, hashToken };
