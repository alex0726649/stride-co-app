const request = require('supertest');
const app = require('../app');

describe('GET /api/products', function () {
  it('debería responder con status 200 y la lista de productos', async function () {
    const response = await request(app).get('/api/products');
    expect(response.status).toEqual(200);
    expect(response.body).toHaveProperty('message', 'GET products');
    expect(response.body).toHaveProperty('data');
  });
});