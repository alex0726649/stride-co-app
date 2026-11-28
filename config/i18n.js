const path = require('path');
const i18n = require('i18n');
const locales = ['es', 'en'];
const defaultLocale = 'es';
const LANG_COOKIE = 'lang';
const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;

i18n.configure({
  locales,
  defaultLocale,
  directory: path.join(__dirname, '..', 'locales'),
  objectNotation: true,
  updateFiles: false,
});

function isApiRequest(req) {
  return req.path === '/api' || req.path.startsWith('/api/');
}

function normalize(value) {
  return typeof value === 'string' ? value.toLowerCase().split('-')[0] : null;
}

// Orden de detección:
//   ?lang  ->  cookie `lang` (solo rutas web)  ->  Accept-Language  ->  es
// En las rutas web, un ?lang válido guarda la cookie para conservar el idioma al navegar.
// En /api la cookie se ignora y no se escribe: el comportamiento del Entregable 2 no cambia.
function init(req, res, next) {
  i18n.init(req, res, () => {
    const api = isApiRequest(req);
    const query = req.query.lang;
    let language;

    if (query !== undefined) {
      // Una consulta explícita no soportada (o repetida) usa el idioma por defecto.
      const requested = normalize(query);
      language = locales.includes(requested) ? requested : defaultLocale;
      if (!api && locales.includes(requested)) {
        res.cookie(LANG_COOKIE, requested, {
          maxAge: ONE_YEAR,
          httpOnly: true,
          sameSite: 'lax',
          secure: req.app.get('env') === 'production',
        });
      }
    } else {
      const fromCookie = api ? null : normalize(req.cookies && req.cookies[LANG_COOKIE]);
      language = locales.includes(fromCookie)
        ? fromCookie
        : req.acceptsLanguages(...locales) || defaultLocale;
    }

    req.setLocale(locales.includes(language) ? language : defaultLocale);
    res.locals.locale = req.getLocale();
    res.set('Content-Language', req.getLocale());
    next();
  });
}

module.exports = { init, locales, defaultLocale, LANG_COOKIE };
