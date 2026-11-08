const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = require('../app');
const { User } = require('../models/relationals');

let record;
beforeEach(async () => {
  record = User.build({ id: 7, first_name: 'Ana', last_name: 'Prueba', email: 'ana@example.com',
    active: true, password_hash: await bcrypt.hash('Clave123!', 4), salt_key: 'private-salt' });
});
const credentials = { email: 'ana@example.com', password: 'Clave123!' };
function token(options = {}, secret = process.env.JWT_SECRET) {
  return jwt.sign({ sub: '7' }, secret, {
    algorithm: 'HS256', expiresIn: '15m', issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE, ...options,
  });
}
function safe(data) {
  for (const field of ['password', 'password_hash', 'salt_key']) expect(data).not.toHaveProperty(field);
}

it.each([{}, { email: 'a' }, { password: 'b' }, { email: 42, password: 'b' },
  { email: ' ', password: 'b' }, { email: 'a', password: ' ' }])('login incompleto %p: 400 sin consultar SQL', async body => {
  await request(app).post('/api/auth/login').send(body).expect(400);
  expect(User.findOne).not.toHaveBeenCalled();
});

describe.each([
  ['sin cookie (español predeterminado)', null, 'credenciales invalidas'],
  ['español', 'es', 'credenciales invalidas'],
  ['inglés', 'en', 'Invalid Credentials'],
])('credenciales incorrectas: %s', (_label, language, message) => {
it.each(['desconocido', 'inactivo', 'contraseña incorrecta'])('rechaza %s con mensaje genérico', async reason => {
  record.active = reason !== 'inactivo';
  User.findOne.mockResolvedValue(reason === 'desconocido' ? null : record);
  const login = request(app).post('/api/auth/login');
  if (language) login.set('Cookie', `lang=${language}`);
  const res = await login
    .send({ ...credentials, password: reason === 'contraseña incorrecta' ? 'mal' : credentials.password }).expect(401);
  expect(res.body).toEqual({ message });
});
});

it.each(['json', 'form'])('login %s firma JWT verificable con los claims requeridos', async type => {
  User.findOne.mockResolvedValue(record);
  const res = await request(app).post('/api/auth/login').type(type).send(credentials).expect(200);
  const payload = jwt.verify(res.body.data.token, process.env.JWT_SECRET, {
    algorithms: ['HS256'], issuer: process.env.JWT_ISSUER, audience: process.env.JWT_AUDIENCE,
  });
  expect(payload.sub).toBe('7');
  expect(payload.exp - payload.iat).toBe(900);
  expect(Object.keys(payload).sort()).toEqual(['aud', 'exp', 'iat', 'iss', 'sub']);
  expect(res.body.data.token_type).toBe('Bearer');
  expect(res.body.data.expiresIn).toBe('15m');
  safe(payload);
});

it('sin token devuelve 401 JSON y no consulta al usuario', async () => {
  await request(app).get('/api/auth/me').expect('Content-Type', /json/).expect(401);
  expect(User.findByPk).not.toHaveBeenCalled();
});

it.each([
  ['malformado', () => 'token-invalido'],
  ['firma incorrecta', () => token({}, 'other-test-secret')],
  ['expirado', () => token({ expiresIn: -1 })],
  ['issuer incorrecto', () => token({ issuer: 'otro' })],
  ['audience incorrecto', () => token({ audience: 'otro' })],
  ['algoritmo incorrecto', () => token({ algorithm: 'HS384' })],
])('rechaza token %s antes de consultar SQL', async (_label, createToken) => {
  await request(app).get('/api/auth/me').auth(createToken(), { type: 'bearer' })
    .expect('Content-Type', /json/).expect(401);
  expect(User.findByPk).not.toHaveBeenCalled();
});

it('login seguido de /me devuelve usuario seguro; rechaza el mismo token al desactivarlo o eliminarlo', async () => {
  User.findOne.mockResolvedValue(record);
  User.findByPk.mockResolvedValue(record);
  const login = await request(app).post('/api/auth/login').send(credentials).expect(200);
  const access = login.body.data.token;
  const res = await request(app).get('/api/auth/me').auth(access, { type: 'bearer' }).expect(200);
  expect(res.body.id).toBe(7);
  expect(res.body.email).toBe(credentials.email);
  safe(res.body);
  record.active = false;
  await request(app).get('/api/auth/me').auth(access, { type: 'bearer' }).expect(401);
  User.findByPk.mockResolvedValue(null);
  await request(app).get('/api/auth/me').auth(access, { type: 'bearer' }).expect(401);
});

it('errores de consulta en authenticate producen 500 sin detalles privados', async () => {
  User.findByPk.mockRejectedValue(new Error('detalle privado'));
  const res = await request(app).get('/api/auth/me').auth(token(), { type: 'bearer' }).expect(500);
  expect(res.body).toEqual({ message: 'Error interno del servidor', data: null });
});

it('login responde 500 JSON (no se queda colgado) si falla la consulta', async () => {
  User.findOne.mockRejectedValue(new Error('detalle privado'));
  const res = await request(app).post('/api/auth/login').send(credentials).expect(500);
  expect(res.body).toEqual({ message: 'Error interno del servidor', data: null });
});
