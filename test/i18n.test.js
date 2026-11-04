const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = require('../app');
const { User, Role } = require('../models/relationals');
const es = require('../locales/es.json');
const en = require('../locales/en.json');

function keys(value, prefix = '') {
  return Object.entries(value).flatMap(([key, entry]) => {
    const name = prefix ? `${prefix}.${key}` : key;
    return typeof entry === 'object' && entry !== null ? keys(entry, name) : [name];
  }).sort();
}

function token() {
  return jwt.sign({ sub: '7' }, process.env.JWT_SECRET, {
    algorithm: 'HS256', expiresIn: '15m',
    issuer: process.env.JWT_ISSUER, audience: process.env.JWT_AUDIENCE,
  });
}

it('ambos catálogos tienen exactamente las mismas claves y textos no vacíos', () => {
  expect(keys(es)).toEqual(keys(en));
  function check(value) {
    for (const entry of Object.values(value)) {
      if (typeof entry === 'object' && entry !== null) check(entry);
      else {
        expect(typeof entry).toBe('string');
        expect(entry.trim().length).toBeGreaterThan(0);
      }
    }
  }
  check(es);
  check(en);
});

it.each([
  ['sin preferencia', '', {}, 'es'],
  ['query inglés', '?lang=en', {}, 'en'],
  ['header inglés', '', { 'Accept-Language': 'en' }, 'en'],
  ['query gana al header', '?lang=en', { 'Accept-Language': 'es' }, 'en'],
  ['query español gana al header', '?lang=es', { 'Accept-Language': 'en' }, 'es'],
  ['query regional', '?lang=es-MX', { 'Accept-Language': 'en' }, 'es'],
  ['header regional', '', { 'Accept-Language': 'es-MX' }, 'es'],
  ['query no soportada', '?lang=fr', { 'Accept-Language': 'en' }, 'es'],
  ['header no soportado', '', { 'Accept-Language': 'fr' }, 'es'],
  ['ponderación del header', '', { 'Accept-Language': 'es;q=0.3,en;q=0.9' }, 'en'],
  ['cookie no decide idioma', '', { Cookie: 'lang=en' }, 'es'],
  ['query repetida', '?lang=en&lang=es', {}, 'es'],
])('selección de idioma: %s', async (_label, query, headers, locale) => {
  const response = await request(app).get(`/api/no-existe${query}`).set(headers).expect(404);
  expect(response.headers['content-language']).toBe(locale);
  expect(response.body).toEqual({ message: (locale === 'es' ? es : en).errors.notFound, data: null });
});

describe.each([['es', es], ['en', en]])('mensajes comunes: %s', (locale, catalog) => {
  it('traduce 400 por JSON malformado antes de llegar a las rutas', async () => {
    const response = await request(app).post(`/api/auth/login?lang=${locale}`)
      .set('Content-Type', 'application/json').send('{"privateMarker":').expect(400);
    expect(response.body).toEqual({ message: catalog.errors.invalidJson, data: null });
  });

  it('traduce 401 sin token', async () => {
    const response = await request(app).get(`/api/auth/me?lang=${locale}`).expect(401);
    expect(response.body).toEqual({ message: catalog.errors.unauthorized, data: null });
  });

  it('traduce 401 para usuario inactivo con token válido', async () => {
    User.findByPk.mockResolvedValue({ id: 7, active: false });
    const response = await request(app).get(`/api/auth/me?lang=${locale}`)
      .auth(token(), { type: 'bearer' }).expect(401);
    expect(response.body).toEqual({ message: catalog.errors.unauthorized, data: null });
  });

  it('traduce 403 de authorize con un rol sin permisos', async () => {
    User.findByPk.mockResolvedValue({ id: 7, active: true, role_id: 2 });
    Role.findByPk.mockResolvedValue(null);
    const response = await request(app).delete(`/api/products/1?lang=${locale}`)
      .auth(token(), { type: 'bearer' }).expect(403);
    expect(response.body).toEqual({ message: catalog.errors.forbidden, data: null });
  });

  it('traduce 500 sin revelar detalles del error', async () => {
    User.findOne.mockRejectedValue(new Error('privateMarker'));
    const response = await request(app).post(`/api/auth/login?lang=${locale}`)
      .send({ email: 'demo@example.com', password: 'demo' }).expect(500);
    expect(response.body).toEqual({ message: catalog.errors.internal, data: null });
  });

  it('traduce validación e inicio de sesión correcto', async () => {
    const invalid = await request(app).post(`/api/auth/login?lang=${locale}`).send({}).expect(400);
    expect(invalid.body.message).toBe(catalog.auth.requiredCredentials);
    User.findOne.mockResolvedValue({ id: 7, active: true, password_hash: await bcrypt.hash('demo', 4) });
    const login = await request(app).post(`/api/auth/login?lang=${locale}`)
      .send({ email: 'demo@example.com', password: 'demo' }).expect(200);
    expect(login.body.message).toBe(catalog.auth.loginSuccess);
    expect(login.body.data.token).toEqual(expect.any(String));
  });

  it('traduce las vistas de inicio y error', async () => {
    const home = await request(app).get(`/?lang=${locale}`).expect(200);
    expect(home.text).toContain(catalog.views.welcome.replace('%s', 'Stride &amp; Co'));
    expect(home.text).toContain(`lang="${locale}"`);
    expect(home.text).toMatch(/^<!DOCTYPE html>/);
    const missing = await request(app).get(`/no-existe?lang=${locale}`).expect(404);
    expect(missing.text).toContain(catalog.errors.notFound);
    expect(missing.text).toContain(`${catalog.views.status}: 404`);
  });
});

it('no comparte el idioma entre peticiones', async () => {
  const english = await request(app).get('/api/no-existe?lang=en');
  const spanish = await request(app).get('/api/no-existe');
  expect(english.body.message).toBe(en.errors.notFound);
  expect(spanish.body.message).toBe(es.errors.notFound);
});
