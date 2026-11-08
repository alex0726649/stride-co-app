const { jest: mock } = require('@jest/globals');
const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../app');
const { User } = require('../models/relationals');

const profile = { id: 7, first_name: 'Ana', last_name: 'Prueba', email: 'ana@example.com', active: true, role_id: 1 };
function user() {
  const record = User.build({ ...profile, password_hash: 'old-hash', salt_key: 'old-salt' });
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
  User.findByPk.mockResolvedValue(record);
  const list = await request(app).get('/api/users').expect(200);
  safe(list.body.data[0]);
  const found = await request(app).get('/api/users/7').expect(200);
  expect(found.body.data.email).toBe(profile.email);
  safe(found.body.data);
  expect(User.findByPk).toHaveBeenCalledWith('7', expect.any(Object));
});

it('crea el usuario con hash y salt reales, sin almacenar password', async () => {
  User.create.mockImplementation(async values => User.build({ id: 7, ...values }));
  const res = await request(app).post('/api/users').send({ ...profile, password: 'Clave123!' }).expect(201);
  const saved = User.create.mock.calls[0][0];
  expect(saved).not.toHaveProperty('password');
  expect(await bcrypt.compare('Clave123!', saved.password_hash)).toBe(true);
  expect(await bcrypt.hash('Clave123!', saved.salt_key)).toBe(saved.password_hash);
  expect(bcrypt.getRounds(saved.password_hash)).toBe(4);
  safe(res.body.data);
});

it('regenera hash y salt al cambiar contraseña; conserva contraseña al editar nombre', async () => {
  const record = user();
  User.findByPk.mockResolvedValue(record);
  const first = await request(app).put('/api/users/7').send({ password: 'Nueva123!' }).expect(200);
  const firstHash = record.password_hash;
  const firstSalt = record.salt_key;
  safe(first.body.data);
  await request(app).put('/api/users/7').send({ password: 'Nueva123!' }).expect(200);
  expect(record.password_hash).not.toBe(firstHash);
  expect(record.salt_key).not.toBe(firstSalt);
  expect(await bcrypt.compare('Nueva123!', record.password_hash)).toBe(true);
  const hash = record.password_hash;
  await request(app).put('/api/users/7').send({ first_name: 'Eva' }).expect(200);
  expect(record.password_hash).toBe(hash);
  expect(record.first_name).toBe('Eva');
});

it.each(['', '   ', null, 123])('rechaza contraseña inválida %p al actualizar', async password => {
  const record = user();
  User.findByPk.mockResolvedValue(record);
  await request(app).put('/api/users/7').send({ password }).expect(400);
  expect(record.update).not.toHaveBeenCalled();
});

it.each(['get', 'put', 'delete'])('responde 404 para usuario inexistente: %s', async method => {
  await request(app)[method]('/api/users/999').send({}).expect(404);
});

it('elimina mediante el modelo sin revelar el hash', async () => {
  const record = user();
  User.findByPk.mockResolvedValue(record);
  const res = await request(app).delete('/api/users/7').expect(200);
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
  await request(app).post('/api/users').send(body).expect(400);
  expect(User.create).not.toHaveBeenCalled();
});

it('responde 409 si el email ya está registrado', async () => {
  const duplicate = Object.assign(new Error('Validation error'), { name: 'SequelizeUniqueConstraintError' });
  User.create.mockRejectedValue(duplicate);
  await request(app).post('/api/users').send({ ...profile, password: 'Clave123!' }).expect(409);
});

it('errores de BD en usuarios responden 500 JSON sin colgarse', async () => {
  User.create.mockRejectedValue(new Error('detalle privado'));
  const res = await request(app).post('/api/users').send({ ...profile, password: 'Clave123!' }).expect(500);
  expect(res.body).toEqual({ message: 'Error interno del servidor', data: null });
  User.findAll.mockRejectedValue(new Error('detalle privado'));
  await request(app).get('/api/users').expect(500);
});

it('el email del modelo User es único', () => {
  expect(User.rawAttributes.email.unique).toBe(true);
});
