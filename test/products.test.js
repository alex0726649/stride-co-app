const { jest: mock } = require('@jest/globals');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const config = require('config');
const app = require('../app');
const { User, Role, Product } = require('../models/relationals');

const adminRole = {
  id: 1,
  name: 'admin',
  permissions: ['read', 'create', 'update', 'delete'].map(action => ({ key: `products:${action}:any` })),
};

function token(id) {
  return jwt.sign({ sub: String(id) }, config.get('jwt.secret'), {
    issuer: config.get('jwt.issuer'),
    audience: config.get('jwt.audience'),
  });
}

function asAdmin(method, path) {
  return request(app)[method](path).auth(token(7), { type: 'bearer' });
}

beforeEach(() => {
  User.findByPk.mockResolvedValue({ id: 7, active: true, role_id: 1 });
  Role.findByPk.mockResolvedValue(adminRole);
});

const validProduct = {
  name: 'Tenis de Prueba',
  description: 'Descripción de prueba',
  brand: 'Marca Prueba',
  price: 500,
  category_id: 1,
};

const mockProductRow = {
  id: 1,
  category_id: '1',
  name: 'Tenis Deportivos Stride',
  description: 'Calzado ergonómico de alta resistencia para corredores urbanos.',
  brand: 'Stride & Co.',
  price: 1299.0,
  active: true,
  variants: [],
};

function expectError(res, status) {
  expect(res.status).toBe(status);
  expect(res.headers['content-type']).toMatch(/json/);
  expect(res.body).toEqual({ message: expect.any(String), data: null });
}

// 401 y 403 los responde el middleware (authenticate/authorize), no utils/response.js.
function expectAuthError(res, status) {
  expect(res.status).toBe(status);
  expect(res.body.message).toEqual(expect.any(String));
}

describe('/api/products', () => {
  it('lista productos incluyendo sus variantes (200)', async () => {
    Product.findAll.mockResolvedValue([mockProductRow]);

    const res = await asAdmin('get', '/api/products');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Lista de productos');
    expect(res.body.data).toEqual([mockProductRow]);
    expect(Product.findAll).toHaveBeenCalledWith({ include: 'variants' });
  });

  it('consulta un producto por ID incluyendo variantes (200)', async () => {
    Product.findByPk.mockResolvedValue(mockProductRow);

    const res = await asAdmin('get', '/api/products/1');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Producto encontrado');
    expect(res.body.data).toEqual(mockProductRow);
    expect(Product.findByPk).toHaveBeenCalledWith('1', { include: 'variants' });
  });

  it('devuelve 400 si el ID tiene formato inválido', async () => {
    const res = await asAdmin('get', '/api/products/abc');
    expectError(res, 400);
    expect(Product.findByPk).not.toHaveBeenCalled();
  });

  it('devuelve 404 para un producto que no existe', async () => {
    Product.findByPk.mockResolvedValue(null);

    const res = await asAdmin('get', '/api/products/999');
    expectError(res, 404);
  });

  it('crea un producto válido (201)', async () => {
    Product.create.mockResolvedValue({ id: 2, ...validProduct, active: true });

    const res = await asAdmin('post', '/api/products').send(validProduct);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Producto creado');
    expect(res.body.data).toMatchObject({ name: validProduct.name });
    expect(Product.create).toHaveBeenCalledWith(validProduct);
  });

  it('devuelve 400 si falta name', async () => {
    const invalid = { ...validProduct };
    delete invalid.name;

    const res = await asAdmin('post', '/api/products').send(invalid);
    expectError(res, 400);
    expect(Product.create).not.toHaveBeenCalled();
  });

  it('devuelve 400 si price es negativo', async () => {
    const res = await asAdmin('post', '/api/products').send({ ...validProduct, price: -10 });
    expectError(res, 400);
    expect(Product.create).not.toHaveBeenCalled();
  });

  it('actualiza un producto existente (200)', async () => {
    const instance = { ...mockProductRow, update: mock.fn().mockResolvedValue(undefined) };
    Product.findByPk.mockResolvedValue(instance);

    const res = await asAdmin('put', '/api/products/1').send(validProduct);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Producto actualizado');
    expect(instance.update).toHaveBeenCalledWith(validProduct);
  });

  it('devuelve 404 al actualizar un producto inexistente', async () => {
    Product.findByPk.mockResolvedValue(null);

    const res = await asAdmin('put', '/api/products/999').send(validProduct);
    expectError(res, 404);
  });

  it('elimina un producto existente (200, data null)', async () => {
    const instance = { ...mockProductRow, destroy: mock.fn().mockResolvedValue(undefined) };
    Product.findByPk.mockResolvedValue(instance);

    const res = await asAdmin('delete', '/api/products/1');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Producto eliminado');
    expect(res.body.data).toBeNull();
    expect(instance.destroy).toHaveBeenCalled();
  });

  it('devuelve 404 al eliminar un producto inexistente', async () => {
    Product.findByPk.mockResolvedValue(null);

    const res = await asAdmin('delete', '/api/products/999');
    expectError(res, 404);
  });

  it('devuelve 401 sin token', async () => {
    const res = await request(app).get('/api/products');
    expectAuthError(res, 401);
  });

  it('devuelve 403 para un rol sin permiso sobre products', async () => {
    Role.findByPk.mockResolvedValue({ id: 2, name: 'sales', permissions: [] });

    const res = await asAdmin('get', '/api/products');
    expectAuthError(res, 403);
  });
});