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
      status: 'Pendiente de pago',
      total: 1000,
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
      status: 'Pagado',
      total: 750,
    });
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
    // orden-2 original: paymentMethod "transferencia", status "Pagado", total 1599.
    // Se envían valores deliberadamente distintos para que la comparación sea concluyente.
    await request(app).put('/api/orders/orden-2').send({
      customerId: 'cliente-1',
      salesPersonId: 1,
      paymentMethod: 'efectivo',
      items: [{ productId: 9, quantity: 3, unitPrice: 100 }],
      status: 'Cancelado',
    });

    const res = await request(app).get('/api/orders/orden-2');
    expect(res.body.data).toMatchObject({
      status: 'Pagado',
      paymentMethod: 'transferencia',
      total: 1599.0,
    });
  });
});