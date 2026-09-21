// test/orders.test.js
const request = require('supertest');
const app = require('../app');

describe('GET /api/orders', () => {
  it('devuelve la lista de órdenes con estado 200', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

describe('GET /api/orders/:id', () => {
  it('devuelve una orden existente con estado 200', async () => {
    const res = await request(app).get('/api/orders/orden-1');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ _id: 'orden-1', customerId: 'cliente-1' });
  });

  it('devuelve 404 para un ID que no existe', async () => {
    const res = await request(app).get('/api/orders/orden-no-existe');
    expect(res.status).toBe(404);
    expect(res.body.data).toBeNull();
  });
});

describe('POST /api/orders', () => {
  const validOrder = {
    customerId: 'cliente-1',
    salesPersonId: 1,
    paymentMethod: 'efectivo',
    items: [{ productId: 1, quantity: 2, unitPrice: 500 }],
  };

  it('simula la creación de una orden con datos válidos (201)', async () => {
    const res = await request(app).post('/api/orders').send(validOrder);
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      customerId: 'cliente-1',
      paymentMethod: 'efectivo',
      statusHistory: [{ status: 'Pendiente de pago', changedById: 1, changedAt: '2026-09-01T12:00:00.000Z' }],
      totals: { subtotal: 1000, shipping: 0, discount: 0, total: 1000 },
    });
    expect(res.body.data._id).toBeDefined();
  });

  it('devuelve 400 si falta un campo obligatorio', async () => {
    const incompleteOrder = { ...validOrder };
    delete incompleteOrder.customerId;
    const res = await request(app).post('/api/orders').send(incompleteOrder);
    expect(res.status).toBe(400);
  });

  it('devuelve 400 si paymentMethod no es válido', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ ...validOrder, paymentMethod: 'tarjeta' });
    expect(res.status).toBe(400);
  });

  it('devuelve 400 si items está vacío', async () => {
    const res = await request(app).post('/api/orders').send({ ...validOrder, items: [] });
    expect(res.status).toBe(400);
  });

  it('devuelve 400 si un item tiene quantity inválida', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ ...validOrder, items: [{ productId: 1, quantity: 0, unitPrice: 500 }] });
    expect(res.status).toBe(400);
  });

  it('no modifica los datos fijos: un GET posterior no incluye la orden creada', async () => {
    await request(app).post('/api/orders').send(validOrder);
    const res = await request(app).get('/api/orders');
    expect(res.body.data.length).toBe(2);
  });
});

describe('PUT /api/orders/:id', () => {
  const validUpdate = {
    customerId: 'cliente-1',
    salesPersonId: 1,
    paymentMethod: 'transferencia',
    items: [{ productId: 1, quantity: 1, unitPrice: 750 }],
    status: 'Pagado',
  };

  it('simula la actualización de una orden existente (200)', async () => {
    const res = await request(app).put('/api/orders/orden-1').send(validUpdate);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      _id: 'orden-1',
      totals: { subtotal: 750, shipping: 0, discount: 0, total: 750 },
    });
    expect(res.body.data.statusHistory.at(-1)).toEqual({ status: 'Pagado', changedById: 1,
      changedAt: '2026-09-02T12:00:00.000Z' });
  });

  it('devuelve 404 al actualizar un ID inexistente', async () => {
    const res = await request(app).put('/api/orders/orden-no-existe').send(validUpdate);
    expect(res.status).toBe(404);
  });

  it('devuelve 400 si el cuerpo no cumple las validaciones', async () => {
    const res = await request(app)
      .put('/api/orders/orden-1')
      .send({ ...validUpdate, paymentMethod: 'bitcoin' });
    expect(res.status).toBe(400);
  });

  it('no modifica los datos fijos: un GET posterior sigue devolviendo el original', async () => {
    const original = (await request(app).get('/api/orders/orden-2')).body.data;
    // Se envían valores deliberadamente distintos para que la comparación sea concluyente.
    const updated = await request(app).put('/api/orders/orden-2').send({
      customerId: 'cliente-1',
      salesPersonId: 1,
      paymentMethod: 'efectivo',
      items: [{ productId: 9, quantity: 3, unitPrice: 100 }],
      status: 'Cancelado',
    });
    expect(updated.status).toBe(200);
    expect(updated.body.data.statusHistory.at(-1).status).toBe('Cancelado');

    const res = await request(app).get('/api/orders/orden-2');
    expect(res.body.data).toEqual(original);
  });
});

