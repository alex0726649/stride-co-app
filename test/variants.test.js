const { jest: mock } = require('@jest/globals');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const config = require('config');
const { ForeignKeyConstraintError, UniqueConstraintError } = require('sequelize');
const app = require('../app');
const { sequelize, User, Role, Product, ProductVariant, Inventory } = require('../models/relationals');
const matrix = require('../database/rbac-matrix.json');

const base = '/api/variants';
const valid = { product_id: 1, sku: 'STRIDE-28-AZUL', size: '28', color: 'Azul' };
const transaction = {};
const roles = { 1: 'admin', 2: 'sales', 3: 'user' };
const findAll = mock.spyOn(ProductVariant, 'findAll');
const findByPk = mock.spyOn(ProductVariant, 'findByPk');
const createWithInventory = mock.spyOn(ProductVariant, 'createWithInventory');
const findInventory = mock.spyOn(Inventory, 'findOne');
const transact = mock.spyOn(sequelize, 'transaction');

function asRole(roleId, method, path = base) {
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
  Product.findByPk.mockResolvedValue(Product.build({ id: 1 }));
  findAll.mockReset().mockResolvedValue([]);
  findByPk.mockReset().mockResolvedValue(null);
  createWithInventory.mockReset();
  findInventory.mockReset().mockResolvedValue(null);
  transact.mockReset().mockImplementation(callback => callback(transaction));
});

it('lista variantes de PostgreSQL para un cliente', async () => {
  const variant = { id: 2, ...valid, active: true };
  findAll.mockResolvedValue([ProductVariant.build(variant)]);

  await asRole(3, 'get').expect(200).expect({ message: 'Lista de variantes', data: [variant] });
  expect(findAll).toHaveBeenCalledWith({ order: [['id', 'ASC']] });
});

it('consulta una variante con su producto e inventario y traduce al inglés', async () => {
  const variant = {
    id: 2, ...valid, active: true,
    product: { id: 1, name: 'Stride Runner' },
    inventory: { id: 3, variant_id: 2, stock: 10, reserved: 2 },
  };
  findByPk.mockResolvedValue(ProductVariant.build(variant, { include: ['product', 'inventory'] }));

  const res = await asRole(2, 'get', base + '/2?lang=en').expect(200);
  expect(res.body).toMatchObject({ message: 'Variant found', data: variant });
  expect(findByPk).toHaveBeenCalledWith('2', { include: ['product', 'inventory'] });
});

it('crea una variante con el helper transaccional y solo permite campos editables', async () => {
  const variant = { id: 2, ...valid, active: false };
  createWithInventory.mockResolvedValue({ variant: ProductVariant.build(variant) });

  await asRole(1, 'post').send({ ...valid, id: 99, active: false, inventory: { stock: 100 } })
    .expect(201).expect({ message: 'Variante creada', data: variant });
  expect(Product.findByPk).toHaveBeenCalledWith(1, { attributes: ['id'] });
  expect(createWithInventory).toHaveBeenCalledWith({ ...valid, active: false });
});

it('actualiza conservando active si se omite y permite mantener el SKU de la misma variante', async () => {
  const variant = ProductVariant.build({ id: 2, ...valid, active: false });
  const update = mock.spyOn(variant, 'update').mockImplementation(async values => variant.set(values));
  findByPk.mockResolvedValue(variant);

  const res = await asRole(1, 'put', base + '/2').send({ ...valid, color: 'Negro', id: 99 }).expect(200);
  expect(res.body.data).toEqual({ id: 2, ...valid, color: 'Negro', active: false });
  expect(findByPk).toHaveBeenCalledWith('2', { transaction, lock: true });
  expect(update).toHaveBeenCalledWith({ ...valid, color: 'Negro' }, { transaction });
});

it.each(['post', 'put'])('devuelve 400 si el producto no existe: %s', async method => {
  Product.findByPk.mockResolvedValue(null);
  const variant = ProductVariant.build({ id: 2, ...valid });
  const update = mock.spyOn(variant, 'update');
  findByPk.mockResolvedValue(variant);

  await asRole(1, method, method === 'post' ? base : base + '/2').send(valid)
    .expect(400).expect({ message: 'El producto indicado no existe', data: null });
  expect(createWithInventory).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
});

it.each(['post', 'put'])('traduce la restricción única de SKU a 400: %s', async method => {
  const duplicate = new UniqueConstraintError({ fields: { sku: valid.sku } });
  const variant = ProductVariant.build({ id: 2, ...valid });
  mock.spyOn(variant, 'update').mockRejectedValue(duplicate);
  findByPk.mockResolvedValue(variant);
  createWithInventory.mockRejectedValue(duplicate);

  await asRole(1, method, (method === 'post' ? base : base + '/2') + '?lang=en').send(valid)
    .expect(400).expect({ message: 'This sku already exists', data: null });
});

