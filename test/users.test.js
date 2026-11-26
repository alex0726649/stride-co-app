const { jest: mock } = require('@jest/globals');
const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('config');
const app = require('../app');
const { User, Role } = require('../models/relationals');

const profile = { id: 7, first_name: 'Ana', last_name: 'Prueba', email: 'ana@example.com', active: true, role_id: 1 };
const adminRole = { id: 1, name: 'admin' };
const userRole = { id: 2, name: 'user' };
const permissions = ['create', 'read', 'update', 'delete'].map(action => ({ key: `users:${action}:any` }));

function token(id) {
  return jwt.sign({ sub: id }, config.get('jwt.secret'), {
    issuer: config.get('jwt.issuer'),
    audience: config.get('jwt.audience'),
  });
}

function asAdmin(method, path) {
  return request(app)[method](path).auth(token('101'), { type: 'bearer' });
}

function mockTarget(record) {
  User.findByPk.mockImplementation(async (id) => {
    if (id === '101') return { id: 101, role_id: adminRole.id, active: true };
    if (id === '102') return { id: 102, role_id: userRole.id, active: true };
    return id === '7' ? record : null;
  });
}

beforeEach(() => {
  mockTarget(null);
  Role.findByPk.mockImplementation(async (id, options) => {
    if (id === adminRole.id) return options ? { ...adminRole, permissions } : adminRole;
    if (id === userRole.id) return options ? { ...userRole, permissions: [{ key: 'orders:read:own' }] } : userRole;
    return null;
  });
});

function user() {
  const record = User.build({ ...profile, password_hash: 'old-hash', salt_key: 'old-salt' });
  record.setDataValue('role', adminRole);
  record.update = mock.fn().mockImplementation(async changes => { record.set(changes); return record; });
  record.destroy = mock.fn().mockResolvedValue();
  return record;
}
function safe(data) {
  for (const key of ['password', 'password_hash', 'salt_key']) expect(data).not.toHaveProperty(key);
}

it('consulta usuarios mediante el modelo y oculta campos sensibles', async () => {
  const record = user();
  User.findAll.mockResolvedValue([record]);
  mockTarget(record);
  const list = await asAdmin('get', '/api/users').expect(200);
  expect(list.body.data[0].role).toEqual(adminRole);
  safe(list.body.data[0]);
  const found = await asAdmin('get', '/api/users/7').expect(200);
  expect(found.body.data.email).toBe(profile.email);
  expect(found.body.data.role).toEqual(adminRole);
  safe(found.body.data);
  expect(User.findByPk).toHaveBeenCalledWith('7', { include: { model: Role, as: 'role' } });
});

it('crea el usuario con hash y salt reales, sin almacenar password', async () => {
  User.create.mockImplementation(async values => User.build({ id: 7, ...values }));
  const res = await asAdmin('post', '/api/users').send({ ...profile, password: 'Clave123!' }).expect(201);
  const saved = User.create.mock.calls[0][0];
  expect(saved).not.toHaveProperty('password');
  expect(await bcrypt.compare('Clave123!', saved.password_hash)).toBe(true);
  expect(await bcrypt.hash('Clave123!', saved.salt_key)).toBe(saved.password_hash);
  expect(bcrypt.getRounds(saved.password_hash)).toBe(4);
  expect(res.body.data.role).toEqual(adminRole);
  safe(res.body.data);
});

it('regenera hash y salt al cambiar contraseña; conserva contraseña al editar nombre', async () => {
  const record = user();
  mockTarget(record);
  const first = await asAdmin('put', '/api/users/7').send({ password: 'Nueva123!' }).expect(200);
  const firstHash = record.password_hash;
  const firstSalt = record.salt_key;
  safe(first.body.data);
  await asAdmin('put', '/api/users/7').send({ password: 'Nueva123!' }).expect(200);
  expect(record.password_hash).not.toBe(firstHash);
  expect(record.salt_key).not.toBe(firstSalt);
  expect(await bcrypt.compare('Nueva123!', record.password_hash)).toBe(true);
  const hash = record.password_hash;
  await asAdmin('put', '/api/users/7').send({ first_name: 'Eva' }).expect(200);
  expect(record.password_hash).toBe(hash);
  expect(record.first_name).toBe('Eva');
});

it.each(['', '   ', null, 123])('rechaza contraseña inválida %p al actualizar', async password => {
  const record = user();
  mockTarget(record);
  await asAdmin('put', '/api/users/7').send({ password }).expect(400);
  expect(record.update).not.toHaveBeenCalled();
});

