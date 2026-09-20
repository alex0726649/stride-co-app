const request = require('supertest');
const app = require('../app');

describe('/api/customers', () => {
  it('debería listar clientes', async () => {
    const res = await request(app).get('/api/customers');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Lista de clientes');
  });

  it('debería buscar por ID', async () => {
    const res = await request(app).get('/api/customers/cliente-1');
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe('cliente-1');
  });
});
