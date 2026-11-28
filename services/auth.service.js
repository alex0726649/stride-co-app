const config = require('config');
const jwt = require('jsonwebtoken');
const { User } = require('../models/relationals');
const { verifyPassword } = require('../utils/password');
const serviceError = require('./service-error');

function signToken(user) {
  return jwt.sign({ sub: String(user.id) }, config.get('jwt.secret'), {
    expiresIn: config.get('jwt.expiresIn'), issuer: config.get('jwt.issuer'),
    audience: config.get('jwt.audience'), algorithm: 'HS256',
  });
}

async function login({ email, password } = {}) {
  if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password.trim()) {
    throw serviceError(400, 'auth.requiredCredentials');
  }
  const user = await User.findOne({ where: { email } });
  if (!user || !user.active || !await verifyPassword(password, user.password_hash)) {
    throw serviceError(401, 'auth.invalidCredentials');
  }
  return { token: signToken(user), token_type: 'Bearer', expiresIn: config.get('jwt.expiresIn') };
}

module.exports = { login };
