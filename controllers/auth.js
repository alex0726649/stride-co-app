const config = require('config');
const { User } = require('../models/relationals');
const { verifyPassword } = require('../utils/password');
const jwt = require('jsonwebtoken');

function signToken(user) {
  const jwtOptions = {
    expiresIn: config.get('jwt.expiresIn'),
    issuer: config.get('jwt.issuer'),
    audience: config.get('jwt.audience'),
    algorithm: 'HS256',
  };

  const secret = config.get('jwt.secret');
  return jwt.sign({ sub: String(user.id) }, secret, jwtOptions);
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      !password.trim()
    ) {
      return res.status(400).json({
        message: req.__('auth.requiredCredentials'),
        data: null,
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !user.active) {
      return res.status(401).json({
        message: req.__('auth.invalidCredentials'),
        data: null,
      });
    }
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({
        message: req.__('auth.invalidCredentials'),
        data: null,
      });
    }

    res.json({
      message: req.__('auth.loginSuccess'),
      data: {
        token: signToken(user),
        token_type: 'Bearer',
        expiresIn: config.get('jwt.expiresIn'),
      },
    });
  } catch (error) {
    // Express 4 no atrapa errores de funciones async: sin esto la petición se queda colgada
    next(error);
  }
}

function me(req, res) {
  return res.json(req.user);
}

module.exports = { login, me };
