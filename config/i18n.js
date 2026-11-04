const path = require('path');
const i18n = require('i18n');
const locales = ['es', 'en'];
const defaultLocale = 'es';

i18n.configure({
  locales,
  defaultLocale,
  directory: path.join(__dirname, '..', 'locales'),
  objectNotation: true,
  updateFiles: false,
});

function init(req, res, next) {
  i18n.init(req, res, () => {
    // Una consulta explícita no soportada usa el idioma por defecto.
    const query = req.query.lang;
    const language = query === undefined
      ? req.acceptsLanguages(...locales) || defaultLocale
      : typeof query === 'string' ? query.toLowerCase().split('-')[0] : defaultLocale;
    req.setLocale(locales.includes(language) ? language : defaultLocale);
    res.locals.locale = req.getLocale();
    res.set('Content-Language', req.getLocale());
    next();
  });
}

module.exports = { init };
