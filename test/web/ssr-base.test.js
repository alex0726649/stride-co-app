// Base de las vistas SSR (S3-02): errores web y de API, idioma por cookie, layouts,
// "Próximamente", mensajes de un solo uso, formateadores, validación y mixins.
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const createError = require('http-errors');
const pug = require('pug');
const request = require('supertest');
const { body } = require('express-validator');
const app = require('../../app');
const i18n = require('../../config/i18n');
const viewLocals = require('../../middlewares/viewLocals');
const errorHandler = require('../../middlewares/errorHandler');
const { fieldErrors } = require('../../utils/validation');
const es = require('../../locales/es.json');
const en = require('../../locales/en.json');

const VIEWS = path.join(__dirname, '..', '..', 'views');

// App mínima con la misma cadena de vistas que app.js, para los casos que todavía no tienen
// una ruta real (401, 403, errores, mensajes de un solo uso y validación).
function webApp(env = 'test') {
  const web = express();
  web.set('views', VIEWS);
  web.set('view engine', 'pug');
  web.set('env', env);
  web.use(cookieParser());
  web.use(i18n.init);
  web.use(express.urlencoded({ extended: true }));
  web.use(viewLocals);
  web.get('/privado', (_req, _res, next) => next(createError(401)));
  web.post('/privado', (_req, _res, next) => next(createError(401)));
  web.get('/prohibido', (_req, _res, next) => next(createError(403)));
  web.get('/falla', (_req, _res, next) => next(new Error('privateMarker')));
  web.post('/accion', (_req, res) => {
    res.flash('success', 'products.created');
    res.redirect('/destino');
  });
  web.get('/destino', (_req, res) => res.render('coming-soon'));
  web.post('/formulario',
    body('name').trim().notEmpty().withMessage('products.invalidBody'),
    body('price').isFloat({ min: 0 }).withMessage('products.invalidPrice'),
    (req, res) => res.json(fieldErrors(req)));
  web.get('/formato', (_req, res) => res.json({
    price: res.locals.formatPrice('1899.00'),
    date: res.locals.formatDate('2026-10-29T12:00:00Z', { dateStyle: 'long', timeZone: 'UTC' }),
  }));
  web.use(errorHandler);
  return web;
}

function renderMixin(source, locals = {}) {
  return pug.render(source, {
    filename: path.join(VIEWS, 'prueba.pug'),
    __: key => key,
    formatPrice: value => `$${value}`,
    ...locals,
  });
}

describe('errores web y de API', () => {
  it('una ruta web inexistente responde 404 en HTML', async () => {
    const res = await request(app).get('/no-existe').expect(404);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain(es.pages.errors.notFound.title);
    expect(res.text).toContain(`${es.views.status}: 404`);
  });

  it('/api/no-existe sigue respondiendo 404 en JSON', async () => {
    const res = await request(app).get('/api/no-existe').expect(404);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toEqual({ message: es.errors.notFound, data: null });
  });

  it('un 401 en una ruta web redirige a /login con la URL pedida', async () => {
    const res = await request(webApp()).get('/privado?filtro=1').expect(302);
    expect(res.headers.location).toBe('/login?next=%2Fprivado%3Ffiltro%3D1');
    const post = await request(webApp()).post('/privado').expect(302);
    expect(post.headers.location).toBe('/login?next=%2F');
  });

  it('un 403 renderiza errors/403 con su código', async () => {
    const res = await request(webApp()).get('/prohibido?lang=en').expect(403);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain(en.pages.errors.forbidden.title);
  });

  it('un 500 en producción no muestra el stack ni el mensaje interno', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(webApp('production')).get('/falla').expect(500);
    log.mockRestore();
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain(es.errors.internal);
    expect(res.text).not.toContain('privateMarker');
    expect(res.text).not.toMatch(/at .+\.js:\d+/);
  });

  it('en desarrollo sí muestra el stack para depurar', async () => {
    const res = await request(webApp('development')).get('/falla').expect(500);
    expect(res.text).toContain('privateMarker');
  });
});

describe('idioma en las vistas', () => {
  it('?lang=en guarda la cookie y la siguiente petición sale en inglés', async () => {
    const agent = request.agent(app);
    const first = await agent.get('/no-existe?lang=en').expect(404);
    const cookie = first.headers['set-cookie'].find(value => value.startsWith('lang='));
    expect(cookie).toMatch(/^lang=en;/);
    expect(cookie).toMatch(/HttpOnly/);

    const next = await agent.get('/no-existe').expect(404);
    expect(next.text).toContain('<html lang="en">');
    expect(next.text).toContain(en.pages.errors.notFound.title);
    expect(next.headers['content-language']).toBe('en');
  });

  it('?lang gana a la cookie y un idioma no soportado no se guarda', async () => {
    const res = await request(app).get('/no-existe?lang=es').set('Cookie', 'lang=en').expect(404);
    expect(res.text).toContain('<html lang="es">');
    const unsupported = await request(app).get('/no-existe?lang=fr').expect(404);
    expect(unsupported.headers['set-cookie'] || []).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/^lang=/)]));
  });

  it('en /api la cookie no decide el idioma ni se escribe', async () => {
    const res = await request(app).get('/api/no-existe?lang=en').expect(404);
    expect(res.headers['set-cookie'] || []).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/^lang=/)]));
    const withCookie = await request(app).get('/api/no-existe').set('Cookie', 'lang=en').expect(404);
    expect(withCookie.body.message).toBe(es.errors.notFound);
  });

  it.each([['es', es], ['en', en]])('<html lang> y textos del layout en %s', async (locale, catalog) => {
    const res = await request(app).get(`/cart?lang=${locale}`).expect(200);
    expect(res.text).toContain(`<html lang="${locale}">`);
    expect(res.text).toContain(catalog.nav.products);
    expect(res.text).toContain(catalog.pages.comingSoon.heading);
  });

  it('el selector de idioma conserva la ruta y el query string', async () => {
    const res = await request(app).get('/cart?lang=es&color=negro').expect(200);
    expect(res.text).toContain('href="/cart?lang=en&amp;color=negro"');
  });
});

