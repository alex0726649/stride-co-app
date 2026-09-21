const request = require('supertest');
const app = require('../app');

const validCustomer = { userId: 1, phone: '6147654321', email: 'nuevo@example.com' };
const address = { type: 'shipping', street: 'Calle Ejemplo', number: '10', city: 'Chihuahua',
  state: 'Chihuahua', postalCode: '31000', country: 'México' };

function expectError(res, status) {
  expect(res.status).toBe(status);
  expect(res.headers['content-type']).toMatch(/json/);
  expect(res.body).toEqual({ message: expect.any(String), data: null });
}

describe('/api/customers', () => {
  it('debería listar clientes', async () => {
    const res = await request(app).get('/api/customers');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Lista de clientes');
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.data).toEqual(expect.arrayContaining([expect.objectContaining({
      _id: 'cliente-1', userId: 1, addresses: expect.any(Array),
      createdAt: '2026-09-01T12:00:00.000Z', updatedAt: '2026-09-01T12:00:00.000Z',
    })]));
  });

  it('debería buscar por ID', async () => {
    const res = await request(app).get('/api/customers/cliente-1');
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe('cliente-1');
    const list = await request(app).get('/api/customers');
    expect(res.body.data).toEqual(list.body.data.find(customer => customer._id === 'cliente-1'));
  });

  it.each(['get', 'put', 'delete'])('%s devuelve 404 para un ID inexistente', async method => {
    const res = await request(app)[method]('/api/customers/no-existe').send({});
    expectError(res, 404);
  });

  it('crea sin persistir y controla ID, fechas y campos públicos', async () => {
    const original = (await request(app).get('/api/customers')).body.data;
    const payload = { ...validCustomer, _id: 'inyectado', createdAt: 'falsa', password: 'no-reflejar',
      addresses: [{ ...address, privateField: 'no-reflejar' }] };
    const res = await request(app).post('/api/customers').send(payload);
    expect(res.status).toBe(201);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.data).toEqual({ ...validCustomer, _id: 'cliente-nuevo', addresses: [address],
      createdAt: '2026-09-01T12:00:00.000Z', updatedAt: '2026-09-01T12:00:00.000Z' });
    expectError(await request(app).get('/api/customers/cliente-nuevo'), 404);
    expect((await request(app).get('/api/customers')).body.data).toEqual(original);
  });

  it('usa direcciones vacías al crear si se omiten', async () => {
    const res = await request(app).post('/api/customers').send(validCustomer);
    expect(res.status).toBe(201);
    expect(res.body.data.addresses).toEqual([]);
  });

  it('actualiza campos y direcciones sin modificar el fixture', async () => {
    const original = (await request(app).get('/api/customers/cliente-1')).body.data;
    const res = await request(app).put('/api/customers/cliente-1')
      .send({ ...validCustomer, _id: 'otro', addresses: [address] });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ ...validCustomer, _id: 'cliente-1', addresses: [address],
      createdAt: original.createdAt, updatedAt: '2026-09-02T12:00:00.000Z' });
    expect((await request(app).get('/api/customers/cliente-1')).body.data).toEqual(original);
    const omitted = await request(app).put('/api/customers/cliente-1').send(validCustomer);
    expect(omitted.status).toBe(200);
    expect(omitted.body.data.addresses).toEqual(original.addresses);
    const cleared = await request(app).put('/api/customers/cliente-1').send({ ...validCustomer, addresses: [] });
    expect(cleared.status).toBe(200);
    expect(cleared.body.data.addresses).toEqual([]);
  });

  it('elimina de forma simulada y conserva el cliente', async () => {
    const original = (await request(app).get('/api/customers/cliente-1')).body.data;
    const res = await request(app).delete('/api/customers/cliente-1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Eliminación de cliente simulada', data: null });
    expect((await request(app).get('/api/customers/cliente-1')).body.data).toEqual(original);
  });

  describe.each(['post', 'put'])('%s valida las solicitudes', method => {
    const url = method === 'post' ? '/api/customers' : '/api/customers/cliente-1';
    it.each([
      ['objeto vacío', {}], ['arreglo', []],
      ['userId ausente', { phone: '123', email: 'a@example.com' }],
      ['userId textual', { ...validCustomer, userId: '1' }],
      ['userId cero', { ...validCustomer, userId: 0 }],
      ['userId fraccionario', { ...validCustomer, userId: 1.5 }],
      ['phone ausente', { userId: 1, email: 'a@example.com' }],
      ['phone vacío', { ...validCustomer, phone: '  ' }],
      ['phone numérico', { ...validCustomer, phone: 123 }],
      ['email ausente', { userId: 1, phone: '123' }],
      ['email vacío', { ...validCustomer, email: '  ' }],
      ['email nulo', { ...validCustomer, email: null }],
      ['addresses no arreglo', { ...validCustomer, addresses: {} }],
      ['dirección nula', { ...validCustomer, addresses: [null] }],
      ['dirección incompleta', { ...validCustomer, addresses: [{ type: 'shipping' }] }],
      ['tipo de dirección inválido', { ...validCustomer, addresses: [{ ...address, type: 'other' }] }],
    ])('rechaza %s con 400', async (_label, body) => {
      expectError(await request(app)[method](url).send(body), 400);
    });

    it('rechaza cuerpo ausente y JSON malformado', async () => {
      expectError(await request(app)[method](url), 400);
      expectError(await request(app)[method](url).set('Content-Type', 'application/json').send('{'), 400);
    });
  });
});
