const request = require('supertest');
const app = require('../app');

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
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('GET products');
    expect(res.body.data.length).toBeGreaterThan(0);

    const firstProduct = res.body.data[0];
    const found = await request(app).get(`/api/products/${firstProduct.id}`);
    expect(found.status).toBe(200);
    expect(found.body.data).toEqual(firstProduct);
  });

  it('devuelve 404 para productos inexistentes', async () => {
    const res = await request(app).get('/api/products/999');
    expectError(res, 404);
  });

  it('simula creación con validación', async () => {
    const res = await request(app).post('/api/products').send(validProduct);
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe(validProduct.name);

    // Error por falta de campo
    const invalid = { ...validProduct };
    delete invalid.name;
    expectError(await request(app).post('/api/products').send(invalid), 400);
  });

  it('simula actualización y eliminación', async () => {
    const resUpdate = await request(app).put('/api/products/1').send(validProduct);
    expect(resUpdate.status).toBe(200);

    const resDelete = await request(app).delete('/api/products/1');
    expect(resDelete.status).toBe(200);
    expect(resDelete.body.data).toBeNull();
  });
});
