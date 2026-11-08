const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { User, Role } = require('../models/relationals');

const accessToken = jwt.sign({ sub: '7' }, process.env.JWT_SECRET, {
  algorithm: 'HS256',
  expiresIn: '15m',
  issuer: process.env.JWT_ISSUER,
  audience: process.env.JWT_AUDIENCE,
});

function authenticated(method, path) {
  return request(app)[method](path).auth(accessToken, { type: 'bearer' });
}

beforeEach(() => {
  User.findByPk.mockResolvedValue({ id: 7, active: true, role_id: 1 });
  Role.findByPk.mockResolvedValue({
    id: 1,
    name: 'admin',
    permissions: [
      { key: 'products:read:any' },
      { key: 'products:create:any' },
      { key: 'products:update:any' },
      { key: 'products:delete:any' },
    ],
  });
});

const validProduct = {
  name: 'Tenis de Prueba',
  description: 'Descripción de prueba',
  brand: 'Marca Prueba',
  price: 500,
  category_id: 1
};

function expectError(res, status) {
  expect(res.status).toBe(status);
  expect(res.headers['content-type']).toMatch(/json/);
  expect(res.body).toEqual({ message: expect.any(String), data: null });
}

describe('/api/products', () => {
  it('lista productos y consulta por ID', async () => {
    const res = await authenticated('get', '/api/products');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('GET products');
    expect(res.body.data.length).toBeGreaterThan(0);

    const firstProduct = res.body.data[0];
    const found = await authenticated('get', `/api/products/${firstProduct.id}`);
    expect(found.status).toBe(200);
    expect(found.body.data).toEqual(firstProduct);
  });

  it('devuelve 404 para productos inexistentes', async () => {
    const res = await authenticated('get', '/api/products/999');
    expectError(res, 404);
  });

  it('simula creación con validación', async () => {
    const res = await authenticated('post', '/api/products').send(validProduct);
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe(validProduct.name);

    // Error por falta de campo
    const invalid = { ...validProduct };
    delete invalid.name;
    expectError(await authenticated('post', '/api/products').send(invalid), 400);
  });

  it('simula actualización y eliminación', async () => {
    const resUpdate = await authenticated('put', '/api/products/1').send(validProduct);
    expect(resUpdate.status).toBe(200);

    const resDelete = await authenticated('delete', '/api/products/1');
    expect(resDelete.status).toBe(200);
    expect(resDelete.body.data).toBeNull();
  });
});