describe('layout de la tienda', () => {
  it('tiene title, meta description y la misma versión de Bootstrap en CSS y JS', async () => {
    const res = await request(app).get('/my/orders').expect(200);
    expect(res.text).toMatch(/^<!DOCTYPE html>/);
    expect(res.text).toContain(`<title>${es.pages.comingSoon.title} · Stride &amp; Co</title>`);
    expect(res.text).toContain(`<meta name="description" content="${es.pages.comingSoon.text}">`);
    expect(res.text).toContain('bootstrap@5.3.3/dist/css/bootstrap.min.css');
    expect(res.text).toContain('bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js');
    expect(res.text).not.toMatch(/bootstrap@5\.3\.(?!3)/);
  });

  it.each(['/products', '/admin', '/cart', '/my/orders'])('%s responde "Próximamente" con 200', async url => {
    const res = await request(app).get(url).expect(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain(es.pages.comingSoon.heading);
  });

  it('el menú no tiene enlaces vacíos', async () => {
    const res = await request(app).get('/cart').expect(200);
    expect(res.text).not.toContain('href="#"');
  });
});

describe('mensajes de un solo uso', () => {
  it('se muestra en la página a la que se redirige y desaparece al recargar', async () => {
    const agent = request.agent(webApp());
    await agent.post('/accion').expect(302);
    const first = await agent.get('/destino').expect(200);
    expect(first.text).toContain(es.products.created);
    const again = await agent.get('/destino').expect(200);
    expect(again.text).not.toContain(es.products.created);
  });

  it('ignora una cookie manipulada', async () => {
    const res = await request(webApp()).get('/destino')
      .set('Cookie', `flash=${encodeURIComponent('{"type":"x\\" onclick=\\"alert(1)","key":"products.created"}')}`)
      .expect(200);
    expect(res.text).not.toContain(es.products.created);
    expect(res.text).not.toContain('onclick');
  });
});

describe('formateadores y validación', () => {
  it('formatPrice y formatDate dependen del idioma', async () => {
    const spanish = await request(webApp()).get('/formato?lang=es').expect(200);
    const english = await request(webApp()).get('/formato?lang=en').expect(200);
    expect(spanish.body.price).toBe(new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(1899));
    expect(english.body.price).toBe(new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MXN' }).format(1899));
    expect(spanish.body.price).not.toBe(english.body.price);
    expect(spanish.body.date).toBe('29 de octubre de 2026');
    expect(english.body.date).toBe('October 29, 2026');
  });

  it.each([['es', es], ['en', en]])('fieldErrors traduce un error por campo (%s)', async (locale, catalog) => {
    const res = await request(webApp()).post(`/formulario?lang=${locale}`)
      .type('form').send({ name: '  ', price: '-1' }).expect(200);
    expect(res.body).toEqual({ name: catalog.products.invalidBody, price: catalog.products.invalidPrice });
  });
});

describe('mixins', () => {
  it('formField conserva el valor, marca el error y escapa el contenido', () => {
    const html = renderMixin([
      'include mixins/formField',
      "+formField('name', 'Nombre', { value: '<b>Runner</b>', error: 'Obligatorio', required: true })",
    ].join('\n'));
    expect(html).toContain('value="&lt;b&gt;Runner&lt;/b&gt;"');
    expect(html).toContain('class="form-control is-invalid"');
    expect(html).toContain('<div class="invalid-feedback" id="field-name-error">Obligatorio</div>');
  });

  it('formField nunca rellena una contraseña', () => {
    const html = renderMixin([
      'include mixins/formField',
      "+formField('password', 'Contraseña', { type: 'password', value: 'secreta' })",
    ].join('\n'));
    expect(html).not.toContain('secreta');
  });

  it('productCard enlaza al detalle y escapa el nombre', () => {
    const html = renderMixin([
      'include mixins/productCard',
      ".row: +productCard({ id: 7, name: '<i>Velocity</i>', brand: 'Stride', price: '2199.00', category_id: 'Training' })",
    ].join('\n'));
    expect(html).toContain('href="/products/7"');
    expect(html).toContain('&lt;i&gt;Velocity&lt;/i&gt;');
    expect(html).toContain('$2199.00');
  });

  it('table y statusBadge generan la tabla y la insignia', () => {
    const html = renderMixin([
      'include mixins/table',
      'include mixins/statusBadge',
      "+table(['Producto', 'Estado'])",
      '  tr',
      '    td Runner',
      "    td: +statusBadge('soldOut')",
    ].join('\n'));
    expect(html).toContain('<th scope="col">Producto</th>');
    expect(html).toContain('<span class="badge text-bg-danger">common.status.soldOut</span>');
  });
});
