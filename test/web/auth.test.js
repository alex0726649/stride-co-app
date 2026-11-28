const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const config = require('config');
const createError = require('http-errors');
const app = require('../../app');
const authService = require('../../services/auth.service');
const { User, Role } = require('../../models/relationals');
const { authenticate } = require('../../middlewares/authenticate');
const { authorize } = require('../../middlewares/authorize');
const webSession = require('../../middlewares/webSession');
const viewLocals = require('../../middlewares/viewLocals');
const errorHandler = require('../../middlewares/errorHandler');
const i18n = require('../../config/i18n');
const es = require('../../locales/es.json');
const en = require('../../locales/en.json');

const user = { id: 7, active: true, role_id: 1, first_name: 'Ana', last_name: 'Demo', email: 'ana@example.com', password_hash: 'private-hash', salt_key: 'private-salt' };
const credentials = { email: user.email, password: ' secret ' };
const sessionUser = authService.sessionUser;
let loginSpy;
let sessionSpy;

function token(options = {}) {
  return jwt.sign({ sub: '7' }, config.get('jwt.secret'), {
    expiresIn: '15m', issuer: config.get('jwt.issuer'), audience: config.get('jwt.audience'), ...options,
  });
}

function cookies(res) {
  return res.headers['set-cookie'] || [];
}

// Rutas de prueba: las pantallas protegidas del panel se implementan en S3-07/08.
function protectedApp() {
  const web = express();
  web.set('env', 'test');
  web.set('views', path.join(__dirname, '../../views'));
  web.set('view engine', 'pug');
  web.use(cookieParser());
  web.use(i18n.init);
  web.use(viewLocals);
  web.use(webSession);
  web.get('/privado', authenticate, authorize('products', 'update', 'any'), (_req, res) => res.render('coming-soon'));
  web.get('/session', (_req, res) => res.json({
    user: res.locals.currentUser,
    canRead: res.locals.can('products', 'read', 'any'),
    canUpdate: res.locals.can('products', 'update', 'any'),
    invalid: res.locals.can('products', 'invalid', 'any'),
  }));
  web.use(errorHandler);
  return web;
}

beforeEach(() => {
  loginSpy = jest.spyOn(authService, 'login').mockResolvedValue({ token: token() });
  sessionSpy = jest.spyOn(authService, 'sessionUser').mockImplementation(sessionUser);
  User.findByPk.mockResolvedValue(user);
  Role.findByPk.mockResolvedValue({ name: 'custom-role', permissions: [{ key: 'products:read:any' }, { key: 'products:update:any' }] });
});

afterEach(() => {
  loginSpy.mockRestore();
  sessionSpy.mockRestore();
});

