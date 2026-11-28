// Datos y utilidades que todas las vistas Pug necesitan.
// Se monta después de i18n, así que res.locals.locale ya está definido.
const { URL } = require('url');

const FLASH_COOKIE = 'flash';
const FLASH_TYPES = ['success', 'info', 'warning', 'danger'];
const KEY_PATTERN = /^[a-zA-Z0-9_.]+$/;
const LOCALE_TAGS = { es: 'es-MX', en: 'en-US' };

function readFlash(req, res) {
  const raw = req.cookies && req.cookies[FLASH_COOKIE];
  if (!raw) return null;
  // Se borra al leerse: el mensaje se muestra una sola vez.
  res.clearCookie(FLASH_COOKIE, { path: '/' });
  try {
    const { type, key } = JSON.parse(raw);
    if (!FLASH_TYPES.includes(type) || typeof key !== 'string' || !KEY_PATTERN.test(key)) return null;
    return { type, message: req.__(key) };
  } catch {
    return null;
  }
}

function viewLocals(req, res, next) {
  const tag = LOCALE_TAGS[res.locals.locale] || LOCALE_TAGS.es;

  res.locals.formatPrice = value => new Intl.NumberFormat(tag, {
    style: 'currency',
    currency: 'MXN',
  }).format(Number(value) || 0);

  res.locals.formatDate = (value, options = { dateStyle: 'medium' }) => {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(tag, options).format(date);
  };

  res.locals.currentPath = req.path;

  // Misma ruta y query string, con otro idioma. Lo usa el selector ES / EN.
  res.locals.langUrl = code => {
    const url = new URL(req.originalUrl, 'http://localhost');
    url.searchParams.set('lang', code);
    return url.pathname + url.search;
  };

  // Mensaje de confirmación de un solo uso (patrón PRG): se guarda en una cookie antes de
  // redirigir y se muestra en la página siguiente. Se guarda la clave de traducción, no el
  // texto, para que salga en el idioma de la página que lo muestra.
  res.flash = (type, key) => {
    res.cookie(FLASH_COOKIE, JSON.stringify({ type, key }), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
  };

  const api = req.path === '/api' || req.path.startsWith('/api/');
  res.locals.flash = !api && req.method === 'GET' ? readFlash(req, res) : null;
  next();
}

module.exports = viewLocals;
