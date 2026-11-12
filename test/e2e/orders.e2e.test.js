const { randomUUID } = require('node:crypto');
const { api, login, cleanup } = require('./helpers');
const { orders } = require('../../locales/es.json');

describe('E2E Mongo - Órdenes', () => {
  let token;
  let customer;
  let product;

  const resources = [
    { path: '/api/orders', ids: [] },
    { path: '/api/customers', ids: [] },
    { path: '/api/products', ids: [] },
  ];

  function request(method, path = '/api/orders') {
    return api()[method](path)
      .set('Accept-Language', 'es')
      .set('Authorization', `Bearer ${token}`);
  }

  async function createResource(path, body, idKey = '_id') {
    const res = await request('post', path).send(body);
    const id = res.body?.data?.[idKey];
    if (res.status >= 200 && res.status < 300 && id) {
      const bucket = resources.find(r => r.path === path);
      if (bucket) {
        bucket.ids.push(id);
      }
    }
    return res;
  }

  beforeAll(async () => {
    token = await login('admin');

    // 1. Obtener ID de usuario del admin para crear el cliente
    const me = await request('get', '/api/auth/me');
    expect(me.status).toBe(200);
    const userId = me.body.id;
    expect(userId).toBeGreaterThan(0);

    // 2. Crear cliente temporal único
    const customerEmail = `e2e-order-customer-${randomUUID()}@example.test`;
    const customerRes = await createResource('/api/customers', {
      userId,
      email: customerEmail,
      phone: '6141234567',
    });
    expect(customerRes.status).toBe(201);
    customer = customerRes.body.data;
    expect(customer._id).toMatch(/^[a-f0-9]{24}$/i);

    // 3. Crear producto temporal único en PostgreSQL para las órdenes
    const productRes = await createResource('/api/products', {
      name: `Producto temporal ${randomUUID()}`,
      description: 'Producto temporal para E2E de órdenes',
      brand: 'Stride E2E',
      price: 120,
    }, 'id');
    expect(productRes.status).toBe(201);
    product = productRes.body.data;
    expect(product.id).toBeGreaterThan(0);
  });

  afterAll(async () => {
    // Borra las órdenes antes que sus clientes y productos
    await cleanup(token, resources);
  });

  it('completa el ciclo de una orden, incluye datos de su cliente, actualiza, borra y confirma 404', async () => {
    const items = [{ productId: product.id, quantity: 2 }];

    // 1. Crear orden (POST /api/orders) -> 201
    const createRes = await createResource('/api/orders', {
      customerId: customer._id,
      paymentMethod: 'efectivo',
      items,
    });
    expect(createRes.status).toBe(201);
    expect(createRes.body.message).toBe(orders.created);

    const orderId = createRes.body?.data?._id;
    expect(orderId).toBeDefined();
    expect(orderId).toMatch(/^[a-f0-9]{24}$/i);

    const path = `/api/orders/${orderId}`;

    // 2. Consultar orden por id (GET /api/orders/:id) -> 200 y verifica que incluya datos del cliente vinculado
    const detailRes = await request('get', path);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.message).toBe(orders.found);
    expect(detailRes.body.data).toMatchObject({
      _id: orderId,
      customerId: {
        _id: customer._id,
        email: customer.email,
        userId: customer.userId,
      },
      status: 'Pendiente de pago',
      items: [{ productId: product.id, quantity: 2, unitPrice: 120 }],
      totals: { total: 240 },
    });

    // 3. Listar órdenes (GET /api/orders) -> 200 y presencia en la lista con cliente poblado
    const listRes = await request('get');
    expect(listRes.status).toBe(200);
    expect(listRes.body.message).toBe(orders.list);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.data).toContainEqual(
      expect.objectContaining({
        _id: orderId,
        customerId: expect.objectContaining({
          _id: customer._id,
          email: customer.email,
        }),
      })
    );

    // 4. Actualizar orden (PUT /api/orders/:id) -> 200
    const updateRes = await request('put', path).send({ status: 'Pagado' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.message).toBe(orders.updated);
    expect(updateRes.body.data).toMatchObject({
      _id: orderId,
      status: 'Pagado',
    });

    // 5. Verificar persistencia tras actualización (GET /api/orders/:id) -> 200
    const verifyRes = await request('get', path);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data).toMatchObject({
      _id: orderId,
      status: 'Pagado',
    });

    // 6. Borrar orden (DELETE /api/orders/:id) -> 200
    const deleteRes = await request('delete', path);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toBe(orders.deleted);
    expect(deleteRes.body.data).toEqual({ id: orderId });

    // 7. Consulta tras borrar devuelve 404
    const notFoundRes = await request('get', path);
    expect(notFoundRes.status).toBe(404);
    expect(notFoundRes.body.message).toBe(orders.notFound);
    expect(notFoundRes.body.data).toBeNull();
  });

  it('rechaza una orden con datos inválidos (sin artículos) devolviendo 400 y mensaje traducido', async () => {
    const badRes = await createResource('/api/orders', {
      customerId: customer._id,
      paymentMethod: 'efectivo',
      items: [],
    });
    expect(badRes.status).toBe(400);
    expect(badRes.body.message).toBe(orders.invalidItems);
    expect(badRes.body.data).toBeNull();
  });

  it('rechaza un identificador mal formado devolviendo 400 y mensaje traducido', async () => {
    const res = await request('get', '/api/orders/id-invalido');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(orders.invalidId);
    expect(res.body.data).toBeNull();
  });
});
