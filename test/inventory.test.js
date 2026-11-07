const { jest: mock } = require('@jest/globals');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const config = require('config');
const app = require('../app');
const { Inventory, User, Role } = require('../models/relationals');
const matrix = require('../database/rbac-matrix.json');

const roles = { 1: 'admin', 2: 'sales', 3: 'user' };
const record = { id: 1, variant_id: 2, stock: 20, reserved: 3 };

function asRole(roleId, method, path = '/api/inventory') {
  const token = jwt.sign({ sub: String(roleId) }, config.get('jwt.secret'), {
    issuer: config.get('jwt.issuer'),
    audience: config.get('jwt.audience'),
  });
  return request(app)[method](path).auth(token, { type: 'bearer' });
}

beforeEach(() => {
  User.findByPk.mockImplementation(async id => ({ id, active: true, role_id: Number(id) }));
  Role.findByPk.mockImplementation(async id => ({
    name: roles[id],
    permissions: matrix.permissions.filter(permission => permission.roles.includes(roles[id])),
  }));
  mock.spyOn(Inventory, 'findAll').mockResolvedValue([Inventory.build(record)]);
  mock.spyOn(Inventory, 'findByPk').mockResolvedValue(Inventory.build(record));
  mock.spyOn(Inventory, 'update').mockResolvedValue([0, []]);
});

afterEach(() => {
  Inventory.findAll.mockRestore();
  Inventory.findByPk.mockRestore();
  Inventory.update.mockRestore();
});

it('lista inventario real del modelo para ventas con mensaje en español', async () => {
  await asRole(2, 'get').expect(200).expect({ message: 'Lista de inventario', data: [record] });
  expect(Inventory.findAll).toHaveBeenCalledTimes(1);
});

it('consulta por ID con traducción al inglés', async () => {
  await asRole(2, 'get', '/api/inventory/1').set('Accept-Language', 'en')
    .expect(200).expect({ message: 'Inventory record found', data: record });
  expect(Inventory.findByPk).toHaveBeenCalledWith('1', expect.any(Object));
});

it('actualiza solo existencias como admin y devuelve los datos de la escritura', async () => {
  const updated = { ...record, stock: 25, reserved: 5 };
  Inventory.update.mockResolvedValue([1, [Inventory.build(updated)]]);
  await asRole(1, 'put', '/api/inventory/1?lang=en')
    .send({ stock: 25, reserved: 5, variant_id: 99 })
    .expect(200).expect({ message: 'Stock updated', data: updated });
  expect(Inventory.update).toHaveBeenCalledWith(
    { stock: 25, reserved: 5 },
    expect.objectContaining({ where: { id: '1' } }),
  );
});

it.each([
  ['get', '/api/inventory'], ['get', '/api/inventory/1'], ['put', '/api/inventory/1'],
])('rechaza solicitudes sin JWT: %s %s', async (method, path) => {
  await request(app)[method](path).expect(401);
  expect(Inventory.findAll).not.toHaveBeenCalled();
  expect(Inventory.findByPk).not.toHaveBeenCalled();
  expect(Inventory.update).not.toHaveBeenCalled();
});

it('ventas no puede ajustar existencias y un cliente no puede leer inventario', async () => {
  await asRole(2, 'put', '/api/inventory/1?lang=en').send({ stock: 5, reserved: 0 })
    .expect(403).expect({ message: 'Forbidden', data: null });
  await asRole(3, 'get').expect(403);
  expect(Inventory.update).not.toHaveBeenCalled();
  expect(Inventory.findAll).not.toHaveBeenCalled();
});

it.each(['get', 'put'])('rechaza un ID inválido sin consultar inventario: %s', async method => {
  for (const id of ['abc', '0', '1.5', '2147483648']) {
    await asRole(1, method, '/api/inventory/' + id).expect(400);
  }
  expect(Inventory.findByPk).not.toHaveBeenCalled();
  expect(Inventory.update).not.toHaveBeenCalled();
});

it.each([
  { stock: 10 },
  { stock: '10', reserved: 1 },
  { stock: 2.5, reserved: 1 },
  { stock: 10, reserved: -1 },
  { stock: 2147483648, reserved: 1 },
])('rechaza cantidades inválidas %p', async body => {
  await asRole(1, 'put', '/api/inventory/1').send(body).expect(400);
  expect(Inventory.update).not.toHaveBeenCalled();
});

it('rechaza reserved mayor que stock con error traducido', async () => {
  await asRole(1, 'put', '/api/inventory/1?lang=en').send({ stock: 5, reserved: 10 })
    .expect(400).expect({ message: 'reserved cannot exceed stock', data: null });
  expect(Inventory.update).not.toHaveBeenCalled();
});

it.each(['get', 'put'])('responde 404 con ID válido inexistente: %s', async method => {
  Inventory.findByPk.mockResolvedValue(null);
  await asRole(1, method, '/api/inventory/999?lang=en').send({ stock: 0, reserved: 0 })
    .expect(404).expect({ message: 'Inventory record not found', data: null });
});

it('responde 500 traducido si falla el modelo sin exponer detalles de PostgreSQL', async () => {
  Inventory.update.mockRejectedValue(new Error('detalle privado'));
  await asRole(1, 'put', '/api/inventory/1?lang=en').send({ stock: 20, reserved: 0 })
    .expect(500).expect({ message: 'Internal server error', data: null });
});

it('el modelo valida cantidades enteras y que reserved no supere stock', async () => {
  await expect(Inventory.build({ ...record, stock: 20.5 }).validate()).rejects.toThrow();
  await expect(Inventory.build({ ...record, reserved: 21 }).validate()).rejects.toThrow();
  await expect(Inventory.build({ ...record, stock: 0, reserved: 0 }).validate()).resolves.toBeDefined();
});
