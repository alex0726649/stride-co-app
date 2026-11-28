const authService = require('../services/auth.service');
const { loadRoleAccess, parsePermissionKey } = require('../utils/rbac');
const { cookieOptions } = require('../utils/session-cookie');

async function webSession(req, res, next) {
  if (req.path === '/api' || req.path.startsWith('/api/') || req.path === '/health') return next();
  res.locals.currentUser = null;
  res.locals.can = () => false;
  const token = req.cookies?.access_token;
  if (!token) return next();

  try {
    const user = await authService.sessionUser(token);
    const roleAccess = await loadRoleAccess(user.role_id);
    req.user = user;
    res.locals.currentUser = {
      name: [user.first_name, user.last_name].filter(Boolean).join(' '), email: user.email,
    };
    res.locals.can = (resource, action, possession) => {
      if (!parsePermissionKey(`${resource}:${action}:${possession}`) ||
          !roleAccess?.accessControl.hasRole(roleAccess.roleName)) return false;
      const checker = roleAccess.accessControl.can(roleAccess.roleName);
      return checker[`${action}Any`](resource).granted ||
        (possession === 'own' && checker[`${action}Own`](resource).granted);
    };
    return next();
  } catch (error) {
    if (error.status === 401) {
      res.clearCookie('access_token', cookieOptions(req));
      delete req.cookies.access_token;
      return next();
    }
    return next(error);
  }
}

module.exports = webSession;