it('traduce el error de la llave foránea si el producto desaparece antes de guardar', async () => {
  createWithInventory.mockRejectedValue(new ForeignKeyConstraintError({ table: 'product_variants' }));

  await asRole(1, 'post').send(valid)
    .expect(400).expect({ message: 'El producto indicado no existe', data: null });
});

it('borra la variante y su inventario vacío dentro de la misma transacción', async () => {
  const variant = ProductVariant.build({ id: 2, ...valid });
  const inventory = Inventory.build({ id: 3, variant_id: 2, stock: 0, reserved: 0 });
  const deleteVariant = mock.spyOn(variant, 'destroy').mockResolvedValue(undefined);
  const deleteInventory = mock.spyOn(inventory, 'destroy').mockResolvedValue(undefined);
  findByPk.mockResolvedValue(variant);
  findInventory.mockResolvedValue(inventory);

  await asRole(1, 'delete', base + '/2').expect(200).expect({ message: 'Variante eliminada', data: null });
  expect(findInventory).toHaveBeenCalledWith({ where: { variant_id: 2 }, transaction, lock: true });
  expect(deleteInventory).toHaveBeenCalledWith({ transaction });
  expect(deleteVariant).toHaveBeenCalledWith({ transaction });
  expect(deleteInventory.mock.invocationCallOrder[0]).toBeLessThan(deleteVariant.mock.invocationCallOrder[0]);
});

it('rechaza el borrado si la variante todavía tiene existencias', async () => {
  const variant = ProductVariant.build({ id: 2, ...valid });
  const inventory = Inventory.build({ id: 3, variant_id: 2, stock: 5, reserved: 1 });
  const deleteVariant = mock.spyOn(variant, 'destroy');
  const deleteInventory = mock.spyOn(inventory, 'destroy');
  findByPk.mockResolvedValue(variant);
  findInventory.mockResolvedValue(inventory);

  await asRole(1, 'delete', base + '/2').expect(400);
  expect(deleteInventory).not.toHaveBeenCalled();
  expect(deleteVariant).not.toHaveBeenCalled();
});

it.each(['get', 'put', 'delete'])('devuelve 404 para un ID válido inexistente: %s', async method => {
  await asRole(1, method, base + '/999').expect(404).expect({ message: 'Variante no encontrada', data: null });
});

it.each(['get', 'put', 'delete'])('rechaza un ID de ruta inválido antes de consultar: %s', async method => {
  for (const id of ['abc', '0', '-1', '1.5', '01', '2147483648']) {
    await asRole(1, method, base + '/' + id).expect(400);
  }
  expect(findByPk).not.toHaveBeenCalled();
});

it.each([
  [], {}, { ...valid, product_id: '1' }, { ...valid, product_id: 2_147_483_648 },
  { ...valid, sku: '  ' }, { ...valid, sku: 'a'.repeat(101) },
  { ...valid, size: 'a'.repeat(31) }, { ...valid, color: 'a'.repeat(51) },
  { ...valid, active: 'false' }, { ...valid, color: null },
])('rechaza cuerpos inválidos antes de escribir: %p', async body => {
  const variant = ProductVariant.build({ id: 2, ...valid });
  const update = mock.spyOn(variant, 'update');
  findByPk.mockResolvedValue(variant);

  await asRole(1, 'post').send(body).expect(400);
  await asRole(1, 'put', base + '/2').send(body).expect(400);
  expect(Product.findByPk).not.toHaveBeenCalled();
  expect(createWithInventory).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
});

it.each([
  ['get', base], ['get', base + '/2'], ['post', base], ['put', base + '/2'], ['delete', base + '/2'],
])('exige JWT en %s %s', async (method, path) => {
  await request(app)[method](path).expect(401);
  expect(findAll).not.toHaveBeenCalled();
  expect(findByPk).not.toHaveBeenCalled();
  expect(createWithInventory).not.toHaveBeenCalled();
});

it.each([
  ['post', base], ['put', base + '/2'], ['delete', base + '/2'],
])('deniega escritura a ventas y cliente: %s %s', async (method, path) => {
  await asRole(2, method, path).send(valid).expect(403);
  await asRole(3, method, path).send(valid).expect(403);
  expect(findByPk).not.toHaveBeenCalled();
  expect(createWithInventory).not.toHaveBeenCalled();
});

it('usa el manejador central de errores si falla la base de datos', async () => {
  findAll.mockRejectedValue(new Error('detalle privado'));

  await asRole(1, 'get').expect(500).expect({ message: 'Error interno del servidor', data: null });
});
