const service = require('../../services/auth.service');

async function login(req, res, next) {
  try {
    const data = await service.login(req.body || {});
    return res.json({ message: req.__('auth.loginSuccess'), data });
  } catch (error) { next(error); }
}

function me(req, res) {
  return res.json(req.user);
}

module.exports = { login, me };