it.each(['get', 'put', 'delete'])('responde 404 para usuario inexistente: %s', async method => {
  await asAdmin(method, '/api/users/999').send({}).expect(404)
    .expect({ message: 'Usuario no encontrado', data: null });
});

it('elimina mediante el modelo sin revelar el hash', async () => {
  const record = user();
  mockTarget(record);
  const res = await asAdmin('delete', '/api/users/7').expect(200);
  expect(record.destroy).toHaveBeenCalledTimes(1);
  safe(res.body.data);
});

it('toJSON elimina los tres campos sensibles incluso si password está presente', () => {
  const record = user();
  record.setDataValue('password', 'privada');
  safe(record.toJSON());
});

it.each([undefined, '', '   ', null, 123])('rechaza crear usuario con contraseña inválida %p sin llamar a la BD', async password => {
  const body = { ...profile };
  if (password !== undefined) body.password = password;
  await asAdmin('post', '/api/users').send(body).expect(400);
  expect(User.create).not.toHaveBeenCalled();
});

it('responde 400 traducido si el email ya está registrado al crear', async () => {
  const duplicate = Object.assign(new Error('Validation error'), { name: 'SequelizeUniqueConstraintError' });
  User.create.mockRejectedValue(duplicate);
  await asAdmin('post', '/api/users?lang=en').send({ ...profile, password: 'Clave123!' }).expect(400)
    .expect({ message: 'This email is already registered', data: null });
});

it('errores de BD en usuarios responden 500 JSON sin colgarse', async () => {
  User.create.mockRejectedValue(new Error('detalle privado'));
  const res = await asAdmin('post', '/api/users').send({ ...profile, password: 'Clave123!' }).expect(500);
  expect(res.body).toEqual({ message: 'Error interno del servidor', data: null });
  User.findAll.mockRejectedValue(new Error('detalle privado'));
  await asAdmin('get', '/api/users').expect(500);
});

it('el email del modelo User es único', () => {
  expect(User.rawAttributes.email.unique).toBe(true);
});

it.each([
  ['get', '/api/users'],
  ['get', '/api/users/7'],
  ['post', '/api/users'],
  ['put', '/api/users/7'],
  ['delete', '/api/users/7'],
])('exige JWT y permiso de administrador en %s %s', async (method, path) => {
  await request(app)[method](path).expect(401);
  await request(app)[method](path).auth(token('102'), { type: 'bearer' }).expect(403);
  expect(User.findAll).not.toHaveBeenCalled();
  expect(User.findByPk).toHaveBeenCalledTimes(1);
  expect(User.create).not.toHaveBeenCalled();
});

it.each(['abc', '0', '-1', '1.5', '01', '2147483648'])('rechaza el ID inválido %s', async (id) => {
  await asAdmin('get', '/api/users/' + id).expect(400)
    .expect({ message: 'El ID debe ser un entero positivo válido', data: null });
  expect(User.findByPk).toHaveBeenCalledTimes(1);
});

it.each([
  { first_name: ' ' },
  { last_name: 123 },
  { email: 'incorrecto' },
  { role_id: '1' },
  { role_id: 999 },
])('rechaza los campos inválidos al crear: %p', async (changes) => {
  await asAdmin('post', '/api/users').send({ ...profile, password: 'Clave123!', ...changes }).expect(400);
  expect(User.create).not.toHaveBeenCalled();
});

it('rechaza un cuerpo vacío al actualizar y conserva el registro', async () => {
  const record = user();
  mockTarget(record);
  await asAdmin('put', '/api/users/7').send({}).expect(400);
  expect(record.update).not.toHaveBeenCalled();
});

it('incluye el rol nuevo en la respuesta al actualizarlo', async () => {
  const record = user();
  mockTarget(record);
  const res = await asAdmin('put', '/api/users/7').send({ role_id: userRole.id }).expect(200);
  expect(res.body.data).toMatchObject({ role_id: userRole.id, role: userRole });
  safe(res.body.data);
});

it('responde 400 traducido si el email ya está registrado al actualizar', async () => {
  const record = user();
  mockTarget(record);
  record.update.mockRejectedValue(Object.assign(new Error('Validation error'), {
    name: 'SequelizeUniqueConstraintError',
  }));
  await asAdmin('put', '/api/users/7').send({ email: 'existe@example.com' }).expect(400)
    .expect({ message: 'El email ya está registrado', data: null });
});