describe('login SSR', () => {
  it.each([['es', es], ['en', en]])('renderiza título, descripción y formulario en %s sin datos privados', async (lang, catalog) => {
    const res = await request(app).get(`/login?lang=${lang}&next=%2Fprivado`).expect(200).expect('Content-Type', /html/);
    expect(res.text).toContain(`<html lang="${lang}">`);
    expect(res.text).toContain(catalog.webAuth.heading);
    expect(res.text).toContain(`<meta name="description" content="${catalog.webAuth.description.replace(/&/g, '&amp;')}">`);
    expect(res.text).toContain('method="post"');
    expect(res.text).toContain('name="next" value="/privado"');
    expect(res.text).not.toMatch(/password_hash|salt_key|private-hash|private-salt/);
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it('campos vacíos devuelven errores por campo con 400', async () => {
    const res = await request(app).post('/login').type('form').send({ email: '', password: ' ' }).expect(400);
    expect(res.text).toContain(es.webAuth.emailRequired);
    expect(res.text).toContain(es.webAuth.passwordRequired);
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it('email inválido conserva el valor escapado y nunca la contraseña', async () => {
    const res = await request(app).post('/login?lang=en').type('form')
      .send({ email: '<script>@', password: 'do-not-echo', next: '/privado' }).expect(400);
    expect(res.text).toContain(en.webAuth.emailInvalid);
    expect(res.text).toContain('&lt;script&gt;@');
    expect(res.text).not.toContain('do-not-echo');
    expect(res.text).toContain('name="next" value="/privado"');
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it.each([{ email: ['a', 'b'], password: 'secret' }, { email: user.email, password: { value: 'secret' } }])('rechaza tipos no válidos: %p', async data => {
    await request(app).post('/login').send(data).expect(400);
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it.each(['incorrectas', 'inactivo'])('credenciales %s regresan al formulario con 401 traducido', async () => {
    loginSpy.mockRejectedValue(createError(401));
    const res = await request(app).post('/login?lang=en').type('form').send(credentials).expect(401);
    expect(res.text).toContain(en.auth.invalidCredentials);
    expect(res.text).toContain(user.email);
    expect(res.text).not.toContain(credentials.password);
    expect(cookies(res)).not.toEqual(expect.arrayContaining([expect.stringMatching(/^access_token=/)]));
  });

  it('usa el servicio compartido, guarda cookie HttpOnly y redirige a next interno', async () => {
    const res = await request(app).post('/login').type('form').send({ ...credentials, email: ` ${user.email} `, next: '/privado?filtro=1' }).expect(302);
    expect(loginSpy).toHaveBeenCalledWith(credentials);
    expect(res.headers.location).toBe('/privado?filtro=1');
    const cookie = cookies(res).find(value => value.startsWith('access_token='));
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(cookie).toMatch(/Path=\//);
    expect(cookie).not.toMatch(/Secure/);
  });

  it.each(['https://evil.example', '//evil.example', '/\\evil.example', '/\t/evil.example', '', ['/', '/privado']])('ignora next externo o inválido: %p', async next => {
    const res = await request(app).post('/login').send({ ...credentials, next }).expect(302);
    expect(res.headers.location).toBe('/');
  });

  it('el next externo del GET tampoco se conserva en el formulario', async () => {
    const res = await request(app).get('/login?next=https://evil.example').expect(200);
    expect(res.text).toContain('name="next" value="/"');
    expect(res.text).not.toContain('name="next" value="https://evil.example"');
  });

  it('muestra el acceso demo fuera de producción y lo oculta en producción', async () => {
    const normal = await request(app).get('/login').expect(200);
    expect(normal.text).toContain(es.webAuth.demoTitle);
    app.set('env', 'production');
    try {
      const res = await request(app).get('/login').expect(200);
      expect(res.text).not.toContain(es.webAuth.demoTitle);
      expect(res.text).not.toContain('StrideDemo-Admin-2026!');
      const login = await request(app).post('/login').send(credentials).expect(302);
      expect(cookies(login).find(value => value.startsWith('access_token='))).toMatch(/Secure/);
    } finally { app.set('env', 'test'); }
  });

  it('un fallo del servicio llega al manejador sin detalles internos', async () => {
    loginSpy.mockRejectedValue(new Error('private-hash'));
    const res = await request(app).post('/login?lang=en').send(credentials).expect(500);
    expect(res.text).toContain(en.errors.internal);
    expect(res.text).not.toContain('private-hash');
  });
});

describe('sesión web y autorización', () => {
  it('una página protegida sin sesión redirige a login conservando la URL', async () => {
    const res = await request(protectedApp()).get('/privado?filtro=1').expect(302);
    expect(res.headers.location).toBe('/login?next=%2Fprivado%3Ffiltro%3D1');
  });

  it('acepta JWT en cookie y limita los datos de sesión a nombre y email', async () => {
    const web = protectedApp();
    await request(web).get('/privado').set('Cookie', `access_token=${token()}`).expect(200);
    const res = await request(web).get('/session').set('Cookie', `access_token=${token()}`).expect(200);
    expect(res.body).toEqual({ user: { name: 'Ana Demo', email: user.email }, canRead: true, canUpdate: true, invalid: false });
    expect(res.text).not.toMatch(/password_hash|salt_key|private-hash|private-salt/);
  });

  it('sin permiso devuelve 403 HTML y can refleja los permisos de la BD', async () => {
    Role.findByPk.mockResolvedValue({ name: 'renamed-role', permissions: [{ key: 'products:read:any' }] });
    const web = protectedApp();
    const res = await request(web).get('/privado?lang=en').set('Cookie', `access_token=${token()}`).expect(403);
    expect(res.text).toContain(en.pages.errors.forbidden.title);
    const session = await request(web).get('/session').set('Cookie', `access_token=${token()}`).expect(200);
    expect(session.body).toMatchObject({ canRead: true, canUpdate: false });
  });

  it.each(['invalid', 'expired', 'inactive', 'deleted'])('ignora y borra una sesión %s', async reason => {
    if (reason === 'inactive') User.findByPk.mockResolvedValue({ ...user, active: false });
    if (reason === 'deleted') User.findByPk.mockResolvedValue(null);
    const access = reason === 'invalid' ? 'invalid-token' : token(reason === 'expired' ? { expiresIn: -1 } : {});
    const res = await request(protectedApp()).get('/session').set('Cookie', `access_token=${access}`).expect(200);
    expect(res.body.user).toBeNull();
    expect(res.body.canRead).toBe(false);
    expect(cookies(res).find(value => value.startsWith('access_token='))).toMatch(/Expires=Thu, 01 Jan 1970/);
  });

  it('un fallo de BD no se confunde con cookie inválida', async () => {
    sessionSpy.mockRejectedValue(new Error('private database detail'));
    await request(protectedApp()).get('/session').set('Cookie', `access_token=${token()}`).expect(500);
  });

  it('la API sigue aceptando Bearer y admite cookie; el encabezado tiene prioridad', async () => {
    await request(app).get('/api/auth/me').set('Cookie', `access_token=${token()}`).expect(200);
    await request(app).get('/api/auth/me').auth(token(), { type: 'bearer' }).set('Cookie', 'access_token=invalid').expect(200);
    await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalid').set('Cookie', `access_token=${token()}`).expect(401);
    expect(sessionSpy).not.toHaveBeenCalled();
  });

  it('el header ofrece cierre por POST sin JavaScript y logout borra la cookie', async () => {
    const agent = request.agent(app);
    await agent.post('/login').send(credentials).expect(302);
    const page = await agent.get('/cart').expect(200);
    expect(page.text).toContain('method="post" action="/logout"');
    const logout = await agent.post('/logout').expect(302);
    expect(logout.headers.location).toBe('/');
    expect(cookies(logout).find(value => value.startsWith('access_token='))).toMatch(/Expires=Thu, 01 Jan 1970/);
    const again = await agent.get('/cart').expect(200);
    expect(again.text).not.toContain('action="/logout"');
  });

  it('las confirmaciones de login y logout aparecen una sola vez', async () => {
    const agent = request.agent(app);
    await agent.post('/login').send({ ...credentials, next: '/cart' }).expect(302);
    expect((await agent.get('/cart')).text).toContain(es.webAuth.loggedIn);
    expect((await agent.get('/cart')).text).not.toContain(es.webAuth.loggedIn);
    await agent.post('/logout').expect(302);
    expect((await agent.get('/cart')).text).toContain(es.webAuth.loggedOut);
    expect((await agent.get('/cart')).text).not.toContain(es.webAuth.loggedOut);
  });
});
