const config = require('config');
const { expressjwt } = require('express-jwt');
const { User } = require('../models/relationals');
const createError = require('http-errors');

function getToken(req) {
  const header = req.headers.authorization;
  if (header !== undefined) {
    const match = /^Bearer (\S+)$/i.exec(header);
    if (!match) throw createError(401);
    return match[1];
  }
  return req.cookies?.access_token;
}

const verifyToken = expressjwt({
  secret: config.get('jwt.secret'),
  algorithms: ['HS256'],
  issuer: config.get('jwt.issuer'),
  audience: config.get('jwt.audience'),
  getToken,
});

async function loadUser(req, res, next) {
  try {
    const user = await User.findByPk(req.auth.sub);

    if (!user || !user.active) {
      return next(createError(401));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

const authenticate = [verifyToken, loadUser];

module.exports = { authenticate, getToken };
