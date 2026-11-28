function cookieOptions(req) {
  return { httpOnly: true, sameSite: 'lax', secure: req.app.get('env') === 'production', path: '/' };
}

module.exports = { cookieOptions };