describe('Contrato documental de órdenes', () => {
  const validOrder = { customerId: 'cliente-1', salesPersonId: 1, paymentMethod: 'efectivo',
    items: [{ productId: 1, quantity: 2, unitPrice: 500 }] };
  const shippingAddress = { street: 'Calle Ejemplo', number: '10', city: 'Chihuahua',
    state: 'Chihuahua', postalCode: '31000', country: 'México' };

  it('devuelve la estructura de la figura 1 y no permite inyectar campos calculados', async () => {
    const body = { ...validOrder, _id: 'otro', totals: { total: -1 }, status: 'Pagado',
      statusHistory: [], createdAt: 'falsa', shippingAddress: { ...shippingAddress, extra: true },
      items: [{ ...validOrder.items[0], extra: true }] };
    const res = await request(app).post('/api/orders').send(body);
    expect(res.status).toBe(201);
    expect(res.body.data).toEqual({ ...validOrder, _id: 'orden-nueva', shippingAddress,
      totals: { subtotal: 1000, shipping: 0, discount: 0, total: 1000 },
      statusHistory: [{ status: 'Pendiente de pago', changedById: 1, changedAt: '2026-09-01T12:00:00.000Z' }],
      createdAt: '2026-09-01T12:00:00.000Z', updatedAt: '2026-09-01T12:00:00.000Z' });
    expect((await request(app).get('/api/orders/orden-nueva')).status).toBe(404);
  });

  it('conserva historial y dirección al omitirlos, y permite cambiar la dirección', async () => {
    const original = (await request(app).get('/api/orders/orden-1')).body.data;
    const omitted = await request(app).put('/api/orders/orden-1').send(validOrder);
    expect(omitted.status).toBe(200);
    expect(omitted.body.data.statusHistory).toEqual(original.statusHistory);
    expect(omitted.body.data.shippingAddress).toEqual(original.shippingAddress);
    const sameStatus = await request(app).put('/api/orders/orden-1')
      .send({ ...validOrder, status: 'Pendiente de pago', shippingAddress });
    expect(sameStatus.status).toBe(200);
    expect(sameStatus.body.data.statusHistory).toEqual(original.statusHistory);
    expect(sameStatus.body.data.shippingAddress).toEqual(shippingAddress);
    expect((await request(app).get('/api/orders/orden-1')).body.data).toEqual(original);
  });

  describe.each(['post', 'put'])('%s rechaza solicitudes incorrectas', method => {
    const url = method === 'post' ? '/api/orders' : '/api/orders/orden-1';
    it.each([
      ['cuerpo vacío', {}], ['cuerpo arreglo', []],
      ['item nulo', { ...validOrder, items: [null] }],
      ['item arreglo', { ...validOrder, items: [[]] }],
      ['item texto', { ...validOrder, items: ['incorrecto'] }],
      ['item incompleto', { ...validOrder, items: [{}] }],
      ['cantidad fraccionaria', { ...validOrder, items: [{ productId: 1, quantity: 1.5, unitPrice: 1 }] }],
      ['precio negativo', { ...validOrder, items: [{ productId: 1, quantity: 1, unitPrice: -1 }] }],
      ['precio textual', { ...validOrder, items: [{ productId: 1, quantity: 1, unitPrice: '1' }] }],
      ['total desbordado', { ...validOrder, items: [{ productId: 1, quantity: 2, unitPrice: 1e308 }] }],
      ['vendedor fraccionario', { ...validOrder, salesPersonId: 1.5 }],
      ['cliente vacío', { ...validOrder, customerId: '  ' }],
      ['dirección nula', { ...validOrder, shippingAddress: null }],
      ['dirección incompleta', { ...validOrder, shippingAddress: {} }],
      ['estado inválido', { ...validOrder, status: 'inexistente' }],
    ])('devuelve 400 para %s', async (_label, body) => {
      const res = await request(app)[method](url).send(body);
      expect(res.status).toBe(400);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toEqual({ message: expect.any(String), data: null });
    });
    it('rechaza cuerpo ausente, JSON malformado y números no finitos', async () => {
      expect((await request(app)[method](url)).status).toBe(400);
      expect((await request(app)[method](url).set('Content-Type', 'application/json').send('{')).status).toBe(400);
      const raw = JSON.stringify(validOrder).replace('500', '1e400');
      expect((await request(app)[method](url).set('Content-Type', 'application/json').send(raw)).status).toBe(400);
    });
  });
});
