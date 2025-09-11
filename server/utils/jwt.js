// utils/jwt.js
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'secret';
const expiresIn = process.env.JWT_EXPIRES_IN || '1h';

function signAccessToken(payload) {
  return jwt.sign(payload, secret, { expiresIn });
}

function verifyAccessToken(token) {
  return jwt.verify(token, secret);
}

module.exports = { signAccessToken, verifyAccessToken };
