const config = require('config');
const authService = require('../../services/auth.service');
const { fieldErrors, hasErrors } = require('../../utils/validation');
const { cookieOptions } = require('../../utils/session-cookie');

function internalNext(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') &&
    !value.includes('\\') && !Array.from(value).some(char => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127) ? value : '/';
}

function renderLogin(req, res, { status = 200, errors = {}, message = null } = {}) {
  const email = typeof req.body?.email === 'string' ? req.body.email : '';
  return res.status(status).render('auth/login', {
    title: req.__('webAuth.title'), description: req.__('webAuth.description'),
    values: { email }, errors, message,
    nextUrl: internalNext(req.method === 'POST' ? req.body?.next : req.query.next),
    showDemoAccess: req.app.get('env') !== 'production' && config.get('web.showDemoAccess'),
  });
}

function showLogin(req, res) {
  return renderLogin(req, res);
}

async function login(req, res, next) {
  const errors = fieldErrors(req);
  if (hasErrors(errors)) return renderLogin(req, res, { status: 400, errors });
  try {
    const { token } = await authService.login({ email: req.body.email, password: req.body.password });
    res.cookie('access_token', token, cookieOptions(req));
    res.flash('success', 'webAuth.loggedIn');
    return res.redirect(internalNext(req.body.next));
  } catch (error) {
    if (error.status === 401) return renderLogin(req, res, { status: 401, message: req.__('auth.invalidCredentials') });
    return next(error);
  }
}

function logout(req, res) {
  res.clearCookie('access_token', cookieOptions(req));
  res.flash('success', 'webAuth.loggedOut');
  return res.redirect('/');
}

module.exports = { showLogin, login, logout };
