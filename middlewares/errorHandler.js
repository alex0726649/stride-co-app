// Manejador central de errores.
//   /api/*  -> JSON { message, data: null }, igual que en el Entregable 2.
//   web     -> 401 redirige a /login?next=<url>; 403, 404 y 500 renderizan su vista con su código.
// El stack solo se muestra en desarrollo.

function isApiRequest(req) {
  return req.path === '/api' || req.path.startsWith('/api/');
}

const API_KEYS = {
  401: 'errors.unauthorized',
  403: 'errors.forbidden',
  404: 'errors.notFound',
};

const WEB_VIEWS = {
  403: { view: 'errors/403', key: 'errors.forbidden' },
  404: { view: 'errors/404', key: 'errors.notFound' },
};

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = err.status || err.statusCode || 500;

  if (isApiRequest(req)) {
    const keys = {
      ...API_KEYS,
      400: err.type === 'entity.parse.failed' ? 'errors.invalidJson' : 'errors.badRequest',
    };
    const message = req.__(err.messageKey || keys[status] || 'errors.internal');
    return res.status(status).json({ message, data: null });
  }

  if (status === 401) {
    const target = req.method === 'GET' ? req.originalUrl : '/';
    return res.redirect(`/login?next=${encodeURIComponent(target)}`);
  }

  if (status >= 500 && req.app.get('env') !== 'test') console.error(err);

  const page = WEB_VIEWS[status] || {
    view: 'errors/500',
    key: status === 400 ? 'errors.badRequest' : 'errors.internal',
  };
  res.status(status);
  return res.render(page.view, {
    status,
    message: req.__(page.key),
    stack: req.app.get('env') === 'development' ? err.stack : null,
  });
}

module.exports = errorHandler;
