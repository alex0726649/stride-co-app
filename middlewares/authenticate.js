const config = require('config');
const { expressjwt } = require('express-jwt');
const { User } = require('../models/relationals');

const verifyToken = expressjwt({
  secret: config.get('jwt.secret'),
  algorithms: ['HS256'],
  issuer: config.get('jwt.issuer'),
  audience: config.get('jwt.audience'),
});

async function loadUser(req, res, next) {
  try {
    const user = await User.findByPk(req.auth.sub);

    if (!user || !user.active) {
      return res.status(401).json({
        message: 'No autorizado',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

const authenticate = [verifyToken, loadUser];

module.exports = { authenticate };